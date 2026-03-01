import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Create admin client to read organization data
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the new post
    const { record } = await req.json();

    if (!record || record.status !== "pending") {
      return new Response(JSON.stringify({ message: "Not a new pending post" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get organization and admin emails
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name, users(email)")
      .eq("id", record.organization_id)
      .single();

    if (!org || !org.users || org.users.length === 0) {
      return new Response(JSON.stringify({ message: "No admins found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminEmails = org.users.map((u: any) => u.email).filter(Boolean);

    if (adminEmails.length === 0 || !RESEND_API_KEY) {
      console.log("No admin emails or Resend API key not configured");
      return new Response(JSON.stringify({ message: "Skipped" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "OpenLoop <noreply@yourdomain.com>",
        to: adminEmails,
        subject: `New feedback for ${org.name}: ${record.title}`,
        html: `
          <h2>New feedback submitted</h2>
          <p><strong>Title:</strong> ${record.title}</p>
          <p><strong>Category:</strong> ${record.category}</p>
          <p><strong>Description:</strong></p>
          <p>${record.description || "No description"}</p>
          <p><a href="https://yourdomain.com/admin/posts">View in admin</a></p>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
    }

    return new Response(JSON.stringify({ message: "Notification sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
