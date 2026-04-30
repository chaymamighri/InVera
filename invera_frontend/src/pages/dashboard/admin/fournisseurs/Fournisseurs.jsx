import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../../context/LanguageContext';
import { useFournisseur } from '../../../../hooks/useFournisseur';
import FournisseurSearch from './components/FournisseurSearch';
import FournisseurTable from './components/FournisseurTable';
import FournisseurModal from './components/FournisseurModal';
import FournisseurForm from './components/FournisseurForm';

const copy = {
  fr: {
    creating: 'Creation du fournisseur en cours...',
    created: 'Fournisseur cree avec succes !',
    updating: 'Mise a jour du fournisseur en cours...',
    updated: 'Fournisseur modifie avec succes !',
    deactivating: 'Desactivation du fournisseur en cours...',
    reactivating: 'Reactivation du fournisseur en cours...',
    deactivated: 'Fournisseur desactive avec succes !',
    reactivated: 'Fournisseur reactive avec succes !',
    errorPrefix: 'Erreur: ',
    searchResults: '{{count}} resultat(s) pour "{{term}}"',
    seeAll: 'Voir tous',
    loading: 'Chargement des fournisseurs...',
    searchPlaceholder: 'Rechercher un fournisseur...',
    active: 'Actifs',
    inactive: 'Inactifs',
    all: 'Tous',
    newSupplier: 'Nouveau fournisseur',
    emptyTitle: 'Aucun fournisseur',
    emptyDescription: 'Cliquez sur "Nouveau fournisseur" pour en ajouter',
    name: 'Nom',
    email: 'Email',
    phone: 'Telephone',
    city: 'Ville',
    country: 'Pays',
    status: 'Statut',
    actions: 'Actions',
    activate: 'Activer',
    deactivate: 'Desactiver',
    activeStatus: 'Actif',
    inactiveStatus: 'Inactif',
    edit: 'Modifier',
    confirmationTitle: 'Confirmation',
    confirmToggle: 'Voulez-vous {{action}} ce fournisseur ?',
    activateVerb: 'activer',
    deactivateVerb: 'desactiver',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    supplierName: 'Nom du fournisseur',
    supplierNamePlaceholder: 'Ex: SOTUGAT S.A.',
    address: 'Adresse',
    addressPlaceholder: 'Adresse complete',
    selectCountry: 'Selectionner un pays',
    other: 'Autre',
    create: 'Creer',
    editSupplier: 'Modifier le fournisseur',
  },
  en: {
    creating: 'Creating supplier...',
    created: 'Supplier created successfully!',
    updating: 'Updating supplier...',
    updated: 'Supplier updated successfully!',
    deactivating: 'Deactivating supplier...',
    reactivating: 'Reactivating supplier...',
    deactivated: 'Supplier deactivated successfully!',
    reactivated: 'Supplier reactivated successfully!',
    errorPrefix: 'Error: ',
    searchResults: '{{count}} result(s) for "{{term}}"',
    seeAll: 'See all',
    loading: 'Loading suppliers...',
    searchPlaceholder: 'Search for a supplier...',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    newSupplier: 'New supplier',
    emptyTitle: 'No suppliers',
    emptyDescription: 'Click "New supplier" to add one',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    city: 'City',
    country: 'Country',
    status: 'Status',
    actions: 'Actions',
    activate: 'Activate',
    deactivate: 'Deactivate',
    activeStatus: 'Active',
    inactiveStatus: 'Inactive',
    edit: 'Edit',
    confirmationTitle: 'Confirmation',
    confirmToggle: 'Do you want to {{action}} this supplier?',
    activateVerb: 'activate',
    deactivateVerb: 'deactivate',
    cancel: 'Cancel',
    confirm: 'Confirm',
    supplierName: 'Supplier name',
    supplierNamePlaceholder: 'Ex: SOTUGAT S.A.',
    address: 'Address',
    addressPlaceholder: 'Full address',
    selectCountry: 'Select a country',
    other: 'Other',
    create: 'Create',
    editSupplier: 'Edit supplier',
  },
  ar: {
    creating: 'جاري إنشاء المورد...',
    created: 'تم إنشاء المورد بنجاح!',
    updating: 'جاري تحديث المورد...',
    updated: 'تم تعديل المورد بنجاح!',
    deactivating: 'جاري تعطيل المورد...',
    reactivating: 'جاري إعادة تفعيل المورد...',
    deactivated: 'تم تعطيل المورد بنجاح!',
    reactivated: 'تمت إعادة تفعيل المورد بنجاح!',
    errorPrefix: 'خطأ: ',
    searchResults: '{{count}} نتيجة لـ "{{term}}"',
    seeAll: 'عرض الكل',
    loading: 'جاري تحميل الموردين...',
    searchPlaceholder: 'ابحث عن مورد...',
    active: 'نشطون',
    inactive: 'غير نشطين',
    all: 'الكل',
    newSupplier: 'مورد جديد',
    emptyTitle: 'لا يوجد موردون',
    emptyDescription: 'انقر على "مورد جديد" لإضافة مورد',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    city: 'المدينة',
    country: 'البلد',
    status: 'الحالة',
    actions: 'الإجراءات',
    activate: 'تفعيل',
    deactivate: 'تعطيل',
    activeStatus: 'نشط',
    inactiveStatus: 'غير نشط',
    edit: 'تعديل',
    confirmationTitle: 'تأكيد',
    confirmToggle: 'هل تريد {{action}} هذا المورد؟',
    activateVerb: 'تفعيل',
    deactivateVerb: 'تعطيل',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    supplierName: 'اسم المورد',
    supplierNamePlaceholder: 'مثال: SOTUGAT S.A.',
    address: 'العنوان',
    addressPlaceholder: 'العنوان الكامل',
    selectCountry: 'اختر بلدًا',
    other: 'أخرى',
    create: 'إنشاء',
    editSupplier: 'تعديل المورد',
  },
};

