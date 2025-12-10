import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Upload, Clock, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getItem, updateItem, uploadItemImages } from '../services/itemService';
import { getCategories } from '../services/categoryService';
import { Category, Schedule, Item } from '../types';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';
import toast from 'react-hot-toast';

const EditItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number; lng: number} | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categories: [] as string[],
    type: 'service' as 'service' | 'location',
    address: '',
    phone: '',
    whatsapp: '',
    website: '',
    averagePrice: ''
  });
  
  const [schedule, setSchedule] = useState<Schedule>({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: true }
  });
  
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      navigate('/');
      return;
    }

    if (!id) {
      navigate('/perfil');
      return;
    }

    loadItemData();
    loadCategories();
    loadGoogleMaps();
  }, [user, navigate, id]);

  const loadItemData = async () => {
    if (!id) return;

    try {
      const itemData = await getItem(id);
      
      if (!itemData) {
        toast.error('Item não encontrado');
        navigate('/perfil');
        return;
      }

      // Check if user owns this item or is admin
      if (itemData.ownerId !== user?.uid && !isAdmin) {
        toast.error('Você não tem permissão para editar este item');
        navigate('/perfil');
        return;
      }

      setItem(itemData);
      setFormData({
        name: itemData.name,
        description: itemData.description,
        categories: itemData.categories,
        type: itemData.type,
        address: itemData.address,
        phone: itemData.phone || '',
        whatsapp: itemData.whatsapp || '',
        website: itemData.website || '',
        averagePrice: itemData.averagePrice || ''
      });
      setSchedule(itemData.schedule);
      setSelectedCoordinates(itemData.coordinates);
    } catch (error) {
      console.error('Error loading item:', error);
      toast.error('Erro ao carregar item');
      navigate('/perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const loadGoogleMaps = async () => {
    try {
      if (!GOOGLE_MAPS_CONFIG.apiKey) {
        console.warn('Google Maps API key missing, skipping map initialization');
        setMapLoaded(false);
        return;
      }
      
      const loader = new Loader(GOOGLE_MAPS_CONFIG);

      await loader.load();
      setMapLoaded(true);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setMapLoaded(false);
    }
  };

  useEffect(() => {
    if (mapLoaded && selectedCoordinates) {
      initializeMap();
    }
  }, [mapLoaded, selectedCoordinates]);

  const initializeMap = () => {
    const mapElement = document.getElementById('editItemMap');
    const addressInput = document.getElementById('editAddressInput') as HTMLInputElement;
    if (!mapElement || !selectedCoordinates || !addressInput) return;

    const map = new google.maps.Map(mapElement, {
      center: selectedCoordinates,
      zoom: 15
    });

    // Add existing marker
    const marker = new google.maps.Marker({
      position: selectedCoordinates,
      map: map,
      title: 'Localização atual'
    });

    // Initialize autocomplete
    const autocompleteInstance = new google.maps.places.Autocomplete(addressInput, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'us' }
    });

    setAutocomplete(autocompleteInstance);

    // Handle autocomplete selection
    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setSelectedCoordinates({ lat, lng });
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || place.name || ''
        }));

        // Update map center and marker position
        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
      }
    });

    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        setSelectedCoordinates({ lat, lng });
        
        // Update marker position
        marker.setPosition({ lat, lng });
        
        // Reverse geocoding to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setFormData(prev => ({
              ...prev,
              address: results[0].formatted_address
            }));
          }
        });
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleScheduleChange = (day: keyof Schedule, field: string, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSetMainImage = (selectedIndex: number) => {
    if (!item || selectedIndex === 0) return;
    
    // Reorder images array to put selected image first
    const newImages = [...item.images];
    const selectedImage = newImages[selectedIndex];
    newImages.splice(selectedIndex, 1);
    newImages.unshift(selectedImage);
    
    // Update item state
    setItem(prev => prev ? { ...prev, images: newImages } : null);
  };

  const handleNewImageSelection = (files: FileList | null) => {
    setSelectedImages(files);
    
    if (files) {
      const urls: string[] = [];
      Array.from(files).forEach((file, index) => {
        if (index < 5) {
          const url = URL.createObjectURL(file);
          urls.push(url);
        }
      });
      setNewImagePreviewUrls(urls);
    } else {
      setNewImagePreviewUrls([]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    if (!selectedImages) return;
    
    const filesArray = Array.from(selectedImages);
    filesArray.splice(index, 1);
    
    const dt = new DataTransfer();
    filesArray.forEach(file => dt.items.add(file));
    setSelectedImages(dt.files.length > 0 ? dt.files : null);
    
    const newUrls = [...newImagePreviewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setNewImagePreviewUrls(newUrls);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      newImagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoordinates) {
      toast.error('Selecione uma localização no mapa');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Selecione pelo menos uma categoria');
      return;
    }

    setSaving(true);

    try {
      let updatedImageUrls = item?.images || [];

      // Upload new images if any
      if (selectedImages && selectedImages.length > 0) {
        const newImageUrls = await uploadItemImages(selectedImages, id!);
        updatedImageUrls = [...updatedImageUrls, ...newImageUrls];
      }

      // Update item
      await updateItem(id!, {
        ...formData,
        coordinates: selectedCoordinates,
        schedule,
        images: updatedImageUrls
      });

      toast.success('Item atualizado com sucesso!');
      navigate('/perfil');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando item...</p>
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
            onClick={() => navigate('/perfil')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            Voltar ao perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/perfil')}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Voltar ao perfil</span>
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-6">Editar Item</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="service">Serviço</option>
                  <option value="location">Local</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categorias * (selecione pelo menos uma)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      formData.categories.includes(category.id)
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-medium">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização * (digite o endereço ou clique no mapa)
              </label>
              <div className="space-y-4">
                <input
                  id="editAddressInput"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Digite o endereço ou nome do local..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                
                <div 
                  id="editItemMap" 
                  className="w-full h-64 rounded-lg border border-gray-300"
                />
                
                {selectedCoordinates && (
                  <p className="text-sm text-green-600 flex items-center">
                    <MapPin size={16} className="mr-1" />
                    Localização: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="(123) 456-7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 (123) 456-7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://exemplo.com"
                />
              </div>
            </div>

            {/* Current Images */}
            {item.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagens Atuais (clique para definir como principal)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                  {item.images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer group ${
                        index === 0 ? 'ring-4 ring-green-500' : 'hover:ring-2 hover:ring-green-300'
                      } rounded-lg transition-all`}
                      onClick={() => handleSetMainImage(index)}
                    >
                      <img
                        src={image}
                        alt={`${item.name} - ${index + 1}`}
                        className="profile-image app-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg';
                        }}
                      />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                          PRINCIPAL
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                          {index === 0 ? 'Foto Principal' : 'Definir como Principal'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  A primeira imagem é exibida como foto principal nos cards e previews.
                </p>
              </div>
            )}

            {/* Add New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicionar Novas Imagens
              </label>
              
              {newImagePreviewUrls.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600 mb-2">Clique para adicionar mais imagens</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleNewImageSelection(e.target.files)}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Selecionar Imagens
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">
                      Novas Imagens ({newImagePreviewUrls.length})
                    </h4>
                    <label
                      htmlFor="imageUploadMore"
                      className="text-green-600 hover:text-green-700 text-sm font-medium cursor-pointer"
                    >
                      + Adicionar mais
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && selectedImages) {
                          const dt = new DataTransfer();
                          Array.from(selectedImages).forEach(file => dt.items.add(file));
                          Array.from(e.target.files).forEach(file => dt.items.add(file));
                          handleNewImageSelection(dt.files);
                        } else if (e.target.files) {
                          handleNewImageSelection(e.target.files);
                        }
                      }}
                      className="hidden"
                      id="imageUploadMore"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newImagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Nova imagem ${index + 1}`}
                          className="profile-image app-image"
                        />
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                          NOVA
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    💡 Estas imagens serão adicionadas ao final da galeria atual.
                  </p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Horários de Funcionamento
              </label>
              <div className="space-y-3">
                {Object.entries(schedule).map(([day, daySchedule]) => (
                  <div key={day} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-24">
                      <span className="font-medium capitalize">{day}</span>
                    </div>
                    
                    <input
                      type="checkbox"
                      checked={!daySchedule.closed}
                      onChange={(e) => handleScheduleChange(day as keyof Schedule, 'closed', !e.target.checked)}
                      className="mr-2"
                    />
                    
                    {!daySchedule.closed && (
                      <>
                        <input
                          type="time"
                          value={daySchedule.open}
                          onChange={(e) => handleScheduleChange(day as keyof Schedule, 'open', e.target.value)}
                          className="p-2 border border-gray-300 rounded"
                        />
                        <span>até</span>
                        <input
                          type="time"
                          value={daySchedule.close}
                          onChange={(e) => handleScheduleChange(day as keyof Schedule, 'close', e.target.value)}
                          className="p-2 border border-gray-300 rounded"
                        />
                      </>
                    )}
                    
                    {daySchedule.closed && (
                      <span className="text-red-600">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Average Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço Médio (opcional)
              </label>
              <input
                type="text"
                value={formData.averagePrice}
                onChange={(e) => handleInputChange('averagePrice', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: $50-100, A partir de $30"
              />
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving || !selectedCoordinates}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditItem;