// servicesPlatform/paymentService.js
import platformApi from './platformApi';

export const paymentService = {
  // Récupérer tous les paiements
  getAllPayments: async () => {
    try {
      // Utiliser le nouveau endpoint
      const response = await platformApi.get('/super-admin/paiements');
      console.log('✅ Paiements récupérés:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paiements:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Accès non autorisé. Veuillez vous reconnecter.');
      }
      throw error;
    }
  },

   // Récupérer un paiement par ID
  getPaymentById: async (paymentId) => {
    try {
      const response = await platformApi.get(`/super-admin/paiements/${paymentId}`);
      console.log('✅ Détails du paiement récupérés:', response);
      // ⚠️ Important: platformApi retourne déjà response.data
      // Donc response contient directement les données du paiement
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du paiement:', error);
      throw error;
    }
  },
  
  // Exporter les données en CSV
  exportToCSV: (paymentsData, filename = 'paiements') => {
    if (!paymentsData || paymentsData.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }
    
    try {
      const csv = paymentService.convertToCSV(paymentsData);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${filename}_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      throw error;
    }
  },

  // Convertir les données en CSV
  convertToCSV: (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = [
      'ID',
      'Client',
      'Email',
      'Offre',
      'Montant',
      'Devise',
      'Statut',
      'Date de demande',
      'Date de confirmation'
    ];
    
    const rows = data.map(payment => [
      payment.id || '',
      `${payment.clientPrenom || ''} ${payment.clientNom || ''}`.trim() || '',
      payment.clientEmail || '',
      payment.offreNom || '',
      payment.montant || 0,
      payment.devise || 'XAF',
      payment.statut || '',
      payment.dateDemande || '',
      payment.dateConfirmation || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
};

export default paymentService;