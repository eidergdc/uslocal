import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export type FeedbackType = 'category' | 'location' | 'improvement' | 'bug' | 'other';
export type FeedbackStatus = 'pending' | 'reviewed' | 'implemented' | 'rejected';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  adminResponse?: string;
  priority: FeedbackPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeedbackData {
  userId: string;
  userName: string;
  userEmail: string;
  type: FeedbackType;
  title: string;
  description: string;
}

export const createFeedback = async (data: CreateFeedbackData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'feedback'), {
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      type: data.type,
      title: data.title,
      description: data.description,
      status: 'pending',
      priority: 'medium',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }
};

export const getUserFeedback = async (userId: string): Promise<Feedback[]> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Feedback[];
  } catch (error) {
    console.error('Error getting user feedback:', error);
    return [];
  }
};

export const getAllFeedback = async (): Promise<Feedback[]> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Feedback[];
  } catch (error) {
    console.error('Error getting all feedback:', error);
    return [];
  }
};

export const updateFeedbackStatus = async (
  feedbackId: string,
  status: FeedbackStatus,
  adminResponse?: string,
  priority?: FeedbackPriority
): Promise<void> => {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };

    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    await updateDoc(feedbackRef, updateData);
  } catch (error) {
    console.error('Error updating feedback status:', error);
    throw error;
  }
};

export const getFeedbackById = async (feedbackId: string): Promise<Feedback | null> => {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    const feedbackDoc = await getDoc(feedbackRef);

    if (!feedbackDoc.exists()) {
      return null;
    }

    return {
      id: feedbackDoc.id,
      ...feedbackDoc.data(),
      createdAt: feedbackDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: feedbackDoc.data().updatedAt?.toDate() || new Date()
    } as Feedback;
  } catch (error) {
    console.error('Error getting feedback by id:', error);
    return null;
  }
};

export const getFeedbackStats = async (): Promise<{
  total: number;
  pending: number;
  reviewed: number;
  implemented: number;
  rejected: number;
  byType: Record<FeedbackType, number>;
}> => {
  try {
    const allFeedback = await getAllFeedback();

    const stats = {
      total: allFeedback.length,
      pending: allFeedback.filter(f => f.status === 'pending').length,
      reviewed: allFeedback.filter(f => f.status === 'reviewed').length,
      implemented: allFeedback.filter(f => f.status === 'implemented').length,
      rejected: allFeedback.filter(f => f.status === 'rejected').length,
      byType: {
        category: allFeedback.filter(f => f.type === 'category').length,
        location: allFeedback.filter(f => f.type === 'location').length,
        improvement: allFeedback.filter(f => f.type === 'improvement').length,
        bug: allFeedback.filter(f => f.type === 'bug').length,
        other: allFeedback.filter(f => f.type === 'other').length
      }
    };

    return stats;
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return {
      total: 0,
      pending: 0,
      reviewed: 0,
      implemented: 0,
      rejected: 0,
      byType: { category: 0, location: 0, improvement: 0, bug: 0, other: 0 }
    };
  }
};
