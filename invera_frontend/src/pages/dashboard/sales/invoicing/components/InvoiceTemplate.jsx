// src/components/InvoiceTemplate.jsx

import { logoBase64 } from '../../../../../assets/logoBase64';

const InvoiceTemplate = ({ facture, items, totaux, formatDate, formatMontant }) => {
  return `
    <html>
      <head>
        <title>Facture ${facture.referenceFactureClient || facture.reference}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          
          /* STYLE POUR LE HEADER AVEC LOGO ET INFOS À CÔTÉ */
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 40px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #e5e7eb; 
          }
          
          /* CONTENEUR POUR LOGO + INFOS (HORIZONTAL) */
          .left-section {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          /* STYLE DU LOGO */
          .logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          
          /* STYLE DES INFORMATIONS À CÔTÉ DU LOGO */
          .company-details {
            font-size: 12px;
            color: #4b5563;
            line-height: 1.6;
            border-left: 2px solid #e5e7eb;
            padding-left: 20px;
          }
          
          .company-details p {
            margin: 3px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .company-details i {
            color: #10b981;
            width: 16px;
            font-style: normal;
          }
          
          .invoice-info { text-align: right; }
          .invoice-title { font-size: 32px; font-weight: bold; color: #111827; margin: 0; }
          .invoice-ref { color: #6b7280; font-size: 14px; }
          .status-badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-top: 10px; background: ${facture.statut === 'PAYE' ? '#10b981' : '#f59e0b'}; color: white; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .info-box { background: #f9fafb; padding: 20px; border-radius: 8px; }
          .info-box h3 { margin: 0 0 15px 0; color: #374151; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .info-row { margin-bottom: 8px; }
          .info-label { color: #6b7280; font-size: 13px; }
          .info-value { color: #111827; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background: #f3f4f6; color: #374151; font-weight: 600; font-size: 13px; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
          .total-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
          .total-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 10px; }
          .total-label { font-weight: 500; color: #6b7280; }
          .total-value { font-weight: 600; color: #111827; min-width: 120px; text-align: right; }
          .grand-total { font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 15px; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- HEADER AVEC LOGO ET INFORMATIONS À CÔTÉ -->
          <div class="header">
            <div class="left-section">
              <img src="${logoBase64}" alt="InVera" class="logo" />
              <div class="company-details">
                <p><i>📍</i> 123 Rue de la République, 1000 Tunis</p>
                <p><i>📞</i> +216 00 000 000</p>
                <p><i>✉️</i> contact@invera.tn</p>
                <p><i>🆔</i> MF: 0000000/A/M/000</p>
              </div>
            </div>
            <div class="invoice-info">
              <div class="invoice-title">FACTURE</div>
              <div class="invoice-ref">N° ${facture.referenceFactureClient || facture.reference}</div>
              <div class="status-badge">${facture.statut === 'PAYE' ? 'PAYÉE' : 'NON PAYÉE'}</div>
            </div>
          </div>

          <!-- INFORMATIONS CLIENT ET FACTURE -->
          <div class="info-section">
            <div class="info-box">
              <h3>FACTURER À</h3>
              <div class="info-row">
                <span class="info-label">Client :</span>
                <span class="info-value">${facture.client?.nomComplet || facture.client?.nom || 'N/A'}</span>
              </div>
              ${facture.client?.typeClient ? `
              <div class="info-row">
                <span class="info-label">Type :</span>
                <span class="info-value">${facture.client.typeClient}</span>
              </div>` : ''}
              ${facture.client?.email ? `
              <div class="info-row">
                <span class="info-label">Email :</span>
                <span class="info-value">${facture.client.email}</span>
              </div>` : ''}
              ${facture.client?.telephone ? `
              <div class="info-row">
                <span class="info-label">Tél :</span>
                <span class="info-value">${facture.client.telephone}</span>
              </div>` : ''}
              ${facture.client?.adresse ? `
              <div class="info-row">
                <span class="info-label">Adresse :</span>
                <span class="info-value">${facture.client.adresse}</span>
              </div>` : ''}
            </div>

            <div class="info-box">
              <h3>DÉTAILS FACTURE</h3>
              <div class="info-row">
                <span class="info-label">Date d'émission :</span>
                <span class="info-value">${formatDate(facture.dateFacture)}</span>
              </div>
              ${facture.commande?.reference ? `
              <div class="info-row">
                <span class="info-label">Commande :</span>
                <span class="info-value">${facture.commande.reference}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Échéance :</span>
                <span class="info-value">${formatDate(facture.dateFacture)}</span>
              </div>
            </div>
          </div>

          <!-- TABLEAU DES ARTICLES -->
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire (DT)</th>
                <th>Total (DT)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${formatMontant(item.unitPrice)}</td>
                  <td>${formatMontant(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- TOTAUX -->
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Sous-total :</span>
              <span class="total-value">${formatMontant(totaux.sousTotal)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">TVA (19%) :</span>
              <span class="total-value">${formatMontant(totaux.tva)}</span>
            </div>
            <div class="total-row grand-total">
              <span class="total-label">Total TTC :</span>
              <span class="total-value">${formatMontant(totaux.totalTTC)}</span>
            </div>
          </div>

          <!-- PIED DE PAGE -->
          <div class="footer">
            <p>Merci de votre confiance !</p>
            <p>Cette facture est générée automatiquement par le système InVera.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export default InvoiceTemplate;