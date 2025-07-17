import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, userProfile, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-2xl' 
        : 'bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/30'
    }`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-emerald-500/25">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <span className="text-white text-xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                DF
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              
              <div className="relative mr-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-64 bg-slate-800/50 border border-slate-600/50 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/70"
                />
              </div>

              <Link 
                to="/" 
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActiveRoute('/') 
                    ? 'text-white bg-emerald-600/20 shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Inicio
                {isActiveRoute('/') && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></div>
                )}
              </Link>
              
              <Link 
                to="/categorias" 
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActiveRoute('/categorias') 
                    ? 'text-white bg-emerald-600/20 shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Categorías
                {isActiveRoute('/categorias') && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></div>
                )}
              </Link>
              
              <Link 
                to="/trending" 
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActiveRoute('/trending') 
                    ? 'text-white bg-emerald-600/20 shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                🔥 Trending
                {isActiveRoute('/trending') && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></div>
                )}
              </Link>
              
              {isAuthenticated && (
                <Link 
                  to="/crear-post" 
                  className="relative bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 ml-4"
                >
                  <span className="relative z-10">✨ Crear Post</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-full blur opacity-30"></div>
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            
            <button className="relative p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/50 transition-all duration-300 group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5m0 0h5m-5 0l5-5" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                3
              </span>
            </button>
            
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-slate-300 hover:text-white px-3 py-2 rounded-full transition-all duration-300 hover:bg-slate-800/50 group"
                >
                  <div className="relative">
                    <Avatar 
                      src={userProfile?.profileImageUrl}
                      name={userProfile?.displayName || user?.email || 'Usuario'}
                      size="md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
                  </div>
                  <span className="text-sm font-medium">{userProfile?.displayName || 'Usuario'}</span>
                  <svg className={`w-4 h-4 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-2xl z-50 py-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-600/50">
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          src={userProfile?.profileImageUrl}
                          name={userProfile?.displayName || user?.email || 'Usuario'}
                          size="md"
                        />
                        <div>
                          <div className="text-white text-sm font-medium">{userProfile?.displayName || 'Usuario'}</div>
                          <div className="text-slate-400 text-xs">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link 
                        to="/perfil" 
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Mi Perfil</span>
                      </Link>
                      <Link 
                        to="/mis-posts" 
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Mis Posts</span>
                      </Link>
                      <Link 
                        to="/configuracion" 
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Configuración</span>
                      </Link>
                      <hr className="my-2 border-slate-600/50" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-slate-800/50 rounded-full"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800/50 transition-all duration-300"
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
        <div className="md:hidden bg-slate-800/95 backdrop-blur-md border-t border-slate-700/50 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-4 pb-3 space-y-2">
            
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            <Link 
              to="/" 
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                isActiveRoute('/') 
                  ? 'text-white bg-emerald-600/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Inicio</span>
            </Link>
            
            <Link 
              to="/categorias" 
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                isActiveRoute('/categorias') 
                  ? 'text-white bg-emerald-600/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Categorías</span>
            </Link>
            
            <Link 
              to="/trending" 
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                isActiveRoute('/trending') 
                  ? 'text-white bg-emerald-600/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span>🔥</span>
              <span>Trending</span>
            </Link>
            
            {isAuthenticated && (
              <Link 
                to="/crear-post" 
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>✨</span>
                <span>Crear Post</span>
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="pt-4 pb-3 border-t border-slate-700/50 mt-4">
                <div className="flex items-center px-4 mb-4">
                  <Avatar 
                    src={userProfile?.profileImageUrl}
                    name={userProfile?.displayName || user?.email || 'Usuario'}
                    size="lg"
                  />
                  <div className="ml-3">
                    <div className="text-white text-base font-medium">{userProfile?.displayName || 'Usuario'}</div>
                    <div className="text-slate-400 text-sm">{user?.email}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link 
                    to="/perfil" 
                    className="flex items-center space-x-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 text-base font-medium rounded-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Mi Perfil</span>
                  </Link>
                  <Link 
                    to="/mis-posts" 
                    className="flex items-center space-x-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 text-base font-medium rounded-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Mis Posts</span>
                  </Link>
                  <Link 
                    to="/configuracion" 
                    className="flex items-center space-x-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 text-base font-medium rounded-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Configuración</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-base font-medium rounded-xl transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-slate-700/50 mt-4">
                <div className="flex flex-col space-y-2 px-4">
                  <Link 
                    to="/login" 
                    className="text-center text-slate-300 hover:text-white px-4 py-2 text-base font-medium hover:bg-slate-800/50 rounded-xl transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-center bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-4 py-2 rounded-xl text-base font-medium transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;