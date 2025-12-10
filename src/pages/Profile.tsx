import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Star, MapPin, Settings, Camera, Upload, Ruler, Eye, MousePointerClick, Trash2, EyeOff } from 'lucide-react';
import { getItems, deleteItem, toggleItemVisibility } from '../services/itemService';
import { Item } from '../types';
import { getUserItemsAnalytics, ItemAnalytics } from '../services/analyticsService';
import ItemCard from '../components/Common/ItemCard';
import LoginModal from '../components/Auth/LoginModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, logout, firebaseUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'items' | 'favorites' | 'reviews' | 'settings'>('items');
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Item[]>([]);
  const [itemsAnalytics, setItemsAnalytics] = useState<Record<string, ItemAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>(user?.distanceUnit || 'miles');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.isAnonymous) {
      setShowConvertModal(true);
    }

    loadUserData();
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.photoURL) {
      setProfilePhotoUrl(user.photoURL);
    }
    if (user && user.distanceUnit) {
      setDistanceUnit(user.distanceUnit);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user's items (both approved and pending)
      const [approvedItems, pendingItems] = await Promise.all([
        getItems({ status: 'approved', ownerId: user.uid }).catch(() => []),
        getItems({ status: 'pending', ownerId: user.uid }).catch(() => [])
      ]);

      // Combine and remove duplicates by ID
      const allItems = [...approvedItems, ...pendingItems];
      const uniqueItemsMap = new Map<string, Item>();

      allItems.forEach(item => {
        // Only add if not rejected and not already in map
        if (item.status !== 'rejected' && !uniqueItemsMap.has(item.id)) {
          uniqueItemsMap.set(item.id, item);
        }
      });

      const userOwnedItems = Array.from(uniqueItemsMap.values());
      console.log('📊 Profile - Loaded items:', {
        approved: approvedItems.length,
        pending: pendingItems.length,
        combined: allItems.length,
        unique: userOwnedItems.length
      });

      setUserItems(userOwnedItems);

      // Load analytics for user's items
      const analytics = await getUserItemsAnalytics(user.uid);
      setItemsAnalytics(analytics);

      // Load favorite items
      if (user.favorites.length > 0) {
        const allApprovedItems = await getItems({ status: 'approved' });
        const favoriteItemsData = allApprovedItems.filter(item => user.favorites.includes(item.id));
        setFavoriteItems(favoriteItemsData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoUpload = async (file: File) => {
    if (!user || user.isAnonymous) {
      toast.error('Faça login para adicionar foto de perfil');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL
      });

      // Don't set local state - let the real-time listener handle it
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      handleProfilePhotoUpload(file);
    }
  };

  const handleDistanceUnitChange = async (unit: 'miles' | 'km') => {
    if (!user || user.isAnonymous) {
      toast.error('Faça login para salvar preferências');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        distanceUnit: unit
      });

      setDistanceUnit(unit);
      toast.success(`Unidade alterada para ${unit === 'miles' ? 'milhas' : 'quilômetros'}`);
    } catch (error) {
      console.error('Error updating distance unit:', error);
      toast.error('Erro ao salvar preferência');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;

    const confirmed = window.confirm('Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      // Remove from local state immediately for instant UI feedback
      setUserItems(prev => prev.filter(item => item.id !== itemId));

      await deleteItem(itemId, user.uid);
      toast.success('Item deletado com sucesso!');

      // Reload data to ensure sync
      await loadUserData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao deletar item');
      // Reload on error to restore correct state
      await loadUserData();
    }
  };

  const handleToggleVisibility = async (itemId: string, currentVisibility: boolean) => {
    if (!user) return;

    try {
      // Update local state immediately for instant UI feedback
      setUserItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, visible: !currentVisibility } : item
      ));

      await toggleItemVisibility(itemId, user.uid, !currentVisibility);
      toast.success(currentVisibility ? 'Item ocultado com sucesso!' : 'Item visível novamente!');

      // Reload data to ensure sync
      await loadUserData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Erro ao alterar visibilidade');
      // Reload on error to restore correct state
      await loadUserData();
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <User size={32} className={`text-white ${profilePhotoUrl ? 'hidden' : ''}`} />
                </div>
                
                {!user.isAnonymous && (
                  <label
                    htmlFor="profilePhotoInput"
                    className="absolute -bottom-1 -right-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg"
                    title="Alterar foto de perfil"
                  >
                    {uploadingPhoto ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Camera size={16} />
                    )}
                  </label>
                )}
                
                <input
                  id="profilePhotoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadingPhoto || user.isAnonymous}
                />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.isAnonymous ? 'Visitante' : (user.displayName || user.email)}
                </h1>
                <p className="text-gray-600">
                  {user.isAnonymous ? 'Conta temporária' : 'Membro desde ' + user.createdAt.toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="ml-auto">
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>

            {user.isAnonymous && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 mb-2">
                  Você está usando uma conta temporária. Crie uma conta para salvar seus dados.
                </p>
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Criar Conta
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userItems.length}</div>
                <div className="text-gray-600">Itens Publicados</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{favoriteItems.length}</div>
                <div className="text-gray-600">Favoritos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-gray-600">Avaliações</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('items')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'items'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Meus Itens
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'favorites'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Favoritos
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Minhas Avaliações
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Configurações
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'items' && (
                <div>
                  {userItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userItems.map(item => {
                        const analytics = itemsAnalytics[item.id];
                        return (
                          <div key={item.id} className="relative">
                            <ItemCard item={item} />
                            {!item.visible && (
                              <div className="absolute inset-0 bg-gray-900/70 rounded-lg flex items-center justify-center">
                                <div className="text-white text-center">
                                  <EyeOff size={32} className="mx-auto mb-2" />
                                  <p className="font-semibold">Item Oculto</p>
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex space-x-2">
                              <button
                                onClick={() => handleToggleVisibility(item.id, item.visible)}
                                className={`${item.visible ? 'bg-gray-600 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'} text-white p-2 rounded-full shadow-lg transition-colors`}
                                title={item.visible ? 'Ocultar item' : 'Tornar visível'}
                              >
                                <EyeOff size={16} />
                              </button>
                              <button
                                onClick={() => navigate(`/editar/${item.id}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                                title="Editar item"
                              >
                                <Settings size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                                title="Deletar item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            {analytics && (
                              <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-1">
                                    <Eye size={16} className="text-blue-600" />
                                    <span className="font-medium">{analytics.totalViews}</span>
                                    <span className="text-gray-500 text-xs">visualizações</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MousePointerClick size={16} className="text-green-600" />
                                    <span className="font-medium">{analytics.totalClicks}</span>
                                    <span className="text-gray-500 text-xs">cliques</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500 text-lg mb-4">
                        Você ainda não cadastrou nenhum item.
                      </p>
                      <button
                        onClick={() => navigate('/cadastrar')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        Cadastrar Primeiro Item
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  {favoriteItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteItems.map(item => (
                        <ItemCard key={item.id} item={item} isFavorited={true} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500 text-lg">
                        Você ainda não tem itens favoritos.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="text-center py-12">
                  <Star className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 text-lg">
                    Suas avaliações aparecerão aqui.
                  </p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Ruler className="mr-2" size={20} />
                      Unidade de Distância
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Escolha como as distâncias serão exibidas no aplicativo.
                    </p>
                    
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="distanceUnit"
                          value="miles"
                          checked={distanceUnit === 'miles'}
                          onChange={() => handleDistanceUnitChange('miles')}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                          disabled={user?.isAnonymous}
                        />
                        <div>
                          <div className="font-medium text-gray-800">Milhas (mi)</div>
                          <div className="text-sm text-gray-600">Sistema imperial americano</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="distanceUnit"
                          value="km"
                          checked={distanceUnit === 'km'}
                          onChange={() => handleDistanceUnitChange('km')}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                          disabled={user?.isAnonymous}
                        />
                        <div>
                          <div className="font-medium text-gray-800">Quilômetros (km)</div>
                          <div className="text-sm text-gray-600">Sistema métrico internacional</div>
                        </div>
                      </label>
                    </div>
                    
                    {user?.isAnonymous && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          Faça login para salvar suas preferências de distância.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConvertModal && (
        <LoginModal onClose={() => setShowConvertModal(false)} />
      )}
    </>
  );
};

export default Profile;