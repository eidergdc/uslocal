import React, { useState, useEffect } from 'react';
import { List, Map, Star, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { getItems } from '../services/itemService';
import { getCategories } from '../services/categoryService';
import { getActiveAdsByPlacement } from '../services/sponsoredAdService';
import { Item, Category, SponsoredAd } from '../types';
import { calculateDistance } from '../utils/distance';
import { t } from '../i18n';
import SearchFilters from '../components/Home/SearchFilters';
import CategoryStories from '../components/Home/CategoryStories';
import ItemCard from '../components/Common/ItemCard';
import SponsoredAdCard from '../components/Home/SponsoredAdCard';
import FeaturedBanner from '../components/Home/FeaturedBanner';
import GoogleMap from '../components/Map/GoogleMap';
import FeaturedItemsCarousel from '../components/Home/FeaturedItemsCarousel';
import LoginModal from '../components/Auth/LoginModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userLocation } = useLocation();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [mapItems, setMapItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sponsoredAds, setSponsoredAds] = useState<SponsoredAd[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxDistance, setMaxDistance] = useState(1000); // High default to show all items
  const [openNow, setOpenNow] = useState(false);
  const [currentView, setCurrentView] = useState<'map' | 'list'>('list');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const onItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  // Log user photo for debugging
  useEffect(() => {
    if (user) {
      console.log('🏠 Home - User photoURL:', user.photoURL);
    }
  }, [user?.photoURL]);


  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 HOME - Loading data...');

        // Always load approved items for public view
        let approvedItems = await getItems({ status: 'approved' });

        // If user is logged in and not anonymous, also load their pending items
        let allItems = approvedItems;
        if (user && !user.isAnonymous) {
          try {
            const userPendingItems = await getItems({
              status: 'pending',
              ownerId: user.uid
            });

            // Combine and remove duplicates by ID
            const combined = [...approvedItems, ...userPendingItems];
            const uniqueItemsMap = new Map<string, Item>();

            combined.forEach(item => {
              if (!uniqueItemsMap.has(item.id)) {
                uniqueItemsMap.set(item.id, item);
              }
            });

            allItems = Array.from(uniqueItemsMap.values());
            console.log('🏠 Home - Removed duplicates:', {
              approved: approvedItems.length,
              pending: userPendingItems.length,
              combined: combined.length,
              unique: allItems.length
            });
          } catch (error) {
            console.warn('Could not load user pending items:', error);
          }
        }

        // Filter out hidden items if user is not the owner
        if (user && !user.isAnonymous) {
          allItems = allItems.filter(item => item.visible || item.ownerId === user.uid);
        } else {
          allItems = allItems.filter(item => item.visible);
        }

        const [categoriesData, adsData] = await Promise.all([
          getCategories(),
          getActiveAdsByPlacement('home_list')
        ]);

        const featuredItems = allItems.filter(item => item.featured);
        console.log('✅ Loaded items:', {
          approved: allItems.filter(item => item.status === 'approved').length,
          userPending: user && !user.isAnonymous ? allItems.length - allItems.filter(item => item.status === 'approved').length : 0,
          total: allItems.length,
          featured: featuredItems.length,
          featuredDetails: featuredItems.map(i => ({
            id: i.id,
            name: i.name,
            featured: i.featured,
            visible: i.visible,
            status: i.status
          }))
        });

        // Log ALL items to verify if deleted items are still in database
        console.log('📋 ALL ITEMS IDs:', allItems.map(i => ({ id: i.id, name: i.name, featured: i.featured })));

        setItems(allItems);
        setCategories(categoriesData);
        setSponsoredAds(adsData);
        
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    let filtered = items;
    let forMap = items;

    // Filtro de categoria (aplicar para lista E mapa)
    if (selectedCategory) {
      filtered = filtered.filter(item =>
        item.categories.includes(selectedCategory)
      );
      forMap = forMap.filter(item =>
        item.categories.includes(selectedCategory)
      );
    }

    // Busca por texto (aplicar para lista E mapa)
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      forMap = forMap.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro de distância (aplicar APENAS para lista, NÃO para mapa)
    if (userLocation) {
      filtered = filtered.filter(item => {
        if (!item.coordinates) {
          console.warn('⚠️ ITEM SEM COORDENADAS:', item.name, item.type);
          return false;
        }
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          item.coordinates.lat,
          item.coordinates.lng,
          user?.distanceUnit || 'miles'
        );
        const maxDistanceInUserUnit = user?.distanceUnit === 'km' ? maxDistance : maxDistance * 0.621371; // Convert km to miles
        return distance <= maxDistanceInUserUnit;
      });
    }

    // Filtro "aberto agora" (aplicar para lista E mapa)
    if (openNow) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().substring(0, 3) +
                        now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().substring(3);
      const currentTime = now.toTimeString().substring(0, 5);

      filtered = filtered.filter(item => {
        if (!item.schedule) {
          console.warn('⚠️ ITEM SEM HORÁRIOS:', item.name, item.type);
          return false;
        }
        const schedule = item.schedule[currentDay as keyof typeof item.schedule];
        if (schedule?.closed) return false;

        return schedule?.open <= currentTime && schedule?.close >= currentTime;
      });

      forMap = forMap.filter(item => {
        if (!item.schedule) return false;
        const schedule = item.schedule[currentDay as keyof typeof item.schedule];
        if (schedule?.closed) return false;

        return schedule?.open <= currentTime && schedule?.close >= currentTime;
      });
    }

    // Ordenar por distância se localização disponível (apenas para lista)
    if (userLocation && filtered.length > 0) {
      filtered = filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        const distanceA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.coordinates.lat,
          a.coordinates.lng,
          user?.distanceUnit || 'miles'
        );
        const distanceB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.coordinates.lat,
          b.coordinates.lng,
          user?.distanceUnit || 'miles'
        );
        return distanceA - distanceB;
      });
    }

    setFilteredItems(filtered);
    setMapItems(forMap);
  }, [items, searchTerm, selectedCategory, maxDistance, openNow, userLocation, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 md:py-8">
        {/* Category Stories */}
        <CategoryStories
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        {/* Featured Banner Ad - Always visible */}
        <FeaturedBanner />

        {/* Search and Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          maxDistance={maxDistance}
          onDistanceChange={setMaxDistance}
          openNow={openNow}
          onOpenNowChange={setOpenNow}
        />

        {/* View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
          </h2>

          <div className="bg-white rounded-lg shadow-md overflow-hidden flex">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-3 sm:px-4 py-2 flex items-center space-x-1 sm:space-x-2 transition-colors ${
                currentView === 'list' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List size={18} />
              <span className="text-sm sm:text-base">Lista</span>
            </button>
            <button
              onClick={() => setCurrentView('map')}
              className={`px-3 sm:px-4 py-2 flex items-center space-x-1 sm:space-x-2 transition-colors ${
                currentView === 'map' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Map size={18} />
              <span className="text-sm sm:text-base">Mapa</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {currentView === 'list' ? (
          <>
            {/* Featured Items Section - Always show featured items regardless of distance */}
            {(() => {
              // Get featured items from ALL items, not just filtered ones
              let featuredItems = items.filter(item => item.featured && item.coordinates);

              // Apply only category and search filters, NOT distance filter
              if (selectedCategory) {
                featuredItems = featuredItems.filter(item =>
                  item.categories.includes(selectedCategory)
                );
              }

              if (searchTerm) {
                featuredItems = featuredItems.filter(item =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
                );
              }

              if (openNow) {
                const now = new Date();
                const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const currentTime = now.toTimeString().substring(0, 5);

                featuredItems = featuredItems.filter(item => {
                  if (!item.schedule) return false;
                  const schedule = item.schedule[currentDay as keyof typeof item.schedule];
                  if (schedule?.closed) return false;
                  return schedule?.open <= currentTime && schedule?.close >= currentTime;
                });
              }

              console.log('🌟 Featured items na Home:', {
                count: featuredItems.length,
                items: featuredItems.map(i => ({ id: i.id, name: i.name, featured: i.featured }))
              });
              return featuredItems.length > 0;
            })() && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center flex-wrap gap-2">
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs sm:text-sm font-bold">
                    DESTAQUE
                  </span>
                  <span className="text-sm sm:text-xl">{selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name || 'Categoria'} em Destaque` : 'Itens em Destaque'}</span>
                </h3>
                <FeaturedItemsCarousel
                  items={(() => {
                    let featuredItems = items.filter(item => item && item.featured && item.coordinates);

                    if (selectedCategory) {
                      featuredItems = featuredItems.filter(item =>
                        item.categories.includes(selectedCategory)
                      );
                    }

                    if (searchTerm) {
                      featuredItems = featuredItems.filter(item =>
                        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
                      );
                    }

                    if (openNow) {
                      const now = new Date();
                      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                      const currentTime = now.toTimeString().substring(0, 5);

                      featuredItems = featuredItems.filter(item => {
                        if (!item.schedule) return false;
                        const schedule = item.schedule[currentDay as keyof typeof item.schedule];
                        if (schedule?.closed) return false;
                        return schedule?.open <= currentTime && schedule?.close >= currentTime;
                      });
                    }

                    return featuredItems;
                  })()}
                  userLocation={userLocation}
                />
              </div>
            )}

            {/* Map Section */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                {selectedCategory
                  ? `${categories.find(c => c.id === selectedCategory)?.name || 'Categoria'} - ${mapItems.length} locais`
                  : `Mapa Geral - ${mapItems.length} locais`
                }
              </h3>
              {mapItems.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800">
                    Nenhum item encontrado para exibir no mapa. Tente ajustar os filtros.
                  </p>
                </div>
              )}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Mapa:</strong> {mapItems.length} locais de todas as distâncias (não limitado pelo filtro de distância)
                </p>
              </div>
              <div className="relative">
                <GoogleMap
                  items={mapItems}
                  userLocation={userLocation}
                  selectedItem={selectedItem}
                  className="w-full h-80 md:h-96 lg:h-[600px] rounded-xl"
                />
                
                {/* Mobile Fullscreen Map Button */}
                <button
                  onClick={() => navigate('/mapa')}
                  className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md transition-colors md:hidden flex items-center space-x-2"
                >
                  <Map size={16} />
                  <span className="text-sm font-medium">Tela Cheia</span>
                </button>
              </div>
            </div>

            {/* All Items List */}
            {/* Modern Results Section */}
            <div className="space-y-6">
              {/* Results Header */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedCategory 
                        ? `${categories.find(c => c.id === selectedCategory)?.name || 'Categoria'} Disponíveis` 
                        : 'Todos os Resultados'
                      }
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}</span>
                      </span>
                      {selectedCategory && userLocation && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>ordenados por proximidade</span>
                        </span>
                      )}
                      {userLocation && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>baseado na sua localização</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <div className="bg-white rounded-xl px-3 sm:px-4 py-2 shadow-sm border">
                      <div className="text-base sm:text-lg font-bold text-green-600">
                        {filteredItems.filter(item => item.type === 'service').length}
                      </div>
                      <div className="text-xs text-gray-600">Serviços</div>
                    </div>
                    <div className="bg-white rounded-xl px-3 sm:px-4 py-2 shadow-sm border">
                      <div className="text-base sm:text-lg font-bold text-blue-600">
                        {filteredItems.filter(item => item.type === 'location').length}
                      </div>
                      <div className="text-xs text-gray-600">Locais</div>
                    </div>
                    <div className="bg-white rounded-xl px-3 sm:px-4 py-2 shadow-sm border">
                      <div className="text-base sm:text-lg font-bold text-yellow-600">
                        {filteredItems.filter(item => item.featured).length}
                      </div>
                      <div className="text-xs text-gray-600">Destaques</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results List - Horizontal Layout */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {filteredItems.map((item, index) => {
                    const distance = userLocation && item.coordinates ? calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      item.coordinates.lat,
                      item.coordinates.lng,
                      user?.distanceUnit || 'miles'
                    ) : undefined;

                    const shouldShowAd = (index + 1) % 6 === 0 && sponsoredAds.length > 0;
                    const adIndex = Math.floor(index / 6) % sponsoredAds.length;
                    const ad = shouldShowAd ? sponsoredAds[adIndex] : null;

                    return (
                      <React.Fragment key={item.id}>
                        <div className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                            {/* Image */}
                            <div className="relative flex-shrink-0">
                            <img
                              src={item.images?.[0] || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'}
                              alt={item.name}
                              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg';
                              }}
                            />
                            {item.featured && (
                              <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 p-1 rounded-full">
                                <Star size={10} className="fill-current" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-800 truncate">{item.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-2">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <Star size={12} className="text-yellow-400 fill-current" />
                                <span className="text-xs sm:text-sm text-gray-600">
                                  {item.rating.toFixed(1)}
                                </span>
                              </div>
                              {distance && (
                                <div className="flex items-center space-x-1">
                                  <MapPin size={12} className="text-gray-400" />
                                  <span className="text-xs sm:text-sm text-gray-500">
                                    {distance.toFixed(1)}{user?.distanceUnit === 'km' ? 'km' : 'mi'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => navigate(`/item/${item.id}`)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inject sponsored ad after every 6th item */}
                      {ad && (
                        <div className="p-4 bg-gray-50">
                          <SponsoredAdCard ad={ad} />
                        </div>
                      )}
                    </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <GoogleMap
            items={filteredItems}
            userLocation={userLocation}
            selectedItem={selectedItem}
          />
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum resultado encontrado para os filtros selecionados.
            </p>
          </div>
        )}
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} initialMode="register" />}
    </div>
  );
};

export default Home;