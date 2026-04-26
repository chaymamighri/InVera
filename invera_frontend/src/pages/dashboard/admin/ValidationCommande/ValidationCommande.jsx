import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../../../context/LanguageContext';
import commandeFournisseurService from '../../../../services/commandeFournisseurService';
import CommandeDetailsModal from '../../procurement/commandeFournisseur/components/CommandeDetailsModal';
import ValidationConfirmModal from './components/ValidationConfirmModal';
import RejectModal from './components/RejectModal';

const copy = {
  fr: {
    loadingOrders: 'Chargement des commandes...',
    loadError: 'Impossible de charger les commandes. Veuillez reessayer.',
    loadToastError: 'Erreur de chargement des commandes',
    priorityTitle: 'Demande a traiter en priorite',
    resentFocus: 'Cette demande a ete renvoyee apres correction et attend une nouvelle validation.',
    newFocus: 'Cette demande vient d etre creee et attend votre validation.',
    viewDetails: 'Voir details',
    removeFocus: 'Retirer le focus',
    unavailableFocus: 'La demande ciblee n est plus disponible dans la liste en attente.',
    close: 'Fermer',
    searchPlaceholder: 'Rechercher par numero de commande ou fournisseur...',
    pendingCount: '{{count}} commande(s) en attente de validation',
    emptyTitle: 'Aucune commande en attente',
    emptyDescription: 'Toutes les commandes ont ete traitees',
    pending: 'En attente',
    resent: 'Renvoyee',
    newlyCreated: 'Nouvelle',
    supplier: 'Fournisseur',
    creationDate: 'Date creation',
    totalTtc: 'Total TTC',
    products: 'Produits',
    details: 'Voir details',
    validate: 'Valider',
    reject: 'Rejeter',
    retry: 'Reessayer',
    validateSuccess: 'Commande {{reference}} validee avec succes !',
    rejectSuccess: 'Commande {{reference}} rejetee avec succes !',
    validateError: 'Erreur lors de la validation',
    rejectError: 'Erreur lors du rejet',
    detailsError: 'Impossible de charger les details de la commande',
  },
  en: {
    loadingOrders: 'Loading orders...',
    loadError: 'Unable to load orders. Please try again.',
    loadToastError: 'Error while loading orders',
    priorityTitle: 'Priority request',
    resentFocus: 'This request was sent back after correction and is waiting for a new validation.',
    newFocus: 'This request was just created and is waiting for your validation.',
    viewDetails: 'View details',
    removeFocus: 'Remove focus',
    unavailableFocus: 'The targeted request is no longer available in the pending list.',
    close: 'Close',
    searchPlaceholder: 'Search by order number or supplier...',
    pendingCount: '{{count}} pending order(s)',
    emptyTitle: 'No pending orders',
    emptyDescription: 'All orders have been processed',
    pending: 'Pending',
    resent: 'Resent',
    newlyCreated: 'New',
    supplier: 'Supplier',
    creationDate: 'Creation date',
    totalTtc: 'Total incl. tax',
    products: 'Products',
    details: 'View details',
    validate: 'Validate',
    reject: 'Reject',
    retry: 'Retry',
    validateSuccess: 'Order {{reference}} validated successfully!',
    rejectSuccess: 'Order {{reference}} rejected successfully!',
    validateError: 'Error while validating',
    rejectError: 'Error while rejecting',
    detailsError: 'Unable to load order details',
  },
  ar: {
    loadingOrders: 'جاري تحميل الطلبات...',
    loadError: 'تعذر تحميل الطلبات. يرجى المحاولة مرة أخرى.',
    loadToastError: 'خطأ أثناء تحميل الطلبات',
    priorityTitle: 'طلب ذو أولوية للمعالجة',
    resentFocus: 'تمت إعادة إرسال هذا الطلب بعد التصحيح وهو في انتظار اعتماد جديد.',
    newFocus: 'تم إنشاء هذا الطلب حديثًا وهو في انتظار اعتمادك.',
    viewDetails: 'عرض التفاصيل',
    removeFocus: 'إزالة التركيز',
    unavailableFocus: 'الطلب المحدد لم يعد متوفرًا في قائمة الانتظار.',
    close: 'إغلاق',
    searchPlaceholder: 'ابحث برقم الطلب أو المورد...',
    pendingCount: '{{count}} طلب/طلبات في انتظار الاعتماد',
    emptyTitle: 'لا توجد طلبات معلقة',
    emptyDescription: 'تمت معالجة كل الطلبات',
    pending: 'في الانتظار',
    resent: 'أعيد الإرسال',
    newlyCreated: 'جديد',
    supplier: 'المورد',
    creationDate: 'تاريخ الإنشاء',
    totalTtc: 'الإجمالي مع الأداءات',
    products: 'المنتجات',
    details: 'عرض التفاصيل',
    validate: 'اعتماد',
    reject: 'رفض',
    retry: 'إعادة المحاولة',
    validateSuccess: 'تم اعتماد الطلب {{reference}} بنجاح!',
    rejectSuccess: 'تم رفض الطلب {{reference}} بنجاح!',
    validateError: 'خطأ أثناء الاعتماد',
    rejectError: 'خطأ أثناء الرفض',
    detailsError: 'تعذر تحميل تفاصيل الطلب',
  },
};

