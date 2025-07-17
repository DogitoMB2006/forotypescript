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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Dogito's Forum</h1>
          <p className="text-gray-400 text-lg">
            Comparte tus ideas y conecta con la comunidad
          </p>
        </div>

        <div className="mb-8">
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