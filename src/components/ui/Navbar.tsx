import { FC, useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-lg">F</span>
              </div>
              <span className="text-white text-xl font-bold tracking-wide">ForoTS</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Inicio
              </Link>
              <Link 
                to="/categorias" 
                className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Categorías
              </Link>
              <Link 
                to="/trending" 
                className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Trending
              </Link>
              <Link 
                to="/crear-post" 
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Crear Post
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="text-white hover:text-indigo-200 p-2 rounded-lg transition-colors duration-200 hover:bg-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="text-white hover:text-indigo-200 p-2 rounded-lg transition-colors duration-200 hover:bg-white/10 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5h5m-5-5v5" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center space-x-3">
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Iniciar Sesión
              </button>
              <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg">
                Registrarse
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-indigo-200 p-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="text-white hover:text-indigo-200 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Inicio
            </Link>
            <Link 
              to="/categorias" 
              className="text-white hover:text-indigo-200 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Categorías
            </Link>
            <Link 
              to="/trending" 
              className="text-white hover:text-indigo-200 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Trending
            </Link>
            <Link 
              to="/crear-post" 
              className="bg-white text-indigo-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 mx-3 mt-2"
            >
              Crear Post
            </Link>
            <div className="pt-4 pb-3 border-t border-white/20">
              <div className="flex items-center px-5 space-x-3">
                <button className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium w-full">
                  Iniciar Sesión
                </button>
                <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium w-full">
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;