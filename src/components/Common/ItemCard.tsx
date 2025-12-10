import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Heart } from 'lucide-react';
import { Item } from '../../types';
import { formatDistance } from '../../utils/distance';
import { useAuth } from '../../contexts/AuthContext';
import StarRating from './StarRating';

interface ItemCardProps {
  item: Item;
  distance?: number;
  onFavorite?: (itemId: string) => void;
  isFavorited?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  distance, 
  onFavorite,
  isFavorited = false
}) => {
  const { user } = useAuth();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(item.id);
    }
  };

  return (
    <Link to={`/item/${item.id}`} className="block">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden h-full flex flex-col">
        <div className="relative">
          <img
            src={item.images?.[0] || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'}
            alt={item.name}
            className="w-full h-40 sm:h-48 object-cover object-center"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg';
            }}
          />

          {item.featured && (
            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-yellow-400 text-yellow-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
              DESTAQUE
            </div>
          )}

          {item.status === 'pending' && (
            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-orange-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
              PENDENTE
            </div>
          )}
          
          {item.verified && (
            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-blue-500 text-white p-1 rounded-full">
              <Star size={14} className="fill-current sm:w-4 sm:h-4" />
            </div>
          )}

          {user && !user.isAnonymous && (
            <button
              onClick={handleFavorite}
              className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-white bg-opacity-90 p-1.5 sm:p-2 rounded-full hover:bg-opacity-100 transition-all"
            >
              <Heart
                size={18}
                className={`sm:w-5 sm:h-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'} transition-colors`}
              />
            </button>
          )}
        </div>

        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1.5 sm:mb-2">
            <h3 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-2 flex-1 min-h-[2.75rem] sm:min-h-[3.5rem]">
              {item.name}
            </h3>
            {distance && (
              <span className="text-xs sm:text-sm text-gray-500 ml-2 flex items-center flex-shrink-0">
                <MapPin size={12} className="mr-1 sm:w-[14px] sm:h-[14px]" />
                <span className="hidden sm:inline">{formatDistance(distance, user?.distanceUnit || 'miles')}</span>
                <span className="sm:hidden">{formatDistance(distance, user?.distanceUnit || 'miles').split(' ')[0]}</span>
              </span>
            )}
          </div>

          <div className="flex items-center mb-1.5 sm:mb-2">
            <StarRating rating={item.rating} readonly size={14} />
            <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-600">
              ({item.reviewCount})
            </span>
          </div>

          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 flex-1 min-h-[2rem] sm:min-h-[2.5rem]">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
            {item.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium"
              >
                {category}
              </span>
            ))}
            {item.categories.length > 2 && (
              <span className="text-gray-500 text-[10px] sm:text-xs">+{item.categories.length - 2}</span>
            )}
          </div>

          <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mt-auto">
            <span className="flex items-center truncate flex-1 mr-2">
              <MapPin size={12} className="mr-1 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
              <span className="truncate">{item.address.split(',')[0]}</span>
            </span>
            {item.averagePrice && (
              <span className="font-medium text-green-600 flex-shrink-0">
                {item.averagePrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;