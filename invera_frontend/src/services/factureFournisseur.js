// services/factureFournisseur.js
import api from './api';

export const factureFournisseur = {
  // ✅ Générer une facture (sauvegarde automatique en BD)
  genererFacture: (commandeId) => 
    api.post(`/facture-fournisseur/generer/${commandeId}`).then(res => res.data),
  
  // ✅ Exporter PDF par ID facture
  exporterPDF: (factureId, reference) => 
    api.get(`/facture-fournisseur/exporter/${factureId}`, {
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${reference || factureId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
  
  // ✅ Liste paginée des factures
  getFactures: (page = 0, size = 10) =>
    api.get(`/facture-fournisseur/liste`, {
      params: { page, size }
    }).then(res => res.data),
  
  // ✅ Détail d'une facture par ID
  getFactureById: (factureId) =>
    api.get(`/facture-fournisseur/${factureId}`).then(res => res.data),
  
  // ✅ Mettre à jour le statut de paiement
  updateStatutPaiement: (factureId, statut) =>
    api.patch(`/facture-fournisseur/${factureId}/statut`, null, {
      params: { statut }
    }).then(res => res.data)
};