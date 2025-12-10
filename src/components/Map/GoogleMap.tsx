import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Item, UserLocation } from '../../types';
import { GOOGLE_MAPS_CONFIG, MAP_STYLES } from '../../config/maps';
import { Map, List } from 'lucide-react';
import MarkerModal from './MarkerModal';
import { useAuth } from '../../contexts/AuthContext';

// Função para obter ícone da categoria (mesmo do CategoryStories)
const getCategoryIcon = (categoryId: string) => {
  const iconMap: { [key: string]: string } = {
    eletricista: '⚡',
    mecanico: '🔧',
    encanador: '🔧',
    manicure: '💅',
    estetica: '💆',
    tatuador: '💉',
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
    eventos: '📅'
  };
  return iconMap[categoryId.toLowerCase()] || '📍';
};

// Função para obter cor da categoria (mesmo do CategoryStories)
const getCategoryColor = (categoryId: string) => {
  const colors: { [key: string]: string } = {
    manicure: '#E91E63',
    estetica: '#9C27B0',
    tatuador: '#212121',
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
    mecanico: '#424242'
  };
  return colors[categoryId.toLowerCase()] || '#009739';
};

interface GoogleMapProps {
  items: Item[];
  userLocation: UserLocation | null;
  onItemClick?: (item: Item) => void;
  selectedItem?: Item | null;
  showToggle?: boolean;
  onViewChange?: (view: 'map' | 'list') => void;
  currentView?: 'map' | 'list';
}

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

