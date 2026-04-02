// produits/CreateProduitForm.jsx - Version avec stock désactivé
import React, { useState, useEffect } from 'react';
import ProduitFormBase from './ProduitFormBase';

const CreateProduitForm = ({ categories = [], onClose, onSave, userRole }) => {
  const [formData, setFormData] = useState({
    libelle: '',
    prixVente: '',
    prixAchat: '',
    categorie: { idCategorie: '' },
    quantiteStock: 0,  // Valeur par défaut, mais le champ sera désactivé
    seuilMinimum: 10,
    uniteMesure: 'pièce',
    imageUrl: '',
    imageFile: null,  
    remiseTemporaire: 0,
    active: true
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const isRemiseDisabled = userRole === 'RESPONSABLE_ACHAT';
  const isStockDisabled = true; // ✅ Désactiver le champ stock pour la création

  // ✅ Vérifier que categories est un tableau
  const safeCategories = Array.isArray(categories) ? categories : [];

  // ✅ DEBUG : Voir les catégories reçues
  useEffect(() => {
    console.log('📁 Catégories reçues dans CreateProduitForm:', safeCategories);
    console.log('📁 Nombre de catégories:', safeCategories.length);
  }, [safeCategories]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';
    
    const prixVente = parseFloat(formData.prixVente);
    const prixAchat = parseFloat(formData.prixAchat);
    
    if (!formData.prixVente || isNaN(prixVente) || prixVente <= 0) {
      newErrors.prixVente = 'Le prix de vente doit être supérieur à 0';
    }
    
    if (!formData.prixAchat || isNaN(prixAchat) || prixAchat <= 0) {
      newErrors.prixAchat = "Le prix d'achat doit être supérieur à 0";
    }
    
    if (!formData.categorie?.idCategorie) newErrors.categorie = 'La catégorie est requise';
    
    // ✅ Supprimer la validation de quantiteStock puisqu'il est désactivé
    // if (formData.quantiteStock < 0) newErrors.quantiteStock = 'La quantité ne peut pas être négative';
    
    if (formData.seuilMinimum < 0) newErrors.seuilMinimum = 'Le seuil minimum doit être positif';
    if (!formData.uniteMesure.trim()) newErrors.uniteMesure = "L'unité de mesure est requise";
    
    const remise = parseFloat(formData.remiseTemporaire);
    if (isNaN(remise) || remise < 0 || remise > 100) {
      newErrors.remiseTemporaire = 'La remise doit être entre 0 et 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // ✅ Empêcher la modification du stock si c'est le champ désactivé
    if (name === 'quantiteStock' && isStockDisabled) {
      return;
    }
    
    if (type === 'number') {
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

  // ✅ CORRECTION : Gérer le changement de catégorie avec sécurité
  const handleCategorieChange = (e) => {
    const categorieId = parseInt(e.target.value);
    // ✅ Utiliser safeCategories au lieu de categories
    const selectedCategorie = safeCategories.find(c => c.idCategorie === categorieId);
    setFormData(prev => ({
      ...prev,
      categorie: selectedCategorie || { idCategorie: categorieId }
    }));
    if (errors.categorie) {
      setErrors(prev => ({ ...prev, categorie: null }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const formDataToSend = new FormData();
      formDataToSend.append('libelle', formData.libelle);
      formDataToSend.append('prixVente', parseFloat(formData.prixVente));
      formDataToSend.append('prixAchat', parseFloat(formData.prixAchat));
      formDataToSend.append('categorieId', formData.categorie.idCategorie);
      // ✅ Toujours envoyer 0 pour le stock initial lors de la création
      formDataToSend.append('quantiteStock', 0);
      formDataToSend.append('seuilMinimum', parseInt(formData.seuilMinimum) || 0);
      formDataToSend.append('uniteMesure', formData.uniteMesure);
      formDataToSend.append('remiseTemporaire', parseFloat(formData.remiseTemporaire) || 0);
      formDataToSend.append('active', formData.active);
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }
      
      console.log('📤 Création produit - Catégorie ID:', formData.categorie.idCategorie);
      console.log('📤 Stock initial forcé à 0');
      onSave(formDataToSend);
    }
  };

  return (
    <ProduitFormBase
      formData={formData}
      errors={errors}
      categories={safeCategories} 
      handleChange={handleChange}
      handleImageChange={handleImageChange}   
      handleRemoveImage={handleRemoveImage}    
      imagePreview={imagePreview}             
      handleCategorieChange={handleCategorieChange}
      isRemiseDisabled={isRemiseDisabled}
      isStockDisabled={isStockDisabled}  
      handleSubmit={handleSubmit}
      onClose={onClose}
      isEditMode={false}
      title="Nouveau produit"
    />
  );
};

export default CreateProduitForm;