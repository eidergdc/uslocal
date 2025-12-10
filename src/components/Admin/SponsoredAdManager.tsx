import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, MousePointer, Calendar, ExternalLink, Upload, X, Bug } from 'lucide-react';
import { SponsoredAd, PlacementType } from '../../types';
import { getAllAds, createAd, updateAd, deleteAd } from '../../services/sponsoredAdService';
import { useAuth } from '../../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import toast from 'react-hot-toast';

const SponsoredAdManager: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<SponsoredAd | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    placement: 'home_list' as PlacementType,
    itemId: '',
    priority: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const adsData = await getAllAds();
      setAds(adsData);
    } catch (error) {
      console.error('Error loading ads:', error);
      toast.error('Erro ao carregar anúncios');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !user) throw new Error('No image file');

    setUploading(true);
    try {
      const timestamp = Date.now();
      const filename = `sponsored-ads/${user.uid}/${timestamp}_${imageFile.name}`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, imageFile);
      const url = await getDownloadURL(storageRef);

      return url;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        imageUrl = await uploadImage();
      }

      if (!imageUrl) {
        toast.error('Imagem é obrigatória');
        return;
      }

      const adData = {
        ...formData,
        imageUrl,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        createdBy: user.uid,
      };

      if (editingAd) {
        await updateAd(editingAd.id, adData);
        toast.success('Anúncio atualizado com sucesso!');
      } else {
        await createAd(adData as any);
        toast.success('Anúncio criado com sucesso!');
      }

      resetForm();
      loadAds();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Erro ao salvar anúncio');
    }
  };

  const handleEdit = (ad: SponsoredAd) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || '',
      placement: ad.placement,
      itemId: ad.itemId || '',
      priority: ad.priority,
      startDate: ad.startDate instanceof Date ? ad.startDate.toISOString().split('T')[0] : '',
      endDate: ad.endDate instanceof Date ? ad.endDate.toISOString().split('T')[0] : '',
      isActive: ad.isActive,
    });
    setImagePreview(ad.imageUrl);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;

    try {
      await deleteAd(id);
      toast.success('Anúncio excluído com sucesso!');
      loadAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Erro ao excluir anúncio');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      placement: 'home_list',
      itemId: '',
      priority: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
    });
    setEditingAd(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview('');
  };

  const diagnoseAd = (ad: SponsoredAd) => {
    const now = new Date();
    const issues: string[] = [];
    const info: string[] = [];

    info.push(`📋 Título: ${ad.title}`);
    info.push(`📍 Posicionamento: ${getPlacementLabel(ad.placement)}`);
    info.push(`🔧 Prioridade: ${ad.priority}`);
    info.push(`📅 Data de início: ${ad.startDate instanceof Date ? ad.startDate.toLocaleString('pt-BR') : ad.startDate}`);
    info.push(`📅 Data de término: ${ad.endDate ? (ad.endDate instanceof Date ? ad.endDate.toLocaleString('pt-BR') : ad.endDate) : 'Sem data de término'}`);
    info.push(`⏰ Data/Hora atual: ${now.toLocaleString('pt-BR')}`);

    if (!ad.isActive) {
      issues.push('❌ Anúncio está INATIVO');
    } else {
      info.push('✅ Anúncio está ATIVO');
    }

    if (ad.startDate > now) {
      issues.push(`❌ Data de início está no FUTURO (${ad.startDate instanceof Date ? ad.startDate.toLocaleString('pt-BR') : ad.startDate})`);
    } else {
      info.push('✅ Data de início válida');
    }

    if (ad.endDate && ad.endDate < now) {
      issues.push(`❌ Data de término está no PASSADO (expirado em ${ad.endDate instanceof Date ? ad.endDate.toLocaleString('pt-BR') : ad.endDate})`);
    } else if (ad.endDate) {
      info.push('✅ Data de término válida');
    } else {
      info.push('✅ Sem data de término (válido indefinidamente)');
    }

    const message = [...info, '', issues.length > 0 ? '⚠️ PROBLEMAS ENCONTRADOS:' : '✅ TUDO OK! O anúncio deveria estar aparecendo.', ...issues].join('\n');

    alert(message);
    console.log('🔍 DIAGNÓSTICO DO ANÚNCIO:', ad.id, '\n', message);
  };

  const getPlacementLabel = (placement: PlacementType) => {
    const labels = {
      home_list: 'Lista da Home',
      item_detail: 'Detalhes do Item',
      category_story: 'Story de Categoria',
      featured_banner: 'Banner em Destaque',
    };
    return labels[placement];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Anúncios Patrocinados</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Novo Anúncio</span>
        </button>
      </div>

      {/* Help Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">ℹ️</span>
          Onde os anúncios aparecem?
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            <strong>⭐ Banner em Destaque:</strong> Fixo no topo da home, sempre visível (recomendado!)
          </li>
          <li>
            <strong>📋 Lista da Home:</strong> Card aparece a cada 6 itens na lista de resultados
          </li>
          <li>
            <strong>⭕ Story de Categoria:</strong> Aparece como story no carrossel de categorias
          </li>
          <li>
            <strong>📄 Detalhes do Item:</strong> Até 3 anúncios ao final da página de detalhes
          </li>
        </ul>
        <p className="text-xs text-blue-700 mt-3">
          💡 <strong>Dica:</strong> Use "Banner em Destaque" para garantir que seu anúncio sempre apareça!
        </p>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">
            {editingAd ? 'Editar Anúncio' : 'Novo Anúncio'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Deixe vazio se a imagem já contém texto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posicionamento *
                </label>
                <select
                  value={formData.placement}
                  onChange={(e) => setFormData({ ...formData, placement: e.target.value as PlacementType })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="featured_banner">⭐ Banner em Destaque (FIXO no topo)</option>
                  <option value="home_list">📋 Lista da Home (a cada 6 itens)</option>
                  <option value="item_detail">📄 Detalhes do Item (ao final da página)</option>
                  <option value="category_story">⭕ Story de Categoria (carrossel no topo)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.placement === 'featured_banner' && '⭐ Banner grande e fixo sempre visível no topo da home (RECOMENDADO)'}
                  {formData.placement === 'home_list' && 'Card destacado que aparece misturado na lista de resultados'}
                  {formData.placement === 'item_detail' && 'Até 3 anúncios na seção "Relacionados" ao final dos detalhes'}
                  {formData.placement === 'category_story' && 'Visual tipo Instagram Story entre as categorias'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Deixe vazio se a imagem já contém toda a informação"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem do Anúncio *
              </label>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors bg-gray-50">
                      <Upload size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {imageFile ? imageFile.name : 'Escolher imagem do dispositivo'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setFormData({ ...formData, imageUrl: '' });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="text-center text-sm text-gray-500">
                  <span>ou</span>
                </div>

                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    if (e.target.value) {
                      setImagePreview(e.target.value);
                      setImageFile(null);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Cole a URL de uma imagem"
                />

                <p className="text-xs text-gray-500">
                  Tamanho máximo: 5MB. Formatos: JPG, PNG, GIF
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link de Destino
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do Item (interno)
                </label>
                <input
                  type="text"
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="ID do item do marketplace"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quanto maior o número, mais prioridade (ex: 10 aparece antes que 5). Deixe 0 para ordem normal.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Término
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Anúncio Ativo
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Enviando...
                  </>
                ) : (
                  <>{editingAd ? 'Atualizar' : 'Criar'} Anúncio</>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={uploading}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{ad.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ad.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {ad.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getPlacementLabel(ad.placement)}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{ad.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Eye size={16} />
                    <span>{ad.viewCount} visualizações</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MousePointer size={16} />
                    <span>{ad.clickCount} cliques</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>
                      {ad.startDate instanceof Date ? ad.startDate.toLocaleDateString('pt-BR') : ''}
                      {ad.endDate && ` - ${ad.endDate instanceof Date ? ad.endDate.toLocaleDateString('pt-BR') : ''}`}
                    </span>
                  </div>
                  {ad.linkUrl && (
                    <a
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink size={16} />
                      <span>Ver link</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => diagnoseAd(ad)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Diagnosticar problemas"
                >
                  <Bug size={20} />
                </button>
                <button
                  onClick={() => handleEdit(ad)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-40 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Imagem+Indisponível';
                }}
              />
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">Nenhum anúncio cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsoredAdManager;
