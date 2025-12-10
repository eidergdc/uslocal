import React from 'react';
import { X, MapPin, Star, ExternalLink, Navigation, Phone, MessageCircle, Globe } from 'lucide-react';
import { Item } from '../../types';
import { Link } from 'react-router-dom';
import StarRating from '../Common/StarRating';
import { openWhatsApp, openPhone, openMaps, openWebsite } from '../../utils/openUrl';

interface MarkerModalProps {
  item: Item;
  onClose: () => void;
  onNavigate: (item: Item) => void;
}

const MarkerModal: React.FC<MarkerModalProps> = ({ item, onClose, onNavigate }) => {
  const handleNavigate = () => {
    onNavigate(item);
  };

  const handleExternalNavigation = async (app: 'google' | 'apple' | 'waze') => {
    const { lat, lng } = item.coordinates;
    await openMaps(lat, lng, app);
    onClose();
  };

  const handleContact = async (type: 'phone' | 'whatsapp' | 'website') => {
    switch (type) {
      case 'phone':
        if (item.phone) await openPhone(item.phone);
        break;
      case 'whatsapp':
        if (item.whatsapp) await openWhatsApp(item.whatsapp);
        break;
      case 'website':
        if (item.website) await openWebsite(item.website);
        break;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header with Image - Ultra Compacted */}
        <div className="relative">
          <img
            src={item.images?.[0] || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'}
            alt={item.name}
            className="w-full h-24 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg';
            }}
          />

          <button
            onClick={onClose}
            className="absolute top-1.5 right-1.5 bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80 transition-colors"
          >
            <X size={14} />
          </button>

          {item.featured && (
            <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded text-[9px] font-bold">
              DESTAQUE
            </div>
          )}

          {item.verified && (
            <div className="absolute bottom-1.5 right-1.5 bg-blue-500 text-white p-0.5 rounded-full">
              <Star size={10} className="fill-current" />
            </div>
          )}
        </div>

        {/* Content - Ultra Compacted NO SCROLL */}
        <div className="p-2.5">
          {/* Title and Rating */}
          <div className="mb-1.5">
            <h3 className="font-bold text-sm text-gray-800 mb-0.5 line-clamp-1">{item.name}</h3>
            <div className="flex items-center gap-1.5 mb-0.5">
              <StarRating rating={item.rating} readonly size={12} />
              <span className="text-[10px] text-gray-600">({item.reviewCount})</span>
            </div>
            <div className="flex items-start text-gray-600 text-[10px]">
              <MapPin size={10} className="mr-0.5 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{item.address.split(',')[0]}</span>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-0.5 mb-1.5">
            {item.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-[9px] font-medium"
              >
                {category}
              </span>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-1 mb-1.5">
            {item.phone && (
              <button
                onClick={() => handleContact('phone')}
                className="flex flex-col items-center justify-center bg-blue-100 text-blue-700 py-1 rounded text-[9px] font-medium hover:bg-blue-200 transition-colors"
              >
                <Phone size={10} className="mb-0.5" />
                <span>Ligar</span>
              </button>
            )}

            {item.whatsapp && (
              <button
                onClick={() => handleContact('whatsapp')}
                className="flex flex-col items-center justify-center bg-green-100 text-green-700 py-1 rounded text-[9px] font-medium hover:bg-green-200 transition-colors"
              >
                <MessageCircle size={10} className="mb-0.5" />
                <span>WhatsApp</span>
              </button>
            )}

            {item.website && (
              <button
                onClick={() => handleContact('website')}
                className="flex flex-col items-center justify-center bg-purple-100 text-purple-700 py-1 rounded text-[9px] font-medium hover:bg-purple-200 transition-colors"
              >
                <Globe size={10} className="mb-0.5" />
                <span>Site</span>
              </button>
            )}
          </div>

          {/* Navigation Options */}
          <div className="mb-1.5">
            <h4 className="font-semibold text-[10px] text-gray-700 mb-0.5">Navegação:</h4>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleExternalNavigation('google')}
                className="flex flex-col items-center justify-center bg-red-100 text-red-700 py-1 rounded text-[9px] font-medium hover:bg-red-200 transition-colors"
              >
                <Navigation size={10} className="mb-0.5" />
                <span>Google</span>
              </button>

              <button
                onClick={() => handleExternalNavigation('apple')}
                className="flex flex-col items-center justify-center bg-gray-100 text-gray-700 py-1 rounded text-[9px] font-medium hover:bg-gray-200 transition-colors"
              >
                <Navigation size={10} className="mb-0.5" />
                <span>Apple</span>
              </button>

              <button
                onClick={() => handleExternalNavigation('waze')}
                className="flex flex-col items-center justify-center bg-blue-100 text-blue-700 py-1 rounded text-[9px] font-medium hover:bg-blue-200 transition-colors"
              >
                <Navigation size={10} className="mb-0.5" />
                <span>Waze</span>
              </button>
            </div>
          </div>

          {/* Main Actions */}
          <div className="flex gap-1.5">
            <Link
              to={`/item/${item.id}`}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded font-semibold text-center transition-colors flex items-center justify-center space-x-1 text-[10px]"
              onClick={onClose}
            >
              <ExternalLink size={12} />
              <span>Ver Perfil</span>
            </Link>

            <button
              onClick={handleNavigate}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded font-semibold transition-colors flex items-center justify-center space-x-1 text-[10px]"
            >
              <Navigation size={12} />
              <span>Ir Agora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkerModal;