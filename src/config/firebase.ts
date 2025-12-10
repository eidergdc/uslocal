import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache, clearIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCryyhiUki-1hJJ-OLSfqLZ163TqWec30A",
  authDomain: "us-local.firebaseapp.com",
  projectId: "us-local",
  storageBucket: "us-local.firebasestorage.app",
  messagingSenderId: "267644836724",
  appId: "1:267644836724:web:a3157937d018d97b5eea21"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with MEMORY-ONLY cache (no persistence)
// This prevents stale cached data from showing up
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export const storage = getStorage(app);

// Function to clear any existing IndexedDB cache
export const clearFirestoreCache = async () => {
  try {
    console.log('🗑️ Clearing Firestore cache...');
    await clearIndexedDbPersistence(db);
    console.log('✅ Firestore cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

export default app;