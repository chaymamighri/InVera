import React, { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ProduitFormBase from './ProduitFormBase';
import toast from 'react-hot-toast';

const EditProduitForm = ({ produit, categories, onClose, onSave, userRole }) => {

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
  
  const isRemiseDisabled = userRole === 'RESPONSABLE_ACHAT';
  
  // ✅ DEBUG : Voir les catégories reçues
  useEffect(() => {
    console.log('📁 Catégories reçues dans EditProduitForm:', categories);
    console.log('📦 Produit à modifier:', produit);
  }, [categories, produit]);
    
  // ✅ CORRECTION : Initialiser avec les données du produit
  useEffect(() => {
    if (produit) {
      // ✅ Récupérer l'ID de la catégorie du produit
      let categorieId = null;
      
      // Essayer différentes sources
      if (produit.categorieId) {
        categorieId = produit.categorieId;
      } else if (produit.idCategorie) {
        categorieId = produit.idCategorie;
      } else if (produit.categorie?.idCategorie) {
        categorieId = produit.categorie.idCategorie;
      } else if (produit.categorie && typeof produit.categorie === 'number') {
        categorieId = produit.categorie;
      }
      
      // ✅ Trouver la catégorie correspondante dans la liste
      let selectedCategorie = { idCategorie: '' };
      if (categorieId && categories && categories.length > 0) {
        const found = categories.find(c => 
          (c.idCategorie === categorieId) || (c.id === categorieId)
        );
        if (found) {
          selectedCategorie = found;
        } else {
          selectedCategorie = { idCategorie: categorieId };
        }
      }
      
      console.log('🔍 Catégorie sélectionnée:', {
        categorieId: categorieId,
        selectedCategorie: selectedCategorie,
        nomCategorie: selectedCategorie?.nomCategorie || selectedCategorie?.nom
      });
      
      setFormData({
        libelle: produit.libelle || '',
        prixVente: produit.prixVente?.toString() || '',
        prixAchat: produit.prixAchat?.toString() || '',
        categorie: selectedCategorie,
        quantiteStock: produit.quantiteStock || 0,
        seuilMinimum: produit.seuilMinimum || 10,
        uniteMesure: produit.uniteMesure || 'pièce',
        imageUrl: produit.imageUrl || '',
        imageFile: null, 
        remiseTemporaire: produit.remiseTemporaire?.toString() || '',
        active: produit.active ?? true
      });
      
      if (produit.imageUrl) {
        const imageUrl = produit.imageUrl.startsWith('http') 
          ? produit.imageUrl 
          : `http://localhost:8081/${produit.imageUrl.replace(/^\/+/, '')}`;
        setImagePreview(imageUrl);
      }
    }
  }, [produit, categories]);

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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'quantiteStock') {
      return;
    }
    
    if (name === 'prixVente' || name === 'prixAchat' || name === 'remiseTemporaire') {
      const normalizedValue = value.replace(',', '.');
      if (normalizedValue === '' || /^\d*\.?\d*$/.test(normalizedValue)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

  // ✅ CORRECTION : Gérer correctement le changement de catégorie
  const handleCategorieChange = (e) => {
    const categorieId = parseInt(e.target.value);
    // ✅ Trouver la catégorie complète
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
      
      // ✅ Envoyer correctement l'ID de la catégorie
      const categorieId = formData.categorie?.idCategorie;
      formDataToSend.append('categorieId', String(categorieId || ''));
      
      formDataToSend.append('seuilMinimum', String(parseInt(formData.seuilMinimum) || 0));
      formDataToSend.append('uniteMesure', String(formData.uniteMesure || 'pièce'));
      
      const remise = parseFloat(String(formData.remiseTemporaire).replace(',', '.')) || 0;
      formDataToSend.append('remiseTemporaire', String(remise));
      formDataToSend.append('active', formData.active ? 'true' : 'false');
      
      if (formData.imageFile && formData.imageFile instanceof File) {
        formDataToSend.append('image', formData.imageFile);
      }

      const productId = produit.idProduit || produit.id;
      
      if (!productId) {
        console.error('❌ ID du produit manquant:', produit);
        toast.error('Erreur: ID du produit manquant');
        return;
      }
      
      console.log('📤 Envoi mise à jour - ID:', productId);
      console.log('📤 Catégorie envoyée:', categorieId);
      
      await onSave(productId, formDataToSend);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Une erreur inattendue est survenue');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          
          <div className="sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="text-lg font-semibold text-white">
                Modifier le produit
              </h3>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Gestion du stock</p>
                  <p className="text-xs text-blue-700">
                    Le stock est géré automatiquement par les réceptions de commande et les ventes.
                    Pour modifier le stock, créez une commande fournisseur ou enregistrez une vente.
                  </p>
                </div>
              </div>
            </div>

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
              stockDisabled={true}  
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduitForm;