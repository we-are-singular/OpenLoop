import { useState, useEffect } from 'react';
import { supabase, type Post, type PostCategory, type Announcement } from '../lib/supabase';
import { MessageSquare, ThumbsUp, Megaphone, ChevronUp, Check, X } from 'lucide-react';

// Simple spinner component
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin`}></div>
  );
}

const LOGO_PATH = "M 482.500 173.122 C 449.995 175.605, 418.617 182.633, 386.650 194.591 C 322.862 218.451, 264.057 266.738, 224.788 327.500 C 217.846 338.242, 208.630 354.541, 204.967 362.557 C 203.724 365.275, 201.378 370.425, 199.754 374 C 188.263 399.298, 179.416 430.621, 174.335 464 C 171.196 484.618, 170.076 521.555, 171.965 542.151 C 181.748 648.806, 241.029 745.154, 331.760 801.863 C 374.179 828.377, 420.510 844.606, 473.500 851.516 C 490.876 853.782, 532.200 853.832, 550.500 851.609 C 593.517 846.385, 629.403 835.770, 666.159 817.399 C 716.406 792.285, 763.495 749.920, 796.646 700 C 844.641 627.728, 862.826 540.180, 847.982 452.847 C 831.234 354.312, 770.828 267.332, 684.591 217.574 C 638.676 191.083, 592.619 177.043, 538.500 173.043 C 522.499 171.860, 498.577 171.894, 482.500 173.122 M 477.500 215.605 C 383.205 226.401, 300.488 280.793, 253.495 362.905 C 252.457 364.718, 253.965 363.815, 260.314 358.825 C 267.212 353.403, 282.967 344.798, 293.874 340.497 C 325.560 328, 366.634 324.571, 400.755 331.574 C 420.574 335.642, 444.082 346.093, 461.960 358.784 C 473.348 366.869, 487.242 380.359, 496.377 392.201 C 503.265 401.130, 521.937 429.961, 534.972 451.797 C 539.144 458.785, 542.820 463.899, 543.487 463.643 C 544.133 463.395, 559.376 453.448, 577.362 441.538 C 612.867 418.026, 620.708 413.423, 632.652 409.075 C 646.664 403.976, 655.794 402.541, 673.500 402.658 C 687.171 402.748, 690.893 403.129, 699.074 405.279 C 751.135 418.962, 782.380 461.104, 779.681 514 C 777.041 565.730, 739.648 605.677, 685 615.148 C 674.442 616.978, 649.567 616.692, 638.759 614.617 C 614.697 609.997, 590.795 597.958, 573.361 581.676 C 561.289 570.403, 551.930 557.910, 537.949 534.407 C 535.035 529.508, 532.558 525.367, 532.446 525.204 C 532.245 524.913, 500.181 545.542, 496.756 548.164 C 495.156 549.391, 495.842 550.729, 505.129 564.500 C 518.784 584.748, 528.152 596.369, 541.549 609.678 C 558.570 626.588, 573.542 637.134, 595.145 647.429 C 644.212 670.812, 701.590 670.793, 748.344 647.376 C 769.844 636.608, 783.534 623.803, 792.428 606.143 C 811.310 568.649, 816.773 507.249, 805.942 454.274 C 796.531 408.247, 774.464 360.913, 745.251 324.092 C 735.479 311.774, 713.188 289.485, 701 279.844 C 659.576 247.076, 616.710 227.635, 565.500 218.391 C 541.571 214.071, 501.873 212.815, 477.500 215.605 M 336.597 372.607 C 292.840 380.509, 253.228 414.655, 237.536 458 C 231.943 473.450, 229.909 485.063, 229.306 505 C 228.828 520.761, 229.067 525.721, 230.919 538.500 C 237.570 584.383, 255.635 628.923, 286.264 674.954 C 300.787 696.779, 313.539 712.311, 331.642 730.223 C 378.058 776.150, 433.024 802.852, 495.999 810.066 C 509.447 811.607, 544.769 810.743, 559 808.526 C 591.683 803.435, 617.264 795.373, 645.367 781.308 C 669.819 769.070, 692.311 753.485, 714.185 733.620 C 730.849 718.488, 756.675 689.262, 751.450 691.449 C 735.968 697.931, 710.432 704.084, 691.144 705.981 C 615.200 713.451, 541.095 680.326, 489.844 616 C 481.580 605.628, 466.668 584.601, 461.779 576.427 L 458.695 571.272 446.598 579.503 C 414.853 601.102, 398.043 606.917, 371 605.653 C 336.136 604.023, 304.863 586.695, 287.199 559.220 C 271.233 534.387, 267.858 499.578, 278.746 472.050 C 288.669 446.962, 308.425 427.867, 333.177 419.442 C 343.577 415.902, 353.696 414.644, 366.798 415.263 C 387.891 416.261, 406.548 424.303, 422.594 439.315 C 431.953 448.072, 437.662 456.159, 458.380 490 C 465.282 501.275, 471.283 511.028, 471.715 511.674 C 472.255 512.481, 477.646 509.429, 489 501.885 C 498.075 495.856, 506.145 490.539, 506.934 490.069 C 508.073 489.391, 506.129 485.640, 497.497 471.857 C 470.539 428.813, 460.066 414.980, 443.497 400.530 C 425.937 385.215, 408.704 376.956, 385.140 372.560 C 374.541 370.582, 347.662 370.608, 336.597 372.607 M 654.362 446.917 C 643.735 449.799, 639.758 452.121, 601.892 477.558 L 567.145 500.900 575.640 514.700 C 590.794 539.315, 600.650 550.716, 614.812 560.014 C 629.362 569.566, 645.402 574.198, 664 574.220 C 677.597 574.236, 686.552 572.181, 699.675 566.031 C 723.800 554.726, 738 533.526, 738 508.816 C 738 498.443, 736.140 490.863, 731.053 480.500 C 723.653 465.426, 710.490 454.106, 693.901 448.552 C 682.488 444.731, 665.078 444.011, 654.362 446.917 M 353 458.154 C 330.846 461.768, 314 483.312, 314 508.029 C 314 521.700, 319.330 534.192, 329.523 544.412 C 348.908 563.847, 377.497 568.271, 403.897 555.921 C 413.415 551.467, 435.918 537.069, 435.967 535.400 C 435.985 534.795, 434.742 532.545, 433.205 530.400 C 431.668 528.255, 426.197 519.756, 421.049 511.514 C 398.030 474.664, 392.682 467.913, 382.366 462.685 C 373.627 458.257, 362.701 456.571, 353 458.154";

function LogoButtonIcon({ size = 56, accentColor = '#6366f1' }: { size?: number; accentColor?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" width={size} height={size}>
      <circle cx="512" cy="512" r="511" fill={accentColor} />
      <path d={LOGO_PATH} fill="white" fillRule="evenodd" />
    </svg>
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
        className="w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110 overflow-hidden flex items-center justify-center"
        style={isOpen ? { backgroundColor: config.accentColor } : {}}
      >
        {isOpen ? <X size={20} color="white" /> : <LogoButtonIcon size={56} accentColor={config.accentColor} />}
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
