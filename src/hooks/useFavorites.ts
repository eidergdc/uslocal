import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      setFavorites(user.favorites || []);
    } else {
      setFavorites([]);
    }
  }, [user]);

  const toggleFavorite = async (itemId: string) => {
    if (!user || user.isAnonymous) {
      toast.error('Faça login para favoritar itens');
      return false;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const isFavorited = favorites.includes(itemId);
      
      if (isFavorited) {
        await updateDoc(userRef, {
          favorites: arrayRemove(itemId)
        });
        setFavorites(prev => prev.filter(id => id !== itemId));
        toast.success('Removido dos favoritos');
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(itemId)
        });
        setFavorites(prev => [...prev, itemId]);
        toast.success('Adicionado aos favoritos');
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favoritos');
      return false;
    }
  };

  const isFavorited = (itemId: string) => favorites.includes(itemId);

  return {
    favorites,
    toggleFavorite,
    isFavorited
  };
};