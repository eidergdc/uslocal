import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, Clock, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createItem, uploadItemImages, updateItem } from '../services/itemService';
import { getCategories } from '../services/categoryService';
import { Category, Schedule } from '../types';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps';
import toast from 'react-hot-toast';

const AddItem: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      navigate('/');
      return;
    }

    loadCategories();
    loadGoogleMaps();
  }, [user, navigate]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      console.log('Loaded categories:', categoriesData);
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
      
      const loader = new Loader({
        ...GOOGLE_MAPS_CONFIG
      });

      await loader.load();
      setMapLoaded(true);
      initializeMap();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setMapLoaded(false);
    }
  };

  const initializeMap = () => {
    const mapElement = document.getElementById('addItemMap');
    const addressInput = document.getElementById('addressInput') as HTMLInputElement;
    if (!mapElement || !addressInput) return;

    const map = new google.maps.Map(mapElement, {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 12
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

        // Update map center and add marker
        map.setCenter({ lat, lng });
        map.setZoom(15);
        
        // Clear existing markers and add new one
        new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: place.name || 'Localização selecionada'
        });
      }
    });

    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        setSelectedCoordinates({ lat, lng });
        
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

        // Clear existing markers
        map.getClickableIcons();
        
        // Add new marker
        new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: 'Localização selecionada'
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

  const handleImageSelection = (files: FileList | null) => {
    setSelectedImages(files);
    
    if (files) {
      const urls: string[] = [];
      Array.from(files).forEach((file, index) => {
        if (index < 5) { // Limit to 5 images
          const url = URL.createObjectURL(file);
          urls.push(url);
        }
      });
      setImagePreviewUrls(urls);
    } else {
      setImagePreviewUrls([]);
    }
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    if (!selectedImages) return;
    
    const filesArray = Array.from(selectedImages);
    const [movedFile] = filesArray.splice(fromIndex, 1);
    filesArray.splice(toIndex, 0, movedFile);
    
    // Create new FileList
    const dt = new DataTransfer();
    filesArray.forEach(file => dt.items.add(file));
    setSelectedImages(dt.files);
    
    // Update preview URLs
    const newUrls = [...imagePreviewUrls];
    const [movedUrl] = newUrls.splice(fromIndex, 1);
    newUrls.splice(toIndex, 0, movedUrl);
    setImagePreviewUrls(newUrls);
  };

  const handleRemoveImage = (index: number) => {
    if (!selectedImages) return;
    
    const filesArray = Array.from(selectedImages);
    filesArray.splice(index, 1);
    
    // Create new FileList
    const dt = new DataTransfer();
    filesArray.forEach(file => dt.items.add(file));
    setSelectedImages(dt.files.length > 0 ? dt.files : null);
    
    // Update preview URLs
    const newUrls = [...imagePreviewUrls];
    URL.revokeObjectURL(newUrls[index]); // Clean up memory
    newUrls.splice(index, 1);
    setImagePreviewUrls(newUrls);
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return; // Already main image
    handleReorderImages(index, 0);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) {
      console.log('⚠️ Submit already in progress, ignoring duplicate submission');
      return;
    }

    if (!selectedCoordinates) {
      toast.error('Selecione uma localização no mapa');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Selecione pelo menos uma categoria');
      return;
    }

    setLoading(true);
    console.log('🚀 Starting item creation...');

    try {
      // Create item
      console.log('📝 Creating item in Firestore...');
      const itemId = await createItem({
        ...formData,
        coordinates: selectedCoordinates,
        schedule,
        images: [],
        status: 'pending',
        featured: false,
        verified: false,
        ownerId: user!.uid
      });
      console.log('✅ Item created with ID:', itemId);

      // Upload images if any
      if (selectedImages && selectedImages.length > 0) {
        console.log('📸 Uploading', selectedImages.length, 'images...');
        const imageUrls = await uploadItemImages(selectedImages, itemId);
        console.log('✅ Images uploaded:', imageUrls.length);

        // Update item with image URLs
        console.log('🔄 Updating item with image URLs...');
        await updateItem(itemId, { images: imageUrls });
        console.log('✅ Item updated with images');
      }

      toast.success('Item cadastrado com sucesso! Aguarde aprovação.');
      console.log('✅ Item creation complete, navigating to home...');
      navigate('/');
    } catch (error) {
      console.error('❌ Error creating item:', error);
      toast.error('Erro ao cadastrar item');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Cadastrar Novo Item</h1>

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
                  id="addressInput"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Digite o endereço ou nome do local..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                
                <div 
                  id="addItemMap" 
                  className="w-full h-64 rounded-lg border border-gray-300"
                />
                
                {selectedCoordinates && (
                  <p className="text-sm text-green-600 flex items-center">
                    <MapPin size={16} className="mr-1" />
                    Localização selecionada: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
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

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens (máximo 5)
              </label>
              
              {/* Image Upload Area */}
              {imagePreviewUrls.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600 mb-2">Clique para selecionar imagens</p>
                  <p className="text-sm text-gray-500 mb-3">A primeira imagem será a foto principal</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageSelection(e.target.files)}
                    className="hidden"
                    id="imageUpload"
                    max={5}
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
                  {/* Preview as Card */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Preview do Card (como aparecerá na lista):</h4>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-sm">
                      <div className="relative">
                        <img
                          src={imagePreviewUrls[0]}
                          alt="Preview principal"
                          className="card-image app-image"
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          FOTO PRINCIPAL
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">
                          {formData.name || 'Nome do seu negócio'}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {formData.description || 'Descrição do seu negócio aparecerá aqui...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Image Management */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">
                        Suas Imagens ({imagePreviewUrls.length}/5)
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
                          if (e.target.files) {
                            const currentCount = imagePreviewUrls.length;
                            const newFiles = Array.from(e.target.files).slice(0, 5 - currentCount);
                            
                            if (selectedImages) {
                              const dt = new DataTransfer();
                              Array.from(selectedImages).forEach(file => dt.items.add(file));
                              newFiles.forEach(file => dt.items.add(file));
                              handleImageSelection(dt.files);
                            } else {
                              const dt = new DataTransfer();
                              newFiles.forEach(file => dt.items.add(file));
                              handleImageSelection(dt.files);
                            }
                          }
                        }}
                        className="hidden"
                        id="imageUploadMore"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviewUrls.map((url, index) => (
                        <div
                          key={index}
                          className={`relative group cursor-pointer ${
                            index === 0 ? 'ring-4 ring-green-500' : 'hover:ring-2 hover:ring-green-300'
                          } rounded-lg transition-all`}
                          onClick={() => handleSetMainImage(index)}
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="profile-image app-image"
                          />
                          
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                              PRINCIPAL
                            </div>
                          )}
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium text-center px-2">
                              {index === 0 ? 'Foto Principal' : 'Definir como Principal'}
                            </span>
                          </div>
                          
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-3">
                      💡 <strong>Dica:</strong> Clique em qualquer imagem para torná-la a foto principal. 
                      A foto principal aparece nos cards e previews do seu negócio.
                    </p>
                  </div>
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
                disabled={loading || !selectedCoordinates}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Item'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
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

export default AddItem;