import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Heart, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  display_name: string;
  content: string;
  is_anonymous: boolean;
  likes: number;
  created_at: string;
  user_id: string;
}

interface CommunityProps {
  onBack: () => void;
}

export default function Community({ onBack }: CommunityProps) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
    fetchLikedPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setPosts(data);
  };

  const fetchLikedPosts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (data) {
      setLikedPosts(new Set(data.map((like) => like.post_id)));
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !content.trim()) return;

    setLoading(true);

    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      display_name: isAnonymous ? 'Anonymous' : profile.name,
      content: content.trim(),
      is_anonymous: isAnonymous,
      likes: 0,
    });

    if (!error) {
      setContent('');
      setIsAnonymous(false);
      setShowNewPost(false);
      await fetchPosts();
    }

    setLoading(false);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      const post = posts.find((p) => p.id === postId);
      if (post) {
        await supabase
          .from('community_posts')
          .update({ likes: Math.max(0, post.likes - 1) })
          .eq('id', postId);
      }

      setLikedPosts((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: user.id,
      });

      const post = posts.find((p) => p.id === postId);
      if (post) {
        await supabase
          .from('community_posts')
          .update({ likes: post.likes + 1 })
          .eq('id', postId);
      }

      setLikedPosts((prev) => new Set(prev).add(postId));
    }

    await fetchPosts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 mb-4 hover:underline">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Community</h1>
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showNewPost && (
          <div className="mb-6 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-blue-900 mb-4">Create a Post</h3>
            <form onSubmit={createPost} className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, wins, or questions..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none"
                rows={4}
                required
              />

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                  />
                  <span className="text-sm text-gray-700">Post anonymously</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewPost(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{post.display_name}</p>
                  <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-2 text-sm ${
                    likedPosts.has(post.id)
                      ? 'text-red-600'
                      : 'text-gray-600 hover:text-red-600'
                  } transition-colors`}
                >
                  <Heart
                    className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`}
                  />
                  <span>{post.likes}</span>
                </button>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No posts yet.</p>
              <p className="text-sm mt-2">Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
