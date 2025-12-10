import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Star, MapPin, MessageSquare } from 'lucide-react';
import { getItems } from '../services/itemService';
import { Item } from '../types';
import ItemCard from '../components/Common/ItemCard';
import LoginModal from '../components/Auth/LoginModal';
import { useFavorites } from '../hooks/useFavorites';

const Favorites: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorited } = useFavorites();
  
  const [favoriteItems, setFavoriteItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.isAnonymous) {
      setShowLoginModal(true);
      return;
    }

    loadFavoriteItems();
  }, [user, navigate, favorites]);

  const loadFavoriteItems = async () => {
    if (!user || user.isAnonymous || favorites.length === 0) {
      setFavoriteItems([]);
      setLoading(false);
      return;
    }

    try {
      const items = await getItems({ status: 'approved' });
      const favoriteItemsData = items.filter(item => 
        favorites.includes(item.id) && item.status === 'approved'
      );
      setFavoriteItems(favoriteItemsData);
    } catch (error) {
      console.error('Error loading favorite items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (itemId: string) => {
    await toggleFavorite(itemId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16 md:pb-0">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors md:hidden"
            >
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center space-x-3 ml-4 md:ml-0">
              <Heart className="text-red-500" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Meus Favoritos</h1>
                <p className="text-gray-600">{favoriteItems.length} itens salvos</p>
              </div>
            </div>
          </div>

          {/* Info Card about Benefits */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 bg-green-500 text-white rounded-full p-3">
                <Heart size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg mb-3">Você sabia?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Star className="text-yellow-500" size={20} />
                    <span className="text-sm text-gray-700"><strong>Avalie</strong> os lugares que você visita</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-blue-500" size={20} />
                    <span className="text-sm text-gray-700"><strong>Salve</strong> seus lugares favoritos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="text-green-500" size={20} />
                    <span className="text-sm text-gray-700"><strong>Anuncie</strong> seu negócio grátis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {favoriteItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onFavorite={handleFavoriteToggle}
                  isFavorited={isFavorited(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="mx-auto text-gray-400 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Nenhum favorito ainda
              </h2>
              <p className="text-gray-600 mb-6">
                Explore o marketplace e adicione itens aos seus favoritos
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Explorar Itens
              </button>
            </div>
          )}
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default Favorites;