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

  const handleColorSelect = (color: string, type: 'primary' | 'accent') => {
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
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-80 mx-auto overflow-hidden">
            <div 
              className="h-20 relative"
              style={getPreviewStyle()}
            >
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            <div className="relative px-4 pt-2">
              <div className="absolute -top-8 left-4">
                <div 
                  className="w-16 h-16 rounded-full border-4 border-gray-900 shadow-xl ring-2 flex items-center justify-center text-white font-bold text-xl"
                  style={{
                    background: selectedTheme.accentColor,
                    borderColor: selectedTheme.primaryColor
                  }}
                >
                  U
                </div>
              </div>
            </div>
            
            <div className="pt-10 p-4">
              <div className="mb-3">
                <h3 className="font-bold text-white text-lg leading-tight">Tu Nombre</h3>
                <p className="text-gray-400 text-sm">@usuario</p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Esta es tu biografía personalizada que aparecerá en tu perfil.
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  className="flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200"
                  style={{ backgroundColor: selectedTheme.accentColor }}
                >
                  Ver perfil completo
                </button>
                <button className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'primary'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Color Primario
            </button>
            <button
              onClick={() => setActiveTab('accent')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'accent'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Color de Acento
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            {activeTab === 'primary' ? 'Seleccionar Color Primario' : 'Seleccionar Color de Acento'}
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
            {COLOR_PALETTE[activeTab].map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value, activeTab)}
                className={`
                  group relative aspect-square rounded-lg overflow-hidden transition-all duration-200
                  ${(activeTab === 'primary' ? selectedTheme.primaryColor : selectedTheme.accentColor) === color.value
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-105' 
                    : 'hover:scale-105 hover:ring-1 hover:ring-gray-400'
                  }
                `}
                title={color.name}
                style={{ backgroundColor: color.value }}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-200"></div>
                
                {(activeTab === 'primary' ? selectedTheme.primaryColor : selectedTheme.accentColor) === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: selectedTheme.primaryColor }}
              ></div>
              <div>
                <div className="text-white font-medium text-sm">Color Primario</div>
                <div className="text-gray-400 text-xs">{selectedTheme.primaryColor}</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: selectedTheme.accentColor }}
              ></div>
              <div>
                <div className="text-white font-medium text-sm">Color de Acento</div>
                <div className="text-gray-400 text-xs">{selectedTheme.accentColor}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 sm:p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-300 text-xs sm:text-sm">
                Los colores personalizados aparecerán en tu modal de vista previa y elementos relacionados con tu perfil. 
                Otros usuarios verán estos colores cuando interactúen contigo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileThemeSelector;