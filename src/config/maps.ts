export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places', 'geometry'] as const,
  language: 'pt-BR',
  region: 'US'
};

export const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }]
  }
];

export const MARKER_COLORS = {
  manicure: '#E91E63',
  barbeiro: '#795548',
  igreja: '#9C27B0',
  mercado: '#4CAF50',
  restaurante: '#FF5722',
  limpeza: '#00BCD4',
  eletricista: '#FFC107',
  encanador: '#2196F3',
  petshop: '#8BC34A',
  dentista: '#FFFFFF',
  medico: '#F44336',
  advogado: '#3F51B5',
  contabilidade: '#607D8B',
  escola: '#FFEB3B',
  eventos: '#E91E63',
  autoescola: '#FF9800',
  mecanico: '#424242'
};

// Símbolos Unicode para cada categoria
export const CATEGORY_SYMBOLS = {
  manicure: '💅',
  barbeiro: '✂️',
  igreja: '⛪',
  mercado: '🛒',
  restaurante: '🍽️',
  limpeza: '✨',
  eletricista: '⚡',
  encanador: '🔧',
  petshop: '🐕',
  dentista: '🦷',
  medico: '🏥',
  advogado: '⚖️',
  contabilidade: '📊',
  escola: '🎓',
  eventos: '📅',
  autoescola: '🚗',
  mecanico: '🔧'
};

// Simplified function to create custom marker icon
export const createSimpleMarkerIcon = (featured: boolean = false) => {
  const size = 40;
  const color = featured ? '#FFD700' : '#009739';
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="20" y="26" text-anchor="middle" font-size="16" fill="white" font-weight="bold">📍</text>
      ${featured ? '<circle cx="32" cy="8" r="6" fill="#FF4444" stroke="white" stroke-width="2"/>' : ''}
    </svg>
  `;
  
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    size: new google.maps.Size(size, size),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(20, 40)
  };
};