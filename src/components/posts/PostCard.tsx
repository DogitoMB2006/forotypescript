import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { deletePost } from '../../services/postService';
import { getCommentCount } from '../../services/commentService';
import { getUserProfile } from '../../services/userService';
import type { Post } from '../../services/postService';
import type { UserProfile } from '../../services/userService';
import DeletePost from './DeletePost';
import Avatar from '../ui/Avatar';
import ClickableUsername from '../ui/ClickableUsername';
import DefaultBadge from '../user/DefaultBadge';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [refreshProfile, setRefreshProfile] = useState(0);
  const isAuthor = user?.uid === post.authorId;

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
  }, [post.id, post.authorId, refreshProfile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshProfile(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  const processContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId, post.imageUrls);
      onPostDeleted?.(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  return (
    <>
      <Link to={`/post/${post.id}`}>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-xl">
          <div className="flex items-start space-x-4">
            <Avatar 
              src={authorProfile?.profileImageUrl}
              name={post.authorDisplayName}
              size="lg"
              className="flex-shrink-0 shadow-md"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <ClickableUsername
                      userId={post.authorId}
                      username={post.authorUsername}
                      displayName={post.authorDisplayName}
                      className="font-semibold text-white hover:text-blue-400"
                    >
                      {post.authorDisplayName}
                    </ClickableUsername>
                    <DefaultBadge badgeId={(authorProfile as any)?.defaultBadgeId} size="sm" />
                  </div>
                  <span className="text-gray-500">@{post.authorUsername}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500 text-sm">{formatTimeAgo(post.createdAt)}</span>
                </div>
                
                {isAuthor && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteModal(true);
                    }}
                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg transition-colors duration-200 hover:bg-red-900/20 opacity-0 group-hover:opacity-100"
                    title="Eliminar post"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-200">
                {post.title}
              </h2>
              
              <div className="text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                {processContent(post.content)}
              </div>
              
              {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="mb-6">
                  {post.imageUrls.length === 1 ? (
                    <img
                      src={post.imageUrls[0]}
                      alt="Post image"
                      className="w-full max-h-64 object-cover rounded-lg border border-gray-700 shadow-md"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {post.imageUrls.slice(0, 4).map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-700 shadow-md"
                          />
                          {index === 3 && post.imageUrls.length > 4 && (
                            <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                              <span className="text-white font-semibold">
                                +{post.imageUrls.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-6 text-gray-500 pt-4 border-t border-gray-800">
                <button 
                  className="flex items-center space-x-2 hover:text-red-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-red-900/20"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likes}</span>
                </button>
                
                <button 
                  className="flex items-center space-x-2 hover:text-blue-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-blue-900/20"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{commentCount}</span>
                </button>
                
                <button 
                  className="flex items-center space-x-2 hover:text-green-400 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-green-900/20"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <DeletePost
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        postId={post.id}
        postTitle={post.title}
        onDelete={handleDelete}
      />
    </>
  );
};

export default PostCard;