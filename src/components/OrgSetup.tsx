import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const stored = localStorage.getItem('sb_session');
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    if (!session.access_token) return null;
    return createClient(
      import.meta.env.PUBLIC_SUPABASE_URL || '',
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      }
    );
  } catch {
    return null;
  }
}

export default function OrgSetup() {
  const [form, setForm] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      window.location.href = '/admin/login';
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: form.name, slug: form.slug.toLowerCase() })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create default widget settings
      await supabase.from('widget_settings').insert({
        organization_id: org.id,
        accent_color: '#6366f1',
        position: 'bottom_right',
        enabled: true
      });

      // Reload to show the settings page
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
      setLoading(false);
    }
  }

  return (
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Set Up Your Organization</h1>
      <p class="text-gray-600 mb-6">Create your organization to get started with OpenLoop.</p>

      {error && (
        <div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={createOrg} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            class="w-full px-3 py-2 border rounded-lg"
            placeholder="Acme Inc."
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            class="w-full px-3 py-2 border rounded-lg"
            placeholder="acme"
            required
          />
          <p class="text-gray-500 text-sm mt-1">This will be used in your public URL: /acme</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </button>
      </form>
    </div>
  );
}
