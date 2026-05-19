// produits/CreateProduitForm.jsx - Version ONE-TO-MANY (un seul fournisseur)
import React, { useState, useEffect } from 'react';
import ProduitFormBase from './ProduitFormBase';
import FournisseurService from '../../../../../services/FournisseurService';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../../../context/LanguageContext';

const CreateProduitForm = ({ categories = [], onClose, onSave, userRole }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    libelle: '',
    prixVente: '',
    prixAchat: '',          
    categorie: { idCategorie: '' },
    quantiteStock: 0, 
    seuilMinimum: 3,
    uniteMesure: 'PIECE',
    imageUrl: '',
    imageFile: null,  
    remiseTemporaire: 0,
    active: true,
    fournisseurId: ''        
  });

  //  État pour les fournisseurs
  const [fournisseursDisponibles, setFournisseursDisponibles] = useState([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const isRemiseDisabled = userRole === 'RESPONSABLE_ACHAT';
  const isStockDisabled = true;

  const safeCategories = Array.isArray(categories) ? categories : [];

  //  Charger les fournisseurs actifs
  useEffect(() => {
    chargerFournisseurs();
  }, []);

  const chargerFournisseurs = async () => {
    setLoadingFournisseurs(true);
    try {
      const response = await FournisseurService.getActiveFournisseurs();
      
      let fournisseursList = [];
      if (response?.success && response?.fournisseurs) {
        fournisseursList = response.fournisseurs;
      } else if (response?.data && Array.isArray(response.data)) {
        fournisseursList = response.data;
      } else if (Array.isArray(response)) {
        fournisseursList = response;
      }
      
      setFournisseursDisponibles(fournisseursList);
    } catch (error) {
      console.error(' Erreur chargement fournisseurs:', error);
    } finally {
      setLoadingFournisseurs(false);
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.libelle.trim()) newErrors.libelle = t('dashboard.procurementProductsPage.errorRequiredField');
    
    const prixVente = parseFloat(formData.prixVente);
    if (!formData.prixVente || isNaN(prixVente) || prixVente <= 0) {
      newErrors.prixVente = t('dashboard.procurementProductsPage.errorPriceGreaterThanZero');
    }
    
    const prixAchat = parseFloat(formData.prixAchat);
    if (!formData.prixAchat || isNaN(prixAchat) || prixAchat <= 0) {
      newErrors.prixAchat = t('dashboard.procurementProductsPage.errorPriceGreaterThanZero');
    }
    
    if (!formData.categorie?.idCategorie) newErrors.categorie = t('dashboard.procurementProductsPage.errorCategoryRequired');
    if (!formData.fournisseurId) newErrors.fournisseurId = t('dashboard.procurementProductsPage.errorSupplierRequired');
    if (formData.seuilMinimum < 0) newErrors.seuilMinimum = t('dashboard.procurementProductsPage.errorMinimumThresholdPositive');
    if (!formData.uniteMesure.trim()) newErrors.uniteMesure = t('dashboard.procurementProductsPage.errorMeasurementUnitRequired');
    
    const remise = parseFloat(formData.remiseTemporaire);
    if (isNaN(remise) || remise < 0 || remise > 100) {
      newErrors.remiseTemporaire = t('dashboard.procurementProductsPage.errorDiscountBetween');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
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

  const handleCategorieChange = (e) => {
    const categorieId = parseInt(e.target.value);
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
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, imageUrl: t('dashboard.procurementProductsPage.errorUnsupportedImageFormat') }));
        e.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, imageUrl: t('dashboard.procurementProductsPage.errorImageTooLarge') }));
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
        }
      };
      reader.onerror = () => {
        setErrors(prev => ({ ...prev, imageUrl: t('dashboard.procurementProductsPage.errorUnsupportedImageFormat') }));
        setImagePreview(null);
        e.target.value = '';
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
    
    console.log(' Validation...');
    console.log(' formData avant envoi:', formData);
    
    if (validateForm()) {
      const formDataToSend = new FormData();
      
      //  Champs du produit
      formDataToSend.append('libelle', formData.libelle || '');
      formDataToSend.append('prixVente', formData.prixVente ? formData.prixVente.toString() : '0');
      formDataToSend.append('prixAchat', formData.prixAchat ? formData.prixAchat.toString() : '0');
      formDataToSend.append('categorieId', formData.categorie?.idCategorie?.toString() || '');
      formDataToSend.append('quantiteStock', '0');
      formDataToSend.append('seuilMinimum', formData.seuilMinimum?.toString() || '3');
      formDataToSend.append('uniteMesure', formData.uniteMesure || 'PIECE');
      formDataToSend.append('remiseTemporaire', formData.remiseTemporaire?.toString() || '0');
      formDataToSend.append('active', formData.active ? 'true' : 'false');
      
      // Envoyer un seul fournisseurId
      if (formData.fournisseurId) {
        formDataToSend.append('fournisseurId', formData.fournisseurId);
      }
      
      //  Image
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }
      
      //  LOG DÉTAILLÉ
      console.log(' CONTENU DU FORM DATA:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`   ${key}: ${value}`);
      }
      
      // Vérification critique
      if (!formDataToSend.has('libelle')) {
        console.error(' libelle MANQUANT dans FormData!');
        toast.error(t('dashboard.procurementProductsPage.missingProductLabel'));
        return;
      }
      
      // Appel onSave avec les données
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
      stockDisabled={isStockDisabled}  
      handleSubmit={handleSubmit}
      onClose={onClose}
      isEditMode={false}
      title={t('dashboard.procurementProductsPage.newProductTitle')}
      fournisseursDisponibles={fournisseursDisponibles}
      loadingFournisseurs={loadingFournisseurs}
    />
  );
};

export default CreateProduitForm;
