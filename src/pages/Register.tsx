import { FC } from 'react';
import Register from '../components/Register';

const RegisterPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <Register />
    </div>
  );
};

export default RegisterPage;