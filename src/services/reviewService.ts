import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Review } from '../types';

export const getReviews = async (itemId: string): Promise<Review[]> => {
  try {
    // Simple query to avoid composite index requirement
    const q = query(
      collection(db, 'reviews'),
      where('itemId', '==', itemId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(review => !review.reported) // Filter out reported reviews in memory
      .sort((a, b) => {
        // Sort by createdAt in descending order (newest first)
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      }) as Review[];
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw error;
  }
};

export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'reported'>): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      // FIRST: Read item data (all reads must come before writes)
      const itemRef = doc(db, 'items', reviewData.itemId);
      const itemDoc = await transaction.get(itemRef);

      // THEN: Perform writes
      // Add review
      const reviewRef = doc(collection(db, 'reviews'));
      transaction.set(reviewRef, {
        ...reviewData,
        reported: false,
        createdAt: serverTimestamp()
      });

      // Update item rating
      if (itemDoc.exists()) {
        const currentData = itemDoc.data();
        const currentRating = currentData.rating || 0;
        const currentCount = currentData.reviewCount || 0;

        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + reviewData.rating) / newCount;

        transaction.update(itemRef, {
          rating: newRating,
          reviewCount: newCount
        });
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const reportReview = async (reviewId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      reported: true
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    throw error;
  }
};