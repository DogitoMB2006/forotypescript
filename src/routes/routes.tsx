import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home/Home';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import CreatePostPage from '../pages/CreatePost';
import PostDetail from '../pages/PostDetail';

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