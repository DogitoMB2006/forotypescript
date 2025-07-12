import { FC } from 'react';

const Home: FC = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Foro Avanzado</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">Bienvenido al Foro</h2>
          <p className="text-gray-400">
            Este es el inicio de nuestro foro avanzado. Aquí podrás encontrar todas las discusiones
            y participar en la comunidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;