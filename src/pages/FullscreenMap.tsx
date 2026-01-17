import React, { useState, useEffect } from 'react';
import { ArrowLeft, List, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { getItems } from '../services/itemService';
import { getCategories } from '../services/categoryService';
import { Item, Category } from '../types';
import { calculateDistance } from '../utils/distance';
import { MAP_STYLES, CATEGORY_SYMBOLS, MARKER_COLORS } from '../config/maps';

// Função para obter ícone da categoria (mesmo do CategoryStories)
const getCategoryIcon = (categoryId: string) => {
  const iconMap: { [key: string]: string } = {
    eletricista: '⚡',
    mecanico: '🔧',
    encanador: '🔧',
    manicure: '💅',
    estetica: '💆',
    tatuador: '💉',
    traducao: '🌍',
    barbeiro: '✂️',
    igreja: '⛪',
    mercado: '🛒',
    restaurante: '🍽️',
    petshop: '🐕',
    escola: '🎓',
    autoescola: '🚗',
    dentista: '🦷',
    medico: '🏥',
    advogado: '⚖️',
    contabilidade: '📊',
    limpeza: '✨',
    eventos: '📅',
    construcao: '🏗️',
    pintor: '🎨',
    jardinagem: '🌱',
    seguranca: '🔐'
  };
  return iconMap[categoryId] || '📍';
};

// Função para obter cor da categoria (mesmo do CategoryStories)
const getCategoryColor = (categoryId: string) => {
  const colors: { [key: string]: string } = {
    manicure: '#E91E63',
    estetica: '#9C27B0',
    tatuador: '#212121',
    traducao: '#10b981',
    barbeiro: '#795548',
    igreja: '#9C27B0',
    mercado: '#4CAF50',
    restaurante: '#FF5722',
    limpeza: '#00BCD4',
    eletricista: '#FFC107',
    encanador: '#2196F3',
    petshop: '#8BC34A',
    dentista: '#2196F3',
    medico: '#F44336',
    advogado: '#3F51B5',
    contabilidade: '#607D8B',
    escola: '#FFEB3B',
    eventos: '#E91E63',
    autoescola: '#FF9800',
    mecanico: '#424242',
    construcao: '#FF6F00',
    pintor: '#E91E63',
    jardinagem: '#66BB6A',
    seguranca: '#424242'
  };
  return colors[categoryId] || '#009739';
};

const FullscreenMap: React.FC = () => {
  const navigate = useNavigate();
  const { userLocation } = useLocation();
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showItemsList, setShowItemsList] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Criar função de navegação com evento customizado
  React.useLayoutEffect(() => {
    const handleNavigateEvent = (e: CustomEvent) => {
      console.log('🔄 Navegando para item via evento:', e.detail.itemId);
      navigate(`/item/${e.detail.itemId}`);
    };

    (window as any).navigateToItem = (itemId: string) => {
      console.log('🔄 navigateToItem chamada:', itemId);
      const event = new CustomEvent('navigate-to-item', { detail: { itemId } });
      window.dispatchEvent(event);
    };

    window.addEventListener('navigate-to-item', handleNavigateEvent as EventListener);
    console.log('✅ Função navigateToItem registrada');

    return () => {
      window.removeEventListener('navigate-to-item', handleNavigateEvent as EventListener);
      delete (window as any).navigateToItem;
    };
  }, [navigate]);
  
  // Função para criar marcadores personalizados com ícones das categorias
  const createCategoryMarkerIcon = (categoryId: string, featured: boolean = false) => {
    const size = featured ? 50 : 40;
    const color = getCategoryColor(categoryId);
    const icon = getCategoryIcon(categoryId);

    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-${categoryId}" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>

        <!-- Círculo principal -->
        <circle
          cx="${size/2}"
          cy="${size/2}"
          r="${(size-8)/2}"
          fill="${color}"
          stroke="white"
          stroke-width="3"
          filter="url(#shadow-${categoryId})"
        />

        <!-- Ícone emoji -->
        <text
          x="${size/2}"
          y="${size/2 + 6}"
          text-anchor="middle"
          font-size="${size * 0.4}"
          fill="white"
          font-family="Arial, sans-serif"
        >${icon}</text>

        ${featured ? `
          <!-- Estrela de destaque -->
          <circle cx="${size-8}" cy="8" r="6" fill="#FFD700" stroke="white" stroke-width="2"/>
          <text x="${size-8}" y="12" text-anchor="middle" font-size="8" fill="#FF6B00">★</text>
        ` : ''}
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      size: new google.maps.Size(size, size),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size/2),
      origin: new google.maps.Point(0, 0)
    };
  };

  // Create circular user marker element
  const createUserMarkerElement = (photoURL: string | null): HTMLDivElement => {
    const markerDiv = document.createElement('div');
    markerDiv.style.width = '60px';
    markerDiv.style.height = '60px';
    markerDiv.style.position = 'relative';
    markerDiv.style.cursor = 'pointer';

    if (photoURL) {
      const container = document.createElement('div');
      container.style.width = '60px';
      container.style.height = '60px';
      container.style.borderRadius = '50%';
      container.style.border = '4px solid #3b82f6';
      container.style.backgroundColor = 'white';
      container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      container.style.overflow = 'hidden';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';

      const img = document.createElement('img');
      img.src = photoURL;
      img.style.width = '52px';
      img.style.height = '52px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';

      container.appendChild(img);
      markerDiv.appendChild(container);
    } else {
      markerDiv.innerHTML = `
        <div style="width: 60px; height: 60px; border-radius: 50%; border: 4px solid #3b82f6; background: #3b82f6; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; position: relative;">
          <div style="position: absolute; top: 14px; width: 16px; height: 16px; border-radius: 50%; background: white;"></div>
          <div style="position: absolute; bottom: 8px; width: 28px; height: 28px; border-radius: 50%; background: white;"></div>
        </div>
      `;
    }

    return markerDiv;
  };
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Map refs
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<google.maps.Marker[]>([]);
  const userMarkerRef = React.useRef<any>(null);
  const currentInfoWindowRef = React.useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    console.log('🚀 FullscreenMap - Iniciando...');
    loadData();
    loadGoogleMapsAPI();
  }, []);

  // Initialize map only when API is loaded and DOM ref is ready
  useEffect(() => {
    if (isMapsApiLoaded && mapRef.current && !mapInstanceRef.current) {
      console.log('🗺️ Inicializando mapa com ref disponível...');
      createMapInstance();
    }
  }, [isMapsApiLoaded, mapRef.current]);
  const loadData = async () => {
    try {
      console.log('📊 Loading fullscreen map data...');
      
      // Always load approved items for public view
      let allItems = await getItems({ status: 'approved' });
      
      // If user is logged in and not anonymous, also load their pending items
      if (user && !user.isAnonymous) {
        try {
          const userPendingItems = await getItems({ 
            status: 'pending', 
            ownerId: user.uid 
          });
          allItems = [...allItems, ...userPendingItems];
        } catch (error) {
          console.warn('Could not load user pending items:', error);
        }
      }
      
      const [categoriesData] = await Promise.all([
        getCategories()
      ]);
      
      console.log('✅ Fullscreen map data loaded:', allItems.length, 'items');
      setItems(allItems);
      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ Error loading fullscreen map data:', error);
      setMapError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMapsAPI = async () => {
    console.log('🗺️ Loading Google Maps API...');
    
    // Check if Google Maps API key exists
    const apiKey = import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY;
    console.log('🔑 API Key exists:', !!apiKey);
    
    if (!apiKey) {
      console.error('❌ Google Maps API key não encontrada');
      setMapError('Chave da API do Google Maps não configurada');
      return;
    }

    try {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps já carregado');
        setIsMapsApiLoaded(true);
        return;
      }

      console.log('📡 Carregando Google Maps...');
      
      // Load Google Maps dynamically
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=pt-BR&region=US`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Maps carregado com sucesso');
        setIsMapsApiLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error('❌ Erro ao carregar Google Maps:', error);
        setMapError('Erro ao carregar Google Maps. Verifique sua conexão.');
      };
      
      document.head.appendChild(script);
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      setMapError('Erro na inicialização do mapa');
    }
  };

  const createMapInstance = () => {
    console.log('🎯 Criando instância do mapa...');
    console.log('📍 mapRef.current:', !!mapRef.current);
    console.log('🌍 window.google:', !!window.google);
    
    if (!mapRef.current) {
      console.error('❌ Ref do mapa não encontrada');
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error('❌ Google Maps não disponível');
      setMapError('Google Maps não disponível');
      return;
    }

    try {
      
      const center = userLocation || { lat: 40.7128, lng: -74.0060 };
      console.log('📍 Centro do mapa:', center);
      
      const mapOptions: google.maps.MapOptions = {
        center,
        zoom: userLocation ? 12 : 10,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: MAP_STYLES
      };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

      // Adicionar listener para fechar InfoWindow ao clicar no mapa
      mapInstanceRef.current.addListener('click', () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
          currentInfoWindowRef.current = null;
        }
      });

      console.log('✅ Mapa criado com sucesso!');

      // Add user location marker with photo if available
      if (userLocation) {
        addUserMarker();
      }

    } catch (error) {
      console.error('❌ Erro ao criar mapa:', error);
      setMapError('Erro ao criar instância do mapa');
    }
  };

  // Add user marker with custom HTML overlay
  const addUserMarker = () => {
    if (!userLocation || !mapInstanceRef.current) return;

    // Clear existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    // Create custom overlay
    class UserMarkerOverlay extends google.maps.OverlayView {
      position: google.maps.LatLng;
      containerDiv: HTMLDivElement | null = null;

      constructor(position: google.maps.LatLng) {
        super();
        this.position = position;
      }

      onAdd() {
        const markerElement = createUserMarkerElement(user?.photoURL || null);
        markerElement.style.position = 'absolute';
        this.containerDiv = markerElement;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(markerElement);
      }

      draw() {
        if (!this.containerDiv) return;
        const overlayProjection = this.getProjection();
        const pos = overlayProjection.fromLatLngToDivPixel(this.position);
        if (pos) {
          this.containerDiv.style.left = (pos.x - 30) + 'px';
          this.containerDiv.style.top = (pos.y - 30) + 'px';
        }
      }

      onRemove() {
        if (this.containerDiv) {
          this.containerDiv.parentNode?.removeChild(this.containerDiv);
          this.containerDiv = null;
        }
      }
    }

    const overlay = new UserMarkerOverlay(
      new google.maps.LatLng(userLocation.lat, userLocation.lng)
    );
    overlay.setMap(mapInstanceRef.current);
    userMarkerRef.current = overlay;
  };

  // Add markers when items change
  useEffect(() => {
    if (mapInstanceRef.current && filteredItems.length > 0) {
      console.log('📌 Adicionando marcadores:', filteredItems.length);
      
      filteredItems.forEach((item) => {
        if (!item.coordinates) return;
        
        // Validar coordenadas
        const lat = Number(item.coordinates.lat);
        const lng = Number(item.coordinates.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`⚠️ Item ${item.name} com coordenadas inválidas:`, { lat, lng });
          return;
        }
        
        const primaryCategory = item.categories[0] || 'default';
        const markerIcon = createCategoryMarkerIcon(primaryCategory, item.featured);
        
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: item.name,
          icon: markerIcon,
          zIndex: item.featured ? 1000 : 100,
          optimized: false
        });

        marker.addListener('click', () => {
          // Fechar infoWindow anterior se existir
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }

          // Criar conteúdo com imagem se disponível
          const mainImage = item.images && item.images.length > 0 ? item.images[0] : null;

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="font-family: system-ui; width: 280px;">
                ${mainImage ? `
                  <div style="margin: -12px -12px 12px -12px; width: calc(100% + 24px); height: 160px; overflow: hidden; border-radius: 8px 8px 0 0;">
                    <img
                      src="${mainImage}"
                      alt="${item.name}"
                      style="width: 100%; height: 100%; object-fit: cover;"
                      onerror="this.style.display='none'"
                    />
                  </div>
                ` : ''}
                <div style="padding: ${mainImage ? '0' : '12px'} 12px 12px 12px;">
                  <div style="font-weight: bold; font-size: 16px; color: #1f2937; margin-bottom: 8px;">
                    ${item.name}
                    ${item.featured ? '<span style="background: #fbbf24; color: #92400e; padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-left: 8px;">DESTAQUE</span>' : ''}
                  </div>
                  <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">
                    📍 ${item.address.split(',').slice(0, 2).join(',')}
                  </div>
                  <div style="color: #4b5563; font-size: 13px; margin-bottom: 12px; line-height: 1.4;">
                    ${item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description}
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button onclick="try{window.navigateToItem('${item.id}')}catch(e){console.error(e);window.location.href='/item/${item.id}'}"
                       style="flex: 1; background: #009739; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
                      Ver Detalhes
                    </button>
                    <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')"
                       style="flex: 1; background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
                      Ir Agora
                    </button>
                  </div>
                </div>
              </div>
            `,
            maxWidth: 320
          });

          // Salvar referência do infoWindow atual
          currentInfoWindowRef.current = infoWindow;

          infoWindow.open(mapInstanceRef.current, marker);
        });
      });

      // Fit bounds
      if (filteredItems.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        
        if (userLocation) {
          bounds.extend(userLocation);
        }
        
        filteredItems.forEach(item => {
          if (item.coordinates) {
            const lat = Number(item.coordinates.lat);
            const lng = Number(item.coordinates.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              bounds.extend({ lat, lng });
            }
          }
        });
        
        setTimeout(() => {
          if (mapInstanceRef.current && !bounds.isEmpty()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
          }
        }, 500);
      }
    }
  }, [filteredItems, mapInstanceRef.current]);

  // Filter items
  useEffect(() => {
    let filtered = items;

    // Aplicar apenas filtros de categoria e busca por texto
    // NÃO aplicar filtro de distância no mapa em tela cheia
    if (selectedCategory) {
      filtered = filtered.filter(item =>
        item.categories.includes(selectedCategory)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Ordenar por distância se localização disponível, mas não filtrar
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
  }, [items, searchTerm, selectedCategory, userLocation, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Erro no Mapa</h3>
          <p className="text-gray-600 mb-4">{mapError}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mr-2"
            >
              Tentar Novamente
            </button>
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-medium">Voltar</span>
          </button>
          
          <h1 className="text-lg font-bold text-gray-800">
            Mapa ({filteredItems.length} locais)
          </h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter size={20} />
            </button>
            
            <button
              onClick={() => setShowItemsList(!showItemsList)}
              className={`p-2 rounded-lg transition-colors ${
                showItemsList ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar serviços ou locais..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>💡 Dica:</strong> O mapa mostra todos os locais cadastrados, sem limite de distância. Use o zoom para explorar diferentes regiões!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        className={`absolute left-0 right-0 bottom-0 ${
          showFilters ? 'top-48' : 'top-20'
        } ${showItemsList ? 'bottom-80' : 'bottom-0'}`}
      >
        <div
          ref={mapRef}
          className="w-full h-full bg-gray-200"
          style={{ minHeight: '300px' }}
        />

        {/* Recenter Button */}
        {userLocation && (
          <button
            onClick={() => {
              if (mapInstanceRef.current && userLocation) {
                mapInstanceRef.current.panTo(userLocation);
                mapInstanceRef.current.setZoom(15);
              }
            }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg transition-all hover:shadow-xl"
            title="Voltar para minha localização"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Items List */}
      {showItemsList && (
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-white/95 backdrop-blur-sm border-t border-gray-200 overflow-hidden z-30">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">
              Resultados ({filteredItems.length})
            </h3>
          </div>
          
          <div className="h-64 overflow-y-auto p-4">
            {filteredItems.length > 0 ? (
              <div className="space-y-4">
                {filteredItems.slice(0, 10).map((item) => {
                  const distance = userLocation && item.coordinates ? calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    item.coordinates.lat,
                    item.coordinates.lng,
                    user?.distanceUnit || 'miles'
                  ) : undefined;

                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex p-3 space-x-3">
                        <img
                          src={item.images?.[0] || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg';
                          }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm text-gray-600">
                                {item.rating.toFixed(1)} ({item.reviewCount})
                              </span>
                            </div>
                            {distance && (
                              <span className="text-sm text-gray-500">
                                {distance.toFixed(1)}{user?.distanceUnit === 'km' ? 'km' : 'mi'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => navigate(`/item/${item.id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum resultado encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenMap;