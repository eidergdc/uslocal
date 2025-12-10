import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ItemView {
  id?: string;
  itemId: string;
  userId?: string;
  viewedAt: Date;
  sessionId?: string;
}

export interface ContactClick {
  id?: string;
  itemId: string;
  userId?: string;
  contactType: 'phone' | 'whatsapp' | 'email' | 'website';
  clickedAt: Date;
  sessionId?: string;
}

export interface ItemAnalytics {
  itemId: string;
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  clicksByType: {
    phone: number;
    whatsapp: number;
    email: number;
    website: number;
  };
}

export interface PlatformAnalytics {
  totalUsers: number;
  totalAdvertisers: number;
  totalItems: number;
  approvedItems: number;
  pendingItems: number;
  totalViews: number;
  totalClicks: number;
  topItems: Array<{
    itemId: string;
    itemName: string;
    views: number;
    clicks: number;
  }>;
  topCategories: Array<{
    category: string;
    itemCount: number;
    views: number;
  }>;
}

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

export const trackItemView = async (itemId: string, userId?: string): Promise<void> => {
  try {
    const sessionId = getSessionId();

    await addDoc(collection(db, 'item_views'), {
      itemId,
      userId: userId || null,
      viewedAt: Timestamp.now(),
      sessionId,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking item view:', error);
  }
};

export const trackContactClick = async (
  itemId: string,
  contactType: ContactClick['contactType'],
  userId?: string
): Promise<void> => {
  try {
    const sessionId = getSessionId();

    await addDoc(collection(db, 'contact_clicks'), {
      itemId,
      userId: userId || null,
      contactType,
      clickedAt: Timestamp.now(),
      sessionId,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking contact click:', error);
  }
};

export const getItemAnalytics = async (itemId: string): Promise<ItemAnalytics> => {
  try {
    const viewsQuery = query(
      collection(db, 'item_views'),
      where('itemId', '==', itemId)
    );
    const viewsSnapshot = await getDocs(viewsQuery);

    const clicksQuery = query(
      collection(db, 'contact_clicks'),
      where('itemId', '==', itemId)
    );
    const clicksSnapshot = await getDocs(clicksQuery);

    const uniqueSessions = new Set(
      viewsSnapshot.docs.map(doc => doc.data().sessionId).filter(Boolean)
    );

    const clicksByType = {
      phone: 0,
      whatsapp: 0,
      email: 0,
      website: 0
    };

    clicksSnapshot.docs.forEach(doc => {
      const type = doc.data().contactType as keyof typeof clicksByType;
      if (type in clicksByType) {
        clicksByType[type]++;
      }
    });

    return {
      itemId,
      totalViews: viewsSnapshot.size,
      uniqueViews: uniqueSessions.size,
      totalClicks: clicksSnapshot.size,
      clicksByType
    };
  } catch (error) {
    console.error('Error getting item analytics:', error);
    return {
      itemId,
      totalViews: 0,
      uniqueViews: 0,
      totalClicks: 0,
      clicksByType: { phone: 0, whatsapp: 0, email: 0, website: 0 }
    };
  }
};

export const getUserItemsAnalytics = async (userId: string): Promise<Record<string, ItemAnalytics>> => {
  try {
    const itemsSnapshot = await getDocs(
      query(collection(db, 'items'), where('ownerId', '==', userId))
    );

    const analytics: Record<string, ItemAnalytics> = {};

    for (const itemDoc of itemsSnapshot.docs) {
      const itemId = itemDoc.id;
      analytics[itemId] = await getItemAnalytics(itemId);
    }

    return analytics;
  } catch (error) {
    console.error('Error getting user items analytics:', error);
    return {};
  }
};

export const getPlatformAnalytics = async (): Promise<PlatformAnalytics> => {
  try {
    const [usersSnapshot, itemsSnapshot, viewsSnapshot, clicksSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'items')),
      getDocs(collection(db, 'item_views')),
      getDocs(collection(db, 'contact_clicks'))
    ]);

    const items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const advertisers = new Set(items.map(item => item.ownerId).filter(Boolean));

    const approvedItems = items.filter(item => item.status === 'approved');
    const pendingItems = items.filter(item => item.status === 'pending');

    const viewsByItem = new Map<string, number>();
    viewsSnapshot.docs.forEach(doc => {
      const itemId = doc.data().itemId;
      viewsByItem.set(itemId, (viewsByItem.get(itemId) || 0) + 1);
    });

    const clicksByItem = new Map<string, number>();
    clicksSnapshot.docs.forEach(doc => {
      const itemId = doc.data().itemId;
      clicksByItem.set(itemId, (clicksByItem.get(itemId) || 0) + 1);
    });

    const topItems = items
      .map(item => ({
        itemId: item.id,
        itemName: item.name || 'Unnamed',
        views: viewsByItem.get(item.id) || 0,
        clicks: clicksByItem.get(item.id) || 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const viewsByCategory = new Map<string, { count: number; views: number }>();
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      const existing = viewsByCategory.get(category) || { count: 0, views: 0 };
      viewsByCategory.set(category, {
        count: existing.count + 1,
        views: existing.views + (viewsByItem.get(item.id) || 0)
      });
    });

    const topCategories = Array.from(viewsByCategory.entries())
      .map(([category, data]) => ({
        category,
        itemCount: data.count,
        views: data.views
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      totalUsers: usersSnapshot.size,
      totalAdvertisers: advertisers.size,
      totalItems: items.length,
      approvedItems: approvedItems.length,
      pendingItems: pendingItems.length,
      totalViews: viewsSnapshot.size,
      totalClicks: clicksSnapshot.size,
      topItems,
      topCategories
    };
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    return {
      totalUsers: 0,
      totalAdvertisers: 0,
      totalItems: 0,
      approvedItems: 0,
      pendingItems: 0,
      totalViews: 0,
      totalClicks: 0,
      topItems: [],
      topCategories: []
    };
  }
};
