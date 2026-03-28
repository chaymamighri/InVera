// pages/dashboard/procurement/factures/FactureFournisseur.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useCommandeFournisseur } from '../../../../hooks/useCommandeFournisseur';
import { factureFournisseur } from '../../../../services/factureFournisseur';
import { formatPrice, StatutCommande } from '../commandeFournisseur/CommandesFournisseurs';

// ✅ Fonction de formatage de date
const formatDateReelle = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const FactureFournisseur = () => {
  const { commandes, loading, error, fetchCommandes } = useCommandeFournisseur();
  const [factureData, setFactureData] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  // ✅ Filtrer les commandes réceptionnées (RECUE)
  const commandesReceptionnees = useMemo(() => {
    return commandes.filter(cmd => cmd.statut === StatutCommande.RECUE);
  }, [commandes]);

  // ✅ Fonction 1: Générer la facture (récupère les données JSON)
  const handleGenererFacture = async (commande) => {
    setGeneratingId(commande.idCommandeFournisseur);
    try {
      const data = await factureFournisseur.genererFacture(commande.idCommandeFournisseur);
      setFactureData(data);
      toast.success(`Facture générée pour ${commande.numeroCommande}`);
    } catch (error) {
      console.error('Erreur génération:', error);
      toast.error('Erreur lors de la génération de la facture');
    } finally {
      setGeneratingId(null);
    }
  };

  // ✅ Fonction 2: Exporter PDF directement (téléchargement)
  const handleExporterPDF = async (commande) => {
    setExportingId(commande.idCommandeFournisseur);
    try {
      await factureFournisseur.exporterPDF(
        commande.idCommandeFournisseur,
        commande.numeroCommande
      );
      toast.success('PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExportingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-500">Chargement des commandes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-600">
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Erreur de chargement</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchCommandes}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liste des commandes réceptionnées */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">
            Commandes réceptionnées ({commandesReceptionnees.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Générez la facture pour les commandes reçues
          </p>
        </div>

        {commandesReceptionnees.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune commande réceptionnée</p>
            <p className="text-sm text-gray-400 mt-1">
              Les commandes apparaîtront ici après réception
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    N° Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date réception
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commandesReceptionnees.map((commande) => {
                  const dateLivraison = commande.dateLivraisonReelle;
                  
                  return (
                    <tr key={commande.idCommandeFournisseur} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {commande.numeroCommande}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {commande.fournisseur?.nomFournisseur}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commande.fournisseur?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {dateLivraison ? (
                          <span className="text-gray-600">
                            {formatDateReelle(dateLivraison)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Date non renseignée</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatPrice(commande.totalTTC || commande.totalHT)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* ✅ Bouton Générer */}
                          <button
                            onClick={() => handleGenererFacture(commande)}
                            disabled={generatingId === commande.idCommandeFournisseur}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            title="Générer la facture"
                          >
                            {generatingId === commande.idCommandeFournisseur ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <DocumentTextIcon className="w-4 h-4" />
                            )}
                            Générer
                          </button>
                          
                          {/* ✅ Bouton Exporter PDF */}
                          <button
                            onClick={() => handleExporterPDF(commande)}
                            disabled={exportingId === commande.idCommandeFournisseur}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            title="Exporter en PDF"
                          >
                            {exportingId === commande.idCommandeFournisseur ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <DocumentArrowDownIcon className="w-4 h-4" />
                            )}
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Affichage des données de facture générées */}
      {factureData && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800">
              Facture générée avec succès
            </h3>
            <button
              onClick={() => setFactureData(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Référence</p>
              <p className="font-medium text-gray-900">{factureData.reference}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">
                {new Date(factureData.dateFacture).toLocaleString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant total</p>
              <p className="font-medium text-green-600">
                {formatPrice(factureData.montantTotal)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fournisseur</p>
              <p className="font-medium text-gray-900">
                {factureData.fournisseur?.nomFournisseur}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t flex justify-end gap-2">
            <button
              onClick={() => {
                const commande = commandesReceptionnees.find(
                  c => c.idCommandeFournisseur === factureData.commande?.idCommandeFournisseur
                );
                if (commande) handleExporterPDF(commande);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Exporter PDF
            </button>
            <button
              onClick={() => setFactureData(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactureFournisseur;