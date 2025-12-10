import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  GeoPoint,
  Timestamp,
  onSnapshot,
  getDocsFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Item } from '../types';

export const getAllItemsForAdmin = async (filters?: {
  status?: string;
}): Promise<Item[]> => {
  try {
    console.log('🔍 getAllItemsForAdmin() - Starting Firestore query with filters:', filters);

    let q = query(collection(db, 'items'));

    // Filter by status if specified
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    console.log('📡 [ADMIN] Executing Firestore query FROM SERVER (no cache)...');
    const snapshot = await getDocsFromServer(q);
    console.log('📊 [ADMIN] Query returned:', snapshot.size, 'documents');

    if (snapshot.empty) {
      console.warn('⚠️ No documents found matching the query');
      return [];
    }

    const items = snapshot.docs.map(doc => {
      const data = doc.data();

      const processedItem = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };

      return processedItem as Item;
    }).filter(item => {
      // Filter out items without valid coordinates
      return item.coordinates &&
             typeof item.coordinates.lat === 'number' &&
             typeof item.coordinates.lng === 'number' &&
             !isNaN(item.coordinates.lat) &&
             !isNaN(item.coordinates.lng);
    });

    console.log('✅ Returning', items.length, 'valid items');
    return items;

  } catch (error) {
    console.error('❌ Error fetching items:', error);
    throw error;
  }
};

export const getItems = async (filters?: {
  category?: string;
  status?: string;
  featured?: boolean;
  ownerId?: string;
}): Promise<Item[]> => {
  try {
    console.log('🔍 getItems() - Starting Firestore query with filters:', filters);

    let q = query(collection(db, 'items'));

    // Always filter by status first to match security rules
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    } else {
      // Default to approved items only for public access
      q = query(q, where('status', '==', 'approved'));
    }

    // Add owner filter if specified (for user's own items)
    if (filters?.ownerId) {
      q = query(collection(db, 'items'), where('ownerId', '==', filters.ownerId));
    } else {
      // If not filtering by owner, only show visible items
      q = query(q, where('visible', '==', true));
    }

    // Add category filter if specified
    if (filters?.category) {
      q = query(q, where('categories', 'array-contains', filters.category));
    }

    // Add featured filter if specified
    if (filters?.featured !== undefined) {
      q = query(q, where('featured', '==', filters.featured));
    }

    console.log('📡 [PUBLIC] Executing Firestore query FROM SERVER (no cache)...');
    const snapshot = await getDocsFromServer(q);
    console.log('📊 [PUBLIC] Query returned:', snapshot.size, 'documents');
    
    if (snapshot.empty) {
      console.warn('⚠️ No documents found matching the query');
      return [];
    }
    
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      
      const processedItem = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
      
      return processedItem as Item;
    }).filter(item => {
      // Filter out items without valid coordinates
      return item.coordinates && 
             typeof item.coordinates.lat === 'number' && 
             typeof item.coordinates.lng === 'number' &&
             !isNaN(item.coordinates.lat) &&
             !isNaN(item.coordinates.lng);
    });
    
    console.log('✅ Returning', items.length, 'valid items');
    return items;
    
  } catch (error) {
    console.error('❌ Error fetching items:', error);
    throw error;
  }
};

export const getItemsAlternative = async (filters?: {
  category?: string;
  status?: string;
  featured?: boolean;
}): Promise<Item[]> => {
  try {
    let q = query(collection(db, 'items'));
    
    // Apply filters only if they exist
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(where('categories', 'array-contains', filters.category));
      console.log('🏷️ Added category filter:', filters.category);
    }
    
    if (filters?.status) {
      conditions.push(where('status', '==', filters.status));
      console.log('📊 Added status filter:', filters.status);
    }
    
    if (filters?.featured !== undefined) {
      conditions.push(where('featured', '==', filters.featured));
      console.log('⭐ Added featured filter:', filters.featured);
    }
    
    // Apply all conditions to the query
    if (conditions.length > 0) {
      q = query(collection(db, 'items'), ...conditions);
      console.log('🔍 Applied', conditions.length, 'conditions to query');
    }

    console.log('📡 [ALT] Executing Firestore query FROM SERVER (no cache)...');
    const snapshot = await getDocsFromServer(q);
    console.log('📦 Raw snapshot size:', snapshot.size);
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }) as Item).filter(item => {
      // Filter out items without valid coordinates
      return item.coordinates && 
             typeof item.coordinates.lat === 'number' && 
             typeof item.coordinates.lng === 'number' &&
             !isNaN(item.coordinates.lat) &&
             !isNaN(item.coordinates.lng);
    });
    
    console.log('📋 Processed items:', items.length);
    console.log('📊 Items by status:', items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    
    // Sort by createdAt in JavaScript instead of Firestore
    const sortedItems = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    console.log('✅ Returning', sortedItems.length, 'sorted items');
    
    return sortedItems;
  } catch (error) {
    console.error('Error getting items:', error);
    throw error;
  }
};

export const getItem = async (id: string): Promise<Item | null> => {
  try {
    const docRef = doc(db, 'items', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Increment view count
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date()
      } as Item;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
};

export const createItem = async (itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'viewCount' | 'clickCount'>): Promise<string> => {
  try {
    const newItem = {
      ...itemData,
      visible: true,
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
      clickCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'items'), newItem);
    return docRef.id;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const updateItem = async (id: string, updates: Partial<Item>): Promise<void> => {
  try {
    console.log('🔄 UPDATEITEM - ID:', id, 'UPDATES:', updates);
    
    // Criar objeto limpo apenas com campos permitidos
    const cleanUpdates: any = {};
    
    if (updates.status) cleanUpdates.status = updates.status;
    if (updates.featured !== undefined) cleanUpdates.featured = updates.featured;
    if (updates.verified !== undefined) cleanUpdates.verified = updates.verified;
    if (updates.name) cleanUpdates.name = updates.name;
    if (updates.description) cleanUpdates.description = updates.description;
    if (updates.categories) cleanUpdates.categories = updates.categories;
    if (updates.coordinates) cleanUpdates.coordinates = updates.coordinates;
    if (updates.address) cleanUpdates.address = updates.address;
    if (updates.phone) cleanUpdates.phone = updates.phone;
    if (updates.whatsapp) cleanUpdates.whatsapp = updates.whatsapp;
    if (updates.website) cleanUpdates.website = updates.website;
    if (updates.images) cleanUpdates.images = updates.images;
    if (updates.schedule) cleanUpdates.schedule = updates.schedule;
    if (updates.averagePrice) cleanUpdates.averagePrice = updates.averagePrice;
    
    // Sempre adicionar timestamp de atualização
    cleanUpdates.updatedAt = serverTimestamp();
    
    console.log('✅ DADOS LIMPOS:', cleanUpdates);
    
    const docRef = doc(db, 'items', id);
    await updateDoc(docRef, cleanUpdates);
    
    console.log('✅ SUCESSO - ITEM ATUALIZADO:', id);
  } catch (error) {
    console.error('❌ ERRO UPDATEITEM:', error);
    throw error;
  }
};

export const uploadItemImages = async (files: FileList, itemId: string): Promise<string[]> => {
  const urls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const storageRef = ref(storage, `items/${itemId}/${Date.now()}_${file.name}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      urls.push(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
  
  return urls;
};

export const incrementClickCount = async (itemId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'items', itemId), {
      clickCount: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing click count:', error);
  }
};

export const deleteItem = async (itemId: string, ownerId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'items', itemId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Item não encontrado');
    }

    if (docSnap.data().ownerId !== ownerId) {
      throw new Error('Você não tem permissão para deletar este item');
    }

    await updateDoc(docRef, {
      status: 'rejected',
      visible: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

export const permanentlyDeleteItem = async (itemId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'items', itemId);
    await deleteDoc(docRef);
    console.log('✅ Item permanently deleted:', itemId);
  } catch (error) {
    console.error('❌ Error permanently deleting item:', error);
    throw error;
  }
};

export const toggleItemVisibility = async (itemId: string, ownerId: string, visible: boolean): Promise<void> => {
  try {
    const docRef = doc(db, 'items', itemId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Item não encontrado');
    }

    if (docSnap.data().ownerId !== ownerId) {
      throw new Error('Você não tem permissão para alterar este item');
    }

    await updateDoc(docRef, {
      visible,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error toggling item visibility:', error);
    throw error;
  }
};