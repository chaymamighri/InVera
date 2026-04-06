// pages/dashboard/procurement/factures/FactureFournisseur.jsx
/**
 * FactureFournisseur - Gestion des factures fournisseurs
 * 
 * RÔLE : Gérer les factures des commandes fournisseurs (génération, consultation, export)
 * ROUTE : /dashboard/procurement/factures
 * 
 * FONCTIONNALITÉS :
 * - Liste des factures avec pagination
 * - Génération de facture à partir d'une commande reçue
 * - Export PDF des factures
 * - Consultation des détails d'une facture
 * - Mise à jour du statut de paiement (Payée/Non payée)
 * - 2 onglets : Liste des factures / Générer une facture
 * 
 * HOOKS UTILISÉS :
 * - useCommandeFournisseur() : Gestion des commandes fournisseurs
 * - factureFournisseur service : Appels API factures
 * 
 * COMPOSANTS :
 * - FactureTabs : Navigation entre les onglets
 * - FactureListeTab : Tableau des factures existantes
 * - GenererFactureTab : Formulaire de génération
 * - FactureDetailModal : Modal de visualisation détaillée
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useCommandeFournisseur } from '../../../../hooks/useCommandeFournisseur';
import { factureFournisseur } from '../../../../services/factureFournisseur';
import FactureTabs from './components/FactureTabs';
import FactureListeTab from './components/FactureListeTab';
import GenererFactureTab from './components/GenererFactureTab';
import FactureDetailModal from './components/FactureDetailModal';

const FactureFournisseur = () => {
  const { commandes, loading: commandesLoading, error: commandesError, fetchCommandes } = useCommandeFournisseur();
  const [factures, setFactures] = useState([]);
  const [facturesPaginated, setFacturesPaginated] = useState(null);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('liste');
  const [generatingId, setGeneratingId] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [loadingFactures, setLoadingFactures] = useState(false);
  const [loadingCommandes, setLoadingCommandes] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isMounted = useRef(true);


const commandesSansFacture = React.useMemo(() => {
  if (!commandes || commandes.length === 0) return [];
  if (!factures || factures.length === 0) {
    return commandes.filter(cmd => cmd.statut === 'RECUE');
  }
  
  // ✅ Récupérer les NUMÉROS des commandes qui ont des factures
  const factureCommandeNumeros = new Set();
  
  factures.forEach(facture => {
    // Essayer différentes structures possibles
    if (facture.commande?.numeroCommande) {
      factureCommandeNumeros.add(facture.commande.numeroCommande);
    }
    if (facture.numeroCommande) {
      factureCommandeNumeros.add(facture.numeroCommande);
    }
    if (facture.commandeNumero) {
      factureCommandeNumeros.add(facture.commandeNumero);
    }
  });
  
  console.log('🔍 Numéros des commandes avec facture:', [...factureCommandeNumeros]);
  console.log('📋 Toutes les commandes:', commandes.map(c => ({ 
    id: c.idCommandeFournisseur, 
    numero: c.numeroCommande, 
    statut: c.statut 
  })));
  
  // Filtrer par NUMÉRO de commande
  const filtered = commandes.filter(cmd => {
    const hasFacture = factureCommandeNumeros.has(cmd.numeroCommande);
    const isRecue = cmd.statut === 'RECUE';
    
    if (isRecue && hasFacture) {
      console.log(`❌ Commande exclue: ${cmd.numeroCommande} - a déjà une facture`);
    }
    if (isRecue && !hasFacture) {
      console.log(`✅ Commande incluse: ${cmd.numeroCommande} - sans facture`);
    }
    
    return isRecue && !hasFacture;
  });
  
  console.log('🎯 Commandes sans facture:', filtered.map(c => c.numeroCommande));
  
  return filtered;
}, [commandes, factures]);

  const loadFactures = useCallback(async () => {
    if (!isMounted.current) return;
    setLoadingFactures(true);
    try {
      const data = await factureFournisseur.getFactures(0, 100);
      if (isMounted.current) {
        console.log('📄 Factures reçues:', data.content);
        setFacturesPaginated(data);
        setFactures(data.content || []);
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      if (isMounted.current) {
        toast.error('Erreur lors du chargement des factures');
      }
    } finally {
      if (isMounted.current) {
        setLoadingFactures(false);
      }
    }
  }, []);

  // ✅ Correction: Supprimer la dépendance 'commandes' qui cause la boucle
  const loadCommandes = useCallback(async () => {
    if (!isMounted.current) return;
    setLoadingCommandes(true);
    try {
      await fetchCommandes();
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      if (isMounted.current) {
        toast.error('Erreur lors du chargement des commandes');
      }
    } finally {
      if (isMounted.current) {
        setLoadingCommandes(false);
      }
    }
  }, [fetchCommandes]);

  // ✅ Correction: useEffect avec condition pour éviter les rechargements infinis
  useEffect(() => {
    isMounted.current = true;
    
    const init = async () => {
      await Promise.all([loadFactures(), loadCommandes()]);
      if (isMounted.current) {
        setIsInitialized(true);
      }
    };
    
    init();
    
    return () => {
      isMounted.current = false;
    };
  }, []); // ✅ Dépendances vides - exécuté une seule fois

  const handleGenererFacture = async (commande) => {
    setGeneratingId(commande.idCommandeFournisseur);
    try {
      const nouvelleFacture = await factureFournisseur.genererFacture(commande.idCommandeFournisseur);
      toast.success(`Facture générée pour ${commande.numeroCommande}`);
      
      // Recharger les deux listes
      await Promise.all([loadFactures(), loadCommandes()]);
      
      setSelectedFacture(nouvelleFacture);
      setShowModal(true);
      setActiveTab('liste');
    } catch (error) {
      console.error('Erreur génération:', error);
      const message = error.response?.data?.message || 'Erreur lors de la génération';
      toast.error(message);
      
      if (message.includes('existe déjà')) {
        await Promise.all([loadFactures(), loadCommandes()]);
      }
    } finally {
      setGeneratingId(null);
    }
  };

  const handleExporterPDF = async (facture) => {
    setExportingId(facture.idFactureFournisseur);
    try {
      await factureFournisseur.exporterPDF(
        facture.idFactureFournisseur,
        facture.reference
      );
      toast.success('PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExportingId(null);
    }
  };


const handleViewDetail = async (facture) => {
  try {
    const factureId = facture.idFactureFournisseur || facture.id;
    
    console.log('🔍 ID facture:', factureId);
    
    const detail = await factureFournisseur.getFactureById(factureId);
    
    console.log('📄 DÉTAIL COMPLET:', detail);
    console.log('📄 detail.lignesCommande:', detail.lignesCommande);  // ← ICI !
    console.log('📄 detail.commande:', detail.commande);
    
    setSelectedFacture(detail);
    setShowModal(true);
  } catch (error) {
    console.error('❌ Erreur chargement détail:', error);
    toast.error('Erreur lors du chargement des détails');
  }
};

  const handleUpdatePaiement = async (factureId, nouveauStatut) => {
    try {
      const updated = await factureFournisseur.updateStatutPaiement(factureId, nouveauStatut);
      toast.success(`Statut de paiement mis à jour: ${nouveauStatut === 'PAYE' ? 'Payée' : 'Non payée'}`);
      
      await loadFactures();
      
      if (selectedFacture?.idFactureFournisseur === factureId) {
        setSelectedFacture(updated);
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (!isInitialized && (loadingFactures || loadingCommandes)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FactureTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        facturesCount={factures.length}
        commandesCount={commandesSansFacture.length}
      />

      {activeTab === 'liste' && (
        <FactureListeTab
          factures={factures}
          loadingFactures={loadingFactures}
          onViewDetail={handleViewDetail}
          onExporterPDF={handleExporterPDF}
          onUpdatePaiement={handleUpdatePaiement}
          exportingId={exportingId}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'generer' && (
        <GenererFactureTab
          commandesSansFacture={commandesSansFacture}
          loadingCommandes={loadingCommandes}
          generatingId={generatingId}
          onGenererFacture={handleGenererFacture}
          setActiveTab={setActiveTab}
        />
      )}

      <FactureDetailModal
        showModal={showModal}
        selectedFacture={selectedFacture}
        onClose={() => setShowModal(false)}
        onExporterPDF={handleExporterPDF}
        onUpdatePaiement={handleUpdatePaiement}
      />
    </div>
  );
};

export default FactureFournisseur;