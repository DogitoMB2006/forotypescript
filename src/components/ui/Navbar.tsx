import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';
import { useChats } from '../../contexts/ChatContext';
import Avatar from './Avatar';
import NotificationDropdown from './NotificationDropdown';

const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, userProfile, logout, isAuthenticated } = useAuth();
  const { notifications } = useNotifications();
  const { unreadChatsCount, loading: chatsLoading } = useChats();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  console.log('Navbar: Chat state:', { unreadChatsCount, chatsLoading, isAuthenticated });

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
        ? 'bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 shadow-lg shadow-slate-900/20' 
        : 'bg-slate-900/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="flex items-center space-x-3 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg opacity-20 group-hover:opacity-40 transition-opacity duration-200 blur"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent hidden sm:block">
                DF
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
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
              Trending
              {isActiveRoute('/trending') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></div>
              )}
            </Link>
            
            <Link 
              to="/about" 
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isActiveRoute('/about') 
                  ? 'text-white bg-emerald-600/20 shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Acerca de
              {isActiveRoute('/about') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></div>
              )}
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/chats"
                  className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-full transition-all duration-200 touch-manipulation"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadChatsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-medium">
                      {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-full transition-all duration-200 touch-manipulation"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-[10px] font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={showNotifications} 
                    onClose={() => setShowNotifications(false)} 
                  />
                </div>

                <Link 
                  to="/crear-post" 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 hidden sm:block"
                >
                  Crear Post
                </Link>
                
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200"
                  >
                    <Avatar 
                      src={userProfile?.profileImageUrl} 
                      alt={userProfile?.displayName || user?.email || 'Usuario'} 
                      name={userProfile?.displayName || user?.email || 'Usuario'}
                      size="sm"
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            src={userProfile?.profileImageUrl} 
                            alt={userProfile?.displayName || user?.email || 'Usuario'} 
                            name={userProfile?.displayName || user?.email || 'Usuario'}
                            size="md"
                          />
                          <div>
                            <p className="text-white font-medium">{userProfile?.displayName || 'Usuario'}</p>
                            <p className="text-slate-400 text-sm">{user?.email}</p>
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
                        <hr className="my-2 border-slate-700" />
                        <button 
                          onClick={handleLogout}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-700/50 hover:text-red-300 transition-all duration-200 w-full text-left"
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
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-slate-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/registro" 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25"
                >
                  Registrarse
                </Link>
              </div>
            )}

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800 border-t border-slate-700">
              <Link 
                to="/" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActiveRoute('/') 
                    ? 'text-white bg-emerald-600/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link 
                to="/categorias" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActiveRoute('/categorias') 
                    ? 'text-white bg-emerald-600/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Categorías
              </Link>
              <Link 
                to="/trending" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActiveRoute('/trending') 
                    ? 'text-white bg-emerald-600/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Trending
              </Link>
              <Link 
                to="/about" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActiveRoute('/about') 
                    ? 'text-white bg-emerald-600/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Acerca de
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/crear-post" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Crear Post
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;