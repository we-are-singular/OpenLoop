import { useState, useEffect } from 'react';
import { supabase, type Post, type PostCategory, type Announcement } from '../lib/supabase';
import { MessageSquare, ThumbsUp, Megaphone, ChevronUp, Check, MessageCircle, X } from 'lucide-react';

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

interface WidgetConfig {
  org: string;
  userId?: string;
  userName?: string; // Optional user name to prefill
  userEmail?: string; // Optional user email to prefill
  accentColor?: string;
  anchor?: 'left' | 'right'; // Widget position
  position?: 'bottom_right' | 'bottom_left'; // Legacy alias for anchor
  pageMode?: boolean;
  showFloatingButton?: boolean;
}

declare global {
  interface Window {
    OpenLoop?: WidgetConfig;
  }
}

interface WidgetProps {
  org?: string;
  accentColor?: string;
  position?: 'bottom_right' | 'bottom_left';
  pageMode?: boolean;
}

export default function Widget({ org: propOrg, accentColor: propAccentColor, position: propPosition, pageMode: propPageMode }: WidgetProps) {
  const [config, setConfig] = useState<WidgetConfig>({
    org: propOrg || '',
    accentColor: propAccentColor || '#6366f1',
    position: propPosition || 'bottom_right',
    pageMode: propPageMode || false
  });
  const [isOpen, setIsOpen] = useState(propPageMode || false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [activeTab, setActiveTab] = useState<'submit' | 'vote' | 'news'>('submit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostCategory>('feature');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [votedPosts, setVotedPosts] = useState<Set<string>>(new Set());
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState('');
  const [orgName, setOrgName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  useEffect(() => {
    // Get config from window
    const searchParams = new URLSearchParams(window.location.search);

    // Props take precedence, then window config, then URL params
    let cfg: WidgetConfig;
    if (propOrg) {
      cfg = {
        org: propOrg,
        accentColor: propAccentColor || searchParams.get('accentColor') || '#6366f1',
        position: propPosition,
        pageMode: propPageMode,
        userId: window.OpenLoop?.userId || searchParams.get('userId') || undefined,
        userName: window.OpenLoop?.userName || '',
        userEmail: window.OpenLoop?.userEmail || ''
      };
    } else {
      cfg = {
        ...window.OpenLoop,
        org: window.OpenLoop?.org || searchParams.get('org') || '',
        userId: window.OpenLoop?.userId || searchParams.get('userId') || undefined,
        userName: window.OpenLoop?.userName || '',
        userEmail: window.OpenLoop?.userEmail || ''
      };
    }
    setConfig(cfg);

    // Initialize user name/email from config if provided
    if (cfg.userName) setUserName(cfg.userName);
    if (cfg.userEmail) setUserEmail(cfg.userEmail);

    // Auto-open in demo mode or page mode
    if (searchParams.get('demo') === 'true' || cfg.pageMode) {
      setIsOpen(true);
    }

    if (cfg.org) {
      setOrgSlug(cfg.org);
      loadOrgAndPosts(cfg.org, cfg.userId);
    }
  }, []);

  // Listen for messages from parent window (for programmatic open with data)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Verify the message is from a trusted origin (same origin)
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'OPENLOOP_OPEN') {
        const { title, name, email } = event.data.data || {};

        // Set isOpen to true
        setIsOpen(true);

        // Update form fields if provided
        if (name) setUserName(name);
        if (email) setUserEmail(email);
        if (title) setTitle(title);

        // Switch to submit tab to show the pre-filled form
        setActiveTab('submit');
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function loadOrgAndPosts(orgSlug: string, userId?: string) {
    setLoading(true);

    // Get org by slug
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single();

    if (!org) {
      setLoading(false);
      return;
    }

    setOrgId(org.id);
    setOrgName(org.name || orgSlug);

    // Load posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('organization_id', org.id)
      .eq('status', 'idea')
      .order('votes', { ascending: false })
      .limit(10);

    setPosts(postsData || []);

    // Load user's votes - combine DB votes (if userId) and localStorage votes
    let loadedVotedPosts: Set<string> = new Set();

    if (userId) {
      const { data: votes } = await supabase
        .from('post_votes')
        .select('post_id')
        .eq('voter_id', userId);

      if (votes) {
        loadedVotedPosts = new Set(votes.map(v => v.post_id));
      }
    }

    // Also load from localStorage (for anonymous voters)
    const localVoted = loadVotedFromStorage();
    localVoted.forEach(id => loadedVotedPosts.add(id));

    if (loadedVotedPosts.size > 0) {
      setVotedPosts(loadedVotedPosts);
    }

    // Load announcements
    setLoadingAnnouncements(true);
    const { data: announcementsData } = await supabase
      .from('announcements')
      .select('*')
      .eq('organization_id', org.id)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(5);

    const loadedAnnouncements = announcementsData || [];
    setAnnouncements(loadedAnnouncements);
    setLoadingAnnouncements(false);

    // Auto-open on new announcement
    if (loadedAnnouncements.length > 0) {
      try {
        const latestAnnouncementId = loadedAnnouncements[0].id;
        const storageKey = `openloop_latest_${orgSlug}`;
        const storedId = localStorage.getItem(storageKey);

        if (!storedId || storedId !== latestAnnouncementId) {
          setIsOpen(true);
          localStorage.setItem(storageKey, latestAnnouncementId);
        }
      } catch (e) {
        // localStorage might be unavailable
      }
    }

    setLoading(false);
  }

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

    // Build author info - use userId if provided, otherwise encode name/email
    let authorId = config.userId || null;
    if (!authorId && (userName || userEmail)) {
      // Store name and email as JSON in author_id when no userId
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
      // Switch to vote tab after submission
      setTimeout(() => setActiveTab('vote'), 2000);
    } else {
      window.showToast?.('Failed to submit feedback: ' + error.message, 'error');
    }

    setSubmitting(false);
  }

  // Get localStorage key for voted posts (per organization)
  function getVotedPostsKey() {
    return `openloop_voted_${orgSlug}`;
  }

  // Load voted posts from localStorage
  function loadVotedFromStorage(): Set<string> {
    try {
      const stored = localStorage.getItem(getVotedPostsKey());
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {}
    return new Set();
  }

  // Save voted posts to localStorage
  function saveVotedToStorage(voted: Set<string>) {
    try {
      localStorage.setItem(getVotedPostsKey(), JSON.stringify([...voted]));
    } catch {}
  }

  async function handleVote(postId: string) {
    // Check localStorage first (for anonymous voters)
    const localVoted = loadVotedFromStorage();
    if (localVoted.has(postId) || votedPosts.has(postId)) {
      window.showToast?.('You have already voted on this', 'error');
      return;
    }

    // Use userId from config, or fall back to email, or require user input
    const voterId = config.userId || userEmail || null;

    if (!voterId) {
      window.showToast?.('Please enter your email to vote', 'error');
      return;
    }

    // Optimistic UI update
    const newVoted = new Set([...votedPosts, postId]);
    setVotedPosts(newVoted);
    saveVotedToStorage(newVoted);
    setPosts(posts.map(p =>
      p.id === postId ? { ...p, votes: p.votes + 1 } : p
    ));

    const { error } = await supabase.from('post_votes').insert({
      post_id: postId,
      voter_id: voterId
    });

    if (error) {
      // Revert on error
      const revertedVoted = new Set(votedPosts);
      revertedVoted.delete(postId);
      setVotedPosts(revertedVoted);
      saveVotedToStorage(revertedVoted);
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, votes: Math.max(0, p.votes - 1) } : p
      ));
      window.showToast?.('Failed to vote. Please try again.', 'error');
    } else {
      window.showToast?.('Vote added!', 'success');
    }
  }

  const positionClass = config.position === 'bottom_left'
    ? 'left-4 bottom-4'
    : 'right-4 bottom-4';

  const tabPaths: Record<'submit' | 'vote' | 'news', string> = {
    submit: 'feedback',
    vote: 'roadmap',
    news: 'announcements',
  };

  // Page mode shows tabs, floating mode shows button
  if (config.pageMode) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* Tab bar */}
        <div className="flex flex-shrink-0 border-b border-gray-100">
          {(
            [
              { key: 'submit', label: 'Feedback', icon: <MessageSquare size={15} /> },
              { key: 'vote',   label: 'Vote',     icon: <ThumbsUp size={15} /> },
              { key: 'news',   label: "What's New", icon: <Megaphone size={15} /> },
            ] as { key: 'submit' | 'vote' | 'news'; label: string; icon: React.ReactNode }[]
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={activeTab === tab.key ? { backgroundColor: config.accentColor } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Submit tab */}
          {activeTab === 'submit' && (
            submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: config.accentColor + '20' }}>
                  <Check size={24} style={{ color: config.accentColor }} />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Thanks!</p>
                <p className="text-xs text-gray-500 mb-4">Your feedback is under review.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-medium underline"
                  style={{ color: config.accentColor }}
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': config.accentColor } as React.CSSProperties}
                    readOnly={!!config.userName}
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': config.accentColor } as React.CSSProperties}
                    readOnly={!!config.userEmail}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Share an idea…"
                    value={title}
                    onChange={e => setTitle(e.target.value.slice(0, 200))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': config.accentColor } as React.CSSProperties}
                    required
                    minLength={5}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</div>
                </div>
                <div>
                  <textarea
                    placeholder="More detail (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value.slice(0, 1000))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': config.accentColor } as React.CSSProperties}
                    rows={8}
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as PostCategory)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none bg-white"
                  >
                    <option value="feature">Feature</option>
                    <option value="improvement">Improvement</option>
                    <option value="bug">Bug</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 text-white rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: config.accentColor }}
                >
                  {submitting && <Spinner size="sm" />}
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              </form>
            )
          )}

          {/* Vote tab */}
          {activeTab === 'vote' && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : posts.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No ideas yet — be first!</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <button
                      onClick={() => handleVote(post.id)}
                      disabled={votedPosts.has(post.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:cursor-default min-w-[36px]"
                      style={{
                        backgroundColor: votedPosts.has(post.id) ? config.accentColor : '#f3f4f6',
                        color: votedPosts.has(post.id) ? 'white' : '#6b7280',
                      }}
                    >
                      <ChevronUp size={14} />
                      <span>{post.votes}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{post.title}</p>
                      {post.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{post.description}</p>
                      )}
                      <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-xs ${categoryColors[post.category]?.bg || 'bg-gray-100'} ${categoryColors[post.category]?.text || 'text-gray-600'}`}>
                        {post.category}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* What's New tab */}
          {activeTab === 'news' && (
            <div className="space-y-3">
              {loadingAnnouncements ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : announcements.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No announcements yet</p>
              ) : (
                announcements.map(announcement => (
                  <div key={announcement.id} className="p-3 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{announcement.title}</p>
                      {announcement.published_at && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(announcement.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {announcement.content && (
                      <p className="text-xs text-gray-600 leading-relaxed">{announcement.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {orgName && activeTab !== 'submit' && (
          <div className="flex-shrink-0 border-t border-gray-100 py-2 text-center">
            <a
              href={`/~/${orgSlug}/${tabPaths[activeTab]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Visit {orgName} on OpenLoop
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed z-50 font-sans">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform hover:scale-110"
        style={{ backgroundColor: config.accentColor }}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={22} />}
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <div className={`absolute ${positionClass} w-80 max-h-[70vh] bg-white rounded-lg shadow-xl flex flex-col`} style={{ bottom: '4.5rem' }}>
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: config.accentColor }}>
            <h3 className="font-semibold text-gray-900">Feedback</h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Submit Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Share an idea..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': config.accentColor } as React.CSSProperties}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                rows={2}
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PostCategory)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              >
                <option value="feature">Feature</option>
                <option value="improvement">Improvement</option>
                <option value="bug">Bug</option>
                <option value="other">Other</option>
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 text-white rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: config.accentColor }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Posts List */}
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">No feedback yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm">{post.title}</h4>
                    {post.description && (
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{post.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{post.votes} votes</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[post.category]?.bg || 'bg-gray-100'} ${categoryColors[post.category]?.text || 'text-gray-700'}`}>
                          {post.category}
                        </span>
                      </div>
                      <button
                        onClick={() => handleVote(post.id)}
                        disabled={votedPosts.has(post.id)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed ${
                          votedPosts.has(post.id)
                            ? 'opacity-100'
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        style={{
                          backgroundColor: votedPosts.has(post.id) ? config.accentColor : '#f3f4f6',
                          color: votedPosts.has(post.id) ? 'white' : '#374151',
                          boxShadow: votedPosts.has(post.id) ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        {votedPosts.has(post.id) ? (
                          <span className="flex items-center gap-1"><Check size={12} />Voted</span>
                        ) : (
                          <span className="flex items-center gap-1"><ChevronUp size={12} />{post.votes}</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Announcements Section */}
            {announcements.length > 0 && (
              <>
                <hr className="border-gray-200" />
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-2">What's New</h4>
                  <div className="space-y-2">
                    {announcements.slice(0, 3).map(announcement => (
                      <div key={announcement.id} className="p-2 bg-indigo-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 text-xs">{announcement.title}</h5>
                        {announcement.published_at && (
                          <span className="text-xs text-gray-500">
                            {new Date(announcement.published_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
