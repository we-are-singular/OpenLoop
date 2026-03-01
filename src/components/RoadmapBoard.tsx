import { useState, useMemo, useEffect } from 'react';
import type { Post, PostCategory } from '../lib/supabase';
import { stripMarkdown } from '../lib/markdown';
import SocialShare from './SocialShare';
import { supabase } from '../lib/supabase';
import { Lightbulb, ClipboardList, Wrench, CheckCircle2, Heart } from 'lucide-react';

interface RoadmapBoardProps {
  initialPosts: Post[];
  orgSlug: string;
  baseUrl: string;
}

type Status = 'idea' | 'planned' | 'in_progress' | 'completed';
type Category = 'feature' | 'improvement' | 'bug' | 'other' | 'all';

const categoryColors: Record<Category, { bg: string; text: string; border: string }> = {
  feature: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  improvement: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  bug: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  all: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
};

const statusLabels: Record<Status, string> = {
  idea: 'Ideas',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed'
};

const statusIcons: Record<Status, React.ReactNode> = {
  idea:        <Lightbulb size={16} className="text-yellow-500" />,
  planned:     <ClipboardList size={16} className="text-blue-500" />,
  in_progress: <Wrench size={16} className="text-indigo-500" />,
  completed:   <CheckCircle2 size={16} className="text-green-500" />,
};

// Generate a device fingerprint hash using crypto API
function getDeviceHash(): string {
  try {
    const stored = localStorage.getItem('openloop_device_id');
    if (stored) return stored;
  } catch (e) {
    // localStorage might be unavailable
  }

  const fingerprintData = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
    navigator.deviceMemory || ''
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const deviceId = 'device:' + Math.abs(hash).toString(16);
  try {
    localStorage.setItem('openloop_device_id', deviceId);
  } catch (e) {
    // localStorage might be unavailable
  }
  return deviceId;
}

export default function RoadmapBoard({ initialPosts, orgSlug, baseUrl }: RoadmapBoardProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category>('all');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [votedPosts, setVotedPosts] = useState<Set<string>>(new Set());
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);

  // Load user's votes on mount
  useEffect(() => {
    async function loadVotes() {
      try {
        const deviceHash = getDeviceHash();
        const identifiers = [deviceHash].filter(Boolean);

        if (identifiers.length > 0) {
          const { data: votes } = await supabase
            .from('post_votes')
            .select('post_id')
            .in('voter_id', identifiers);

          if (votes) {
            setVotedPosts(new Set(votes.map(v => v.post_id)));
          }
        }
      } catch (error) {
        console.error('Failed to load votes:', error);
      } finally {
        setIsLoadingVotes(false);
      }
    }
    loadVotes();
  }, []);

  const handleVote = async (postId: string) => {
    const deviceHash = getDeviceHash();
    const voterId = deviceHash;
    const hasVoted = votedPosts.has(postId);

    // Optimistic UI update
    if (hasVoted) {
      // Remove vote (unvote)
      const newVotedPosts = new Set(votedPosts);
      newVotedPosts.delete(postId);
      setVotedPosts(newVotedPosts);
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, votes: Math.max(0, p.votes - 1) } : p
      ));

      try {
        const { error } = await supabase
          .from('post_votes')
          .delete()
          .eq('voter_id', voterId)
          .eq('post_id', postId);

        if (error) {
          // Revert on error
          setVotedPosts(new Set([...votedPosts]));
          setPosts(posts.map(p =>
            p.id === postId ? { ...p, votes: p.votes + 1 } : p
          ));
          console.error('Failed to unvote:', error);
        }
      } catch (error) {
        console.error('Failed to unvote:', error);
      }
    } else {
      // Add vote
      setVotedPosts(new Set([...votedPosts, postId]));
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, votes: p.votes + 1 } : p
      ));

      try {
        const { error } = await supabase.from('post_votes').insert({
          voter_id: voterId,
          post_id: postId
        });

        if (error) {
          // Revert on error
          setVotedPosts(new Set([...votedPosts]));
          setPosts(posts.map(p =>
            p.id === postId ? { ...p, votes: Math.max(0, p.votes - 1) } : p
          ));
          console.error('Failed to vote:', error);
        }
      } catch (error) {
        console.error('Failed to vote:', error);
      }
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const titleMatch = post.title?.toLowerCase().includes(searchLower);
        const descMatch = stripMarkdown(post.description || '').toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && post.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [posts, search, categoryFilter]);

  const postsByStatus = useMemo(() => {
    return {
      idea: filteredPosts.filter(p => p.status === 'idea'),
      planned: filteredPosts.filter(p => p.status === 'planned'),
      in_progress: filteredPosts.filter(p => p.status === 'in_progress'),
      completed: filteredPosts.filter(p => p.status === 'completed')
    };
  }, [filteredPosts]);

  const getCategoryStyle = (category: string) => {
    return categoryColors[category as Category] || categoryColors.other;
  };

  const renderColumn = (status: Status) => {
    const posts = postsByStatus[status];
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center">{statusIcons[status]}</span>
          <h2 className="font-semibold text-gray-900">{statusLabels[status]}</h2>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{posts.length}</span>
        </div>
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              {search || categoryFilter !== 'all' ? 'No matching items' : `No ${statusLabels[status].toLowerCase()} yet`}
            </p>
          ) : (
            posts.map(post => {
              const colors = getCategoryStyle(post.category);
              const postUrl = `${baseUrl}/~/${orgSlug}/roadmap#post-${post.id}`;
              return (
                <div key={post.id} id={`post-${post.id}`} className={`bg-white p-4 rounded-lg border-2 ${colors.border} hover:opacity-80 transition-opacity`}>
                  {/* Top row: title and upvote */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 text-sm flex-1">{post.title}</h3>
                    <button
                      onClick={() => handleVote(post.id)}
                      disabled={isLoadingVotes}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                        votedPosts.has(post.id)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                      } cursor-pointer`}
                      title={votedPosts.has(post.id) ? 'Click to remove vote' : 'Click to vote'}
                    >
                      <Heart
                        size={13}
                        className={votedPosts.has(post.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                      />
                      <span>{post.votes}</span>
                    </button>
                  </div>
                  {/* Description */}
                  {post.description && (
                    <p className="text-gray-600 text-xs mt-2 whitespace-pre-wrap">{stripMarkdown(post.description)}</p>
                  )}
                  {/* Bottom row: pill and share */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {post.category}
                    </span>
                    <SocialShare url={postUrl} title={post.title} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search roadmap..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as Category)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="feature">Features</option>
            <option value="improvement">Improvements</option>
            <option value="bug">Bugs</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Roadmap Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderColumn('idea')}
        {renderColumn('planned')}
        {renderColumn('in_progress')}
        {renderColumn('completed')}
      </div>
    </div>
  );
}
