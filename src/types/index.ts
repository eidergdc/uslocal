export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
  role: 'user' | 'admin';
  createdAt: Date;
  favorites: string[];
  viewHistory: string[];
  distanceUnit: 'miles' | 'km';
}

export interface Item {
  id: string;
  name: string;
  description: string;
  categories: string[];
  type: 'service' | 'location';
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  images: string[];
  schedule: Schedule;
  averagePrice?: string;
  rating: number;
  reviewCount: number;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  verified: boolean;
  visible: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  clickCount: number;
}

export interface Schedule {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface Review {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reported: boolean;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  itemId?: string;
  active: boolean;
  order: number;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
  iconUrl?: string;
  color: string;
  active: boolean;
  iconSize?: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type PlacementType = 'home_list' | 'item_detail' | 'category_story' | 'featured_banner';

export interface SponsoredAd {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  placement: PlacementType;
  itemId?: string;
  priority: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  clickCount: number;
  viewCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}