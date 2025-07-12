import type { FC } from 'react';
import Login from '../components/Login';

const LoginPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <Login />
    </div>
  );
};

export default LoginPage;