import type { FC } from 'react';
import { useState } from 'react';
import type { CustomProfileTheme } from '../../types/profileTheme';

interface ThemeCustomizerProps {
  theme: CustomProfileTheme;
  onChange: (theme: CustomProfileTheme) => void;
}

const predefinedColors = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
];

const ThemeCustomizer: FC<ThemeCustomizerProps> = ({ theme, onChange }) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'accent'>('primary');

  const handleColorSelect = (color: string) => {
    onChange({
      ...theme,
      [activeTab === 'primary' ? 'primaryColor' : 'accentColor']: color
    });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...theme,
      [activeTab === 'primary' ? 'primaryColor' : 'accentColor']: e.target.value
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-700 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setActiveTab('primary')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'primary' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          Color Primario
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accent')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'accent' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          Color de Acento
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorSelect(color)}
            className={`aspect-square rounded-lg transition-all duration-200 hover:scale-105 ${
              theme[activeTab === 'primary' ? 'primaryColor' : 'accentColor'] === color
                ? 'ring-2 ring-white scale-105'
                : 'hover:ring-1 hover:ring-gray-400'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={theme[activeTab === 'primary' ? 'primaryColor' : 'accentColor']}
          onChange={handleCustomColorChange}
          className="w-12 h-12 rounded-lg border-2 border-gray-600 cursor-pointer"
        />
        <input
          type="text"
          value={theme[activeTab === 'primary' ? 'primaryColor' : 'accentColor']}
          onChange={(e) => {
            const value = e.target.value;
            if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
              onChange({
                ...theme,
                [activeTab === 'primary' ? 'primaryColor' : 'accentColor']: value
              });
            }
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          placeholder="#000000"
        />
      </div>

      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Vista Previa</h4>
        <div
          className="h-16 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`
          }}
        />
      </div>
    </div>
  );
};

export default ThemeCustomizer;