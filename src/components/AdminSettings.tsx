import { useState, useEffect } from 'react';
import { createClient, type Organization, type WidgetSettings } from '@supabase/supabase-js';

interface AdminSettingsProps {
  orgId: string;
}

// Get authenticated supabase client
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

export default function AdminSettings({ orgId }: AdminSettingsProps) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [orgForm, setOrgForm] = useState({ name: '', slug: '' });
  const [widgetForm, setWidgetForm] = useState({
    accent_color: '#6366f1',
    position: 'bottom_right',
    enabled: true
  });

  useEffect(() => {
    loadData();
  }, [orgId]);

  async function loadData() {
    const supabase = getSupabase();
    if (!supabase) {
      window.location.href = '/admin/login';
      return;
    }
    const [orgRes, settingsRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('widget_settings').select('*').eq('organization_id', orgId).single()
    ]);

    if (orgRes.data) {
      setOrg(orgRes.data);
      setOrgForm({ name: orgRes.data.name, slug: orgRes.data.slug });
    }

    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setWidgetForm({
        accent_color: settingsRes.data.accent_color,
        position: settingsRes.data.position,
        enabled: settingsRes.data.enabled
      });
    }

    setLoading(false);
  }

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    setSaving(true);

    await supabase.from('organizations').update({
      name: orgForm.name,
      slug: orgForm.slug
    }).eq('id', orgId);

    setMessage('Organization saved!');
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  async function saveWidget(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    setSaving(true);

    if (settings) {
      await supabase.from('widget_settings').update(widgetForm).eq('id', settings.id);
    } else {
      await supabase.from('widget_settings').insert({
        organization_id: orgId,
        ...widgetForm
      });
    }

    setMessage('Widget settings saved!');
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }

  if (loading) {
    return <div class="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {message && (
        <div class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
          {message}
        </div>
      )}

      {/* Organization Settings */}
      <div class="bg-white p-6 rounded-lg border mb-6">
        <h2 class="text-lg font-semibold mb-4">Organization</h2>
        <form onSubmit={saveOrg} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={orgForm.name}
              onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
              class="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={orgForm.slug}
              onChange={e => setOrgForm({ ...orgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              class="w-full px-3 py-2 border rounded-lg"
              placeholder="your-company"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Organization'}
          </button>
        </form>
      </div>

      {/* Widget Settings */}
      <div class="bg-white p-6 rounded-lg border mb-6">
        <h2 class="text-lg font-semibold mb-4">Widget Configuration</h2>
        <form onSubmit={saveWidget} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
            <div class="flex gap-3">
              <input
                type="color"
                value={widgetForm.accent_color}
                onChange={e => setWidgetForm({ ...widgetForm, accent_color: e.target.value })}
                class="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={widgetForm.accent_color}
                onChange={e => setWidgetForm({ ...widgetForm, accent_color: e.target.value })}
                class="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={widgetForm.position}
              onChange={e => setWidgetForm({ ...widgetForm, position: e.target.value as 'bottom_right' | 'bottom_left' })}
              class="w-full px-3 py-2 border rounded-lg"
            >
              <option value="bottom_right">Bottom Right</option>
              <option value="bottom_left">Bottom Left</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={widgetForm.enabled}
              onChange={e => setWidgetForm({ ...widgetForm, enabled: e.target.checked })}
              class="rounded"
            />
            <label for="enabled" class="text-sm text-gray-700">Enable widget</label>
          </div>
          <button
            type="submit"
            disabled={saving}
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Widget Settings'}
          </button>
        </form>
      </div>

      {/* Embed Code */}
      <div class="bg-gray-900 text-white p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-4">Embed Code</h2>
        <p class="text-gray-400 text-sm mb-3">Add this to your website:</p>
        <pre class="bg-gray-800 p-4 rounded text-sm overflow-x-auto">
          <code>{`<script>
  window.OpenLoop = {
    org: '${orgForm.slug || 'your-org'}',
    userId: 'USER_ID_FROM_YOUR_APP',
    accentColor: '${widgetForm.accent_color}'
  };
</script>
<script src="https://your-domain.com/embed.js"></script>`}</code>
        </pre>
      </div>
    </div>
  );
}
