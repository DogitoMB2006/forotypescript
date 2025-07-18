import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { getTrendingPosts, getTrendingStats, type TrendingPost, type TimeRange } from '../services/trendingService';
import TrendingStats from '../components/trending/TrendingStats';
import TrendingFilter from '../components/trending/TrendingFilter';
import TrendingPostCard from '../components/trending/TrendingPostCard';

const Trending: FC = () => {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [minLikes, setMinLikes] = useState(1);
  const [stats, setStats] = useState({ totalPosts: 0, avgLikes: 0, timeRange: '7 Días' });
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (initialLoad) {
      window.scrollTo(0, 0);
      setInitialLoad(false);
    }
    return () => {
      mounted.current = false;
    };
  }, [initialLoad]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchTrendingData = async () => {
      if (!mounted.current) return;
      
      setLoading(true);
      setError('');

      try {
        const [trendingPosts, trendingStats] = await Promise.all([
          getTrendingPosts(timeRange, minLikes, 20),
          getTrendingStats(timeRange)
        ]);

        if (mounted.current) {
          setPosts(trendingPosts);
          setStats(trendingStats);
          setRetryCount(0);
        }
      } catch (error) {
        console.error('Error fetching trending data:', error);
        if (mounted.current) {
          setError('Error al cargar el contenido trending');
          if (retryCount < 3) {
            timeoutId = setTimeout(() => {
              if (mounted.current) {
                setRetryCount(prev => prev + 1);
              }
            }, 1000 * (retryCount + 1));
          }
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    fetchTrendingData();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeRange, minLikes, retryCount]);

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
    setRetryCount(0);
  };

  const handleMinLikesChange = (newMinLikes: number) => {
    setMinLikes(newMinLikes);
    setRetryCount(0);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError('');
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-orange-900/5 to-red-900/10 pointer-events-none"></div>
        
        <div className="relative container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="h-10 bg-slate-700/50 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-slate-700/30 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-slate-700 rounded w-16 mb-1"></div>
                    <div className="h-4 bg-slate-700 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-8 animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-slate-700 rounded w-32"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-700 rounded w-20"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/6"></div>
                  </div>
                  <div className="w-16 h-8 bg-slate-700 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-orange-900/5 to-red-900/10 pointer-events-none"></div>
        
        <div className="relative container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
          <div className="text-center py-16">
            <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-8 backdrop-blur-sm max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-red-300 mb-4">{error}</h3>
              <p className="text-red-200/70 mb-6">No se pudo cargar el contenido trending después de varios intentos.</p>
              <div className="space-x-4">
                <button
                  onClick={handleRetry}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Reintentar
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-orange-900/5 to-red-900/10 pointer-events-none"></div>
      
      <div className="relative container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-300 via-red-300 to-pink-300 bg-clip-text text-transparent">
              🔥 Trending
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
          </div>
          
          <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
            Descubre el contenido más popular y viral de la comunidad
          </p>
        </div>

        <TrendingStats 
          totalPosts={stats.totalPosts}
          avgLikes={stats.avgLikes}
          timeRange={stats.timeRange}
        />

        <TrendingFilter
          selectedTimeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          minLikes={minLikes}
          onMinLikesChange={handleMinLikesChange}
        />

        {loading && posts.length > 0 && (
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Actualizando trending...</span>
              </div>
            </div>
          </div>
        )}

        {error && retryCount < 3 && (
          <div className="mb-6 text-center">
            <div className="bg-orange-900/50 border border-orange-500/50 rounded-xl p-4 backdrop-blur-sm max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-orange-300 mb-2">{error}</h3>
              <p className="text-orange-200/70 mb-3">Reintentando... ({retryCount}/3)</p>
              <button
                onClick={handleRetry}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Reintentar ahora
              </button>
            </div>
          </div>
        )}

        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <div key={post.id}>
                <TrendingPostCard 
                  post={post} 
                  rank={index + 1}
                />
                {index < posts.length - 1 && (
                  <div className="flex items-center justify-center mt-6">
                    <div className="flex items-center space-x-3 w-full max-w-xs">
                      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-orange-500/30 flex-1"></div>
                      <div className="w-2 h-2 bg-gradient-to-br from-orange-400/50 to-red-400/50 rounded-full"></div>
                      <div className="h-px bg-gradient-to-l from-transparent via-orange-500/30 to-orange-500/30 flex-1"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-slate-600/30">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full animate-ping"></div>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-300 mb-3">No hay contenido trending</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              No se encontraron posts que cumplan con los criterios seleccionados. Intenta ajustar los filtros.
            </p>
            
            <div className="space-x-4">
              <button
                onClick={() => {
                  setTimeRange('all');
                  setMinLikes(0);
                }}
                className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Mostrar todo el contenido</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Trending;