const FournisseurManagement = () => {
  const { language, isArabic } = useLanguage();
  const text = useMemo(() => copy[language] || copy.fr, [language]);

  const {
    allFournisseurs,
    loading,
    error,
    fetchAllFournisseurs,
    softDeleteFournisseur,
    reactivateFournisseur,
    createFournisseur,
    updateFournisseur,
  } = useFournisseur();

  const [viewMode, setViewMode] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState(null);

  useEffect(() => {
    if (fetchAllFournisseurs) {
      fetchAllFournisseurs();
    }
  }, [fetchAllFournisseurs]);

  const handleSearchResults = (results, term) => {
    setSearchResults(results);
    setActiveSearchTerm(term);
  };

  const refreshData = async () => {
    if (fetchAllFournisseurs) {
      await fetchAllFournisseurs();
    }
  };

  const handleCreate = async (data) => {
    const toastId = toast.loading(text.creating);

    try {
      await createFournisseur(data);
      setShowModal(false);
      await refreshData();
      setSearchResults([]);
      setActiveSearchTerm('');
      toast.success(text.created, { id: toastId });
    } catch (err) {
      toast.error(text.errorPrefix + err.message, { id: toastId });
    }
  };

  const handleUpdate = async (data) => {
    const toastId = toast.loading(text.updating);

    try {
      await updateFournisseur(editingFournisseur.idFournisseur, data);
      setShowModal(false);
      setEditingFournisseur(null);
      await refreshData();
      setSearchResults([]);
      setActiveSearchTerm('');
      toast.success(text.updated, { id: toastId });
    } catch (err) {
      toast.error(text.errorPrefix + err.message, { id: toastId });
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    const toastId = toast.loading(isActive ? text.deactivating : text.reactivating);

    try {
      if (isActive) {
        await softDeleteFournisseur(id);
      } else {
        await reactivateFournisseur(id);
      }
      await refreshData();
      setSearchResults([]);
      setActiveSearchTerm('');
      toast.success(isActive ? text.deactivated : text.reactivated, { id: toastId });
    } catch (err) {
      toast.error(text.errorPrefix + err.message, { id: toastId });
    }
  };

  const openAddModal = () => {
    setEditingFournisseur(null);
    setShowModal(true);
  };

  const openEditModal = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setShowModal(true);
  };

  const getDisplayedFournisseurs = () => {
    if (activeSearchTerm) {
      return [...searchResults].sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
    }

    if (!allFournisseurs) return [];

    let filtered = [];
    switch (viewMode) {
      case 'active':
        filtered = allFournisseurs.filter((f) => f.actif === true);
        break;
      case 'inactive':
        filtered = allFournisseurs.filter((f) => f.actif === false);
        break;
      case 'all':
      default:
        filtered = allFournisseurs;
    }

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.dateCreation || a.createdAt || 0);
      const dateB = new Date(b.dateCreation || b.createdAt || 0);
      return dateB - dateA;
    });
  };

  const displayedFournisseurs = getDisplayedFournisseurs();

  return (
    <div className={`p-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <FournisseurSearch
          onSearchResults={handleSearchResults}
          onViewModeChange={setViewMode}
          viewMode={viewMode}
          onAddNew={openAddModal}
          text={text}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {activeSearchTerm && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {text.searchResults
              .replace('{{count}}', String(searchResults.length))
              .replace('{{term}}', activeSearchTerm)}
          </span>
          <button
            onClick={() => {
              setActiveSearchTerm('');
              setSearchResults([]);
            }}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
          >
            {text.seeAll}
          </button>
        </div>
      )}

      {loading && !displayedFournisseurs.length ? (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="mt-3 text-gray-500">{text.loading}</p>
        </div>
      ) : (
        <FournisseurTable
          fournisseurs={displayedFournisseurs}
          onEdit={openEditModal}
          onToggleStatus={handleToggleStatus}
          text={text}
        />
      )}

      <FournisseurModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingFournisseur(null);
        }}
      >
        <FournisseurForm
          initialData={editingFournisseur}
          onSubmit={editingFournisseur ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowModal(false);
            setEditingFournisseur(null);
          }}
          loading={loading}
          text={text}
        />
      </FournisseurModal>
    </div>
  );
};

export default FournisseurManagement;
