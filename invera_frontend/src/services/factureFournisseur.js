// services/factureFournisseur.js
import api from './api';

export const factureFournisseur = {
    
    /**
     * ✅ Fonction 1: Générer la facture (données JSON)
     */
    genererFacture: async (commandeId) => {
        const response = await api.get(`/factures-fournisseur/commande/${commandeId}/generer`);
        return response.data;
    },
    
    /**
     * ✅ Fonction 2: Exporter le PDF (téléchargement)
     */
    exporterPDF: async (commandeId, reference) => {
        const response = await api.get(`/factures-fournisseur/commande/${commandeId}/exporter`, {
            responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `facture_${reference || commandeId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};