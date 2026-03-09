import React, { useState } from 'react';
import ProduitFormBase from './ProduitFormBase';

const CreateProduitForm = ({ categories, onClose, onSave, userRole }) => {
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
    remiseTemporaire: 0,
    active: true
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const isRemiseDisabled = userRole === 'RESPONSABLE_ACHAT';

  // FONCTION : validateForm
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';
    
    // ✅ Prix avec décimales 
    const prixVente = parseFloat(formData.prixVente);
    const prixAchat = parseFloat(formData.prixAchat);
    
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
    
    // ✅ Remise avec décimales
    const remise = parseFloat(formData.remiseTemporaire);
    if (isNaN(remise) || remise < 0 || remise > 100) {
      newErrors.remiseTemporaire = 'La remise doit être entre 0 et 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FONCTION  handleChange 
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
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

  // FONCTION: handleCategorieChange
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

  // Fonction pour l'upload d'image
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

  // Fonction pour supprimer l'image
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imageUrl: ''
    }));
    setImagePreview(null);
    document.getElementById('image-upload').value = '';
  };

  // Fonction de soumission - Convertir en nombres avant d'envoyer
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const formDataToSend = new FormData();
      formDataToSend.append('libelle', formData.libelle);
      
      // ✅ Convertir en nombres avec décimales
      formDataToSend.append('prixVente', parseFloat(formData.prixVente));
      formDataToSend.append('prixAchat', parseFloat(formData.prixAchat));
      formDataToSend.append('categorieId', formData.categorie.idCategorie);
      formDataToSend.append('quantiteStock', parseInt(formData.quantiteStock) || 0);
      formDataToSend.append('seuilMinimum', parseInt(formData.seuilMinimum) || 0);
      formDataToSend.append('uniteMesure', formData.uniteMesure);
      formDataToSend.append('remiseTemporaire', parseFloat(formData.remiseTemporaire) || 0);
      formDataToSend.append('active', formData.active);
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }
      
      onSave(formDataToSend);
    }
  };

  return (
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
      isEditMode={false}
      title="Nouveau produit"
    />
  );
};

export default CreateProduitForm;