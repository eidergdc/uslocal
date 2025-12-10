import React, { useState, useEffect } from 'react';
import CategoryManager from '../components/Admin/CategoryManager';
import FeedbackItem from '../components/Admin/FeedbackItem';
import SponsoredAdManager from '../components/Admin/SponsoredAdManager';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, clearFirestoreCache } from '../config/firebase';
import { BarChart3, CheckCircle, XCircle, Star, Users, MapPin, TrendingUp, Eye, Upload, Image, MousePointerClick, UserCheck, Activity, MessageSquare, RefreshCw, Trash2, CreditCard as Edit, Megaphone, Database } from 'lucide-react';
import { getItems, getAllItemsForAdmin, updateItem, permanentlyDeleteItem } from '../services/itemService';
import { Item } from '../types';
import { getPlatformAnalytics, PlatformAnalytics } from '../services/analyticsService';
import { getAllFeedback, updateFeedbackStatus, Feedback, FeedbackStatus, FeedbackPriority } from '../services/feedbackService';
import { getCategories } from '../services/categoryService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setDoc, getDoc } from 'firebase/firestore';
import { storage } from '../config/firebase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { seedDatabase } from '../utils/seeds';

const Admin: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'analytics' | 'feedback' | 'customization' | 'categories' | 'ads'>('pending');
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [approvedItems, setApprovedItems] = useState<Item[]>([]);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Item>>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);


  // Customization states
  const [appIcon, setAppIcon] = useState<string>('');
  const [headerLogo, setHeaderLogo] = useState<string>('');
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }

    loadData();
    loadCustomization();
    loadAnalytics();
    loadFeedback();
    loadCategories();
  }, [user, isAdmin, navigate]);

  const loadCategories = async () => {
    try {
      const categories = await getCategories();
      setAvailableCategories(categories.map(c => c.name.toLowerCase()));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadData = async () => {
    try {
      // Load pending and approved items separately using admin function
      const [pendingItemsData, approvedItemsData] = await Promise.all([
        getAllItemsForAdmin({ status: 'pending' }),
        getAllItemsForAdmin({ status: 'approved' })
      ]);

      console.log('📊 Admin data loaded:', {
        pending: pendingItemsData.length,
        approved: approvedItemsData.length
      });

      setPendingItems(pendingItemsData);
      setApprovedItems(approvedItemsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analytics = await getPlatformAnalytics();
      setPlatformAnalytics(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadFeedback = async () => {
    try {
      const feedback = await getAllFeedback();
      setAllFeedback(feedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const handleUpdateFeedback = async (
    feedbackId: string,
    status: FeedbackStatus,
    response?: string,
    priority?: FeedbackPriority
  ) => {
    try {
      await updateFeedbackStatus(feedbackId, status, response, priority);
      toast.success('Feedback atualizado!');
      await loadFeedback();
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Erro ao atualizar feedback');
    }
  };

  const handleApproveItem = async (itemId: string) => {
    try {
      console.log('🟢 Approving item:', itemId);
      
      const docRef = doc(db, 'items', itemId);
      await updateDoc(docRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Item approved:', itemId);
      toast.success('✅ Item aprovado!');
      
      // Reload data after approval
      setTimeout(() => {
        loadData();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error approving item:', error);
      toast.error('❌ Erro: ' + error.message);
    }
  };

  const handleRejectItem = async (itemId: string) => {
    try {
      console.log('🔴 Rejecting item:', itemId);
      
      const docRef = doc(db, 'items', itemId);
      await updateDoc(docRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Item rejected:', itemId);
      toast.success('❌ Item rejeitado');
      
      setTimeout(() => {
        loadData();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error rejecting item:', error);
      toast.error('❌ Erro: ' + error.message);
    }
  };

  const handlePermanentlyDeleteItem = async (itemId: string) => {
    if (!window.confirm('⚠️ TEM CERTEZA? Esta ação é IRREVERSÍVEL e o item será DELETADO PERMANENTEMENTE do banco de dados!')) {
      return;
    }

    try {
      console.log('🗑️ Permanently deleting item:', itemId);
      await permanentlyDeleteItem(itemId);

      console.log('✅ Item permanently deleted:', itemId);
      toast.success('🗑️ Item deletado permanentemente!');

      setTimeout(() => {
        loadData();
      }, 1000);

    } catch (error) {
      console.error('❌ Error permanently deleting item:', error);
      toast.error('❌ Erro ao deletar: ' + error.message);
    }
  };

  const handleToggleFeatured = async (itemId: string, featured: boolean) => {
    try {
      const newFeaturedValue = !featured;
      console.log('🌟 Updating featured status:', { itemId, from: featured, to: newFeaturedValue });

      // Update optimistically in UI
      setApprovedItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, featured: newFeaturedValue } : item
      ));

      await updateItem(itemId, { featured: newFeaturedValue });

      console.log('✅ Featured status updated successfully');
      toast.success(featured ? 'Removido dos destaques' : 'Adicionado aos destaques');

      // Force reload from server after a brief delay to ensure Firebase synced
      setTimeout(async () => {
        console.log('🔄 Force reloading data from server...');
        await loadData();
      }, 500);
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Erro ao atualizar destaque');
      // Reload to restore correct state
      await loadData();
    }
  };

  const loadCustomization = async () => {
    try {
      const customizationDoc = await getDoc(doc(db, 'settings', 'customization'));
      if (customizationDoc.exists()) {
        const data = customizationDoc.data();
        setAppIcon(data.appIcon || '');
        setHeaderLogo(data.headerLogo || '');
      }
    } catch (error) {
      console.error('Error loading customization:', error);
    }
  };

  const handleIconUpload = async (file: File) => {
    setUploadingIcon(true);
    try {
      const storageRef = ref(storage, `customization/app-icon-${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await setDoc(doc(db, 'settings', 'customization'), {
        appIcon: downloadURL,
        headerLogo: headerLogo
      });
      
      setAppIcon(downloadURL);
      toast.success('Ícone do app atualizado!');
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast.error('Erro ao fazer upload do ícone');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const storageRef = ref(storage, `customization/header-logo-${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await setDoc(doc(db, 'settings', 'customization'), {
        appIcon: appIcon,
        headerLogo: downloadURL
      });
      
      setHeaderLogo(downloadURL);
      toast.success('Logo do header atualizado!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      if (type === 'icon') {
        handleIconUpload(file);
      } else {
        handleLogoUpload(file);
      }
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      categories: item.categories,
      phone: item.phone,
      whatsapp: item.whatsapp,
      website: item.website,
      address: item.address,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await updateItem(editingItem.id, editFormData);
      toast.success('Anúncio atualizado com sucesso!');
      setEditingItem(null);
      setEditFormData({});
      await loadData();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar anúncio');
    }
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = editFormData.categories || [];
    const categoryLower = category.toLowerCase();

    if (currentCategories.includes(categoryLower)) {
      setEditFormData({
        ...editFormData,
        categories: currentCategories.filter(c => c !== categoryLower)
      });
    } else {
      setEditFormData({
        ...editFormData,
        categories: [...currentCategories, categoryLower]
      });
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('⚠️ Isso vai adicionar dados de exemplo ao banco. Continuar?')) {
      return;
    }

    const loadingToast = toast.loading('Populando banco de dados...');

    try {
      await seedDatabase();
      toast.success('Banco de dados populado com sucesso!', { id: loadingToast });

      setTimeout(async () => {
        await loadData();
        await loadCategories();
      }, 1500);
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Erro ao popular banco: ' + error.message, { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 pb-20 sm:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Painel Admin</h1>
          <div className="flex flex-wrap gap-2 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={handleSeedDatabase}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              <Database size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Popular Banco</span>
              <span className="sm:hidden">Seed</span>
            </button>
            <button
              onClick={() => {
                toast.loading('Limpando cache e recarregando...');

                // Clear browser storage
                localStorage.clear();
                sessionStorage.clear();

                // Clear Service Worker cache if exists
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                  });
                }

                // Force hard reload
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Limpar Cache</span>
              <span className="sm:hidden">Cache</span>
            </button>
            <button
              onClick={async () => {
                toast.loading('Atualizando dados...');
                await loadData();
                toast.dismiss();
                toast.success('Dados atualizados!');
              }}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              <RefreshCw size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Atualizar Dados</span>
              <span className="sm:hidden">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <MapPin className="text-green-600 mb-2 sm:mb-0" size={24} />
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{approvedItems.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Aprovados</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <Eye className="text-yellow-600 mb-2 sm:mb-0" size={24} />
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{pendingItems.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <Star className="text-purple-600 mb-2 sm:mb-0" size={24} />
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                  {approvedItems.filter(item => item.featured).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Destaque</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <TrendingUp className="text-blue-600 mb-2 sm:mb-0" size={24} />
              <div className="sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                  {approvedItems.reduce((sum, item) => sum + item.viewCount, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Views</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-base ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Pendentes ({pendingItems.length})</span>
                <span className="sm:hidden">Pend. ({pendingItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-base ${
                  activeTab === 'approved'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Aprovados ({approvedItems.length})</span>
                <span className="sm:hidden">Aprov. ({approvedItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-base flex items-center space-x-1 sm:space-x-2 ${
                  activeTab === 'ads'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Megaphone size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Anúncios</span>
                <span className="sm:hidden">Ads</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-base ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Análises</span>
                <span className="sm:hidden">Stats</span>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-base ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Categorias</span>
                <span className="sm:hidden">Categ.</span>
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-base ${
                  activeTab === 'feedback'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Feedback ({allFeedback.filter(f => f.status === 'pending').length})</span>
                <span className="sm:hidden">FB ({allFeedback.filter(f => f.status === 'pending').length})</span>
              </button>
              <button
                onClick={() => setActiveTab('customization')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap text-xs sm:text-base ${
                  activeTab === 'customization'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Personalização</span>
                <span className="sm:hidden">Visual</span>
              </button>
            </nav>
          </div>

          <div className="p-3 sm:p-6">
            {/* Pending Items */}
            {activeTab === 'pending' && (
              <div className="space-y-3 sm:space-y-4">
                {pendingItems.length > 0 ? (
                  pendingItems.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-1 w-full">
                          <h3 className="font-semibold text-base sm:text-lg mb-1">{item.name}</h3>
                          <p className="text-gray-600 mb-2 text-sm line-clamp-2">{item.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded">Por: {item.ownerId.substring(0, 8)}...</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{item.createdAt instanceof Date ? item.createdAt.toLocaleDateString('pt-BR') : 'Data inválida'}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{item.categories[0]}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleApproveItem(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Aprovar"
                          >
                            <CheckCircle size={18} className="mx-auto" />
                          </button>

                          <button
                            onClick={() => handleRejectItem(item.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Rejeitar"
                          >
                            <XCircle size={18} className="mx-auto" />
                          </button>

                          <button
                            onClick={() => handlePermanentlyDeleteItem(item.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Deletar"
                          >
                            <Trash2 size={18} className="mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 text-lg">
                      Nenhum item aguardando aprovação.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Approved Items */}
            {activeTab === 'approved' && (
              <div className="space-y-3 sm:space-y-4">
                {approvedItems.length > 0 ? (
                  approvedItems.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg">{item.name}</h3>
                            {item.featured && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                DESTAQUE
                              </span>
                            )}
                            {item.verified && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                VERIFICADO
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2 text-sm line-clamp-2">{item.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded">👁 {item.viewCount}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">🔗 {item.clickCount}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">⭐ {item.rating.toFixed(1)} ({item.reviewCount})</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Editar"
                          >
                            <Edit size={18} className="mx-auto" />
                          </button>

                          <button
                            onClick={() => handleToggleFeatured(item.id, item.featured)}
                            className={`p-2 rounded-lg transition-colors flex-1 sm:flex-none ${
                              item.featured
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-gray-200 hover:bg-yellow-200 text-gray-700'
                            }`}
                            title={item.featured ? 'Remover destaque' : 'Destacar'}
                          >
                            <Star size={18} className={`mx-auto ${item.featured ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={() => handlePermanentlyDeleteItem(item.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Deletar"
                          >
                            <Trash2 size={18} className="mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 text-lg">
                      Nenhum item aprovado ainda.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics */}
            {activeTab === 'analytics' && platformAnalytics && (
              <div className="space-y-4 sm:space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between mb-2">
                      <Users size={24} className="sm:w-8 sm:h-8 mb-2 sm:mb-0" />
                      <div className="text-2xl sm:text-3xl font-bold">{platformAnalytics.totalUsers}</div>
                    </div>
                    <div className="text-blue-100 text-xs sm:text-base text-center sm:text-left">Usuários</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between mb-2">
                      <UserCheck size={24} className="sm:w-8 sm:h-8 mb-2 sm:mb-0" />
                      <div className="text-2xl sm:text-3xl font-bold">{platformAnalytics.totalAdvertisers}</div>
                    </div>
                    <div className="text-green-100 text-xs sm:text-base text-center sm:text-left">Anunciantes</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between mb-2">
                      <Eye size={24} className="sm:w-8 sm:h-8 mb-2 sm:mb-0" />
                      <div className="text-2xl sm:text-3xl font-bold">{platformAnalytics.totalViews.toLocaleString()}</div>
                    </div>
                    <div className="text-purple-100 text-xs sm:text-base text-center sm:text-left">Views</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 sm:p-6 rounded-xl shadow-lg text-white">
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between mb-2">
                      <MousePointerClick size={24} className="sm:w-8 sm:h-8 mb-2 sm:mb-0" />
                      <div className="text-2xl sm:text-3xl font-bold">{platformAnalytics.totalClicks.toLocaleString()}</div>
                    </div>
                    <div className="text-orange-100 text-xs sm:text-base text-center sm:text-left">Cliques</div>
                  </div>
                </div>

                {/* Items Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="text-3xl font-bold text-gray-800 mb-2">{platformAnalytics.totalItems}</div>
                    <div className="text-gray-600">Total de Itens</div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="text-3xl font-bold text-gray-800 mb-2">{platformAnalytics.approvedItems}</div>
                    <div className="text-gray-600">Itens Aprovados</div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                    <div className="text-3xl font-bold text-gray-800 mb-2">{platformAnalytics.pendingItems}</div>
                    <div className="text-gray-600">Aguardando Aprovação</div>
                  </div>
                </div>

                {/* Top Items */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-semibold text-xl mb-4 flex items-center text-gray-800">
                    <TrendingUp className="mr-2 text-green-600" size={24} />
                    Top 10 Itens Mais Visualizados
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            <div className="flex items-center justify-center">
                              <Eye size={16} className="mr-1" />
                              Visualizações
                            </div>
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            <div className="flex items-center justify-center">
                              <MousePointerClick size={16} className="mr-1" />
                              Cliques
                            </div>
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Taxa de Conversão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformAnalytics.topItems.map((item, index) => {
                          const conversionRate = item.views > 0 ? ((item.clicks / item.views) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={item.itemId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <span className={`font-bold ${index < 3 ? 'text-green-600' : 'text-gray-600'}`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-800">{item.itemName}</td>
                              <td className="py-3 px-4 text-center text-blue-600 font-semibold">{item.views.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center text-green-600 font-semibold">{item.clicks.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                                  {conversionRate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-semibold text-xl mb-4 flex items-center text-gray-800">
                    <BarChart3 className="mr-2 text-blue-600" size={24} />
                    Categorias Mais Populares
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platformAnalytics.topCategories.map((category, index) => (
                      <div key={category.category} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-green-600 mr-3">{index + 1}</span>
                            <span className="font-semibold text-gray-800">{category.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{category.itemCount} itens</span>
                          <span className="flex items-center">
                            <Eye size={14} className="mr-1" />
                            {category.views.toLocaleString()} views
                          </span>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full transition-all"
                            style={{
                              width: `${(category.views / Math.max(...platformAnalytics.topCategories.map(c => c.views))) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engagement Overview */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-semibold text-xl mb-4 flex items-center text-gray-800">
                    <Activity className="mr-2 text-purple-600" size={24} />
                    Visão Geral de Engajamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium mb-1">Média de Visualizações por Item</div>
                      <div className="text-3xl font-bold text-blue-700">
                        {platformAnalytics.totalItems > 0
                          ? Math.round(platformAnalytics.totalViews / platformAnalytics.totalItems).toLocaleString()
                          : 0}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                      <div className="text-sm text-green-600 font-medium mb-1">Taxa de Conversão Global</div>
                      <div className="text-3xl font-bold text-green-700">
                        {platformAnalytics.totalViews > 0
                          ? ((platformAnalytics.totalClicks / platformAnalytics.totalViews) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Gerenciar Feedback</h3>
                  <div className="flex space-x-2">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                      {allFeedback.filter(f => f.status === 'pending').length} pendentes
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {allFeedback.filter(f => f.status === 'implemented').length} implementados
                    </span>
                  </div>
                </div>

                {allFeedback.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum feedback recebido ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allFeedback.map(feedback => (
                      <FeedbackItem
                        key={feedback.id}
                        feedback={feedback}
                        onUpdate={handleUpdateFeedback}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            {activeTab === 'categories' && (
              <CategoryManager />
            )}

            {/* Sponsored Ads */}
            {activeTab === 'ads' && (
              <SponsoredAdManager />
            )}

            {/* Customization */}
            {activeTab === 'customization' && (
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Image className="mr-2" size={24} />
                    Ícone do Aplicativo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Altere o ícone que aparece na aba do navegador e quando o app é salvo na tela inicial.
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    {appIcon && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shadow-md">
                        <img
                          src={appIcon}
                          alt="Ícone atual"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'icon')}
                        className="hidden"
                        id="iconUpload"
                        disabled={uploadingIcon}
                      />
                      <label
                        htmlFor="iconUpload"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center space-x-2"
                      >
                        {uploadingIcon ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <Upload size={16} />
                        )}
                        <span>{uploadingIcon ? 'Enviando...' : 'Alterar Ícone'}</span>
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        Recomendado: 512x512px, formato PNG
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Image className="mr-2" size={24} />
                    Logo do Header
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Altere o logo "UL" que aparece ao lado de "US LOCAL" no cabeçalho do site.
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    {headerLogo ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-yellow-400 shadow-md">
                        <img
                          src={headerLogo}
                          alt="Logo atual"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-green-800 font-bold text-lg">UL</span>
                      </div>
                    )}
                    
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'logo')}
                        className="hidden"
                        id="logoUpload"
                        disabled={uploadingLogo}
                      />
                      <label
                        htmlFor="logoUpload"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center space-x-2"
                      >
                        {uploadingLogo ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <Upload size={16} />
                        )}
                        <span>{uploadingLogo ? 'Enviando...' : 'Alterar Logo'}</span>
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        Recomendado: 48x48px, formato PNG com fundo transparente
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Dicas de Personalização:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• <strong>Ícone do App:</strong> Use imagens quadradas (512x512px) para melhor qualidade</li>
                    <li>• <strong>Logo do Header:</strong> Prefira imagens com fundo transparente</li>
                    <li>• <strong>Formatos:</strong> PNG é recomendado para melhor qualidade</li>
                    <li>• <strong>Tamanho:</strong> Máximo 2MB por arquivo</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editar Anúncio</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setEditFormData({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Estabelecimento
                  </label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorias
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editFormData.categories?.includes(category)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editFormData.whatsapp || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+15551234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    value={editFormData.website || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemplo.com"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setEditFormData({});
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;