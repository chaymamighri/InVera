// produits/EditProduitForm.jsx
import React, { useState, useEffect } from 'react';
import ProduitFormBase from './ProduitFormBase';

const EditProduitForm = ({ produit, categories, onClose, onSave }) => {
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

  // Initialiser avec les données du produit
  useEffect(() => {
    if (produit) {
      setFormData({
        libelle: produit.libelle || '',
        prixVente: produit.prixVente || '',
        prixAchat: produit.prixAchat || '',
        categorie: produit.categorie || { idCategorie: '' },
        quantiteStock: produit.quantiteStock || 0,
        seuilMinimum: produit.seuilMinimum || 10,
        uniteMesure: produit.uniteMesure || 'pièce',
        imageUrl: produit.imageUrl || '',
        imageFile: null, 
        remiseTemporaire: produit.remiseTemporaire || 0,
        active: produit.active ?? true
      });
      
      // Si une image existe déjà, créer un aperçu
      if (produit.imageUrl) {
        setImagePreview(produit.imageUrl);
      }
    }
  }, [produit]);

  // AJOUTER CETTE FONCTION
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, imageUrl: 'Format non supporté' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, imageUrl: 'Image trop volumineuse (max 5MB)' }));
        return;
      }

      // Aperçu
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

  // AJOUTER CETTE FONCTION
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imageUrl: ''
    }));
    setImagePreview(null);
    document.getElementById('image-upload').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const formDataToSend = new FormData();
      
      // Ajouter tous les champs
      formDataToSend.append('libelle', formData.libelle);
      formDataToSend.append('prixVente', formData.prixVente);
      formDataToSend.append('prixAchat', formData.prixAchat);
      formDataToSend.append('categorieId', formData.categorie.idCategorie);
      formDataToSend.append('quantiteStock', formData.quantiteStock);
      formDataToSend.append('seuilMinimum', formData.seuilMinimum);
      formDataToSend.append('uniteMesure', formData.uniteMesure);
      formDataToSend.append('remiseTemporaire', formData.remiseTemporaire);
      formDataToSend.append('active', formData.active);
      
      // Ajouter l'image si présente
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }
      
      await onSave(produit.id, formDataToSend); 
      
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
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
      isEditMode={true}
      title="Modifier le produit"
    />
  );
};

export default EditProduitForm;