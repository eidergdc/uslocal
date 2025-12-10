import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Heart,
  Share2,
  Clock,
  Flag,
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  Edit
} from 'lucide-react';
import { Item, Review } from '../types';
import { getItem, incrementClickCount } from '../services/itemService';
import { getReviews, createReview } from '../services/reviewService';
import { trackItemView, trackContactClick } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import ImageGallery from '../components/Common/ImageGallery';
import StarRating from '../components/Common/StarRating';
import LoginModal from '../components/Auth/LoginModal';
import RelatedAds from '../components/ItemDetail/RelatedAds';
import toast from 'react-hot-toast';
import { t } from '../i18n';
import { openWhatsApp, openPhone, openMaps, openWebsite } from '../utils/openUrl';

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showGpsOptions, setShowGpsOptions] = useState(false);
  
  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      loadItemData(id);
    }
  }, [id]);

  useEffect(() => {
    if (user && item) {
      setIsFavorited(user.favorites.includes(item.id));
    }
  }, [user, item]);

  const loadItemData = async (itemId: string) => {
    try {
      const [itemData, reviewsData] = await Promise.all([
        getItem(itemId),
        getReviews(itemId)
      ]);

      setItem(itemData);
      setReviews(reviewsData);

      // Track view
      await trackItemView(itemId, user?.uid);
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Erro ao carregar item');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, url?: string) => {
    if (!item) return;

    await incrementClickCount(item.id);

    // Track contact click based on action type
    if (action === 'phone' && item.phone) {
      await trackContactClick(item.id, 'phone', user?.uid);
      await openPhone(item.phone);
    } else if (action === 'whatsapp' && item.whatsapp) {
      await trackContactClick(item.id, 'whatsapp', user?.uid);
      await openWhatsApp(item.whatsapp);
    } else if (action === 'website' && item.website) {
      await trackContactClick(item.id, 'website', user?.uid);
      await openWebsite(item.website);
    }
  };

  const handleGpsNavigation = async (app: 'google' | 'apple' | 'waze') => {
    if (!item) return;

    const { lat, lng } = item.coordinates;
    await openMaps(lat, lng, app);
    setShowGpsOptions(false);
  };

  const handleFavorite = async () => {
    if (!user || user.isAnonymous) {
      toast.error('Faça login para salvar favoritos!', {
        icon: '🔒',
        duration: 5000,
      });
      setTimeout(() => setShowLoginModal(true), 500);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);

      if (isFavorited) {
        await updateDoc(userRef, {
          favorites: arrayRemove(item!.id)
        });
        setIsFavorited(false);
        toast.success('Removido dos favoritos');
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(item!.id)
        });
        setIsFavorited(true);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.name,
          text: item?.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.isAnonymous) {
      setShowLoginModal(true);
      return;
    }

    if (reviewRating === 0) {
      toast.error('Selecione uma avaliação');
      return;
    }

    setSubmittingReview(true);

    try {
      await createReview({
        itemId: item!.id,
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userPhotoURL: user.photoURL,
        rating: reviewRating,
        comment: reviewComment
      });

      // Reload reviews
      const updatedReviews = await getReviews(item!.id);
      setReviews(updatedReviews);
      
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment('');
      toast.success('Avaliação enviada!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isCurrentlyOpen = () => {
    if (!item) return false;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof item.schedule;
    const currentTime = now.toTimeString().substring(0, 5);
    
    const schedule = item.schedule[currentDay];
    if (schedule?.closed) return false;
    
    return schedule?.open <= currentTime && schedule?.close >= currentTime;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-xl mb-4">Item não encontrado</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Image Gallery */}
            <ImageGallery
              images={item.images}
              alt={item.name}
              className="h-64 md:h-80"
            />

            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{item.name}</h1>
                  <div className="flex items-center mb-2">
                    <StarRating rating={item.rating} readonly />
                    <span className="ml-2 text-sm sm:text-base text-gray-600">
                      ({item.reviewCount} avaliações)
                    </span>
                  </div>
                  <div className="flex items-start text-gray-600 text-sm sm:text-base">
                    <MapPin size={16} className="mr-1 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.address}</span>
                  </div>
                </div>

                <div className="flex space-x-2 self-start sm:self-auto">
                  {(user?.uid === item.ownerId || isAdmin) && (
                    <button
                      onClick={() => navigate(`/editar/${item.id}`)}
                      className="p-2 sm:p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-green-100 hover:text-green-600 transition-colors"
                      title="Editar anúncio"
                    >
                      <Edit size={18} />
                    </button>
                  )}

                  <button
                    onClick={handleFavorite}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      isFavorited
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                    }`}
                  >
                    <Heart size={18} className={isFavorited ? 'fill-current' : ''} />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-2 sm:p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Categories and Status */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {item.categories.map((category) => (
                  <span
                    key={category}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCurrentlyOpen() 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isCurrentlyOpen() ? 'Aberto' : 'Fechado'}
                </span>
                
                {item.verified && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Verificado
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="relative">
                  <button
                    onClick={() => setShowGpsOptions(!showGpsOptions)}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <MapPin size={18} />
                    <span>Direções</span>
                    <ChevronDown size={16} className={`transition-transform ${showGpsOptions ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showGpsOptions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleGpsNavigation('google')}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">G</span>
                        </div>
                        <span className="text-gray-700 font-medium">Google Maps</span>
                      </button>
                      
                      <button
                        onClick={() => handleGpsNavigation('apple')}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">🍎</span>
                        </div>
                        <span className="text-gray-700 font-medium">Apple Maps</span>
                      </button>
                      
                      <button
                        onClick={() => handleGpsNavigation('waze')}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">W</span>
                        </div>
                        <span className="text-gray-700 font-medium">Waze</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {item.whatsapp && (
                  <button
                    onClick={() => handleAction('whatsapp')}
                    className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                  </button>
                )}

                {item.phone && (
                  <button
                    onClick={() => handleAction('call')}
                    className="flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <Phone size={18} />
                    <span>Ligar</span>
                  </button>
                )}

                {item.website && (
                  <button
                    onClick={() => handleAction('website')}
                    className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <Globe size={18} />
                    <span>Site</span>
                  </button>
                )}
              </div>

              {/* Schedule */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <Clock size={20} className="mr-2" />
                  Horários de Funcionamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(item.schedule).map(([day, schedule]) => (
                    <div key={day} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="font-medium capitalize">{day}</span>
                      <span className={schedule.closed ? 'text-red-600' : 'text-green-600'}>
                        {schedule.closed ? 'Fechado' : `${schedule.open} - ${schedule.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">
                    Avaliações ({reviews.length})
                  </h3>

                  {user && !user.isAnonymous ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Avaliar
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Fazer Login
                    </button>
                  )}
                </div>

                {/* Benefits Banner for non-logged users */}
                {(!user || user.isAnonymous) && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 bg-blue-500 text-white rounded-full p-2">
                        <Heart size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-2">Crie uma conta gratuita e aproveite!</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span><strong>Avaliar locais</strong> e compartilhar suas experiências</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span><strong>Salvar favoritos</strong> e acessar rapidamente</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span><strong>Anunciar seu negócio</strong> gratuitamente</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span><strong>Ver histórico</strong> de lugares visitados</span>
                          </li>
                        </ul>
                        <button
                          onClick={() => setShowLoginModal(true)}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Criar Conta Grátis
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sua avaliação
                      </label>
                      <StarRating rating={reviewRating} onRatingChange={setReviewRating} />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentário
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="Conte sobre sua experiência..."
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={submittingReview || reviewRating === 0}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start space-x-3 flex-1">
                          {/* User Avatar */}
                          <div className="flex-shrink-0">
                            {review.userPhotoURL ? (
                              <img
                                src={review.userPhotoURL}
                                alt={review.userName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                                {review.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Review Content */}
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="font-medium mr-2">{review.userName}</span>
                              <StarRating rating={review.rating} readonly size={16} />
                            </div>
                            <span className="text-sm text-gray-500">
                              {review.createdAt instanceof Date
                                ? review.createdAt.toLocaleDateString('pt-BR')
                                : new Date(review.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                              }
                            </span>
                          </div>
                        </div>

                        <button className="text-gray-400 hover:text-red-600 transition-colors ml-2">
                          <Flag size={16} />
                        </button>
                      </div>

                      <p className="text-gray-700 ml-13">{review.comment}</p>
                    </div>
                  ))}

                  {reviews.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Ainda não há avaliações para este item.
                    </p>
                  )}
                </div>

                {/* Related Ads */}
                <RelatedAds />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default ItemDetail;