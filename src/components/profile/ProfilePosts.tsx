import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getUserCustomTheme } from '../../services/profileThemeService';
import type { Post } from '../../services/postService';
import type { CustomProfileTheme } from '../../types/profileTheme';
import PostCard from '../posts/PostCard';

interface ProfilePostsProps {
  userId: string;
  username: string;
}

const ProfilePosts: FC<ProfilePostsProps> = ({ userId, username }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'blogs'>('posts');
  const [userTheme, setUserTheme] = useState<CustomProfileTheme | null>(null);

  useEffect(() => {
    const fetchUserTheme = async () => {
      try {
        const theme = await getUserCustomTheme(userId);
        setUserTheme(theme);
      } catch (error) {
        console.error('Error fetching user theme:', error);
      }
    };

    fetchUserTheme();
  }, [userId]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const userPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Post));
        
        setPosts(userPosts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId]);

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const isLightColor = (hex: string): boolean => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
  };

  const primaryColor = userTheme?.primaryColor || '#3B82F6';
  const accentColor = userTheme?.accentColor || '#60A5FA';
  const textColor = isLightColor(accentColor) ? '#000000' : '#FFFFFF';
  const secondaryTextColor = isLightColor(primaryColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';

  const getTabStyle = (isActive: boolean) => ({
    color: isActive ? textColor : secondaryTextColor,
    borderBottomColor: isActive ? textColor : 'transparent',
    background: isActive ? `rgba(255, 255, 255, 0.1)` : 'transparent'
  });

  return (
    <div 
      className="border border-gray-800 rounded-lg shadow-lg transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
        borderColor: primaryColor
      }}
    >
      <div 
        className="border-b transition-colors duration-300"
        style={{ borderColor: `${textColor}30` }}
      >
        <nav className="flex">
          <button
            onClick={() => setActiveTab('posts')}
            className="flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 border-b-2 backdrop-blur-sm"
            style={getTabStyle(activeTab === 'posts')}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className="flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 border-b-2 backdrop-blur-sm"
            style={getTabStyle(activeTab === 'blogs')}
          >
            Blogs (0)
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'posts' && (
          <div>
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div 
                    key={index} 
                    className="rounded-lg p-6 animate-pulse border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: `${textColor}20`,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full"
                        style={{ background: `${textColor}30` }}
                      ></div>
                      <div className="flex-1">
                        <div 
                          className="h-4 rounded w-1/4 mb-2"
                          style={{ background: `${textColor}30` }}
                        ></div>
                        <div 
                          className="h-6 rounded w-3/4 mb-3"
                          style={{ background: `${textColor}30` }}
                        ></div>
                        <div className="space-y-2">
                          <div 
                            className="h-4 rounded"
                            style={{ background: `${textColor}30` }}
                          ></div>
                          <div 
                            className="h-4 rounded w-5/6"
                            style={{ background: `${textColor}30` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map(post => (
                  <div
                    key={post.id}
                    className="rounded-lg border p-1 transition-all duration-300"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: `${textColor}20`,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <PostCard
                      post={post}
                      onPostDeleted={handlePostDeleted}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg 
                  className="w-16 h-16 mx-auto mb-4 transition-colors duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: textColor, opacity: 0.7 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h3 
                  className="text-xl font-semibold mb-2 transition-colors duration-300"
                  style={{ color: textColor }}
                >
                  No hay posts todavía
                </h3>
                <p 
                  className="transition-colors duration-300"
                  style={{ color: secondaryTextColor }}
                >
                  @{username} aún no ha publicado nada
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blogs' && (
          <div className="text-center py-12">
            <svg 
              className="w-16 h-16 mx-auto mb-4 transition-colors duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: textColor, opacity: 0.7 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 
              className="text-xl font-semibold mb-2 transition-colors duration-300"
              style={{ color: textColor }}
            >
              Blogs próximamente
            </h3>
            <p 
              className="transition-colors duration-300"
              style={{ color: secondaryTextColor }}
            >
              La función de blogs estará disponible pronto
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePosts;