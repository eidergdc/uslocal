import React, { useState } from 'react';
import { Search, Filter, MapPin, Clock } from 'lucide-react';
import { Category } from '../../types';
import { t } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  maxDistance: number;
  onDistanceChange: (distance: number) => void;
  openNow: boolean;
  onOpenNowChange: (openNow: boolean) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  maxDistance,
  onDistanceChange,
  openNow,
  onOpenNowChange
}) => {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  
  const distanceUnit = user?.distanceUnit || 'miles';
  const unitLabel = distanceUnit === 'miles' ? 'mi' : 'km';

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
      {/* Search Bar */}
      <div className="relative mb-3 sm:mb-4">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('home.searchPlaceholder')}
          className="w-full pl-10 sm:pl-12 pr-12 sm:pr-16 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 transition-colors ${showFilters ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
        >
          <Filter size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 border-t pt-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Distance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin size={16} className="mr-1" />
              Distância máxima: {maxDistance >= 1000 ? 'Todas' : `${maxDistance}${unitLabel}`}
            </label>
            <input
              type="range"
              min="1"
              max="1000"
              value={maxDistance}
              onChange={(e) => onDistanceChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1{unitLabel}</span>
              <span>Todas</span>
            </div>
          </div>

          {/* Open Now Filter */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="openNow"
              checked={openNow}
              onChange={(e) => onOpenNowChange(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="openNow" className="text-sm font-medium text-gray-700 flex items-center">
              <Clock size={16} className="mr-1" />
              Aberto agora
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;