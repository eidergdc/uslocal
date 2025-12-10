import React, { useEffect, useState } from 'react';
import { SponsoredAd } from '../../types';
import { getActiveAdsByPlacement } from '../../services/sponsoredAdService';
import SponsoredAdCard from '../Home/SponsoredAdCard';

const RelatedAds: React.FC = () => {
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const adsData = await getActiveAdsByPlacement('item_detail');
      setAds(adsData.slice(0, 3));
    } catch (error) {
      console.error('Error loading related ads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || ads.length === 0) return null;

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Anúncios Relacionados
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <SponsoredAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  );
};

export default RelatedAds;
