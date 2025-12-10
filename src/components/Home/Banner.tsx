import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Banner as BannerType } from '../../types';

interface BannerProps {
  banners: BannerType[];
}

const Banner: React.FC<BannerProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [banners.length]);

  if (!banners.length) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-lg mb-8">
      <div className="relative w-full h-full">
        <img
          src={currentBanner.image}
          alt={currentBanner.title}
          className="banner-image app-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/1262304/pexels-photo-1262304.jpeg';
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
          <div className="flex flex-col justify-center h-full p-6 md:p-8">
            <h2 className="text-white text-2xl md:text-4xl font-bold mb-2">
              {currentBanner.title}
            </h2>
            <p className="text-white/90 text-lg mb-4 max-w-md">
              {currentBanner.description}
            </p>
            
            {currentBanner.itemId ? (
              <Link
                to={`/item/${currentBanner.itemId}`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-fit"
              >
                Ver Detalhes
              </Link>
            ) : currentBanner.link ? (
              <a
                href={currentBanner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-fit"
              >
                Saiba Mais
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Banner;