import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp,
  getDocsFromServer
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SponsoredAd, PlacementType } from '../types';

const COLLECTION_NAME = 'sponsored_ads';

export const getActiveAdsByPlacement = async (placement: PlacementType): Promise<SponsoredAd[]> => {
  try {
    const now = new Date();
    console.log('📢 getActiveAdsByPlacement - Placement:', placement, 'Hora atual:', now);

    const adsRef = collection(db, COLLECTION_NAME);
    const q = query(
      adsRef,
      where('placement', '==', placement),
      where('isActive', '==', true),
      orderBy('priority', 'desc')
    );

    const snapshot = await getDocsFromServer(q);
    console.log('📢 getActiveAdsByPlacement - Documentos encontrados na query (direto do servidor):', snapshot.size);

    const ads: SponsoredAd[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📢 Processando anúncio:', doc.id, data);

      const ad = {
        id: doc.id,
        ...data,
        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as SponsoredAd;

      console.log('📢 Anúncio processado - Start:', ad.startDate, 'End:', ad.endDate, 'Now:', now);
      console.log('📢 Verificação - startDate <= now:', ad.startDate <= now);
      console.log('📢 Verificação - !endDate || endDate >= now:', !ad.endDate || ad.endDate >= now);

      if (ad.startDate <= now && (!ad.endDate || ad.endDate >= now)) {
        console.log('✅ Anúncio INCLUÍDO:', ad.title);
        ads.push(ad);
      } else {
        console.log('❌ Anúncio EXCLUÍDO:', ad.title);
      }
    });

    console.log('📢 Total de anúncios ativos retornados:', ads.length);
    return ads.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error('❌ Error fetching sponsored ads:', error);
    return [];
  }
};

export const getAllAds = async (): Promise<SponsoredAd[]> => {
  try {
    const adsRef = collection(db, COLLECTION_NAME);
    const q = query(adsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as SponsoredAd;
    });
  } catch (error) {
    console.error('Error fetching all ads:', error);
    return [];
  }
};

export const getAdById = async (id: string): Promise<SponsoredAd | null> => {
  try {
    const adRef = doc(db, COLLECTION_NAME, id);
    const adDoc = await getDoc(adRef);

    if (!adDoc.exists()) {
      return null;
    }

    const data = adDoc.data();
    return {
      id: adDoc.id,
      ...data,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
      endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as SponsoredAd;
  } catch (error) {
    console.error('Error fetching ad:', error);
    return null;
  }
};

export const createAd = async (
  adData: Omit<SponsoredAd, 'id' | 'clickCount' | 'viewCount' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const adsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(adsRef, {
      ...adData,
      clickCount: 0,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating ad:', error);
    throw error;
  }
};

export const updateAd = async (
  id: string,
  adData: Partial<Omit<SponsoredAd, 'id' | 'clickCount' | 'viewCount' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const adRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(adRef, {
      ...adData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    throw error;
  }
};

export const deleteAd = async (id: string): Promise<void> => {
  try {
    const adRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(adRef);
  } catch (error) {
    console.error('Error deleting ad:', error);
    throw error;
  }
};

export const incrementAdView = async (id: string): Promise<void> => {
  try {
    const adRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(adRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing ad view:', error);
  }
};

export const incrementAdClick = async (id: string): Promise<void> => {
  try {
    const adRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(adRef, {
      clickCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing ad click:', error);
  }
};
