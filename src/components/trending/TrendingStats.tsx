import type { FC } from 'react';

interface TrendingStatsProps {
  totalPosts: number;
  avgLikes: number;
  timeRange: string;
}

const TrendingStats: FC<TrendingStatsProps> = ({ totalPosts, avgLikes, timeRange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-orange-300">{totalPosts}</h3>
            <p className="text-orange-200/70 text-sm">Posts Trending</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">💫</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-300">{avgLikes.toFixed(1)}</h3>
            <p className="text-emerald-200/70 text-sm">Likes Promedio</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">⏰</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-300">{timeRange}</h3>
            <p className="text-purple-200/70 text-sm">Período Activo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingStats;