export interface Translations {
  [key: string]: string | Translations;
}

export const ptBR: Translations = {
  common: {
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    save: 'Salvar',
    edit: 'Editar',
    delete: 'Excluir',
    search: 'Buscar',
    filter: 'Filtrar',
    close: 'Fechar',
    login: 'Entrar',
    register: 'Cadastrar',
    logout: 'Sair',
    guest: 'Visitante'
  },
  nav: {
    home: 'Início',
    profile: 'Perfil',
    admin: 'Admin',
    addItem: 'Anunciar'
  },
  home: {
    title: 'US LOCAL',
    subtitle: 'Conectando brasileiros nos EUA',
    searchPlaceholder: 'Buscar serviços ou locais...',
    categories: 'Categorias',
    nearYou: 'Perto de você',
    featured: 'Destaques',
    mapView: 'Ver no mapa',
    listView: 'Ver lista'
  },
  categories: {
    manicure: 'Manicure',
    barbeiro: 'Barbeiro',
    igreja: 'Igreja',
    mercado: 'Mercado',
    restaurante: 'Restaurante',
    limpeza: 'Limpeza',
    eletricista: 'Eletricista',
    encanador: 'Encanador',
    petshop: 'Pet Shop',
    dentista: 'Dentista',
    medico: 'Médico',
    advogado: 'Advogado',
    contabilidade: 'Contabilidade',
    escola: 'Escola',
    eventos: 'Eventos',
    autoescola: 'Auto Escola',
    mecanico: 'Mecânico'
  },
  item: {
    viewOnMaps: 'Ver no Google Maps',
    whatsapp: 'WhatsApp',
    call: 'Ligar',
    website: 'Site',
    favorite: 'Favoritar',
    share: 'Compartilhar',
    report: 'Denunciar',
    reviews: 'Avaliações',
    addReview: 'Adicionar Avaliação',
    hours: 'Horários',
    closed: 'Fechado',
    open: 'Aberto'
  }
};

export const enUS: Translations = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    close: 'Close',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    guest: 'Guest'
  },
  nav: {
    home: 'Home',
    profile: 'Profile',
    admin: 'Admin',
    addItem: 'Advertise'
  },
  home: {
    title: 'US LOCAL',
    subtitle: 'Connecting Brazilians in the USA',
    searchPlaceholder: 'Search services or places...',
    categories: 'Categories',
    nearYou: 'Near you',
    featured: 'Featured',
    mapView: 'Map view',
    listView: 'List view'
  },
  categories: {
    manicure: 'Manicure',
    barbeiro: 'Barber',
    igreja: 'Church',
    mercado: 'Market',
    restaurante: 'Restaurant',
    limpeza: 'Cleaning',
    eletricista: 'Electrician',
    encanador: 'Plumber',
    petshop: 'Pet Shop',
    dentista: 'Dentist',
    medico: 'Doctor',
    advogado: 'Lawyer',
    contabilidade: 'Accounting',
    escola: 'School',
    eventos: 'Events',
    autoescola: 'Driving School',
    mecanico: 'Mechanic'
  },
  item: {
    viewOnMaps: 'View on Google Maps',
    whatsapp: 'WhatsApp',
    call: 'Call',
    website: 'Website',
    favorite: 'Favorite',
    share: 'Share',
    report: 'Report',
    reviews: 'Reviews',
    addReview: 'Add Review',
    hours: 'Hours',
    closed: 'Closed',
    open: 'Open'
  }
};

let currentTranslations = ptBR;

export const setLanguage = (lang: 'pt-BR' | 'en-US') => {
  currentTranslations = lang === 'pt-BR' ? ptBR : enUS;
};

export const t = (key: string): string => {
  const keys = key.split('.');
  let value: any = currentTranslations;
  
  for (const k of keys) {
    value = value[k];
    if (value === undefined) {
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
};