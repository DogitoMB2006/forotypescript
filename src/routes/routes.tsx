import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home/Home';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import CreatePostPage from '../pages/CreatePost';
import PostDetail from '../pages/PostDetail';
import ProfilePage from '../pages/Profile';
import Categories from '../pages/Categories';
import CategoryDetail from '../pages/CategoryDetail';
import Trending from '../pages/Trending';
import ChatsPage from '../pages/ChatsPage';
import ChatConversation from '../components/chats/ChatConversation';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: '/trending',
        element: <Trending />
      },
      {
        path: '/crear-post',
        element: <CreatePostPage />
      },
      {
        path: '/post/:id',
        element: <PostDetail />
      },
      {
        path: '/perfil',
        element: <ProfilePage />
      },
      {
        path: '/perfil/:userId',
        element: <ProfilePage />
      },
      {
        path: '/categorias',
        element: <Categories />
      },
      {
        path: '/categorias/:categoryId',
        element: <CategoryDetail />
      },
      {
        path: '/chats',
        element: <ChatsPage />
      },
      {
        path: '/chats/:chatId',
        element: (
          <div className="h-[calc(100vh-4rem)]">
            <ChatConversation />
          </div>
        )
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  }
]);

export default router;