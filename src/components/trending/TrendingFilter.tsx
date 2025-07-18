import type { FC } from 'react';

export type TimeRange = '24h' | '7d' | '30d' | 'all';

interface TrendingFilterProps {
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  minLikes: number;
  onMinLikesChange: (likes: number) => void;
}

const TrendingFilter: FC<TrendingFilterProps> = ({
  selectedTimeRange,
  onTimeRangeChange,
  minLikes,
  onMinLikesChange
}) => {
  const timeRanges: { value: TimeRange; label: string; icon: string }[] = [
    { value: '24h', label: '24 Horas', icon: '⚡' },
    { value: '7d', label: '7 Días', icon: '📅' },
    { value: '30d', label: '30 Días', icon: '📊' },
    { value: 'all', label: 'Todo', icon: '🌟' }
  ];

  const likesOptions = [
    { value: 0, label: 'Todos' },
    { value: 1, label: '1+ Likes' },
    { value: 5, label: '5+ Likes' },
    { value: 10, label: '10+ Likes' },
    { value: 25, label: '25+ Likes' }
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span className="text-orange-400">🔥</span>
            <span>Período de Tiempo</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium 
                  transition-all duration-300 border
                  ${selectedTimeRange === range.value
                    ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/50 text-orange-300 shadow-lg shadow-orange-500/25'
                    : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }
                `}
              >
                <span>{range.icon}</span>
                <span>{range.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span className="text-emerald-400">💚</span>
            <span>Likes Mínimos</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {likesOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onMinLikesChange(option.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium 
                  transition-all duration-300 border
                  ${minLikes === option.value
                    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingFilter;