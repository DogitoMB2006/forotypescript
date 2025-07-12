import { FC } from 'react';

const Home: FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Foro Avanzado</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Bienvenido al Foro</h2>
          <p className="text-gray-600">
            Este es el inicio de nuestro foro avanzado. Aquí podrás encontrar todas las discusiones
            y participar en la comunidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;