import type { FC } from 'react';
import { useState } from 'react';
import CreatePost from '../../components/posts/CreatePost';
import FloatingCreateButton from '../../components/ui/FloatingCreateButton';
import PostsList from '../../components/posts/PostsList';
import NewPostAlert from '../../components/ui/NewPostAlert';
import { useNewPostListener } from '../../hooks/useNewPostListener';

const Home: FC = () => {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { hasNewPosts, markAsRead } = useNewPostListener();

  const handlePostCreated = () => {
    setIsCreatePostOpen(false);
    window.location.reload();
  };

  const handleRefresh = () => {
    markAsRead();
    window.location.reload();
  };

  const handleDismiss = () => {
    markAsRead();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <NewPostAlert 
        show={hasNewPosts} 
        onRefresh={handleRefresh}
        onDismiss={handleDismiss}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dogito's Forum</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Comparte tus ideas y conecta con la comunidad
          </p>
        </div>

        <div className="mb-6">
          <PostsList />
        </div>
      </div>

      <FloatingCreateButton onClick={() => setIsCreatePostOpen(true)} />
      
      <CreatePost 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)}
        onSuccess={handlePostCreated}
      />
    </div>
  );
};

export default Home;