const GoogleMapComponent: React.FC<GoogleMapProps & { className?: string }> = ({
  items,
  userLocation,
  onItemClick,
  selectedItem,
  showToggle = false,
  onViewChange,
  currentView = 'map',
  className = "w-full h-80 md:h-96 lg:h-[600px] rounded-xl"
}) => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const currentInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Carregar Google Maps
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      console.log('🗺️ Inicializando Google Maps...');
      console.log('🔑 API Key exists:', !!GOOGLE_MAPS_CONFIG.apiKey);
      
      if (!GOOGLE_MAPS_CONFIG.apiKey || GOOGLE_MAPS_CONFIG.apiKey === '') {
        console.error('❌ Google Maps API key is missing');
        setMapError('Chave da API do Google Maps não configurada');
        return;
      }

      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_CONFIG.apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
          language: 'pt-BR',
          region: 'US'
        });

        await loader.load();
        console.log('✅ Google Maps carregado com sucesso');
        setIsLoaded(true);
      } catch (error) {
        console.error('❌ Erro ao carregar Google Maps:', error);
        setMapError('Erro ao carregar Google Maps');
      }
    };

    initializeGoogleMaps();
  }, []);

  // Criar instância do mapa
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current) {
      console.log('🎯 Criando instância do mapa...');
      
      const center = userLocation || { lat: 40.7128, lng: -74.0060 };
      console.log('📍 Centro do mapa:', center);
      
      try {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: userLocation ? 12 : 10,
          styles: MAP_STYLES,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        // Adicionar listener para fechar InfoWindow ao clicar no mapa
        mapInstanceRef.current.addListener('click', () => {
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
            currentInfoWindowRef.current = null;
          }
        });

        console.log('✅ Mapa criado com sucesso!');

        // Force update to trigger marker creation
        setForceUpdate(prev => prev + 1);

      } catch (error) {
        console.error('❌ Erro ao criar mapa:', error);
        setMapError('Erro ao criar instância do mapa');
      }
    }
  }, [isLoaded, userLocation]);

  // Cleanup function to clear all markers
  const clearAllMarkers = () => {
    console.log('🧹 Limpando todos os marcadores...');

    // Clear item markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  };

  // Clear user marker
  const clearUserMarker = () => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  };

  // Create circular user marker element
  const createUserMarkerElement = (photoURL: string | null): HTMLDivElement => {
    const markerDiv = document.createElement('div');
    markerDiv.style.width = '60px';
    markerDiv.style.height = '60px';
    markerDiv.style.position = 'relative';
    markerDiv.style.cursor = 'pointer';

    if (photoURL) {
      // Container with white border and shadow
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

      // Photo
      const img = document.createElement('img');
      img.src = photoURL;
      img.style.width = '52px';
      img.style.height = '52px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';

      container.appendChild(img);
      markerDiv.appendChild(container);
    } else {
      // Default user icon
      markerDiv.innerHTML = `
        <div style="width: 60px; height: 60px; border-radius: 50%; border: 4px solid #3b82f6; background: #3b82f6; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; position: relative;">
          <div style="position: absolute; top: 14px; width: 16px; height: 16px; border-radius: 50%; background: white;"></div>
          <div style="position: absolute; bottom: 8px; width: 28px; height: 28px; border-radius: 50%; background: white;"></div>
        </div>
      `;
    }

    return markerDiv;
  };

  // Add user marker with custom HTML overlay
  const addUserMarker = () => {
    console.log('🎯 addUserMarker chamado');
    console.log('📍 userLocation:', userLocation);
    console.log('📍 userLocation lat/lng:', userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'undefined');

    if (!userLocation) {
      console.log('❌ userLocation não está definido');
      return;
    }

    if (!mapInstanceRef.current) {
      console.log('❌ mapa não está pronto');
      return;
    }

    clearUserMarker();

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

    userMarkerRef.current = overlay as any;

    console.log('✅ Marcador do usuário criado em:', userLocation.lat, userLocation.lng);
    console.log('🎨 Com foto:', !!user?.photoURL);
  };

  // Adicionar marcadores dos itens
  useEffect(() => {
    console.log('🔄 ATUALIZANDO MARCADORES...');
    console.log('📊 Items recebidos:', items?.length || 0);
    console.log('🗺️ Mapa existe:', !!mapInstanceRef.current);
    console.log('👤 User object:', user);
    console.log('📷 User photoURL:', user?.photoURL);

    if (!mapInstanceRef.current) {
      console.log('❌ Mapa não está pronto ainda');
      return;
    }

    if (!items || items.length === 0) {
      console.log('❌ Nenhum item para mostrar');
      clearAllMarkers();
      addUserMarker();
      return;
    }

    // Clear all markers and recreate
    clearAllMarkers();
    addUserMarker();

    // Criar novos marcadores
    let markersCreated = 0;
    const bounds = new google.maps.LatLngBounds();
    
    // Adicionar localização do usuário aos bounds se disponível
    if (userLocation) {
      bounds.extend(userLocation);
    }

    console.log('📍 Iniciando criação de marcadores para', items.length, 'itens');
    console.log('📋 Lista de itens:', items.map(i => ({
      id: i.id,
      name: i.name,
      status: i.status,
      coordinates: i.coordinates,
      categories: i.categories
    })));

    items.forEach((item, index) => {
      if (!item.coordinates || !item.coordinates.lat || !item.coordinates.lng) {
        console.warn(`⚠️ Item ${index} (${item.name}) sem coordenadas válidas:`, item.coordinates);
        return;
      }

      // Don't show hidden items unless user is the owner
      if (!item.visible && (!user || item.ownerId !== user.uid)) {
        return;
      }

      // Validar coordenadas
      const lat = Number(item.coordinates.lat);
      const lng = Number(item.coordinates.lng);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`⚠️ Item ${index} (${item.name}) com coordenadas inválidas:`, { lat, lng });
        return;
      }

      console.log(`📍 Criando marcador ${index + 1}/${items.length}:`, {
        name: item.name,
        category: item.categories[0],
        coordinates: { lat, lng },
        featured: item.featured
      });

      try {
        const primaryCategory = item.categories[0] || 'default';
        
        // Usar ícones personalizados das categorias
        const markerIcon = createCategoryMarkerIcon(primaryCategory, item.featured);

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: item.name,
          icon: markerIcon,
          zIndex: item.featured ? 1000 : 100,
          optimized: true // Usar otimização padrão do Google
        });

        // Adicionar listener de clique
        marker.addListener('click', () => {
          console.log(`🖱️ Clique no marcador: ${item.name}`);

          // Fechar infoWindow anterior se existir
          if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
          }

          // Criar conteúdo com imagem se disponível
          const mainImage = item.images && item.images.length > 0 ? item.images[0] : null;

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="font-family: system-ui; width: 180px; max-width: 180px; overflow: hidden;">
                ${mainImage ? `
                  <div style="margin: -8px -8px 4px -8px; width: calc(100% + 16px); height: 50px; overflow: hidden;">
                    <img
                      src="${mainImage}"
                      alt="${item.name}"
                      style="width: 100%; height: 100%; object-fit: cover;"
                      onerror="this.style.display='none'"
                    />
                  </div>
                ` : ''}
                <div style="padding: 4px; overflow: hidden;">
                  <div style="font-weight: 600; font-size: 11px; color: #1f2937; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.name}
                  </div>
                  <div style="color: #6b7280; font-size: 9px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    📍 ${item.address.split(',')[0]}
                  </div>
                  <div style="display: flex; gap: 3px;">
                    <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')"
                       style="flex: 1; background: #2563eb; color: white; border: none; padding: 4px; border-radius: 3px; font-size: 9px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                      🧭 Ir
                    </button>
                    <button onclick="window.location.href='/item/${item.id}'"
                       style="flex: 1; background: #16a34a; color: white; border: none; padding: 4px; border-radius: 3px; font-size: 9px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                      👁️ Perfil
                    </button>
                  </div>
                </div>
              </div>
            `,
            maxWidth: 200
          });

          // Salvar referência do infoWindow atual
          currentInfoWindowRef.current = infoWindow;

          // Adicionar listener para fechar quando clicar no mapa
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend({ lat, lng });
        markersCreated++;

        console.log(`✅ Marcador ${markersCreated} criado para: ${item.name} em (${lat}, ${lng})`);

      } catch (error) {
        console.error(`❌ Erro ao criar marcador para ${item.name}:`, error);
      }
    });

    console.log(`📊 RESUMO FINAL: ${markersCreated} marcadores criados de ${items.length} itens`);

    // Ajustar zoom para mostrar todos os marcadores
    if (markersCreated > 0) {
      setTimeout(() => {
        if (mapInstanceRef.current && !bounds.isEmpty()) {
          console.log('🎯 Ajustando zoom do mapa para mostrar', markersCreated, 'marcadores...');
          
          try {
            mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
            
            // Garantir zoom mínimo para ver os marcadores
            const listener = google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
              const currentZoom = mapInstanceRef.current?.getZoom();
              if (currentZoom && currentZoom > 15) {
                mapInstanceRef.current?.setZoom(15);
              }
              google.maps.event.removeListener(listener);
            });
            
            console.log('✅ Zoom ajustado com sucesso');
          } catch (error) {
            console.error('❌ Erro ao ajustar zoom:', error);
          }
        }
      }, 1000); // Aumentei o delay para garantir que os marcadores sejam renderizados
    } else {
      console.warn('⚠️ Nenhum marcador foi criado! Verifique os dados dos itens.');
    }

  }, [items, mapInstanceRef.current, forceUpdate, user?.photoURL]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllMarkers();
      clearUserMarker();
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar mapa</h3>
          <p className="text-gray-600 mb-4">{mapError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const recenterMap = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(15);
    }
  };

  return (
    <div className="relative">
      {showToggle && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => onViewChange?.('list')}
            className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
              currentView === 'list' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <List size={18} />
            <span>Lista</span>
          </button>
          <button
            onClick={() => onViewChange?.('map')}
            className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
              currentView === 'map' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Map size={18} />
            <span>Mapa</span>
          </button>
        </div>
      )}

      {userLocation && (
        <button
          onClick={recenterMap}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg transition-all hover:shadow-xl"
          title="Voltar para minha localização"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      <div ref={mapRef} className={className} />
    </div>
  );
};

const GoogleMap: React.FC<GoogleMapProps> = (props) => {
  return <GoogleMapComponent {...props} />;
};

export default GoogleMap;