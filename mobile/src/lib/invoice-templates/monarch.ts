// "Monarch" — minimalist monochrome invoice template.
// Pure function: (settings, draft) => standalone HTML document string.
// Rendered to PDF (A4/Letter) by expo-print. Black & white only.
import {
  InvoiceSettings,
  InvoiceDraft,
  money,
  esc,
  multiline,
  computeTotals,
  DOC_LABEL,
  contacts,
} from './shared';

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const lines = Array.isArray(d.lines) ? d.lines : [];
  const totals = computeTotals({ ...d, lines });
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'] ?? DOC_LABEL.invoice;

  // ---- Header left: logo or business name + tagline ------------------------
  const brandMark = s.logoUrl
    ? `<img src="${s.logoUrl}" style="max-height:60px;max-width:200px;object-fit:contain"/>`
    : `<div class="brand-name">${esc(s.businessName)}</div>`;

  const taglineHtml = s.tagline
    ? `<div class="brand-tagline">${esc(s.tagline)}</div>`
    : '';

  // ---- Contact lines (each with a small grey label) ------------------------
  const contactLines = contacts(s);
  const contactLabels = ['ADDRESS', 'PHONE', 'EMAIL', 'WEB'];
  const contactHtml = contactLines.length
    ? `<div class="contact-block">${contactLines
        .map(
          (line, i) =>
            `<div class="contact-row"><span class="contact-label">${
              contactLabels[i] || ''
            }</span><span class="contact-val">${multiline(line)}</span></div>`,
        )
        .join('')}</div>`
    : '';

  const taxIdHtml = s.taxId
    ? `<div class="contact-row"><span class="contact-label">TAX ID</span><span class="contact-val">${esc(
        s.taxId,
      )}</span></div>`
    : '';

  // ---- Meta rows (right side) ----------------------------------------------
  const metaRow = (label: string, value: string) =>
    `<div class="meta-row"><span class="meta-label">${label}</span><span class="meta-val">${esc(
      value,
    )}</span></div>`;

  let metaHtml = '';
  if (d.number) metaHtml += metaRow('Invoice No.', d.number);
  if (d.date) metaHtml += metaRow('Issue date', d.date);
  if (d.dueDate) metaHtml += metaRow('Due date', d.dueDate);

  // ---- Bill To / Ship To ---------------------------------------------------
  const billDetails = multiline(d.customerInfo);
  const billToHtml =
    `<div class="party">` +
    `<div class="party-bar">BILL TO</div>` +
    `<div class="party-body">` +
    (d.customerName ? `<div class="party-name">${esc(d.customerName)}</div>` : '') +
    (billDetails ? `<div class="party-details">${billDetails}</div>` : '') +
    `</div></div>`;

  // Ship To always shown; falls back to bill-to info when shipTo empty.
  const shipDetails = d.shipTo ? multiline(d.shipTo) : billDetails;
  const shipToHtml =
    `<div class="party">` +
    `<div class="party-bar">SHIP TO</div>` +
    `<div class="party-body">` +
    (d.customerName ? `<div class="party-name">${esc(d.customerName)}</div>` : '') +
    (shipDetails ? `<div class="party-details">${shipDetails}</div>` : '') +
    `</div></div>`;

  // ---- Items table ---------------------------------------------------------
  const rowsHtml = lines
    .map((l, i) => {
      const amount = (l.qty || 0) * (l.unitPrice || 0);
      const detailHtml = l.detail
        ? `<div class="item-detail">${multiline(l.detail)}</div>`
        : '';
      return (
        `<tr>` +
        `<td class="c-num">${i + 1}</td>` +
        `<td class="c-desc"><div class="item-title">${esc(
          l.description,
        )}</div>${detailHtml}</td>` +
        `<td class="c-qty">${esc(String(l.qty ?? 0))}</td>` +
        `<td class="c-unit">${money(l.unitPrice)}</td>` +
        `<td class="c-amt">${money(amount)}</td>` +
        `</tr>`
      );
    })
    .join('');

  const itemsHtml = `
    <table class="items">
      <thead>
        <tr>
          <th class="c-num">#</th>
          <th class="c-desc">Description</th>
          <th class="c-qty">Qty</th>
          <th class="c-unit">Unit Price</th>
          <th class="c-amt">Amount</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;

  // ---- Totals --------------------------------------------------------------
  const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;
  let totalsRows = `<div class="tot-row"><span>SUBTOTAL</span><span>${money(
    totals.subtotal,
  )}</span></div>`;
  if (totals.discount > 0)
    totalsRows += `<div class="tot-row"><span>DISCOUNT</span><span>-${money(
      totals.discount,
    )}</span></div>`;
  if (d.taxPct > 0)
    totalsRows += `<div class="tot-row"><span>${taxLabel}</span><span>${money(
      totals.tax,
    )}</span></div>`;
  const totalsHtml = `
    <div class="totals">
      ${totalsRows}
      <div class="tot-total"><span>TOTAL DUE</span><span>${money(
        totals.total,
      )}</span></div>
    </div>`;

  // ---- Payment details -----------------------------------------------------
  const payRow = (label: string, value?: string) =>
    value
      ? `<div class="pay-row"><span class="pay-label">${label}</span><span class="pay-val">${esc(
          value,
        )}</span></div>`
      : '';
  let payRows = '';
  payRows += payRow('Bank Name', s.bankName);
  payRows += payRow('Account Name', s.bankAccountName);
  payRows += payRow('Account Number', s.bankAccountNumber);
  payRows += payRow('Routing Number', s.bankRouting);
  payRows += payRow('SWIFT/BIC', s.bankSwift);
  if (s.paymentExtra)
    payRows += `<div class="pay-row pay-extra">${esc(s.paymentExtra)}</div>`;
  if (s.acceptNote)
    payRows += `<div class="pay-accept">We accept: ${esc(s.acceptNote)}</div>`;

  const paymentHtml = payRows
    ? `<div class="foot-col"><div class="foot-label">PAYMENT DETAILS</div>${payRows}</div>`
    : '';

  // ---- Notes ---------------------------------------------------------------
  let notesBody = '';
  if (d.notes) notesBody += `<div class="notes-text">${multiline(d.notes)}</div>`;
  if (s.paymentTerms)
    notesBody += `<div class="notes-terms">${esc(s.paymentTerms)}</div>`;
  const notesHtml = notesBody
    ? `<div class="foot-col"><div class="foot-label">NOTES</div>${notesBody}</div>`
    : '';

  const footColumns =
    paymentHtml || notesHtml
      ? `<div class="footer-cols">${paymentHtml}${notesHtml}</div>`
      : '';

  const footerNote = s.footerNote || 'Thank you for your business';

  // ---- Document ------------------------------------------------------------
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>
  :root{
    --ink:#1a1a1a;
    --grey:#ECECEC;
    --muted:#7a7a7a;
    --line:#1a1a1a;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    padding:36px;
    font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;
    color:var(--ink);
    background:#ffffff;
    font-size:12px;
    line-height:1.45;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;}
  .header-left{flex:1;min-width:0;}
  .header-right{text-align:right;flex:0 0 auto;min-width:240px;}
  .brand-name{font-size:22px;font-weight:700;letter-spacing:0.5px;color:var(--ink);}
  .brand-tagline{margin-top:6px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);}
  .doc-title{font-size:46px;font-weight:800;letter-spacing:1px;color:var(--ink);line-height:1;margin-bottom:14px;}
  .meta-row{display:flex;justify-content:space-between;gap:16px;padding:5px 0;border-bottom:0.5px solid var(--ink);}
  .meta-label{font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);}
  .meta-val{font-weight:700;font-size:11px;}
  .contact-block{margin-top:20px;}
  .contact-row{display:flex;gap:10px;padding:2px 0;font-size:11px;}
  .contact-label{flex:0 0 56px;font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);padding-top:1px;}
  .contact-val{flex:1;}
  .parties{display:flex;gap:18px;margin-top:34px;}
  .party{flex:1;min-width:0;}
  .party-bar{background:var(--grey);color:var(--ink);font-size:9.5px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;padding:6px 10px;}
  .party-body{padding:10px 10px 0;}
  .party-name{font-weight:700;font-size:13px;margin-bottom:3px;}
  .party-details{font-size:11px;color:#333;}
  .items{width:100%;border-collapse:collapse;margin-top:34px;}
  .items thead th{
    background:#1a1a1a;color:#ffffff;
    font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;
    text-align:left;padding:9px 10px;
  }
  .items tbody td{padding:9px 10px;border-bottom:0.5px solid #d8d8d8;vertical-align:top;}
  .item-title{font-weight:700;}
  .item-detail{font-size:10px;color:var(--muted);margin-top:2px;}
  .c-num{width:30px;text-align:left;}
  .c-qty{width:50px;text-align:right;}
  .c-unit{width:90px;text-align:right;}
  .c-amt{width:100px;text-align:right;}
  th.c-qty,th.c-unit,th.c-amt{text-align:right;}
  td.c-qty,td.c-unit,td.c-amt{text-align:right;}
  .totals-wrap{display:flex;justify-content:flex-end;margin-top:22px;}
  .totals{width:280px;}
  .tot-row{display:flex;justify-content:space-between;padding:6px 4px;font-size:11px;letter-spacing:0.5px;border-bottom:0.5px solid #e2e2e2;}
  .tot-total{display:flex;justify-content:space-between;align-items:center;background:var(--grey);color:var(--ink);margin-top:10px;padding:12px 14px;font-size:15px;font-weight:800;letter-spacing:0.8px;}
  .footer-cols{display:flex;gap:34px;margin-top:40px;}
  .foot-col{flex:1;min-width:0;}
  .foot-label{font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;color:var(--ink);padding-bottom:8px;margin-bottom:8px;border-bottom:0.5px solid var(--ink);}
  .pay-row{display:flex;gap:10px;padding:3px 0;font-size:11px;}
  .pay-label{flex:0 0 100px;color:var(--muted);font-size:10px;}
  .pay-val{flex:1;font-weight:600;}
  .pay-extra{font-weight:600;}
  .pay-accept{margin-top:8px;font-size:10px;color:var(--muted);}
  .notes-text{font-size:11px;color:#333;white-space:normal;}
  .notes-terms{margin-top:8px;font-size:10px;color:var(--muted);}
  .thanks{display:flex;align-items:center;gap:16px;margin-top:46px;}
  .thanks .rule{flex:1;height:0;border-top:0.5px solid var(--ink);}
  .thanks .txt{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);white-space:nowrap;}
  </style></head><body>
    <div class="header">
      <div class="header-left">
        ${brandMark}
        ${taglineHtml}
        ${contactHtml}
        ${taxIdHtml}
      </div>
      <div class="header-right">
        <div class="doc-title">${esc(docLabel)}</div>
        ${metaHtml}
      </div>
    </div>

    <div class="parties">
      ${billToHtml}
      ${shipToHtml}
    </div>

    ${itemsHtml}

    <div class="totals-wrap">
      ${totalsHtml}
    </div>

    ${footColumns}

    <div class="thanks">
      <span class="rule"></span>
      <span class="txt">${esc(footerNote)}</span>
      <span class="rule"></span>
    </div>
  </body></html>`;
}
