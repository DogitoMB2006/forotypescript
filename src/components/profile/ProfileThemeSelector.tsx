import type { FC } from 'react';
import { useState } from 'react';
import { COLOR_PALETTE } from '../../types/profileTheme';
import type { CustomProfileTheme } from '../../types/profileTheme';

interface ProfileThemeSelectorProps {
  selectedTheme: CustomProfileTheme;
  onThemeChange: (theme: CustomProfileTheme) => void;
  className?: string;
}

const ProfileThemeSelector: FC<ProfileThemeSelectorProps> = ({
  selectedTheme,
  onThemeChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'accent'>('primary');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handleColorSelect = (
    e: React.MouseEvent,
    color: string,
    type: 'primary' | 'accent'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onThemeChange({
      ...selectedTheme,
      [type === 'primary' ? 'primaryColor' : 'accentColor']: color
    });
  };

  const handleCustomColorChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'primary' | 'accent'
  ) => {
    const color = e.target.value;
    onThemeChange({
      ...selectedTheme,
      [type === 'primary' ? 'primaryColor' : 'accentColor']: color
    });
  };

  const getPreviewStyle = () => {
    return {
      background: `linear-gradient(135deg, ${selectedTheme.primaryColor}, ${selectedTheme.accentColor})`
    };
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div
            className="w-6 h-6 rounded-full"
            style={getPreviewStyle()}
          ></div>
          <h3 className="text-lg sm:text-xl font-bold text-white">Personalizar Tema</h3>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-gray-800 rounded-xl border border-gray-700">
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Vista Previa del Modal</h4>
          <div
            className="rounded-xl shadow-2xl w-full max-w-80 mx-auto overflow-hidden border-2"
            style={{
              backgroundColor: selectedTheme.primaryColor,
              backgroundImage: `linear-gradient(135deg, ${selectedTheme.primaryColor}, ${selectedTheme.accentColor})`,
              borderColor: selectedTheme.primaryColor,
              boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${selectedTheme.primaryColor}`
            }}
          >
            <div
              className="h-20 relative"
              style={getPreviewStyle()}
            >
              <div className="absolute inset-0 bg-black/10"></div>
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20"
                style={{
                  background: `linear-gradient(135deg, ${selectedTheme.primaryColor}, ${selectedTheme.accentColor})`
                }}
              ></div>
            </div>

            <div className="relative px-4 pt-2">
              <div className="absolute -top-8 left-4">
                <div
                  className="w-16 h-16 rounded-full border-4 shadow-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTheme.accentColor}, ${selectedTheme.primaryColor})`,
                    borderColor: '#111827',
                    boxShadow: `0 0 0 2px ${selectedTheme.primaryColor}, 0 25px 25px -5px rgba(0, 0, 0, 0.25)`
                  }}
                >
                  U
                </div>
              </div>
            </div>

            <div className="pt-10 p-4 relative">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle at top left, ${selectedTheme.accentColor}, transparent 50%)`
                }}
              ></div>

              <div className="relative z-10">
                <div className="mb-3">
                  <h3
                    className="font-bold text-lg leading-tight"
                    style={{ color: selectedTheme.accentColor }}
                  >
                    Tu Nombre
                  </h3>
                  <p className="text-gray-300 text-sm">@usuario</p>
                </div>

                <div className="mb-4">
                  <p className="text-gray-100 text-sm leading-relaxed">
                    Esta es tu biografía personalizada que aparecerá en tu perfil.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    className="flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 border"
                    style={{
                      background: `linear-gradient(135deg, ${selectedTheme.accentColor}, ${selectedTheme.primaryColor})`,
                      borderColor: selectedTheme.primaryColor
                    }}
                  >
                    Ver perfil completo
                  </button>
                  <button
                    type="button"
                    className="p-2.5 text-gray-400 hover:text-white rounded-lg transition-colors duration-200 border"
                    style={{
                      borderColor: selectedTheme.primaryColor + '40'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Tabs */}
        <div className="mb-4">
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
        </div>

        {/* Paleta de Colores */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">
              {activeTab === 'primary' ? 'Seleccionar Color Primario' : 'Seleccionar Color de Acento'}
            </h4>
            <button
              type="button"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`text-xs px-3 py-1 rounded-full transition-colors duration-200 ${
                showCustomPicker ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showCustomPicker ? 'Predefinidos' : 'Personalizado'}
            </button>
          </div>

          {showCustomPicker ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={activeTab === 'primary' ? selectedTheme.primaryColor : selectedTheme.accentColor}
                  onChange={(e) => handleCustomColorChange(e, activeTab)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-600 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={activeTab === 'primary' ? selectedTheme.primaryColor : selectedTheme.accentColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                      onThemeChange({
                        ...selectedTheme,
                        [activeTab === 'primary' ? 'primaryColor' : 'accentColor']: value
                      });
                    }
                  }}
                  placeholder="#000000"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
              {COLOR_PALETTE[activeTab].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={(e) => handleColorSelect(e, color.value, activeTab)}
                  className={`aspect-square rounded-lg transition-all duration-200 hover:scale-110 ${
                    (activeTab === 'primary' ? selectedTheme.primaryColor : selectedTheme.accentColor) === color.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                      : 'hover:ring-1 hover:ring-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileThemeSelector;
