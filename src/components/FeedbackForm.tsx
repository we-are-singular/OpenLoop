import { useState, useEffect } from 'react';
import { supabase, type PostCategory } from '../lib/supabase';

// Simple spinner component
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin`}></div>
  );
}

// Category color mapping
const categoryColors: Record<PostCategory, { bg: string; text: string; border: string }> = {
  feature: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  improvement: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  bug: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
};

interface FeedbackFormProps {
  org: string;
  accentColor?: string;
  userName?: string;
  userEmail?: string;
}

export default function FeedbackForm({ org, accentColor: propAccentColor, userName: prefilledName, userEmail: prefilledEmail }: FeedbackFormProps) {
  const [accentColor, setAccentColor] = useState(propAccentColor || '#6366f1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostCategory>('feature');
  const [userName, setUserName] = useState(prefilledName || '');
  const [userEmail, setUserEmail] = useState(prefilledEmail || '');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Get widget settings for accent color
    async function loadOrgAndSettings() {
      // Get org by slug
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', org)
        .single();

      if (!orgData) return;

      setOrgId(orgData.id);

      // Get widget settings
      const { data: settings } = await supabase
        .from('widget_settings')
        .select('accent_color')
        .eq('organization_id', orgData.id)
        .single();

      if (settings?.accent_color) {
        setAccentColor(settings.accent_color);
      }
    }

    loadOrgAndSettings();
  }, [org]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!title.trim() || title.trim().length < 5) {
      window.showToast?.('Title must be at least 5 characters', 'error');
      return;
    }
    if (title.trim().length > 200) {
      window.showToast?.('Title must be less than 200 characters', 'error');
      return;
    }
    if (!orgId) return;

    setSubmitting(true);

    // Build author info - use name/email
    let authorId = null;
    if (userName || userEmail) {
      authorId = JSON.stringify({ name: userName, email: userEmail });
    }

    const { error } = await supabase.from('posts').insert({
      organization_id: orgId,
      title: title.trim(),
      description: description.trim(),
      category,
      status: 'pending',
      author_id: authorId
    });

    if (!error) {
      setTitle('');
      setDescription('');
      setSubmitted(true);
      window.showToast?.('Feedback submitted! It will appear after approval.', 'success');
    } else {
      window.showToast?.('Failed to submit feedback: ' + error.message, 'error');
    }

    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
        <p className="text-gray-600 mb-4">Your feedback has been submitted for review.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-sm font-medium"
          style={{ color: accentColor }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User info fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-shadow"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Your email (optional)"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-shadow"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Share an idea..."
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 200))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-shadow text-base"
            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            required
            minLength={5}
            maxLength={200}
          />
          <div className="text-xs text-gray-400 mt-1.5 text-right">{title.length}/200</div>
        </div>

        {/* Description */}
        <div>
          <textarea
            placeholder="Description (optional) - Provide more details about your idea"
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 1000))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-shadow resize-none text-base"
            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            rows={4}
            maxLength={1000}
          />
          <div className="text-xs text-gray-400 mt-1.5 text-right">{description.length}/1000</div>
        </div>

        {/* Category */}
        <div className="flex items-center justify-between">
          <select
            value={category}
            onChange={e => setCategory(e.target.value as PostCategory)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none text-sm bg-white"
          >
            <option value="feature">Feature</option>
            <option value="improvement">Improvement</option>
            <option value="bug">Bug</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 text-white rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: accentColor }}
        >
          {submitting && <Spinner size="sm" />}
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Submissions are reviewed before being published
        </p>
      </form>
    </div>
  );
}
