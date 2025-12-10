import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const defaultCategories = [
  { id: 'academia', name: 'Academia', nameEn: 'Gym', icon: 'Dumbbell', color: '#FF5722' },
  { id: 'advogado', name: 'Advogado', nameEn: 'Lawyer', icon: 'Scale', color: '#795548' },
  { id: 'autoescola', name: 'Autoescola', nameEn: 'Driving School', icon: 'Car', color: '#FF9800' },
  { id: 'bar', name: 'Bar', nameEn: 'Bar', icon: 'Beer', color: '#FF9800' },
  { id: 'cabelereiro', name: 'Cabelereiro', nameEn: 'Hairdresser', icon: 'Scissors', color: '#E91E63' },
  { id: 'contabilidade', name: 'Contabilidade', nameEn: 'Accounting', icon: 'Calculator', color: '#607D8B' },
  { id: 'dentista', name: 'Dentista', nameEn: 'Dentist', icon: 'Smile', color: '#FFFFFF' },
  { id: 'eletricista', name: 'Eletricista', nameEn: 'Electrician', icon: 'Zap', color: '#FFC107' },
  { id: 'encanador', name: 'Encanador', nameEn: 'Plumber', icon: 'Wrench', color: '#2196F3' },
  { id: 'escola', name: 'Escola', nameEn: 'School', icon: 'GraduationCap', color: '#FFEB3B' },
  { id: 'estetica', name: 'Estética', nameEn: 'Aesthetics', icon: 'Droplet', color: '#EC4899' },
  { id: 'eventos', name: 'Eventos', nameEn: 'Events', icon: 'Calendar', color: '#E91E63' },
  { id: 'igreja', name: 'Igreja', nameEn: 'Church', icon: 'Church', color: '#9C27B0' },
  { id: 'limpeza', name: 'Limpeza', nameEn: 'Cleaning', icon: 'Sparkles', color: '#00BCD4' },
  { id: 'manicure', name: 'Manicure', nameEn: 'Manicure', icon: 'Hand', color: '#E91E63' },
  { id: 'mecanico', name: 'Mecânico', nameEn: 'Mechanic', icon: 'Settings', color: '#607D8B' },
  { id: 'medico', name: 'Médico', nameEn: 'Doctor', icon: 'Stethoscope', color: '#F44336' },
  { id: 'mercado', name: 'Mercado', nameEn: 'Market', icon: 'ShoppingCart', color: '#4CAF50' },
  { id: 'pet', name: 'Pet Shop', nameEn: 'Pet Shop', icon: 'PawPrint', color: '#FF9800' },
  { id: 'pizzaria', name: 'Pizzaria', nameEn: 'Pizzeria', icon: 'Pizza', color: '#FFC107' },
  { id: 'restaurante', name: 'Restaurante', nameEn: 'Restaurant', icon: 'Utensils', color: '#FF5722' },
  { id: 'tatuador', name: 'Tatuador', nameEn: 'Tattoo Artist', icon: 'PenTool', color: '#212121' },
  { id: 'veterinario', name: 'Veterinário', nameEn: 'Veterinarian', icon: 'Heart', color: '#E91E63' }
];

export const initializeCategories = async () => {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);

    if (snapshot.empty) {
      console.log('Initializing default categories...');

      for (const category of defaultCategories) {
        const docRef = doc(db, 'categories', category.id);
        await setDoc(docRef, {
          name: category.name,
          nameEn: category.nameEn,
          icon: category.icon,
          color: category.color,
          active: true,
          iconSize: 24,
          orderIndex: defaultCategories.indexOf(category),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log('✅ Default categories initialized successfully!');
      return true;
    } else {
      console.log('Categories already exist, skipping initialization.');
      return false;
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
    throw error;
  }
};
