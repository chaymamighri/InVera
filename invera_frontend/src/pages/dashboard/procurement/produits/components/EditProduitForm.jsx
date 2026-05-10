// produits/EditProduitForm.jsx - Version ONE-TO-MANY (un seul fournisseur)
import React, { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ProduitFormBase from './ProduitFormBase';
import FournisseurService from '../../../../../services/FournisseurService';
import productService from '../../../../../services/productService';
import toast from 'react-hot-toast';

const EditProduitForm = ({ produit, categories, onClose, onSave, userRole }) => {

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
    remiseTemporaire: '',
    active: true,
    fournisseurId: ''        
  });

  const [fournisseursDisponibles, setFournisseursDisponibles] = useState([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);
  const [loadingProduit, setLoadingProduit] = useState(true);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  
  const isRemiseDisabled = userRole === 'RESPONSABLE_ACHAT';

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

  const chargerFournisseurs = async () => {
    setLoadingFournisseurs(true);
    try {
        const response = await FournisseurService.getActiveFournisseurs();
        
        console.log('📋 === DÉTAIL RÉPONSE FOURNISSEURS ===');
        console.log('Type de response:', typeof response);
        console.log('Est-ce un tableau?', Array.isArray(response));
        console.log('Response brute:', response);
        
        let fournisseursList = [];
        
        if (Array.isArray(response)) {
            console.log('📋 Cas: tableau direct');
            fournisseursList = response;
        }
        else if (response?.fournisseurs && Array.isArray(response.fournisseurs)) {
            console.log('📋 Cas: objet avec fournisseurs');
            fournisseursList = response.fournisseurs;
        }
        else if (response?.data && Array.isArray(response.data)) {
            console.log('📋 Cas: objet avec data');
            fournisseursList = response.data;
        }
        else if (response?.success && response?.data && Array.isArray(response.data)) {
            console.log('📋 Cas: success + data');
            fournisseursList = response.data;
        }
        
        console.log('📋 Fournisseurs chargés:', fournisseursList.length);
        console.log('📋 Premier fournisseur:', fournisseursList[0]);
        
        setFournisseursDisponibles(fournisseursList);
        
    } catch (error) {
        console.error('❌ Erreur chargement fournisseurs:', error);
        toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
        setLoadingFournisseurs(false);
    }
  };

  const chargerProduitComplet = async () => {
    const productId = produit.idProduit || produit.id;
    setLoadingProduit(true);
    
    console.log('🔍 Chargement du produit', productId);
    
    try {
      const response = await productService.getProductById(productId);
      console.log('📦 Réponse API:', response);
      
      let produitComplet = response.produit || response;
      
      initialiserFormulaire(produitComplet);
      
    } catch (error) {
      console.error('❌ Erreur chargement produit:', error);
      toast.error('Erreur lors du chargement des données du produit');
      initialiserFormulaire(produit);
    } finally {
      setLoadingProduit(false);
    }
  };

  const initialiserFormulaire = (produitData) => {
    let categorieId = produitData.categorieId || 
                      produitData.idCategorie || 
                      produitData.categorie?.idCategorie;
    
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
                        '';
    
    let prixAchat = produitData.prixAchat || '';
    
    console.log('✅ Initialisation - fournisseurId:', fournisseurId, 'prixAchat:', prixAchat);
    
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
      remiseTemporaire: produitData.remiseTemporaire?.toString() || '',
      active: produitData.active ?? true,
      fournisseurId: fournisseurId
    });
    
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
    
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';
    
    const prixVente = parseFloat(formData.prixVente.replace(',', '.'));
    if (!formData.prixVente || isNaN(prixVente) || prixVente <= 0) {
      newErrors.prixVente = 'Le prix de vente doit être supérieur à 0';
    }
    
    const prixAchat = parseFloat(formData.prixAchat.replace(',', '.'));
    if (!formData.prixAchat || isNaN(prixAchat) || prixAchat <= 0) {
      newErrors.prixAchat = "Le prix d'achat doit être supérieur à 0";
    }
    
    if (!formData.categorie?.idCategorie) newErrors.categorie = 'La catégorie est requise';
    if (!formData.fournisseurId) newErrors.fournisseurId = 'Le fournisseur est requis';
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
    const { name, value } = e.target;
    
    if (name === 'quantiteStock') return;
    
    if (name === 'prixVente' || name === 'prixAchat' || name === 'remiseTemporaire') {
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
      reader.onloadend = () => setImagePreview(reader.result);
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

  const handleCategorieChange = (e) => {
    const categorieId = parseInt(e.target.value);
    const selectedCategorie = categories.find(c => c.idCategorie === categorieId);
    setFormData(prev => ({
      ...prev,
      categorie: selectedCategorie || { idCategorie: categorieId }
    }));
    if (errors.categorie) setErrors(prev => ({ ...prev, categorie: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const formDataToSend = new FormData();
    
    formDataToSend.append('libelle', String(formData.libelle || ''));
    formDataToSend.append('prixVente', parseFloat(String(formData.prixVente).replace(',', '.')) || 0);
    formDataToSend.append('prixAchat', parseFloat(String(formData.prixAchat).replace(',', '.')) || 0);
    formDataToSend.append('categorieId', String(formData.categorie?.idCategorie || ''));
    formDataToSend.append('seuilMinimum', String(parseInt(formData.seuilMinimum) || 0));
    formDataToSend.append('uniteMesure', String(formData.uniteMesure || 'PIECE'));
    formDataToSend.append('remiseTemporaire', String(parseFloat(String(formData.remiseTemporaire).replace(',', '.')) || 0));
    formDataToSend.append('active', formData.active ? 'true' : 'false');
    
    if (formData.fournisseurId) {
      formDataToSend.append('fournisseurId', formData.fournisseurId);
    }
    
    if (formData.imageFile && formData.imageFile instanceof File) {
      formDataToSend.append('image', formData.imageFile);
    }

    const productId = produit.idProduit || produit.id;
    if (!productId) {
      toast.error('Erreur: ID du produit manquant');
      return;
    }
    
    await onSave(productId, formDataToSend);
  };

  if (loadingProduit) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
          <div className="relative bg-white rounded-lg shadow-xl p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du produit...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          
          <div className="sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="text-lg font-semibold text-white">Modifier le produit</h3>
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
              fournisseursDisponibles={fournisseursDisponibles}
              loadingFournisseurs={loadingFournisseurs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduitForm;