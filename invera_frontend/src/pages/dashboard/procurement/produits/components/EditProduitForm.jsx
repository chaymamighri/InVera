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
    remiseTemporaire: 0,
    active: true
  });

  const [errors, setErrors] = useState({});

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
        remiseTemporaire: produit.remiseTemporaire || 0,
        active: produit.active ?? true
      });
    }
  }, [produit]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';
    if (!formData.prixVente || formData.prixVente <= 0) newErrors.prixVente = 'Le prix de vente doit être supérieur à 0';
    if (!formData.prixAchat || formData.prixAchat <= 0) newErrors.prixAchat = "Le prix d'achat doit être supérieur à 0";
    if (!formData.categorie?.idCategorie) newErrors.categorie = 'La catégorie est requise';
    if (formData.quantiteStock < 0) newErrors.quantiteStock = 'La quantité ne peut pas être négative';
    if (formData.seuilMinimum < 0) newErrors.seuilMinimum = 'Le seuil minimum doit être positif';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
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
      handleCategorieChange={handleCategorieChange}
      handleSubmit={handleSubmit}
      onClose={onClose}
      isEditMode={true}
      title="Modifier le produit"
    />
  );
};

export default EditProduitForm;