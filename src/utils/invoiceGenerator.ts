export const generateInvoiceHtml = (order: any, brandLogoUrl?: string): string => {
  const logo = brandLogoUrl || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=150';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.invoiceNumber || order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            color: #1e293b;
            line-height: 1.6;
            background: #fff;
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 24px;
            margin-bottom: 32px;
          }
          .brand-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 8px;
          }
          .company-details h1 {
            color: #0f172a;
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .company-details p {
            margin: 0;
            color: #64748b;
            font-size: 13px;
          }
          .invoice-meta {
            text-align: right;
          }
          .meta-title {
            font-size: 28px;
            font-weight: 800;
            color: #cbd5e1;
            text-transform: uppercase;
            margin: 0 0 12px 0;
            letter-spacing: 2px;
          }
          .meta-item {
            margin: 0 0 4px 0;
            font-size: 13px;
            color: #475569;
          }
          .meta-item strong {
            color: #0f172a;
            display: inline-block;
            width: 130px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .details-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .details-box h3 {
            margin: 0 0 12px 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
          }
          .details-box p {
            margin: 0 0 6px 0;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            background: #f1f5f9;
            color: #475569;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
          }
          th {
            text-align: left;
            padding: 12px 16px;
            background: #f8fafc;
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #e2e8f0;
          }
          td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            color: #334155;
          }
          .totals-section {
            width: 380px;
            margin-left: auto;
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
            color: #475569;
          }
          .total-row.grand-total {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px dashed #cbd5e1;
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px auto #e2e8f0;
            padding-top: 24px;
          }
          @media print {
            body { padding: 0; max-width: 100%; }
            .no-print { display: none !important; }
            .details-box, .totals-section { break-inside: avoid; border: 1px solid #e2e8f0 !important; }
          }
        </style>
      </head>
      <body>
        <!-- Print Control -->
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: inherit;">Print / Save as PDF</button>
        </div>

        <div class="header">
          <div style="display: flex; gap: 20px; align-items: top;">
            <!-- Could inject active logo if setting is loaded, otherwise standard text -->
            <div class="company-details">
              <h1>AFD HOUSE</h1>
              <p>Mirpur DOHS, Dhaka, Bangladesh</p>
              <p>afdhousebd@gmail.com • +880 1575-445600</p>
            </div>
          </div>
          <div class="invoice-meta">
            <h2 class="meta-title">INVOICE</h2>
            <div class="meta-item"><strong>Invoice No:</strong> ${order.invoiceNumber || 'N/A'}</div>
            <div class="meta-item"><strong>Order ID:</strong> ${order.id}</div>
            <div class="meta-item"><strong>Tracking No:</strong> ${order.trackingNumber || 'N/A'}</div>
            <div class="meta-item"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-box">
            <h3>Billed To</h3>
            <p style="font-weight: 700; color: #0f172a; font-size: 16px;">${order.customerName}</p>
            <p>${order.customerPhone || 'No Phone'}</p>
            <p>${order.customerEmail}</p>
          </div>
          <div class="details-box">
            <h3>Shipping Details</h3>
            <p>${order.shippingAddress || 'N/A'}</p>
            ${order.deliveryNotes ? `<p style="margin-top: 10px; font-size: 12px; color: #64748b;"><strong>Notes:</strong> ${order.deliveryNotes}</p>` : ''}
            <div class="status-badge">${order.status}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Detailed Description</th>
              <th style="text-align: right">Unit Price</th>
              <th style="text-align: center">Qty</th>
              <th style="text-align: right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.products.map((p: any) => `
              <tr>
                <td style="font-weight: 500">${p.name}</td>
                <td style="text-align: right">৳${p.price.toLocaleString()}</td>
                <td style="text-align: center">${p.quantity}</td>
                <td style="text-align: right; font-weight: 600;">৳${(p.price * p.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal</span>
            <span style="font-weight: 500">৳${order.total.toLocaleString()}</span>
          </div>
          <div class="total-row">
            <span>Discount</span>
            <span style="font-weight: 500; color: #ef4444;">-৳${order.discount.toLocaleString()}</span>
          </div>
          <div class="total-row">
            <span>Payment Method</span>
            <span style="font-weight: 500; color: #3b82f6; text-transform: uppercase;">${order.paymentMethod}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total Amount</span>
            <span>৳${order.finalTotal.toLocaleString()}</span>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p style="margin-top: 4px; font-weight: 600; color: #0f172a;">Thank you for your business with AFD HOUSE.</p>
        </div>
      </body>
    </html>
  `;
};
