import type { FC } from 'react';

interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif: {
      url: string;
      preview: string;
      dims: [number, number];
      size: number;
    };
    mediumgif: {
      url: string;
      preview: string;
      dims: [number, number];
      size: number;
    };
    tinygif: {
      url: string;
      preview: string;
      dims: [number, number];
      size: number;
    };
  };
}

interface GifContainerProps {
  gifs: TenorGif[];
  loading: boolean;
  selectedGif: string | null;
  onSelectGif: (gifUrl: string) => void;
}

const GifContainer: FC<GifContainerProps> = ({ gifs, loading, selectedGif, onSelectGif }) => {
  const getGifUrl = (gif: TenorGif) => {
    return gif.media_formats.mediumgif?.url || gif.media_formats.gif?.url || gif.media_formats.tinygif?.url;
  };

  const getGifDimensions = (gif: TenorGif) => {
    const format = gif.media_formats.mediumgif || gif.media_formats.gif || gif.media_formats.tinygif;
    return format?.dims || [200, 200];
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(20)].map((_, index) => (
            <div key={index} className="aspect-square bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (gifs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No se encontraron GIFs</h3>
          <p className="text-gray-500">Intenta con otros términos de búsqueda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {gifs.map((gif) => {
          const gifUrl = getGifUrl(gif);
          const [width, height] = getGifDimensions(gif);
          const aspectRatio = height / width;
          const isSelected = selectedGif === gifUrl;

          return (
            <div
              key={gif.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-105 ${
                isSelected 
                  ? 'ring-4 ring-blue-500 shadow-lg shadow-blue-500/50' 
                  : 'hover:ring-2 hover:ring-blue-400'
              }`}
              style={{ aspectRatio: Math.min(aspectRatio, 1.5) }}
              onClick={() => onSelectGif(gifUrl)}
            >
              <img
                src={gifUrl}
                alt={gif.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <p className="text-white text-xs truncate">{gif.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 text-xs">
          Powered by{' '}
          <a 
            href="https://tenor.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            Tenor
          </a>
        </p>
      </div>
    </div>
  );
};

export default GifContainer;