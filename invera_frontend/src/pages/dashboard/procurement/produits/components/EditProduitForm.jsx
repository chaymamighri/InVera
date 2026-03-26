// produits/EditProduitForm.jsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ProduitFormBase from './ProduitFormBase';
import ProductMovementsTab from './ProductMovementsTab'; 

const EditProduitForm = ({ produit, categories, onClose, onSave, userRole }) => {
  const [activeTab, setActiveTab] = useState('info'); // 'info' ou 'movements'
  const [formData, setFormData] = useState({
    libelle: '',
    prixVente: '',
    prixAchat: '',
    categorie: { idCategorie: '' },
    quantiteStock: 0,
    seuilMinimum: 10,
    uniteMesure: 'pièce',
    imageUrl: '',
    imageFile: null,  
    remiseTemporaire: '',
    active: true
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null); 
  
  // ✅ Logique pour désactiver la remise 
  const isRemiseDisabled = userRole === 'RESPONSABLE_ACHAT';
    
  // Initialiser avec les données du produit
  useEffect(() => {
    if (produit) {
      setFormData({
        libelle: produit.libelle || '',
        prixVente: produit.prixVente?.toString() || '',
        prixAchat: produit.prixAchat?.toString() || '',
        categorie: produit.categorie || { idCategorie: '' },
        quantiteStock: produit.quantiteStock || 0,
        seuilMinimum: produit.seuilMinimum || 10,
        uniteMesure: produit.uniteMesure || 'pièce',
        imageUrl: produit.imageUrl || '',
        imageFile: null, 
        remiseTemporaire: produit.remiseTemporaire?.toString() || '',
        active: produit.active ?? true
      });
      
      // Si une image existe déjà, créer un aperçu
      if (produit.imageUrl) {
        const imageUrl = produit.imageUrl.startsWith('http') 
          ? produit.imageUrl 
          : `http://localhost:8081/${produit.imageUrl.replace(/^\/+/, '')}`;
        setImagePreview(imageUrl);
      }
    }
  }, [produit]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';
    
    const prixVente = parseFloat(formData.prixVente.replace(',', '.'));
    const prixAchat = parseFloat(formData.prixAchat.replace(',', '.'));
    
    if (!formData.prixVente || isNaN(prixVente) || prixVente <= 0) {
      newErrors.prixVente = 'Le prix de vente doit être supérieur à 0';
    }
    
    if (!formData.prixAchat || isNaN(prixAchat) || prixAchat <= 0) {
      newErrors.prixAchat = "Le prix d'achat doit être supérieur à 0";
    }
    
    if (!formData.categorie?.idCategorie) newErrors.categorie = 'La catégorie est requise';
    if (formData.quantiteStock < 0) newErrors.quantiteStock = 'La quantité ne peut pas être négative';
    if (formData.seuilMinimum < 0) newErrors.seuilMinimum = 'Le seuil minimum doit être positif';
    if (!formData.uniteMesure.trim()) newErrors.uniteMesure = "L'unité de mesure est requise";
    
    if (formData.remiseTemporaire) {
      const remise = parseFloat(formData.remiseTemporaire.replace(',', '.'));
      if (isNaN(remise) || remise < 0 || remise > 100) {
        newErrors.remiseTemporaire = 'La remise doit être entre 0 et 100';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion du changement avec support des décimales
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'prixVente' || name === 'prixAchat' || name === 'remiseTemporaire') {
      const normalizedValue = value.replace(',', '.');
      if (normalizedValue === '' || /^\d*\.?\d*$/.test(normalizedValue)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, imageUrl: 'Format non supporté' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, imageUrl: 'Image trop volumineuse (max 5MB)' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imageUrl: '' 
      }));
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imageUrl: ''
    }));
    setImagePreview(null);
    const input = document.getElementById('image-upload');
    if (input) input.value = '';
  };

  const handleCategorieChange = (e) => {
    const categorieId = parseInt(e.target.value);
    const selectedCategorie = categories.find(c => c.idCategorie === categorieId);
    setFormData(prev => ({
      ...prev,
      categorie: selectedCategorie || { idCategorie: categorieId }
    }));
    if (errors.categorie) {
      setErrors(prev => ({ ...prev, categorie: null }));
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      
      if (!formData) {
        console.error('❌ formData est null');
        return;
      }
      
      let isValid = false;
      try {
        isValid = validateForm();
        console.log('🚦 Validation:', isValid);
      } catch (validationError) {
        console.error('❌ Erreur validation:', validationError);
        toast.error('Erreur de validation');
        return;
      }
      
      if (!isValid) return;
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('libelle', String(formData.libelle || ''));
      
      const prixVente = parseFloat(String(formData.prixVente).replace(',', '.')) || 0;
      formDataToSend.append('prixVente', prixVente);
      
      const prixAchat = parseFloat(String(formData.prixAchat).replace(',', '.')) || 0;
      formDataToSend.append('prixAchat', prixAchat);
      
      formDataToSend.append('categorieId', String(formData.categorie?.idCategorie || ''));
      formDataToSend.append('quantiteStock', String(parseInt(formData.quantiteStock) || 0));
      formDataToSend.append('seuilMinimum', String(parseInt(formData.seuilMinimum) || 0));
      formDataToSend.append('uniteMesure', String(formData.uniteMesure || 'pièce'));
      
      const remise = parseFloat(String(formData.remiseTemporaire).replace(',', '.')) || 0;
      formDataToSend.append('remiseTemporaire', String(remise));
      formDataToSend.append('active', formData.active ? 'true' : 'false');
      
      if (formData.imageFile && formData.imageFile instanceof File) {
        formDataToSend.append('image', formData.imageFile);
      }

      await onSave(produit.id, formDataToSend);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Une erreur inattendue est survenue');
      e?.preventDefault?.();
      e?.stopPropagation?.();
    }
  };

  // ✅ Fermer le modal si on change d'onglet depuis les mouvements (optionnel)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          
          {/* En-tête avec onglets */}
          <div className="sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="text-lg font-semibold text-white">
                Modifier le produit
              </h3>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* ✅ ONGLETS */}
            <div className="flex border-b bg-white">
              <button
                onClick={() => handleTabChange('info')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Informations
              </button>
              <button
                onClick={() => handleTabChange('movements')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'movements'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mouvements de stock
              </button>
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="p-6">
            {activeTab === 'info' && (
              <ProduitFormBase
                formData={formData}
                errors={errors}
                categories={categories}
                handleChange={handleChange}
                handleImageChange={handleImageChange}    
                handleRemoveImage={handleRemoveImage}   
                imagePreview={imagePreview}  
                handleCategorieChange={handleCategorieChange}
                isRemiseDisabled={isRemiseDisabled}
                handleSubmit={handleSubmit}
                onClose={onClose}
                isEditMode={true}
                title="Modifier le produit"
              />
            )}

            {activeTab === 'movements' && (
              <ProductMovementsTab productId={produit?.id || produit?.idProduit} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduitForm;