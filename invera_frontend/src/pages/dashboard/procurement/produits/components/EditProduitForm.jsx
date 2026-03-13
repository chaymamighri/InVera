// produits/EditProduitForm.jsx
import React, { useState, useEffect } from 'react';
import ProduitFormBase from './ProduitFormBase';

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
        // Vérifier si l'URL est complète ou relative
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
    
    // Pour les champs de prix, accepter chiffres, point et virgule
    if (name === 'prixVente' || name === 'prixAchat' || name === 'remiseTemporaire') {
      const normalizedValue = value.replace(',', '.');
      if (normalizedValue === '' || /^\d*\.?\d*$/.test(normalizedValue)) {
        setFormData(prev => ({
          ...prev,
          [name]: value // Garder la valeur saisie (avec virgule si l'utilisateur l'a mise)
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

// EditProduitForm.jsx - Construction FORCÉE du FormData
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
    
    // ✅ CONSTRUCTION SYSTÉMATIQUE DU FORMDATA
    const formDataToSend = new FormData();
    console.log('🚦 FormData créé');
    
    // ✅ AJOUTER TOUS LES CHAMPS, MÊME VIDES
    formDataToSend.append('libelle', String(formData.libelle || ''));
    
    // Prix avec gestion des virgules
    const prixVente = parseFloat(String(formData.prixVente).replace(',', '.')) || 0;
    formDataToSend.append('prixVente', prixVente);
    
    const prixAchat = parseFloat(String(formData.prixAchat).replace(',', '.')) || 0;
    formDataToSend.append('prixAchat', prixAchat);
    
    // Catégorie
    formDataToSend.append('categorieId', String(formData.categorie?.idCategorie || ''));
    
    // Stock
    formDataToSend.append('quantiteStock', String(parseInt(formData.quantiteStock) || 0));
    formDataToSend.append('seuilMinimum', String(parseInt(formData.seuilMinimum) || 0));
    
    // Unité de mesure
    formDataToSend.append('uniteMesure', String(formData.uniteMesure || 'pièce'));
    
    // Remise
    const remise = parseFloat(String(formData.remiseTemporaire).replace(',', '.')) || 0;
    formDataToSend.append('remiseTemporaire', String(remise));
    
    // Actif
    formDataToSend.append('active', formData.active ? 'true' : 'false');
    
    // Image
    if (formData.imageFile && formData.imageFile instanceof File) {
      formDataToSend.append('image', formData.imageFile);
    }

await onSave(produit.id, formDataToSend);
    
  } catch (error) {
   
    toast.error('Une erreur inattendue est survenue');
    e?.preventDefault?.();
    e?.stopPropagation?.();
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