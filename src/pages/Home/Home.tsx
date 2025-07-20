import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CreatePost from '../../components/posts/CreatePost';
import FloatingCreateButton from '../../components/ui/FloatingCreateButton';
import PostsList from '../../components/posts/PostsList';
import NewPostAlert from '../../components/ui/NewPostAlert';
import { useNewPostListener } from '../../hooks/useNewPostListener';

const Home: FC = () => {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { hasNewPosts, markAsRead } = useNewPostListener();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { preserveScroll?: boolean; targetScrollPosition?: number } | null;
    
    console.log('Home mounted with state:', state);
    
    if (state?.preserveScroll && typeof state.targetScrollPosition === 'number') {
      console.log('Restaurando scroll a:', state.targetScrollPosition);
      const scrollPos = state.targetScrollPosition;
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        console.log('Scroll restaurado a:', scrollPos);
      }, 150);
      
      window.history.replaceState(null, '', '/');
    }
  }, [location.state]);

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
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-emerald-900/5 to-cyan-900/10 pointer-events-none"></div>
      
      <NewPostAlert 
        show={hasNewPosts} 
        onRefresh={handleRefresh}
        onDismiss={handleDismiss}
      />

      <div className="relative container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative inline-block mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Dogito's Forum
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Comparte tus ideas y conecta con la comunidad en un espacio diseñado para la creatividad
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