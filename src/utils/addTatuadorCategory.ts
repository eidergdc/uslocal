import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const addTatuadorCategory = async () => {
  try {
    console.log('Adding tatuador category to Firebase...');

    const categoryRef = doc(db, 'categories', 'tatuador');
    await setDoc(categoryRef, {
      name: 'Tatuador',
      nameEn: 'Tattoo Artist',
      icon: 'PenTool',
      color: '#212121',
      active: true,
      iconSize: 24,
      orderIndex: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true }); // Use merge to update if exists, create if not

    console.log('✅ Tatuador category added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding tatuador category:', error);
    throw error;
  }
};

export const addMissingCategories = async () => {
  try {
    console.log('Adding missing categories to Firebase...');

    const missingCategories = [
      { id: 'tatuador', name: 'Tatuador', nameEn: 'Tattoo Artist', icon: 'PenTool', color: '#212121' },
      { id: 'autoescola', name: 'Autoescola', nameEn: 'Driving School', icon: 'Car', color: '#FF9800' },
      { id: 'contabilidade', name: 'Contabilidade', nameEn: 'Accounting', icon: 'Calculator', color: '#607D8B' },
      { id: 'traducao', name: 'Tradução e interpretação', nameEn: 'Translation and Interpretation', icon: 'Languages', color: '#10b981' }
    ];

    for (const category of missingCategories) {
      const categoryRef = doc(db, 'categories', category.id);
      await setDoc(categoryRef, {
        name: category.name,
        nameEn: category.nameEn,
        icon: category.icon,
        color: category.color,
        active: true,
        iconSize: 24,
        orderIndex: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log(`✅ ${category.name} category added!`);
    }

    console.log('✅ All missing categories added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding missing categories:', error);
    throw error;
  }
};
