import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { SponsoredAd } from '../../types';
import { incrementAdView, incrementAdClick } from '../../services/sponsoredAdService';

interface SponsoredStoryProps {
  ad: SponsoredAd;
}

const SponsoredStory: React.FC<SponsoredStoryProps> = ({ ad }) => {
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
    <div
      onClick={handleClick}
      className="relative flex-shrink-0 w-24 sm:w-28 cursor-pointer group"
    >
      <div className="relative">
        {/* Story Circle with gradient border */}
        <div className="relative p-1 bg-gradient-to-tr from-yellow-400 via-yellow-500 to-yellow-600 rounded-full">
          <div className="bg-white p-0.5 rounded-full">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/100?text=AD';
              }}
            />
          </div>
        </div>

        {/* Sponsored Badge */}
        <div className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 rounded-full p-1 shadow-md">
          <Tag size={12} />
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 text-center">
        {ad.title && (
          <p className="text-xs sm:text-sm font-medium text-gray-800 truncate px-1">
            {ad.title}
          </p>
        )}
        <p className="text-xs text-yellow-600 font-semibold">
          Patrocinado
        </p>
      </div>
    </div>
  );
};

export default SponsoredStory;
