import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Lightbulb,
  MapPin,
  Bug,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react';
import {
  createFeedback,
  getUserFeedback,
  Feedback as FeedbackType,
  FeedbackType as FType
} from '../services/feedbackService';
import LoginModal from '../components/Auth/LoginModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [userFeedback, setUserFeedback] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'improvement' as FType,
    title: '',
    description: ''
  });

  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadUserFeedback();
    }
  }, [user]);

  const loadUserFeedback = async () => {
    if (!user || user.isAnonymous) return;

    setLoading(true);
    try {
      const feedback = await getUserFeedback(user.uid);
      setUserFeedback(feedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || user.isAnonymous) {
      setShowLoginModal(true);
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSubmitting(true);
    try {
      await createFeedback({
        userId: user.uid,
        userName: user.displayName || user.email || 'Usuário',
        userEmail: user.email || '',
        type: formData.type,
        title: formData.title,
        description: formData.description
      });

      toast.success('Feedback enviado com sucesso!');
      setFormData({
        type: 'improvement',
        title: '',
        description: ''
      });

      await loadUserFeedback();
      setActiveTab('history');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Erro ao enviar feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackTypes = [
    { value: 'category', label: 'Nova Categoria', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'location', label: 'Sugerir Local', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'improvement', label: 'Melhoria do App', icon: Lightbulb, color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'bug', label: 'Reportar Bug', icon: Bug, color: 'text-red-600', bg: 'bg-red-100' },
    { value: 'other', label: 'Outro', icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-100' }
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'reviewed':
        return { label: 'Em Análise', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'implemented':
        return { label: 'Implementado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'rejected':
        return { label: 'Recusado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { label: status, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <MessageSquare size={40} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Feedback & Sugestões
          </h1>
          <p className="text-gray-600 text-lg">
            Ajude-nos a melhorar a plataforma com suas ideias
          </p>
        </div>

        {/* Info Alert */}
        {(!user || user.isAnonymous) && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                <MessageSquare size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Faça login para enviar feedback</h3>
                <p className="text-blue-700 mb-4">
                  Você pode visualizar as informações, mas para enviar sugestões, categorias ou reportar problemas,
                  é necessário estar cadastrado.
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Fazer Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {user && !user.isAnonymous && (
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'submit'
                  ? 'bg-white shadow-lg text-green-600 scale-105'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              <Send size={20} className="inline-block mr-2" />
              Enviar Feedback
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white shadow-lg text-green-600 scale-105'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              <Clock size={20} className="inline-block mr-2" />
              Meu Histórico
            </button>
          </div>
        )}

        {/* Submit Form */}
        {activeTab === 'submit' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tipo de Feedback
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {feedbackTypes.map(type => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value as FType })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? `border-green-500 ${type.bg} scale-105`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={24} className={`mx-auto mb-2 ${isSelected ? type.color : 'text-gray-400'}`} />
                        <div className={`text-xs font-medium ${isSelected ? type.color : 'text-gray-600'}`}>
                          {type.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Título
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Adicionar categoria de Academias"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={!user || user.isAnonymous}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição Detalhada
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva sua sugestão ou problema em detalhes..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  required
                  disabled={!user || user.isAnonymous}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !user || user.isAnonymous}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Enviar Feedback</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Carregando histórico...</p>
              </div>
            ) : userFeedback.length > 0 ? (
              userFeedback.map(feedback => {
                const typeInfo = feedbackTypes.find(t => t.value === feedback.type);
                const statusInfo = getStatusInfo(feedback.status);
                const TypeIcon = typeInfo?.icon || MessageSquare;
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={feedback.id} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`${typeInfo?.bg || 'bg-gray-100'} rounded-lg p-3 flex-shrink-0`}>
                          <TypeIcon size={24} className={typeInfo?.color || 'text-gray-600'} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg mb-1">{feedback.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {format(feedback.createdAt, "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          <p className="text-gray-700">{feedback.description}</p>
                        </div>
                      </div>
                      <div className={`${statusInfo.bg} ${statusInfo.color} px-4 py-2 rounded-lg flex items-center space-x-2 flex-shrink-0 ml-4`}>
                        <StatusIcon size={18} />
                        <span className="font-medium text-sm">{statusInfo.label}</span>
                      </div>
                    </div>

                    {feedback.adminResponse && (
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Resposta do Administrador:</p>
                        <p className="text-blue-800">{feedback.adminResponse}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg mb-2">Nenhum feedback enviado ainda</p>
                <p className="text-gray-500 mb-6">Seja o primeiro a compartilhar suas ideias!</p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Enviar Primeiro Feedback
                </button>
              </div>
            )}
          </div>
        )}

        {/* Benefits for non-logged users */}
        {(!user || user.isAnonymous) && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Por que enviar feedback?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                  <Lightbulb size={24} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Influencie o Desenvolvimento</h4>
                  <p className="text-gray-600 text-sm">
                    Suas ideias podem se tornar novas funcionalidades
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                  <Star size={24} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Sugira Categorias</h4>
                  <p className="text-gray-600 text-sm">
                    Ajude a expandir as opções disponíveis
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                  <MapPin size={24} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Indique Locais</h4>
                  <p className="text-gray-600 text-sm">
                    Compartilhe estabelecimentos que merecem estar aqui
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 rounded-lg p-3 flex-shrink-0">
                  <Bug size={24} className="text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Reporte Problemas</h4>
                  <p className="text-gray-600 text-sm">
                    Ajude-nos a corrigir bugs e melhorar a experiência
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
};

export default Feedback;
