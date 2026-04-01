// stockService.js
import api from './api';

export const stockEtatService = {
    // ✅ Obtenir l'état de stock
    getEtatStock: async (params = {}) => {
        const response = await api.get('/stock/etat', { params });
        return response.data;
    },
    
    
    // ✅ Obtenir les produits en rupture
    getProduitsEnRupture: async () => {
        const response = await api.get('/stock/etat/ruptures');
        return response.data;
    },
    
    // ✅ Exporter en CSV
    exportEtatStockCSV: async (categorieId = null) => {
        const params = categorieId ? { categorieId } : {};
        const response = await api.get('/stock/etat/export/csv', {
            params,
            responseType: 'blob'
        });
        
        // Télécharger le fichier
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `etat-stock-${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};