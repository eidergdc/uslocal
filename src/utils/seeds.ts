import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Item, Banner, Category } from '../types';

export const seedDatabase = async () => {
  try {
    // Seed Categories
    const categories: Omit<Category, 'id'>[] = [
      { name: 'Barbeiro', nameEn: 'Barber', icon: 'Scissors', color: '#795548', active: true },
      { name: 'Costureira', nameEn: 'Seamstress', icon: 'Shirt', color: '#E91E63', active: true },
      { name: 'Dentista', nameEn: 'Dentist', icon: 'Heart', color: '#00BCD4', active: true },
      { name: 'Eletricista', nameEn: 'Electrician', icon: 'Zap', color: '#FFC107', active: true },
      { name: 'Encanador', nameEn: 'Plumber', icon: 'Wrench', color: '#2196F3', active: true },
      { name: 'Igreja', nameEn: 'Church', icon: 'Church', color: '#9C27B0', active: true },
      { name: 'Limpeza', nameEn: 'Cleaning', icon: 'Sparkles', color: '#00BCD4', active: true },
      { name: 'Manicure', nameEn: 'Manicure', icon: 'Hand', color: '#E91E63', active: true },
      { name: 'Mercado', nameEn: 'Market', icon: 'ShoppingCart', color: '#4CAF50', active: true },
      { name: 'Restaurante', nameEn: 'Restaurant', icon: 'UtensilsCrossed', color: '#FF5722', active: true },
      { name: 'Salgados', nameEn: 'Snacks', icon: 'Cookie', color: '#FF9800', active: true },
      { name: 'Tatuador', nameEn: 'Tattoo Artist', icon: 'Syringe', color: '#212121', active: true }
    ];

    for (const category of categories) {
      await addDoc(collection(db, 'categories'), category);
    }

    // Seed Items
    const items: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Salão da Maria',
        description: 'Serviços completos de manicure, pedicure e design de sobrancelhas. Atendimento personalizado para brasileiras.',
        categories: ['manicure'],
        type: 'service',
        coordinates: { lat: 40.7580, lng: -73.9855 },
        address: '123 Main St, New York, NY 10001',
        phone: '+1 (555) 123-4567',
        whatsapp: '+15551234567',
        website: 'https://salaodamaria.com',
        images: ['https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'],
        schedule: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: false }
        },
        averagePrice: '$30-50',
        rating: 4.8,
        reviewCount: 45,
        status: 'approved',
        featured: true,
        verified: true,
        ownerId: 'seed-user-1',
        viewCount: 156,
        clickCount: 89
      },
      {
        name: 'Barbearia do João',
        description: 'Cortes masculinos tradicionais e modernos. Ambiente acolhedor com papo brasileiro.',
        categories: ['barbeiro'],
        type: 'service',
        coordinates: { lat: 40.7614, lng: -73.9776 },
        address: '456 Broadway, New York, NY 10013',
        phone: '+1 (555) 987-6543',
        whatsapp: '+15559876543',
        images: ['https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg'],
        schedule: {
          monday: { open: '08:00', close: '20:00', closed: false },
          tuesday: { open: '08:00', close: '20:00', closed: false },
          wednesday: { open: '08:00', close: '20:00', closed: false },
          thursday: { open: '08:00', close: '20:00', closed: false },
          friday: { open: '08:00', close: '20:00', closed: false },
          saturday: { open: '08:00', close: '18:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: false }
        },
        averagePrice: '$25-40',
        rating: 4.6,
        reviewCount: 32,
        status: 'approved',
        featured: false,
        verified: true,
        ownerId: 'seed-user-2',
        viewCount: 89,
        clickCount: 34
      },
      {
        name: 'Igreja Batista Brasileira',
        description: 'Comunidade evangélica brasileira. Cultos em português todos os domingos.',
        categories: ['igreja'],
        type: 'location',
        coordinates: { lat: 40.7505, lng: -73.9934 },
        address: '789 Church Ave, New York, NY 10001',
        phone: '+1 (555) 234-5678',
        website: 'https://igrejabrasileirany.org',
        images: ['https://images.pexels.com/photos/161063/ukraine-church-historically-historically-161063.jpeg'],
        schedule: {
          monday: { open: '19:00', close: '21:00', closed: false },
          tuesday: { open: '19:00', close: '21:00', closed: false },
          wednesday: { open: '19:00', close: '21:00', closed: false },
          thursday: { open: '19:00', close: '21:00', closed: false },
          friday: { open: '19:00', close: '21:00', closed: false },
          saturday: { open: '19:00', close: '21:00', closed: false },
          sunday: { open: '09:00', close: '12:00', closed: false }
        },
        rating: 4.9,
        reviewCount: 67,
        status: 'approved',
        featured: true,
        verified: true,
        ownerId: 'seed-user-3',
        viewCount: 234,
        clickCount: 145
      },
      {
        name: 'Supermercado Tropical',
        description: 'Supermercado brasileiro com produtos importados, açaí, guaraná, pão de açúcar e muito mais.',
        categories: ['mercado'],
        type: 'location',
        coordinates: { lat: 40.7489, lng: -73.9680 },
        address: '321 Tropical Ave, New York, NY 10002',
        phone: '+1 (555) 111-2222',
        whatsapp: '+15551112222',
        website: 'https://tropicalmarket.com',
        images: ['https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg'],
        schedule: {
          monday: { open: '07:00', close: '22:00', closed: false },
          tuesday: { open: '07:00', close: '22:00', closed: false },
          wednesday: { open: '07:00', close: '22:00', closed: false },
          thursday: { open: '07:00', close: '22:00', closed: false },
          friday: { open: '07:00', close: '22:00', closed: false },
          saturday: { open: '07:00', close: '22:00', closed: false },
          sunday: { open: '08:00', close: '20:00', closed: false }
        },
        rating: 4.5,
        reviewCount: 78,
        status: 'approved',
        featured: false,
        verified: true,
        ownerId: 'seed-user-6',
        viewCount: 145,
        clickCount: 67
      },
      {
        name: 'Churrascaria Gaúcha',
        description: 'Churrascaria tradicional brasileira com rodízio de carnes e buffet completo.',
        categories: ['restaurante'],
        type: 'location',
        coordinates: { lat: 40.7831, lng: -73.9712 },
        address: '555 Grill St, New York, NY 10025',
        phone: '+1 (555) 333-4444',
        whatsapp: '+15553334444',
        website: 'https://churrascariagaucha.com',
        images: ['https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'],
        schedule: {
          monday: { open: '17:00', close: '23:00', closed: false },
          tuesday: { open: '17:00', close: '23:00', closed: false },
          wednesday: { open: '17:00', close: '23:00', closed: false },
          thursday: { open: '17:00', close: '23:00', closed: false },
          friday: { open: '17:00', close: '24:00', closed: false },
          saturday: { open: '12:00', close: '24:00', closed: false },
          sunday: { open: '12:00', close: '22:00', closed: false }
        },
        averagePrice: '$35-60',
        rating: 4.7,
        reviewCount: 234,
        status: 'approved',
        featured: true,
        verified: true,
        ownerId: 'seed-user-7',
        viewCount: 456,
        clickCount: 189
      },
      {
        name: 'Mercado Brasil Foods',
        description: 'Mercado brasileiro com produtos típicos, carnes, temperos e ingredientes para suas receitas favoritas.',
        categories: ['mercado'],
        type: 'location',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        address: '456 Brazilian Ave, New York, NY 10002',
        phone: '+1 (555) 345-6789',
        website: 'https://brasilfoods.com',
        images: ['https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg'],
        schedule: {
          monday: { open: '08:00', close: '20:00', closed: false },
          tuesday: { open: '08:00', close: '20:00', closed: false },
          wednesday: { open: '08:00', close: '20:00', closed: false },
          thursday: { open: '08:00', close: '20:00', closed: false },
          friday: { open: '08:00', close: '20:00', closed: false },
          saturday: { open: '08:00', close: '18:00', closed: false },
          sunday: { open: '09:00', close: '17:00', closed: false }
        },
        rating: 4.7,
        reviewCount: 89,
        status: 'approved',
        featured: false,
        verified: true,
        ownerId: 'seed-user-4',
        viewCount: 167,
        clickCount: 78
      },
      {
        name: 'Restaurante Sabor do Brasil',
        description: 'Restaurante brasileiro autêntico com pratos tradicionais, feijoada aos sábados e ambiente familiar.',
        categories: ['restaurante'],
        type: 'location',
        coordinates: { lat: 40.7614, lng: -73.9776 },
        address: '123 Flavor St, New York, NY 10003',
        phone: '+1 (555) 456-7890',
        whatsapp: '+15554567890',
        website: 'https://sabordobrasil.com',
        images: ['https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'],
        schedule: {
          monday: { open: '11:00', close: '22:00', closed: false },
          tuesday: { open: '11:00', close: '22:00', closed: false },
          wednesday: { open: '11:00', close: '22:00', closed: false },
          thursday: { open: '11:00', close: '22:00', closed: false },
          friday: { open: '11:00', close: '23:00', closed: false },
          saturday: { open: '11:00', close: '23:00', closed: false },
          sunday: { open: '12:00', close: '21:00', closed: false }
        },
        averagePrice: '$15-30',
        rating: 4.8,
        reviewCount: 156,
        status: 'approved',
        featured: true,
        verified: true,
        ownerId: 'seed-user-5',
        viewCount: 289,
        clickCount: 134
      },
      {
        name: 'Consultório Dr. Silva - Dentista',
        description: 'Atendimento odontológico completo com profissional brasileiro. Limpeza, clareamento, implantes e tratamento de canal.',
        categories: ['dentista'],
        type: 'service',
        coordinates: { lat: 40.7550, lng: -73.9900 },
        address: '789 Dental Ave, New York, NY 10001',
        phone: '+1 (555) 321-9876',
        whatsapp: '+15553219876',
        website: 'https://drsilva-dental.com',
        images: ['https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg'],
        schedule: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '14:00', closed: false },
          sunday: { open: '10:00', close: '14:00', closed: true }
        },
        averagePrice: '$100-200',
        rating: 4.9,
        reviewCount: 127,
        status: 'approved',
        featured: true,
        verified: true,
        ownerId: 'seed-user-8',
        viewCount: 345,
        clickCount: 189
      }
    ];

    for (const item of items) {
      await addDoc(collection(db, 'items'), {
        ...item,
        visible: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Seed Banners
    const banners: Omit<Banner, 'id' | 'createdAt'>[] = [
      {
        title: 'Bem-vindos ao US LOCAL!',
        description: 'Conectando brasileiros em todo o território americano',
        image: 'https://images.pexels.com/photos/1262304/pexels-photo-1262304.jpeg',
        active: true,
        order: 1
      },
      {
        title: 'Encontre serviços de qualidade',
        description: 'Profissionais brasileiros verificados perto de você',
        image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
        active: true,
        order: 2
      },
      {
        title: 'Cadastre seu negócio',
        description: 'Divulgue seus serviços para a comunidade brasileira',
        image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
        active: true,
        order: 3
      }
    ];

    for (const banner of banners) {
      await addDoc(collection(db, 'banners'), {
        ...banner,
        createdAt: serverTimestamp()
      });
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};