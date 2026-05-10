// src/components/InvoiceTemplate.jsx
/*import { logoBase64 } from '../../../../../assets/logoBase64';

const InvoiceTemplate = ({ facture, items, totaux, formatDate, formatMontant }) => {
  const isPaye = facture.statut === 'PAYE';
  const hasRemise = totaux.remise && totaux.remise > 0;
  
  // ✅ CORRECTION: Récupération du numéro de commande avec le bon nom
  const numeroCommande = 
    facture.commande?.referenceCommandeClient ||  // ← Bon nom !!!
    facture.commande?.numeroCommande ||
    facture.commande?.reference ||
    facture.numeroCommande ||
    facture.referenceCommande ||
    null;
  
  // ✅ Log pour debug (sera visible dans la console du backend)
  console.log('📄 Template - Numéro commande trouvé:', numeroCommande);
  console.log('📄 Template - facture.commande:', facture.commande);
  
  return `
    <html>
      <head>
        <title>Facture ${facture.referenceFactureClient || facture.reference}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Inter', -apple-system, sans-serif;
            background: #f5f7fa; 
            padding: 20px;
            line-height: 1.5;
            color: #1e293b;
          }
          
          .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            box-shadow: 0 20px 30px -10px rgba(0, 20, 40, 0.15);
            overflow: hidden;
          }
          
          .header {
            padding: 24px 28px;
            background: white;
            border-bottom: 1px solid #eef2f6;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .left-section {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          
          .company-details {
            border-left: 1px solid #e2e8f0;
            padding-left: 16px;
          }
          
          .company-details p {
            margin: 3px 0;
            font-size: 11px;
            color: #475569;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 400;
          }
          
          .company-details i {
            color: #64748b;
            width: 14px;
            font-style: normal;
            font-size: 12px;
            opacity: 0.7;
          }
          
          .invoice-info {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          
          .invoice-title {
            font-size: 24px;
            font-weight: 600;
            color: #0f172a;
            letter-spacing: -0.3px;
            line-height: 1.2;
          }
          
          .invoice-ref {
            color: #64748b;
            font-size: 13px;
            margin: 4px 0 12px 0;
            font-weight: 400;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            background: ${isPaye ? '#ecfdf5' : '#fffbeb'};
            color: ${isPaye ? '#047857' : '#b45309'};
            border: 1px solid ${isPaye ? '#a7f3d0' : '#fde68a'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }
          
          .status-badge i {
            margin-right: 6px;
            font-style: normal;
            font-size: 14px;
          }
          
          .info-grid {
            padding: 20px 28px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .info-card {
            background: #f8fafc;
            border-radius: 14px;
            padding: 18px;
            border: 1px solid #edf2f7;
          }
          
          .info-card h3 {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #64748b;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .info-card h3 i {
            color: #475569;
            font-style: normal;
            font-size: 14px;
          }
          
          .info-row {
            margin-bottom: 8px;
            display: flex;
            align-items: baseline;
          }
          
          .info-label {
            font-size: 11px;
            color: #64748b;
            width: 85px;
            flex-shrink: 0;
          }
          
          .info-value {
            font-size: 13px;
            font-weight: 500;
            color: #1e293b;
          }
          
          .montant-highlight {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #dce3ec;
          }
          
          .montant-highlight .info-label {
            color: #475569;
            font-weight: 500;
          }
          
          .montant-highlight .info-value {
            font-size: 18px;
            font-weight: 700;
            color: #2563eb;
          }
          
          .articles-section {
            padding: 10px 28px 5px 28px;
          }
          
          .articles-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }
          
          .articles-header i {
            font-style: normal;
            color: #2563eb;
            font-size: 16px;
          }
          
          .articles-header h3 {
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #edf2f7;
          }
          
          th {
            background: #f8fafc;
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #64748b;
            border-bottom: 1px solid #e2e8f0;
          }
          
          td {
            padding: 10px;
            font-size: 12px;
            color: #334155;
            border-bottom: 1px solid #edf2f7;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-mono { font-family: 'SF Mono', monospace; font-weight: 400; }
          .remise-row {
            color: #059669;
          }
          .remise-row .total-value {
            color: #059669;
            font-weight: 600;
          }
          
          .totaux-section {
            padding: 15px 28px 25px 28px;
          }
          
          .totaux-container {
            max-width: 300px;
            margin-left: auto;
            background: #f8fafc;
            border-radius: 14px;
            padding: 16px 18px;
            border: 1px solid #edf2f7;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
          }
          
          .total-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 400;
          }
          
          .total-value {
            font-size: 13px;
            font-weight: 500;
            color: #334155;
            font-family: monospace;
          }
          
          .grand-total-row {
            margin-top: 6px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
          }
          
          .grand-total-label {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }
          
          .grand-total-value {
            font-size: 17px;
            font-weight: 700;
            color: #2563eb;
          }
          
          .footer {
            padding: 16px 28px;
            text-align: center;
            border-top: 1px solid #eef2f6;
            background: #fafcff;
          }
          
          .footer p {
            font-size: 10px;
            color: #94a3b8;
            font-weight: 400;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          
          <!-- HEADER -->
          <div class="header">
            <div class="left-section">
              <img src="${logoBase64}" alt="InVera" class="logo" />
              <div class="company-details">
                <p><i>📍</i> 123 Rue de la République, 1000 Tunis</p>
                <p><i>📞</i> +216 71 123 456</p>
                <p><i>✉️</i> contact@invera.tn</p>
                <p><i>🆔</i> MF: 0000000/A/M/000</p>
              </div>
            </div>
            <div class="invoice-info">
              <div class="invoice-title">FACTURE</div>
              <div class="invoice-ref">${facture.referenceFactureClient || facture.reference}</div>
              <div class="status-badge">
                <i>${isPaye ? '✓' : '○'}</i>
                ${isPaye ? 'Payée' : 'En attente de paiement'}
              </div>
            </div>
          </div>

          <!-- INFORMATIONS CLIENT ET FACTURE -->
          <div class="info-grid">
            <div class="info-card">
              <h3><i>👤</i> CLIENT</h3>
              <div class="info-row">
                <span class="info-label">Nom</span>
                <span class="info-value">${facture.client?.nomComplet || facture.client?.nom || 'N/A'}</span>
              </div>
              ${facture.client?.typeClient ? `
              <div class="info-row">
                <span class="info-label">Type</span>
                <span class="info-value">${facture.client.typeClient}</span>
              </div>` : ''}
              ${facture.client?.email ? `
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${facture.client.email}</span>
              </div>` : ''}
              ${facture.client?.telephone ? `
              <div class="info-row">
                <span class="info-label">Tél</span>
                <span class="info-value">${facture.client.telephone}</span>
              </div>` : ''}
              ${facture.client?.adresse ? `
              <div class="info-row">
                <span class="info-label">Adresse</span>
                <span class="info-value">${facture.client.adresse}</span>
              </div>` : ''}
            </div>

            <div class="info-card">
              <h3><i>📄</i> FACTURE</h3>
              <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">${formatDate(facture.dateFacture)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">N° Facture</span>
                <span class="info-value">${facture.referenceFactureClient || facture.reference}</span>
              </div>
${numeroCommande ? `
<div class="info-row">
  <span class="info-label">N° Commande</span>
  <span class="info-value">${numeroCommande}</span>
</div>
` : `
<div class="info-row">
  <span class="info-label">N° Commande</span>
  <span class="info-value" style="color: #94a3b8;">Non renseigné</span>
</div>
`}
              <div class="montant-highlight">
                <span class="info-label">Total TTC</span>
                <span class="info-value">${formatMontant(facture.montantTotal)}</span>
              </div>
            </div>
          </div>

          <!-- ARTICLES -->
          <div class="articles-section">
            <div class="articles-header">
              <i>📋</i>
              <h3>ARTICLES</h3>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center">Qté</th>
                  <th class="text-right">Prix unitaire</th>
                  <th class="text-right">Total HT</th>
                </tr>
              </thead>
              <tbody>
                ${items.length > 0 ? items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right font-mono">${formatMontant(item.unitPrice)}</td>
                    <td class="text-right font-mono">${formatMontant(item.total)}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="4" class="text-center" style="padding: 30px; color: #94a3b8;">
                      Aucun article
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>

          <!-- TOTAUX AVEC REMISE -->
          <div class="totaux-section">
            <div class="totaux-container">
              <div class="total-row">
                <span class="total-label">Sous-total HT</span>
                <span class="total-value">${formatMontant(totaux.sousTotal || 0)}</span>
              </div>
              
              ${hasRemise ? `
              <div class="total-row remise-row">
                <span class="total-label">Remise (${totaux.remiseTaux || 0}%)</span>
                <span class="total-value">- ${formatMontant(totaux.remise)}</span>
              </div>
              ` : ''}
              
              <div class="total-row">
                <span class="total-label">Total HT après remise</span>
                <span class="total-value">${formatMontant(totaux.totalHT || totaux.sousTotal || 0)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">TVA ${totaux.tvaTaux || 19}%</span>
                <span class="total-value">${formatMontant(totaux.tva || 0)}</span>
              </div>
              <div class="total-row grand-total-row">
                <span class="total-label grand-total-label">Total TTC</span>
                <span class="total-value grand-total-value">${formatMontant(totaux.totalTTC || facture.montantTotal || 0)}</span>
              </div>
            </div>
          </div>

          <!-- PIED DE PAGE -->
          <div class="footer">
            <p>Merci de votre confiance • Facture générée par InVera</p>
            ${hasRemise ? '<p style="color: #059669;">* Remise commerciale appliquée</p>' : ''}
            ${numeroCommande ? '<p style="color: #64748b;">* Commande client: ' + numeroCommande + '</p>' : ''}
          </div>
        </div>
      </body>
    </html>
  `;
};

export default InvoiceTemplate;*/