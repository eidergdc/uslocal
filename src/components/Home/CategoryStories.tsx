import React, { useEffect, useState, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { Category, SponsoredAd } from '../../types';
import { getActiveAdsByPlacement } from '../../services/sponsoredAdService';
import SponsoredStory from './SponsoredStory';

interface CategoryStoriesProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const CategoryStories: React.FC<CategoryStoriesProps> = ({
  categories,
  selectedCategory,
  onCategorySelect
}) => {
  const [sponsoredAds, setSponsoredAds] = useState<SponsoredAd[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    loadSponsoredAds();
  }, []);

  const loadSponsoredAds = async () => {
    try {
      const ads = await getActiveAdsByPlacement('category_story');
      setSponsoredAds(ads.slice(0, 2));
    } catch (error) {
      console.error('Error loading sponsored stories:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderCategoryIcon = (category: Category) => {
    const iconSize = category.iconSize || 24;
    const iconProps = { size: iconSize, className: "text-white" };

    if (category.iconUrl) {
      return (
        <img
          src={category.iconUrl}
          alt={category.name}
          className="object-contain"
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        />
      );
    }

    if (category.icon) {
      const IconComponent = (LucideIcons as any)[category.icon];
      if (IconComponent) {
        return <IconComponent {...iconProps} />;
      }
    }

    return <LucideIcons.Circle {...iconProps} />;
  };

  return (
    <div className="mb-6 -mx-4 sm:mx-0">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 px-4 sm:px-0">Categorias</h3>

      <div
        ref={scrollContainerRef}
        className="flex space-x-3 sm:space-x-4 overflow-x-auto overflow-y-hidden pb-2 px-4 sm:px-0 scrollbar-hide select-none"
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth', cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {/* All Categories Button */}
        <button
          onClick={() => onCategorySelect('')}
          className={`flex-shrink-0 flex flex-col items-center space-y-1.5 sm:space-y-2 min-w-[3.5rem] sm:min-w-[4rem] w-14 sm:w-16 ${
            selectedCategory === '' ? 'opacity-100' : 'opacity-70'
          }`}
        >
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === ''
                ? 'ring-2 sm:ring-3 ring-green-600 ring-offset-2 scale-105'
                : 'hover:scale-105'
            }`}
            style={{ backgroundColor: '#009739' }}
          >
            <LucideIcons.Grid3x3 size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <span className="text-xs text-center text-gray-700 font-medium line-clamp-2 w-full">
            Todos
          </span>
        </button>

        {/* Sponsored Stories - Show first sponsored ad after "All" button */}
        {sponsoredAds[0] && <SponsoredStory ad={sponsoredAds[0]} />}

        {/* Category Buttons */}
        {categories.map((category, index) => (
          <React.Fragment key={category.id}>
            <button
              onClick={() => onCategorySelect(category.id)}
              className={`flex-shrink-0 flex flex-col items-center space-y-1.5 sm:space-y-2 min-w-[3.5rem] sm:min-w-[4rem] w-14 sm:w-16 ${
                selectedCategory === category.id ? 'opacity-100' : 'opacity-70'
              }`}
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${
                  selectedCategory === category.id
                    ? 'ring-2 sm:ring-3 ring-green-600 ring-offset-2 scale-105'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: category.color }}
              >
                {renderCategoryIcon(category)}
              </div>
              <span className="text-xs text-center text-gray-700 font-medium line-clamp-2 w-full">
                {category.name}
              </span>
            </button>

            {/* Show second sponsored ad after middle category */}
            {index === Math.floor(categories.length / 2) && sponsoredAds[1] && (
              <SponsoredStory ad={sponsoredAds[1]} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CategoryStories;
