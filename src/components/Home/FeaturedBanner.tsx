import React, { useEffect, useState } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { SponsoredAd } from '../../types';
import { getActiveAdsByPlacement, incrementAdView, incrementAdClick } from '../../services/sponsoredAdService';
import { openUrl } from '../../utils/openUrl';

const FeaturedBanner: React.FC = () => {
  const [ad, setAd] = useState<SponsoredAd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAd();
  }, []);

  const loadAd = async () => {
    try {
      console.log('🎯 FeaturedBanner - Buscando anúncios...');
      const ads = await getActiveAdsByPlacement('featured_banner');
      console.log('🎯 FeaturedBanner - Anúncios encontrados:', ads.length, ads);

      if (ads.length > 0) {
        const selectedAd = ads[0];
        console.log('🎯 FeaturedBanner - Anúncio selecionado:', selectedAd);
        setAd(selectedAd);
        await incrementAdView(selectedAd.id);
      } else {
        console.log('⚠️ FeaturedBanner - Nenhum anúncio ativo encontrado para featured_banner');
      }
    } catch (error) {
      console.error('❌ Error loading featured ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (!ad) return;

    await incrementAdClick(ad.id);

    if (ad.linkUrl) {
      openUrl(ad.linkUrl);
    } else if (ad.itemId) {
      window.location.href = `/item/${ad.itemId}`;
    }
  };

  console.log('🎯 FeaturedBanner - Estado atual:', { loading, ad, hasAd: !!ad });

  if (loading) {
    console.log('⏳ FeaturedBanner - Ainda carregando...');
    return null;
  }

  if (!ad) {
    console.log('❌ FeaturedBanner - Nenhum anúncio para exibir');
    return null;
  }

  return (
    <div className="w-full px-4 mb-6">
      <div className="relative group">
        <div
          onClick={handleClick}
          className="relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={14} fill="#FFD700" color="#FFD700" />
                <span className="text-xs font-bold text-yellow-400 tracking-wider">
                  ANÚNCIO EM DESTAQUE
                </span>
              </div>
              {ad.linkUrl && (
                <ExternalLink size={16} className="text-white opacity-80" />
              )}
            </div>
          </div>

          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-48 md:h-64 object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Anúncio';
            }}
          />

          {(ad.title || ad.description) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10 p-6">
              {ad.title && (
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
                  {ad.title}
                </h3>
              )}
              {ad.description && (
                <p className="text-sm md:text-base text-gray-200 line-clamp-2">
                  {ad.description}
                </p>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-yellow-400/0 group-hover:bg-yellow-400/5 transition-colors duration-300 pointer-events-none z-20" />
        </div>
      </div>
    </div>
  );
};

export default FeaturedBanner;
