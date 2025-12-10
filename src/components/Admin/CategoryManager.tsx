import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Category } from '../../types';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryIcon
} from '../../services/categoryService';
import toast from 'react-hot-toast';

interface CategoryFormData {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
  iconFile?: File;
  color: string;
  active: boolean;
  iconSize: number;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    id: '',
    name: '',
    nameEn: '',
    icon: 'Circle',
    color: '#6366F1',
    active: true,
    iconSize: 24
  });
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [searchIcon, setSearchIcon] = useState('');

  const availableIcons = Object.keys(LucideIcons).filter(
    key => typeof (LucideIcons as any)[key] === 'function' &&
    key !== 'createLucideIcon' &&
    key.toLowerCase().includes(searchIcon.toLowerCase())
  ).slice(0, 50);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        id: category.id,
        name: category.name,
        nameEn: category.nameEn,
        icon: category.icon,
        color: category.color,
        active: category.active,
        iconSize: category.iconSize || 24
      });
      if (category.iconUrl) {
        setIconPreview(category.iconUrl);
      }
    } else {
      setEditingCategory(null);
      setFormData({
        id: '',
        name: '',
        nameEn: '',
        icon: 'Circle',
        color: '#6366F1',
        active: true,
        iconSize: 24
      });
      setIconPreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      id: '',
      name: '',
      nameEn: '',
      icon: 'Circle',
      color: '#6366F1',
      active: true,
      iconSize: 24
    });
    setIconPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 2MB');
        return;
      }

      setFormData({ ...formData, iconFile: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.nameEn || !formData.id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      let iconUrl = editingCategory?.iconUrl;

      if (formData.iconFile) {
        console.log('Uploading icon file...', formData.iconFile);
        try {
          const uploadedUrl = await uploadCategoryIcon(formData.iconFile);
          iconUrl = uploadedUrl;
          console.log('Icon uploaded successfully:', uploadedUrl);
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          toast.error('Erro ao fazer upload do ícone: ' + (uploadError.message || 'Erro desconhecido'));
          return;
        }
      }

      const categoryData: any = {
        id: formData.id,
        name: formData.name,
        nameEn: formData.nameEn,
        icon: formData.icon,
        iconUrl: iconUrl,
        color: formData.color,
        active: formData.active,
        iconSize: formData.iconSize
      };

      console.log('Saving category:', categoryData);

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await createCategory(categoryData);
        toast.success('Categoria criada com sucesso!');
      }

      handleCloseModal();
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      const errorMessage = error.message || error.error_description || error.hint || 'Erro ao salvar categoria';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success('Categoria excluída com sucesso!');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const renderIcon = (category: Category, size: number = 24) => {
    if (category.iconUrl) {
      return (
        <img
          src={category.iconUrl}
          alt={category.name}
          className="w-6 h-6 object-contain"
        />
      );
    }

    if (category.icon) {
      const IconComponent = (LucideIcons as any)[category.icon];
      if (IconComponent) {
        return <IconComponent size={size} />;
      }
    }

    return <LucideIcons.Circle size={size} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="rounded-full p-3"
                style={{ backgroundColor: category.color + '20' }}
              >
                <div style={{ color: category.color }}>
                  {renderIcon(category)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{category.nameEn}</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  category.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {category.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da Categoria *
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    disabled={!!editingCategory}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="ex: restaurante"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome (PT) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Restaurante"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome (EN) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Restaurant"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="#6366F1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone Personalizado (Imagem)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Upload size={20} />
                    <span>Fazer Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {iconPreview && (
                    <div className="relative">
                      <img
                        src={iconPreview}
                        alt="Preview"
                        className="w-12 h-12 object-contain border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIconPreview(null);
                          setFormData({ ...formData, iconFile: undefined });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG ou SVG. Máximo 2MB. Recomendado: 128x128px
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamanho do Ícone (16-48 pixels)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={formData.iconSize}
                    onChange={(e) => setFormData({ ...formData, iconSize: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="16"
                    max="48"
                    value={formData.iconSize}
                    onChange={(e) => setFormData({ ...formData, iconSize: parseInt(e.target.value) || 24 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">px</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ajuste o tamanho do ícone dentro do círculo colorido
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou escolha um ícone Lucide
                </label>
                <input
                  type="text"
                  value={searchIcon}
                  onChange={(e) => setSearchIcon(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {availableIcons.map((iconName) => {
                    const IconComponent = (LucideIcons as any)[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, icon: iconName });
                          setIconPreview(null);
                        }}
                        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                          formData.icon === iconName ? 'bg-pink-100 ring-2 ring-pink-500' : ''
                        }`}
                        title={iconName}
                      >
                        <IconComponent size={20} />
                      </button>
                    );
                  })}
                </div>
                {formData.icon && !iconPreview && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-600" />
                    Ícone selecionado: {formData.icon}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Categoria Ativa
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  {editingCategory ? 'Atualizar' : 'Criar'} Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
