import { useState, useEffect } from 'react';
import { createClient, type Announcement } from '@supabase/supabase-js';

interface AdminAnnouncementsProps {
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

export default function AdminAnnouncements({ orgId }: AdminAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, [orgId]);

  async function loadAnnouncements() {
    const supabase = getSupabase();
    if (!supabase) {
      window.location.href = '/admin/login';
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setSubmitting(true);

    if (editingId) {
      await supabase.from('announcements').update({
        title: form.title,
        content: form.content,
        published_at: new Date().toISOString()
      }).eq('id', editingId);
    } else {
      await supabase.from('announcements').insert({
        organization_id: orgId,
        title: form.title,
        content: form.content,
        published_at: new Date().toISOString()
      });
    }

    setForm({ title: '', content: '' });
    setShowForm(false);
    setEditingId(null);
    loadAnnouncements();
    setSubmitting(false);
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return;
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('announcements').delete().eq('id', id);
    loadAnnouncements();
  }

  function startEdit(announcement: Announcement) {
    setEditingId(announcement.id);
    setForm({ title: announcement.title, content: announcement.content });
    setShowForm(true);
  }

  return (
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Announcements</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ title: '', content: '' });
          }}
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <div class="bg-white p-6 rounded-lg border mb-6">
          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., This Week on OpenLoop"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Content (Markdown supported)</label>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                class="w-full px-3 py-2 border rounded-lg"
                rows={6}
                placeholder="Write your announcement here..."
              />
            </div>
            <div class="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : editingId ? 'Update' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div class="space-y-4">
        {loading ? (
          <p class="text-center py-8 text-gray-500">Loading...</p>
        ) : announcements.length === 0 ? (
          <p class="text-center py-8 text-gray-500">No announcements yet</p>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.id} class="bg-white p-6 rounded-lg border">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-lg text-gray-900">{announcement.title}</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    {announcement.published_at
                      ? new Date(announcement.published_at).toLocaleDateString()
                      : 'Draft'}
                  </p>
                </div>
                <div class="flex gap-3">
                  <button
                    onClick={() => startEdit(announcement)}
                    class="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {announcement.content && (
                <div class="mt-3 text-gray-600 text-sm whitespace-pre-wrap">
                  {announcement.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