const ValidationCommande = () => {
  const { language, isArabic } = useLanguage();
  const text = useMemo(() => copy[language] || copy.fr, [language]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [rawCommandes, setRawCommandes] = useState([]);
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedCommandeData, setSelectedCommandeData] = useState(null);
  const [modalError, setModalError] = useState('');
  const focusedCommandeId = searchParams.get('focusCommande') || '';
  const focusedNotificationType = (searchParams.get('notificationType') || '').toLowerCase();

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar' : language === 'en' ? 'en-GB' : 'fr-FR')
      : '-';

  const fetchCommandes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await commandeFournisseurService.getAllCommandes();

      let allCommandes = [];
      if (response && response.data) {
        allCommandes = response.data;
      } else if (Array.isArray(response)) {
        allCommandes = response;
      } else {
        allCommandes = response?.commandes || [];
      }

      setRawCommandes(allCommandes);

      const commandesEnAttente = allCommandes.filter((cmd) => cmd.statut === 'BROUILLON');

      const formattedCommandes = commandesEnAttente.map((cmd) => ({
        id: cmd.idCommandeFournisseur,
        reference: cmd.numeroCommande || `CMD-${cmd.idCommandeFournisseur}`,
        fournisseur: cmd.fournisseur?.nomFournisseur || cmd.nomFournisseur || '-',
        dateCreation: formatDate(cmd.dateCommande),
        dateLivraisonPrevue: formatDate(cmd.dateLivraisonPrevue),
        totalHT: cmd.totalHT || 0,
        totalTTC: cmd.totalTTC || 0,
        statut: cmd.statut,
        adresseLivraison: cmd.adresseLivraison || '-',
        nbProduits: cmd.lignesCommande?.length || 0,
        produits: cmd.lignesCommande || [],
      }));

      setCommandes(formattedCommandes);
      setFilteredCommandes(formattedCommandes);
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err);
      setError(text.loadError);
      toast.error(text.loadToastError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
  }, [language]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCommandes(commandes);
    } else {
      const filtered = commandes.filter(
        (c) =>
          c.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCommandes(filtered);
    }
  }, [searchTerm, commandes]);

  const focusedCommande = useMemo(
    () => commandes.find((commande) => String(commande.id) === String(focusedCommandeId)) || null,
    [commandes, focusedCommandeId]
  );

  const clearFocus = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('focusCommande');
    nextParams.delete('notificationType');
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (!focusedCommandeId || loading) return;

    const timer = window.setTimeout(() => {
      const target = document.querySelector(`[data-commande-id="${focusedCommandeId}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [focusedCommandeId, filteredCommandes, loading]);

  const openValidateModal = (commande) => {
    setSelectedCommandeData(commande);
    setModalError('');
    setIsValidateModalOpen(true);
  };

  const confirmValidation = async () => {
    if (!selectedCommandeData) return;

    setActionInProgress(`valider-${selectedCommandeData.id}`);
    setModalError('');

    try {
      await commandeFournisseurService.validerCommande(selectedCommandeData.id);
      toast.success(text.validateSuccess.replace('{{reference}}', selectedCommandeData.reference));
      await fetchCommandes();
      if (String(selectedCommandeData.id) === String(focusedCommandeId)) {
        clearFocus();
      }
      setIsValidateModalOpen(false);
      setSelectedCommandeData(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || text.validateError;
      setModalError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  const openRejectModal = (commande) => {
    setSelectedCommandeData(commande);
    setModalError('');
    setIsRejectModalOpen(true);
  };

  const confirmRejection = async (motif) => {
    if (!selectedCommandeData) return;

    setActionInProgress(`rejeter-${selectedCommandeData.id}`);
    setModalError('');

    try {
      await commandeFournisseurService.rejeterCommande(selectedCommandeData.id, motif);
      toast.success(text.rejectSuccess.replace('{{reference}}', selectedCommandeData.reference));
      await fetchCommandes();
      if (String(selectedCommandeData.id) === String(focusedCommandeId)) {
        clearFocus();
      }
      setIsRejectModalOpen(false);
      setSelectedCommandeData(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || text.rejectError;
      setModalError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleViewDetails = (formattedCommande) => {
    const rawCommande = rawCommandes.find((c) => c.idCommandeFournisseur === formattedCommande.id);
    if (rawCommande) {
      setSelectedCommande(rawCommande);
      setIsDetailsModalOpen(true);
    } else {
      toast.error(text.detailsError);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">{text.loadingOrders}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={fetchCommandes}
            className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {text.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {focusedCommande && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">{text.priorityTitle}</p>
            <p className="mt-1 text-sm text-amber-800">
              <span className="font-semibold">{focusedCommande.reference}</span>
              {' - '}
              {focusedNotificationType === 'resent' ? text.resentFocus : text.newFocus}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewDetails(focusedCommande)}
              className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              {text.viewDetails}
            </button>
            <button
              onClick={clearFocus}
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              {text.removeFocus}
            </button>
          </div>
        </div>
      )}

      {focusedCommandeId && !focusedCommande && !loading && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">{text.unavailableFocus}</p>
          <button onClick={clearFocus} className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900">
            {text.close}
          </button>
        </div>
      )}

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={text.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {text.pendingCount.replace('{{count}}', String(filteredCommandes.length))}
        </p>
      </div>

      {filteredCommandes.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h3 className="text-lg font-medium text-gray-800">{text.emptyTitle}</h3>
          <p className="mt-1 text-gray-500">{text.emptyDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCommandes.map((commande) => (
            <div
              key={commande.id}
              data-commande-id={commande.id}
              className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                String(commande.id) === String(focusedCommandeId)
                  ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{commande.reference}</h3>
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">{text.pending}</span>
                    {String(commande.id) === String(focusedCommandeId) && (
                      <span className="rounded-full bg-amber-200 px-2 py-1 text-xs text-amber-900">
                        {focusedNotificationType === 'resent' ? text.resent : text.newlyCreated}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="flex items-start gap-2">
                      <BuildingOfficeIcon className="mt-0.5 w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{text.supplier}</p>
                        <p className="text-sm font-medium">{commande.fournisseur}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="mt-0.5 w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{text.creationDate}</p>
                        <p className="text-sm font-medium">{commande.dateCreation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CurrencyEuroIcon className="mt-0.5 w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{text.totalTtc}</p>
                        <p className="text-sm font-medium text-blue-600">
                          {commande.totalTTC?.toLocaleString()} DH
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CubeIcon className="mt-0.5 w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{text.products}</p>
                        <p className="text-sm font-medium">{commande.nbProduits}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleViewDetails(commande)}
                    className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                    title={text.details}
                    disabled={actionInProgress !== null}
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openValidateModal(commande)}
                    disabled={actionInProgress !== null}
                    className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                    title={text.validate}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openRejectModal(commande)}
                    disabled={actionInProgress !== null}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    title={text.reject}
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ValidationConfirmModal
        isOpen={isValidateModalOpen}
        onClose={() => {
          setIsValidateModalOpen(false);
          setSelectedCommandeData(null);
          setModalError('');
        }}
        onConfirm={confirmValidation}
        commandeReference={selectedCommandeData?.reference}
        isLoading={actionInProgress !== null}
        errorMessage={modalError}
      />

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedCommandeData(null);
          setModalError('');
        }}
        onConfirm={confirmRejection}
        commandeReference={selectedCommandeData?.reference}
        isLoading={actionInProgress !== null}
        errorMessage={modalError}
      />

      <CommandeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCommande(null);
        }}
        commande={selectedCommande}
      />
    </div>
  );
};

export default ValidationCommande;
