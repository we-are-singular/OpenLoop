import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { organizationSlug, postTitle, postDescription, postCategory, authorName, notificationType } = body;

    // Default to new_feedback if not specified
    const type = notificationType || 'new_feedback';

    if (!organizationSlug || !postTitle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase with service key for admin access
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', organizationSlug)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get notification settings from widget_settings
    const { data: settings } = await supabase
      .from('widget_settings')
      .select('notification_email, notify_on_new_feedback, notify_on_new_votes, notify_on_status_change')
      .eq('organization_id', org.id)
      .single();

    const notificationEmail = settings?.notification_email;

    if (!notificationEmail) {
      // No notification email configured, skip sending
      return new Response(JSON.stringify({ success: true, message: 'No notification email configured' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check notification preferences (all ON by default)
    const preferences = settings || {};
    const notifyOnFeedback = preferences.notify_on_new_feedback !== false; // Default true
    const notifyOnVotes = preferences.notify_on_new_votes === true;
    const notifyOnStatusChange = preferences.notify_on_status_change === true;

    // Determine if we should send based on type
    let shouldNotify = false;
    if (type === 'new_feedback' && notifyOnFeedback) {
      shouldNotify = true;
    } else if (type === 'new_vote' && notifyOnVotes) {
      shouldNotify = true;
    } else if (type === 'status_change' && notifyOnStatusChange) {
      shouldNotify = true;
    }

    if (!shouldNotify) {
      return new Response(JSON.stringify({ success: true, message: 'Notification disabled for this type' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send email via Resend
    const resendApiKey = import.meta.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    const categoryLabels: Record<string, string> = {
      feature: 'Feature Request',
      improvement: 'Improvement',
      bug: 'Bug Report',
      other: 'Other'
    };

    const typeLabels: Record<string, string> = {
      new_feedback: 'New Feedback',
      new_vote: 'New Vote',
      status_change: 'Status Change'
    };

    const categoryLabel = categoryLabels[postCategory] || 'Feedback';
    const typeLabel = typeLabels[type] || 'Notification';

    let emailSubject = '';
    let emailTitle = '';

    if (type === 'new_feedback') {
      emailSubject = `[${org.name}] New ${categoryLabel}: ${postTitle}`;
      emailTitle = `New ${categoryLabel}`;
    } else if (type === 'new_vote') {
      emailSubject = `[${org.name}] New Vote on: ${postTitle}`;
      emailTitle = 'New Vote';
    } else if (type === 'status_change') {
      emailSubject = `[${org.name}] Status Changed: ${postTitle}`;
      emailTitle = 'Status Update';
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
      <div style="background: #4f46e5; color: white; padding: 20px;">
        <h1 style="margin: 0; font-size: 20px;">${emailTitle}</h1>
      </div>
      <div style="padding: 20px;">
        ${type === 'new_feedback' ? `
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
          From: ${authorName || 'Anonymous'}
        </p>
        ` : ''}
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">
          ${postTitle}
        </h2>
        ${postDescription ? `<p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${postDescription}</p>` : ''}
      </div>
      <div style="padding: 16px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Received via OpenLoop Feedback Hub
        </p>
      </div>
    </div>
  </body>
</html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'OpenLoop <notifications@resend.dev>',
      to: [notificationEmail],
      subject: emailSubject,
      html: emailHtml
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update notification log if post_id provided
    if (body.postId) {
      await supabase
        .from('notification_log')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('post_id', body.postId)
        .eq('type', type);
    }

    return new Response(JSON.stringify({ success: true, emailId: emailData?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Notification error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
