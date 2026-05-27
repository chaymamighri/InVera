/*import { logoBase64 } from '../../../../../assets/logoBase64';

const InvoiceTemplate = ({
  facture,
  items = [],
  totaux = {},
  formatDate,
  formatMontant,
  labels = {},
  isArabic = false,
}) => {
  const isPaid = facture.statut === 'PAYE';
  const hasDiscount = totaux.remise && totaux.remise > 0;
  const dir = isArabic ? 'rtl' : 'ltr';
  const align = isArabic ? 'right' : 'left';
  const alignOpposite = isArabic ? 'left' : 'right';

  const numeroCommande =
    facture.commande?.referenceCommandeClient ||
    facture.commande?.numeroCommande ||
    facture.commande?.reference ||
    facture.numeroCommande ||
    facture.referenceCommande ||
    null;

  return `
    <html dir="${dir}">
      <head>
        <title>${labels.invoice || 'Invoice'} ${facture.referenceFactureClient || facture.reference}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f7fa;
            padding: 20px;
            line-height: 1.5;
            color: #1e293b;
            direction: ${dir};
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
            gap: 24px;
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
            border-${isArabic ? 'right' : 'left'}: 1px solid #e2e8f0;
            padding-${isArabic ? 'right' : 'left'}: 16px;
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

          .invoice-info {
            text-align: ${alignOpposite};
            display: flex;
            flex-direction: column;
            align-items: ${isArabic ? 'flex-start' : 'flex-end'};
          }

          .invoice-title {
            font-size: 24px;
            font-weight: 600;
            color: #0f172a;
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
            gap: 6px;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            background: ${isPaid ? '#ecfdf5' : '#fffbeb'};
            color: ${isPaid ? '#047857' : '#b45309'};
            border: 1px solid ${isPaid ? '#a7f3d0' : '#fde68a'};
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
            color: #64748b;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .info-row {
            margin-bottom: 8px;
            display: flex;
            align-items: baseline;
            gap: 10px;
          }

          .info-label {
            font-size: 11px;
            color: #64748b;
            width: 95px;
            flex-shrink: 0;
          }

          .info-value {
            font-size: 13px;
            font-weight: 500;
            color: #1e293b;
          }

          .amount-highlight {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #dce3ec;
          }

          .amount-highlight .info-value {
            font-size: 18px;
            font-weight: 700;
            color: #2563eb;
          }

          .items-section {
            padding: 10px 28px 5px 28px;
          }

          .items-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }

          .items-header h3 {
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            text-transform: uppercase;
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
            text-align: ${align};
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
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
          .text-end { text-align: ${alignOpposite}; }
          .font-mono { font-family: 'SF Mono', Consolas, monospace; font-weight: 400; }
          .discount-row, .discount-row .total-value { color: #059669; }

          .totals-section {
            padding: 15px 28px 25px 28px;
          }

          .totals-container {
            max-width: 300px;
            margin-${isArabic ? 'right' : 'left'}: auto;
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
            gap: 16px;
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
          <div class="header">
            <div class="left-section">
              <img src="${logoBase64}" alt="InVera" class="logo" />
              <div class="company-details">
                <p>InVera</p>
                <p>123 Rue de la Republique, 1000 Tunis</p>
                <p>+216 71 123 456</p>
                <p>contact@invera.tn</p>
                <p>MF: 0000000/A/M/000</p>
              </div>
            </div>
            <div class="invoice-info">
              <div class="invoice-title">${labels.invoiceUpper}</div>
              <div class="invoice-ref">${facture.referenceFactureClient || facture.reference}</div>
              <div class="status-badge">
                <span>${isPaid ? '✓' : '○'}</span>
                ${isPaid ? labels.paid : labels.pendingPayment}
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h3>${labels.client}</h3>
              <div class="info-row">
                <span class="info-label">${labels.name}</span>
                <span class="info-value">${facture.client?.nomComplet || facture.client?.nom || labels.notAvailable}</span>
              </div>
              ${facture.client?.typeClient ? `
              <div class="info-row">
                <span class="info-label">${labels.type}</span>
                <span class="info-value">${facture.client.typeClient}</span>
              </div>` : ''}
              ${facture.client?.email ? `
              <div class="info-row">
                <span class="info-label">${labels.email}</span>
                <span class="info-value">${facture.client.email}</span>
              </div>` : ''}
              ${facture.client?.telephone ? `
              <div class="info-row">
                <span class="info-label">${labels.phoneShort}</span>
                <span class="info-value">${facture.client.telephone}</span>
              </div>` : ''}
              ${facture.client?.adresse ? `
              <div class="info-row">
                <span class="info-label">${labels.address}</span>
                <span class="info-value">${facture.client.adresse}</span>
              </div>` : ''}
            </div>

            <div class="info-card">
              <h3>${labels.invoice}</h3>
              <div class="info-row">
                <span class="info-label">${labels.date}</span>
                <span class="info-value">${formatDate(facture.dateFacture)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">${labels.invoiceNumber}</span>
                <span class="info-value">${facture.referenceFactureClient || facture.reference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">${labels.orderNumber}</span>
                <span class="info-value" style="${numeroCommande ? '' : 'color: #94a3b8;'}">${numeroCommande || labels.notProvided}</span>
              </div>
              <div class="amount-highlight">
                <span class="info-label">${labels.totalTtc}</span>
                <span class="info-value">${formatMontant(facture.montantTotal)}</span>
              </div>
            </div>
          </div>

          <div class="items-section">
            <div class="items-header">
              <h3>${labels.itemsUpper}</h3>
            </div>

            <table>
              <thead>
                <tr>
                  <th>${labels.description}</th>
                  <th class="text-center">${labels.quantityShort}</th>
                  <th class="text-end">${labels.unitPrice}</th>
                  <th class="text-end">${labels.totalHt}</th>
                </tr>
              </thead>
              <tbody>
                ${items.length > 0 ? items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end font-mono">${formatMontant(item.unitPrice)}</td>
                    <td class="text-end font-mono">${formatMontant(item.total)}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="4" class="text-center" style="padding: 30px; color: #94a3b8;">
                      ${labels.noItems}
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="totals-container">
              <div class="total-row">
                <span class="total-label">${labels.subtotalHt}</span>
                <span class="total-value">${formatMontant(totaux.sousTotal || 0)}</span>
              </div>

              ${hasDiscount ? `
              <div class="total-row discount-row">
                <span class="total-label">${labels.discount} (${totaux.remiseTaux || 0}%)</span>
                <span class="total-value">- ${formatMontant(totaux.remise)}</span>
              </div>
              ` : ''}

              <div class="total-row">
                <span class="total-label">${labels.totalHtAfterDiscount}</span>
                <span class="total-value">${formatMontant(totaux.totalHT || totaux.sousTotal || 0)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">${labels.vat} ${totaux.tvaTaux || 19}%</span>
                <span class="total-value">${formatMontant(totaux.tva || 0)}</span>
              </div>
              <div class="total-row grand-total-row">
                <span class="total-label grand-total-label">${labels.totalTtc}</span>
                <span class="total-value grand-total-value">${formatMontant(totaux.totalTTC || facture.montantTotal || 0)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>${labels.thankYou}</p>
            ${hasDiscount ? `<p style="color: #059669;">${labels.commercialDiscountApplied}</p>` : ''}
            ${numeroCommande ? `<p style="color: #64748b;">${labels.clientOrder}: ${numeroCommande}</p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
};

export default InvoiceTemplate;
*/