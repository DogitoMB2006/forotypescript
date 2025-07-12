import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';

const Login: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate('/');
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No existe una cuenta con este correo electrónico');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta');
          break;
        case 'auth/invalid-email':
          setError('El correo electrónico no es válido');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Intenta más tarde');
          break;
        default:
          setError('Error al iniciar sesión. Verifica tus credenciales');
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
        <p className="text-gray-400">Accede a tu cuenta del foro</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            placeholder="tu@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
              Recordarme
            </label>
          </div>
          <button type="button" className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          ¿No tienes cuenta?{' '}
          <button 
            onClick={() => navigate('/register')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;