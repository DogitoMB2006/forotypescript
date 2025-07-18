import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCommentCount } from '../../services/commentService';
import { getUserProfile } from '../../services/userService';
import type { Post } from '../../services/postService';
import type { UserProfile } from '../../services/userService';
import LikeButton from '../posts/LikeButton';
import Avatar from '../ui/Avatar';
import DefaultBadge from '../user/DefaultBadge';
import UserRoleDisplay from '../user/UserRoleDisplay';
import CategoryBadge from '../categories/CategoryBadge';

interface TrendingPostCardProps {
  post: Post;
  rank: number;
}

const TrendingPostCard: FC<TrendingPostCardProps> = ({ post, rank }) => {
  const [commentCount, setCommentCount] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [count, profile] = await Promise.all([
          getCommentCount(post.id),
          getUserProfile(post.authorId)
        ]);
        setCommentCount(count);
        setAuthorProfile(profile);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [post.id, post.authorId]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Hace un momento';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-600/20 to-orange-600/20 border-yellow-500/50';
      case 2: return 'from-slate-600/20 to-gray-600/20 border-slate-400/50';
      case 3: return 'from-amber-600/20 to-orange-600/20 border-amber-500/50';
      default: return 'from-slate-800/50 to-slate-700/30 border-slate-600/50';
    }
  };

  const processContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline transition-colors duration-200"
          >
            {part.length > 50 ? `${part.substring(0, 50)}...` : part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <article className={`
      relative bg-gradient-to-br ${getRankStyle(rank)} backdrop-blur-sm 
      rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] 
      hover:shadow-2xl border group overflow-hidden
    `}>
      <div className="absolute top-4 right-4 z-10">
        <div className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm border
          ${rank <= 3 
            ? 'bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/50 text-orange-300' 
            : 'bg-slate-800/60 border-slate-600/50 text-slate-300'
          }
        `}>
          <span className="text-lg">{getRankIcon(rank)}</span>
          {rank > 3 && <span className="text-sm font-bold">{rank}</span>}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="relative">
            <Avatar 
              src={authorProfile?.profileImageUrl}
              name={authorProfile?.displayName || post.authorDisplayName}
              size="md"
            />
            <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-white hover:text-emerald-300 transition-colors duration-200 cursor-pointer">
                {authorProfile?.displayName || post.authorDisplayName}
              </span>
              <UserRoleDisplay userId={post.authorId} />
              <span className="text-slate-400 text-sm">•</span>
              <time className="text-slate-400 text-sm">{formatTimeAgo(post.createdAt)}</time>
            </div>
            
            {post.categoryId && (
              <div className="mb-3">
                <CategoryBadge categoryId={post.categoryId} />
              </div>
            )}
          </div>
        </div>

        <Link to={`/post/${post.id}`} className="block group/link">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover/link:text-emerald-300 transition-colors duration-300 leading-tight">
            {post.title}
          </h2>
          
          <div className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
            {processContent(post.content.length > 300 ? `${post.content.substring(0, 300)}...` : post.content)}
          </div>
        </Link>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-1 sm:space-x-4">
            <LikeButton 
              postId={post.id}
              initialLikes={post.likes || 0}
              initialLikedBy={post.likedBy || []}
            />
            
            <Link 
              to={`/post/${post.id}#comments`}
              className="flex items-center space-x-1 sm:space-x-2 text-slate-400 hover:text-emerald-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-emerald-900/20"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm sm:text-base">{commentCount}</span>
            </Link>
            
            <button className="flex items-center space-x-1 sm:space-x-2 text-slate-400 hover:text-cyan-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-cyan-900/20">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm sm:text-base hidden sm:inline">Compartir</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <span className="text-orange-400">🔥</span>
            <span>{post.likes || 0} likes</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TrendingPostCard;