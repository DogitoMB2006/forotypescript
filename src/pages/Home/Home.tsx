import type { FC } from 'react';
import { useState } from 'react';
import CreatePost from '../../components/posts/CreatePost';
import FloatingCreateButton from '../../components/ui/FloatingCreateButton';
import PostsList from '../../components/posts/PostsList';

const Home: FC = () => {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const handlePostCreated = () => {
    setIsCreatePostOpen(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Foro Avanzado</h1>
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