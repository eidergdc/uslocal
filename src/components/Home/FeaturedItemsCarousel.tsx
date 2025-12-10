import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Item, UserLocation } from '../../types';
import { calculateDistance, formatDistance } from '../../utils/distance';
import { useAuth } from '../../contexts/AuthContext';
import StarRating from '../Common/StarRating';

interface FeaturedItemsCarouselProps {
  items: Item[];
  userLocation: UserLocation | null;
}

const FeaturedItemsCarousel: React.FC<FeaturedItemsCarouselProps> = ({
  items,
  userLocation
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate carousel every 6 seconds
  useEffect(() => {
    if (items.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 6000);

      return () => clearInterval(timer);
    }
  }, [items.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];
  const distance = userLocation && currentItem?.coordinates ? calculateDistance(
    userLocation.lat,
    userLocation.lng,
    currentItem.coordinates.lat,
    currentItem.coordinates.lng,
    user?.distanceUnit || 'miles'
  ) : undefined;

  // Safety check - if currentItem is undefined, don't render
  if (!currentItem) {
    return null;
  }

  return (
    <div className="relative h-[400px] sm:h-80 md:h-96 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl mb-6 sm:mb-8 group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentItem.images?.[0] || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'}
          alt={currentItem.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg';
          }}
        />

        {/* Gradient Overlay - Stronger on mobile */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 sm:via-black/50 to-black/40 sm:to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end sm:items-center">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-16 sm:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="text-white space-y-2 sm:space-y-4">
              {/* Featured Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-4">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1 sm:space-x-2 animate-pulse">
                  <Star size={14} className="fill-current sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">ITEM EM DESTAQUE</span>
                  <span className="sm:hidden">DESTAQUE</span>
                </div>
                {currentItem.verified && (
                  <div className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Star size={10} className="fill-current sm:w-3 sm:h-3" />
                    <span>VERIFICADO</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {currentItem.name}
              </h2>

              {/* Rating and Distance */}
              <div className="flex items-center gap-3 sm:space-x-4 flex-wrap">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <StarRating rating={currentItem.rating} readonly size={16} />
                  <span className="text-white/90 font-medium text-sm sm:text-base">
                    {currentItem.rating.toFixed(1)} ({currentItem.reviewCount})
                  </span>
                </div>
                {distance && (
                  <div className="flex items-center space-x-1 text-white/80 text-sm sm:text-base">
                    <MapPin size={14} className="sm:w-4 sm:h-4" />
                    <span>{formatDistance(distance, user?.distanceUnit || 'miles')}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-none">
                {currentItem.description}
              </p>

              {/* Categories */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {currentItem.categories.slice(0, 2).map((category) => (
                  <span
                    key={category}
                    className="bg-white/20 backdrop-blur-sm text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border border-white/30"
                  >
                    {category}
                  </span>
                ))}
              </div>

              {/* Location */}
              <div className="flex items-start space-x-1.5 sm:space-x-2 text-white/80">
                <MapPin size={16} className="flex-shrink-0 mt-0.5 sm:w-[18px] sm:h-[18px]" />
                <span className="text-sm sm:text-lg line-clamp-1">{currentItem.address.split(',').slice(0, 2).join(', ')}</span>
              </div>

              {/* CTA Button */}
              <div className="pt-2 sm:pt-4">
                <Link
                  to={`/item/${currentItem.id}`}
                  className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 sm:px-8 py-2.5 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <ExternalLink size={16} className="sm:w-5 sm:h-5" />
                  <span>Ver Detalhes</span>
                </Link>
              </div>
            </div>

            {/* Right Content - Additional Info Card */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
                <h3 className="text-white font-bold text-xl mb-4">Informações Rápidas</h3>
                
                <div className="space-y-3 text-white/90">
                  {currentItem.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs">📞</span>
                      </div>
                      <span>Telefone disponível</span>
                    </div>
                  )}
                  
                  {currentItem.whatsapp && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs">💬</span>
                      </div>
                      <span>WhatsApp disponível</span>
                    </div>
                  )}
                  
                  {currentItem.website && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs">🌐</span>
                      </div>
                      <span>Website próprio</span>
                    </div>
                  )}
                  
                  {currentItem.averagePrice && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs">💰</span>
                      </div>
                      <span>{currentItem.averagePrice}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
            aria-label="Item anterior"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
            aria-label="Próximo item"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white scale-125 shadow-lg'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Ir para item ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-rotate Progress Bar */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-500"
            style={{
              animation: 'carouselProgress 6s linear infinite'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FeaturedItemsCarousel;