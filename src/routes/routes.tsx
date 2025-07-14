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