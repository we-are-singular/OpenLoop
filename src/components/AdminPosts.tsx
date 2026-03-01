import { useState, useEffect } from 'react';
import { createClient, type Post, type PostStatus, type PostCategory } from '@supabase/supabase-js';
import { stripMarkdown } from '../lib/markdown';

interface AdminPostsProps {
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

const STATUSES: PostStatus[] = ['idea', 'planned', 'in_progress', 'completed', 'closed'];
const CATEGORIES: PostCategory[] = ['feature', 'bug', 'improvement', 'other'];

const categoryColors: Record<PostCategory, { bg: string; text: string }> = {
  feature: { bg: 'bg-blue-100', text: 'text-blue-700' },
  bug: { bg: 'bg-red-100', text: 'text-red-700' },
  improvement: { bg: 'bg-green-100', text: 'text-green-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' }
};

type SortField = 'title' | 'category' | 'status' | 'votes' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function AdminPosts({ orgId }: AdminPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PostStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  useEffect(() => {
    loadPosts();
  }, [orgId, filter, categoryFilter]);

  async function loadPosts() {
    const supabase = getSupabase();
    if (!supabase) {
      window.location.href = '/admin/login';
      return;
    }
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*')
      .eq('organization_id', orgId)
      .order(sortField, { ascending: sortDirection === 'asc' });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    loadPosts();
  }

  async function updateStatus(postId: string, status: PostStatus) {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('posts').update({ status }).eq('id', postId);
    loadPosts();
  }

  async function saveEdit(postId: string) {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('posts').update({
      title: editForm.title,
      description: editForm.description
    }).eq('id', postId);
    setEditingId(null);
    loadPosts();
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this post?')) return;
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('posts').delete().eq('id', postId);
    loadPosts();
  }

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Feedback</h1>
        <div class="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            class="px-4 py-2 border rounded-lg"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as PostStatus | 'all')}
            class="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as PostCategory | 'all')}
            class="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div class="bg-white rounded-lg border overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('title')}>
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('votes')}>
                Votes {sortField === 'votes' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            {loading ? (
              <tr>
                <td colspan={6} class="px-6 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredPosts.length === 0 ? (
              <tr>
                <td colspan={6} class="px-6 py-8 text-center text-gray-500">No posts found</td>
              </tr>
            ) : (
              filteredPosts.map(post => (
                <tr key={post.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    {editingId === post.id ? (
                      <div class="space-y-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                          class="w-full px-2 py-1 border rounded"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          class="w-full px-2 py-1 border rounded"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <div class="font-medium text-gray-900">{post.title}</div>
                        {post.description && (
                          <div class="text-sm text-gray-500 line-clamp-1">{stripMarkdown(post.description)}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td class="px-6 py-4">
                    {(() => {
                      const colors = categoryColors[post.category] || categoryColors.other;
                      return (
                        <span class={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text}`}>
                          {post.category}
                        </span>
                      );
                    })()}
                  </td>
                  <td class="px-6 py-4">
                    <select
                      value={post.status}
                      onChange={e => updateStatus(post.id, e.target.value as PostStatus)}
                      class="text-sm border rounded px-2 py-1"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td class="px-6 py-4 text-gray-600">{post.votes}</td>
                  <td class="px-6 py-4 text-gray-500 text-sm">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 text-right">
                    {editingId === post.id ? (
                      <div class="flex gap-2 justify-end">
                        <button
                          onClick={() => saveEdit(post.id)}
                          class="text-green-600 hover:text-green-800 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          class="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div class="flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            setEditingId(post.id);
                            setEditForm({ title: post.title, description: post.description });
                          }}
                          class="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          class="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
