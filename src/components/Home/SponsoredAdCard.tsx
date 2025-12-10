import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Tag } from 'lucide-react';
import { SponsoredAd } from '../../types';
import { incrementAdView, incrementAdClick } from '../../services/sponsoredAdService';

interface SponsoredAdCardProps {
  ad: SponsoredAd;
}

const SponsoredAdCard: React.FC<SponsoredAdCardProps> = ({ ad }) => {
  const navigate = useNavigate();

  useEffect(() => {
    incrementAdView(ad.id);
  }, [ad.id]);

  const handleClick = async () => {
    await incrementAdClick(ad.id);

    if (ad.itemId) {
      navigate(`/item/${ad.itemId}`);
    } else if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-400">
      <div
        onClick={handleClick}
        className="relative"
      >
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-md">
            <Tag size={14} />
            <span>PATROCINADO</span>
          </span>
        </div>

        <div className="relative h-48 overflow-hidden">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Anúncio';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="p-4">
          {(ad.title || ad.description) && (
            <>
              {ad.title && (
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-2 flex-1">
                    {ad.title}
                  </h3>
                  {ad.linkUrl && (
                    <ExternalLink size={18} className="text-gray-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              )}

              {ad.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {ad.description}
                </p>
              )}
            </>
          )}

          <button
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-all transform hover:scale-105"
          >
            Ver Mais
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsoredAdCard;
