import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Category } from '../types';

export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, 'categories'),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No categories found in database');
      return [];
    }

    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        nameEn: data.nameEn,
        icon: data.icon || undefined,
        iconUrl: data.iconUrl || undefined,
        color: data.color,
        active: data.active,
        iconSize: data.iconSize || 24
      };
    });

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));

    if (snapshot.empty) return [];

    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        nameEn: data.nameEn,
        icon: data.icon || undefined,
        iconUrl: data.iconUrl || undefined,
        color: data.color,
        active: data.active,
        iconSize: data.iconSize || 24
      };
    });

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting all categories:', error);
    return [];
  }
};

export const createCategory = async (category: Omit<Category, 'id'> & { id: string }) => {
  try {
    const docRef = doc(db, 'categories', category.id);
    await addDoc(collection(db, 'categories'), {
      name: category.name,
      nameEn: category.nameEn,
      icon: category.icon,
      iconUrl: category.iconUrl,
      color: category.color,
      active: category.active ?? true,
      iconSize: category.iconSize || 24,
      orderIndex: 999,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { id: category.id };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, updates: Partial<Category>) => {
  try {
    const docRef = doc(db, 'categories', id);
    const dbUpdates: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.nameEn) dbUpdates.nameEn = updates.nameEn;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.iconUrl !== undefined) dbUpdates.iconUrl = updates.iconUrl;
    if (updates.color) dbUpdates.color = updates.color;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.iconSize !== undefined) dbUpdates.iconSize = updates.iconSize;

    await updateDoc(docRef, dbUpdates);
    return { id };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const uploadCategoryIcon = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, `category-icons/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file, {
      cacheControl: 'public, max-age=3600'
    });

    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error('Error uploading icon:', error);
    throw error;
  }
};
