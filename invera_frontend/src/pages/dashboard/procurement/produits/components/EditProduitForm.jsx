// produits/EditProduitForm.jsx - Version avec remise standard
import React, { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ProduitFormBase from './ProduitFormBase';
import FournisseurService from '../../../../../services/FournisseurService';
import productService from '../../../../../services/productService';
import categorieService from '../../../../../services/categorieService';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../../../context/LanguageContext';

const EditProduitForm = ({ produit, categories, onClose, onSave, userRole }) => {
  const { t, isArabic } = useLanguage();

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
    active: true,
    fournisseurId: ''        
  });

  const [categorieRemiseStandard, setCategorieRemiseStandard] = useState(0);
  const [prixApresRemise, setPrixApresRemise] = useState(0);
  const [prixOriginal, setPrixOriginal] = useState(0);

  const [fournisseursDisponibles, setFournisseursDisponibles] = useState([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);
  const [loadingProduit, setLoadingProduit] = useState(true);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Charger les fournisseurs disponibles
  useEffect(() => {
    chargerFournisseurs();
  }, []);

  // Charger le produit complet
  useEffect(() => {
    const productId = produit?.idProduit || produit?.id;
    if (productId) {
      chargerProduitComplet();
    }
  }, [produit]);

  // Calculer le prix après remise - CORRIGÉ
  useEffect(() => {
    const prixVente = parseFloat(String(formData.prixVente).replace(',', '.'));
    if (!isNaN(prixVente) && prixVente > 0) {
      setPrixOriginal(prixVente);
      if (categorieRemiseStandard > 0) {
        const apresRemise = prixVente * (1 - categorieRemiseStandard / 100);
        setPrixApresRemise(apresRemise);
      } else {
        setPrixApresRemise(prixVente);
      }
    } else {
      setPrixOriginal(0);
      setPrixApresRemise(0);
    }
  }, [formData.prixVente, categorieRemiseStandard]);

  const chargerFournisseurs = async () => {
    setLoadingFournisseurs(true);
    try {
        const response = await FournisseurService.getActiveFournisseurs();
        
        let fournisseursList = [];
        
        if (Array.isArray(response)) {
            fournisseursList = response;
        }
        else if (response?.fournisseurs && Array.isArray(response.fournisseurs)) {
            fournisseursList = response.fournisseurs;
        }
        else if (response?.data && Array.isArray(response.data)) {
            fournisseursList = response.data;
        }
        else if (response?.success && response?.data && Array.isArray(response.data)) {
            fournisseursList = response.data;
        }
        
        setFournisseursDisponibles(fournisseursList);
        
    } catch (error) {
        console.error('❌ Erreur chargement fournisseurs:', error);
        toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
        setLoadingFournisseurs(false);
    }
  };

  // Récupérer la remise standard de la catégorie
  const fetchRemiseStandardByCategorie = async (categorieId) => {
    if (!categorieId) {
      setCategorieRemiseStandard(0);
      return;
    }
    
    try {
      const response = await categorieService.getCategorieById(categorieId);
      // CORRECTION: Vérifier la structure de la réponse
      const remise = response?.remiseStandard || response?.data?.remiseStandard || 0;
      setCategorieRemiseStandard(remise);
      console.log(`✅ Remise standard de la catégorie: ${remise}%`);
    } catch (error) {
      console.error('Erreur chargement remise catégorie:', error);
      setCategorieRemiseStandard(0);
    }
  };

  const chargerProduitComplet = async () => {
    const productId = produit.idProduit || produit.id;
    setLoadingProduit(true);
    
    try {
      const response = await productService.getProductById(productId);
      let produitComplet = response?.produit || response?.data || response;
      initialiserFormulaire(produitComplet);
      
      const categorieId = produitComplet.categorieId || 
                          produitComplet.idCategorie || 
                          produitComplet.categorie?.idCategorie ||
                          produitComplet.categorie?.id;
      
      if (categorieId) {
        await fetchRemiseStandardByCategorie(categorieId);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement produit:', error);
      toast.error(t('dashboard.procurementProductsPage.errorLoadingProduct'));
      initialiserFormulaire(produit);
    } finally {
      setLoadingProduit(false);
    }
  };

  const initialiserFormulaire = (produitData) => {
    let categorieId = produitData.categorieId || 
                      produitData.idCategorie || 
                      produitData.categorie?.idCategorie ||
                      produitData.categorie?.id;
    
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
    
    let fournisseurId = produitData.fournisseurId || 
                        produitData.fournisseur?.idFournisseur || 
                        produitData.fournisseur?.id ||
                        '';
    
    let prixAchat = produitData.prixAchat || '';
    
    setFormData({
      libelle: produitData.libelle || '',
      prixVente: produitData.prixVente?.toString() || '',
      prixAchat: prixAchat?.toString() || '',
      categorie: selectedCategorie,
      quantiteStock: produitData.quantiteStock || 0,
      seuilMinimum: produitData.seuilMinimum || 10,
      uniteMesure: produitData.uniteMesure || 'PIECE',
      imageUrl: produitData.imageUrl || '',
      imageFile: null,
      active: produitData.active ?? true,
      fournisseurId: fournisseurId
    });
    
    // Calculer le prix original pour l'affichage
    const prixVente = parseFloat(produitData.prixVente) || 0;
    setPrixOriginal(prixVente);
    setPrixApresRemise(prixVente);
    
    if (produitData.imageUrl) {
      const baseURL = 'http://localhost:8081';
      const imageUrl = produitData.imageUrl.startsWith('http') 
          ? produitData.imageUrl 
          : `${baseURL}/api/produits/uploads/produits/${produitData.imageUrl}`;
      setImagePreview(imageUrl);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.libelle.trim()) newErrors.libelle = t('dashboard.procurementProductsPage.errorRequiredField');
    
    const prixVente = parseFloat(String(formData.prixVente).replace(',', '.'));
    if (!formData.prixVente || isNaN(prixVente) || prixVente <= 0) {
      newErrors.prixVente = t('dashboard.procurementProductsPage.errorPriceGreaterThanZero');
    }
    
    const prixAchat = parseFloat(String(formData.prixAchat).replace(',', '.'));
    if (!formData.prixAchat || isNaN(prixAchat) || prixAchat <= 0) {
      newErrors.prixAchat = t('dashboard.procurementProductsPage.errorPriceGreaterThanZero');
    }
    
    if (!formData.categorie?.idCategorie) newErrors.categorie = t('dashboard.procurementProductsPage.errorCategoryRequired');
    if (!formData.fournisseurId) newErrors.fournisseurId = t('dashboard.procurementProductsPage.errorSupplierRequired');
    if (formData.seuilMinimum < 0) newErrors.seuilMinimum = t('dashboard.procurementProductsPage.errorMinimumThresholdPositive');
    if (!formData.uniteMesure.trim()) newErrors.uniteMesure = t('dashboard.procurementProductsPage.errorMeasurementUnitRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'quantiteStock') return;
    
    if (name === 'prixVente' || name === 'prixAchat') {
      const normalizedValue = value.replace(',', '.');
      if (normalizedValue === '' || /^\d*\.?\d*$/.test(normalizedValue)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
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

      setFormData(prev => ({ ...prev, imageFile: file, imageUrl: '' }));
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null, imageUrl: '' }));
    setImagePreview(null);
    const input = document.getElementById('image-upload');
    if (input) input.value = '';
  };

  const handleCategorieChange = async (e) => {
    const categorieId = parseInt(e.target.value);
    const selectedCategorie = categories.find(c => c.idCategorie === categorieId);
    setFormData(prev => ({
      ...prev,
      categorie: selectedCategorie || { idCategorie: categorieId }
    }));
    if (errors.categorie) setErrors(prev => ({ ...prev, categorie: null }));
    
    await fetchRemiseStandardByCategorie(categorieId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const formDataToSend = new FormData();
    
    // Ajouter les champs texte
    formDataToSend.append('libelle', String(formData.libelle || ''));
    formDataToSend.append('prixVente', parseFloat(String(formData.prixVente).replace(',', '.')) || 0);
    formDataToSend.append('prixAchat', parseFloat(String(formData.prixAchat).replace(',', '.')) || 0);
    formDataToSend.append('categorieId', String(formData.categorie?.idCategorie || ''));
    formDataToSend.append('seuilMinimum', String(parseInt(formData.seuilMinimum) || 0));
    formDataToSend.append('uniteMesure', String(formData.uniteMesure || 'PIECE'));
    formDataToSend.append('active', formData.active ? 'true' : 'false');
    
    if (formData.fournisseurId) {
      formDataToSend.append('fournisseurId', formData.fournisseurId);
    }
    
    if (formData.imageFile && formData.imageFile instanceof File) {
      formDataToSend.append('image', formData.imageFile);
    }

    const productId = produit.idProduit || produit.id;
    if (!productId) {
      toast.error(t('dashboard.procurementProductsPage.errorMissingProductId'));
      return;
    }
    
    // CORRECTION: Appeler onSave avec les bons paramètres
    await onSave(productId, formDataToSend);
  };

  if (loadingProduit) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          <div className="relative bg-white rounded-lg shadow-xl p-8 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('dashboard.procurementProductsPage.loadingProduct')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
          
          <div className="sticky top-0 bg-white z-20">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">{t('dashboard.procurementProductsPage.editProductTitle')}</h3>
              <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <ProduitFormBase
              formData={formData}
              errors={errors}
              categories={categories}
              handleChange={handleChange}
              handleImageChange={handleImageChange}
              handleRemoveImage={handleRemoveImage}
              imagePreview={imagePreview}
              handleCategorieChange={handleCategorieChange}
              handleSubmit={handleSubmit}
              onClose={onClose}
              isEditMode={true}
              title={t('dashboard.procurementProductsPage.editProductTitle')}
              stockDisabled={true}
              fournisseursDisponibles={fournisseursDisponibles}
              loadingFournisseurs={loadingFournisseurs}
              categorieRemiseStandard={categorieRemiseStandard}
              prixApresRemise={prixApresRemise}
              prixOriginal={prixOriginal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduitForm;