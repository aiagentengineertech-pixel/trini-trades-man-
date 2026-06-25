// "Corporate" invoice template — professional blue. Pure (settings, draft) => HTML.
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
  const PRIMARY = '#1F4FC4';
  const ACCENT = '#3A6FE0';
  const ZEBRA = '#EEF3FF';

  const lines = Array.isArray(d.lines) ? d.lines : [];
  const totals = computeTotals({ ...d, lines });

  // ---- Header: logo / business name + tagline -----------------------------
  const brandBlock = s.logoUrl
    ? `<img src="${s.logoUrl}" style="max-height:56px;max-width:200px;object-fit:contain"/>`
    : `<div class="biz-name">${esc(s.businessName)}</div>`;

  const tagline = s.tagline
    ? `<div class="tagline">${esc(s.tagline)}</div>`
    : '';

  // ---- Header: contact lines (right) --------------------------------------
  const contactLines = contacts(s);
  const icons = ['⌖', '☎', '✉', '🌐']; // ⌖ address, ☎ phone, ✉ email, 🌐 website
  const contactHtml = contactLines.length
    ? `<div class="contacts">${contactLines
        .map(
          (c, i) =>
            `<div class="cline"><span class="cicon">${
              icons[i] || '•'
            }</span><span>${multiline(c)}</span></div>`,
        )
        .join('')}</div>`
    : '';

  const taxId = s.taxId
    ? `<div class="taxid">${esc(s.taxId)}</div>`
    : '';

  // ---- Title + meta -------------------------------------------------------
  const title = DOC_LABEL[d.docType ?? 'invoice'];

  const metaRows: string[] = [];
  if (d.number) {
    metaRows.push(
      `<div class="mrow"><span class="mlabel">${title} #</span><span class="mval">${esc(
        d.number,
      )}</span></div>`,
    );
  }
  if (d.date) {
    metaRows.push(
      `<div class="mrow"><span class="mlabel">ISSUE DATE</span><span class="mval">${esc(
        d.date,
      )}</span></div>`,
    );
  }
  if (d.dueDate) {
    metaRows.push(
      `<div class="mrow"><span class="mlabel">DUE DATE</span><span class="mval">${esc(
        d.dueDate,
      )}</span></div>`,
    );
  }
  const metaHtml = metaRows.length
    ? `<div class="meta">${metaRows.join('')}</div>`
    : '';

  // ---- Bill to ------------------------------------------------------------
  const billDetails = d.customerInfo
    ? `<div class="bill-info">${multiline(d.customerInfo)}</div>`
    : '';
  const billTo = d.customerName || d.customerInfo
    ? `<div class="billto">
        <div class="billto-head"><span class="dot"></span>BILL TO</div>
        <div class="bill-name">${esc(d.customerName)}</div>
        ${billDetails}
      </div>`
    : '';

  // ---- Items --------------------------------------------------------------
  const itemRows = lines
    .map((l, i) => {
      const detail = l.detail
        ? `<div class="idetail">${esc(l.detail)}</div>`
        : '';
      const amount = (l.qty || 0) * (l.unitPrice || 0);
      return `<tr>
        <td class="c-num">${i + 1}</td>
        <td class="c-desc"><div class="idesc">${esc(
          l.description,
        )}</div>${detail}</td>
        <td class="c-qty">${esc(String(l.qty ?? 0))}</td>
        <td class="c-price">${money(l.unitPrice)}</td>
        <td class="c-amt">${money(amount)}</td>
      </tr>`;
    })
    .join('');

  const itemsTable = `<table class="items">
    <thead>
      <tr>
        <th class="c-num">#</th>
        <th class="c-desc">DESCRIPTION</th>
        <th class="c-qty">QTY</th>
        <th class="c-price">UNIT PRICE</th>
        <th class="c-amt">AMOUNT</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>`;

  // ---- Totals -------------------------------------------------------------
  const totalRows: string[] = [];
  totalRows.push(
    `<div class="trow"><span>SUBTOTAL</span><span>${money(
      totals.subtotal,
    )}</span></div>`,
  );
  if (totals.discount > 0) {
    totalRows.push(
      `<div class="trow"><span>DISCOUNT</span><span>-${money(
        totals.discount,
      )}</span></div>`,
    );
  }
  if ((d.taxPct || 0) > 0) {
    const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;
    totalRows.push(
      `<div class="trow"><span>${taxLabel}</span><span>${money(
        totals.tax,
      )}</span></div>`,
    );
  }
  const totalsHtml = `<div class="totals">
    ${totalRows.join('')}
    <div class="total-due"><span>TOTAL DUE</span><span>${money(
      totals.total,
    )}</span></div>
  </div>`;

  // ---- Payment information ------------------------------------------------
  const payRows: string[] = [];
  const pushPay = (label: string, val?: string) => {
    if (val) {
      payRows.push(
        `<div class="prow"><span class="plabel">${label}</span><span class="pval">${esc(
          val,
        )}</span></div>`,
      );
    }
  };
  pushPay('Bank Name', s.bankName);
  pushPay('Account Name', s.bankAccountName);
  pushPay('Account Number', s.bankAccountNumber);
  pushPay('Routing Number', s.bankRouting);
  pushPay('SWIFT', s.bankSwift);
  const payExtra = s.paymentExtra
    ? `<div class="pextra">${multiline(s.paymentExtra)}</div>`
    : '';
  const acceptPill = s.acceptNote
    ? `<div class="accept-pill">WE ACCEPT: ${esc(s.acceptNote)}</div>`
    : '';
  const hasPayment = payRows.length || payExtra || acceptPill;
  const paymentBlock = hasPayment
    ? `<div class="foot-col">
        <div class="foot-head">PAYMENT INFORMATION</div>
        ${payRows.join('')}
        ${payExtra}
        ${acceptPill}
      </div>`
    : '';

  // ---- Notes --------------------------------------------------------------
  const noteParts: string[] = [];
  if (d.notes) noteParts.push(multiline(d.notes));
  if (s.paymentTerms) noteParts.push(multiline(s.paymentTerms));
  const notesBlock = noteParts.length
    ? `<div class="foot-col">
        <div class="foot-head">NOTES</div>
        <div class="notes-body">${noteParts.join('<br/>')}</div>
      </div>`
    : '';

  const footerCols =
    paymentBlock || notesBlock
      ? `<div class="footer-grid">${paymentBlock}${notesBlock}</div>`
      : '';

  const footerNote = esc(s.footerNote) || 'Thank you for your business';

  // ---- Document -----------------------------------------------------------
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system,'Segoe UI',Helvetica,Arial,sans-serif;
    color: #1c2430;
    font-size: 12px;
    line-height: 1.45;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .band {
    position: relative;
    overflow: hidden;
    background: ${PRIMARY};
    color: #ffffff;
    padding: 22px 36px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .stripe {
    position: absolute;
    top: -40px;
    width: 26px;
    height: 220px;
    background: ${ACCENT};
    transform: skewX(-20deg);
    opacity: 0.85;
  }
  .stripe.s1 { right: 30px; }
  .stripe.s2 { right: 70px; opacity: 0.55; }
  .band-left { position: relative; z-index: 2; }
  .band-right { position: relative; z-index: 2; text-align: right; }
  .biz-name { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px; }
  .tagline {
    margin-top: 4px;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #BDD0FF;
    font-variant: small-caps;
  }
  .contacts { font-size: 10.5px; color: #ffffff; }
  .cline {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 3px;
  }
  .cicon { color: #BDD0FF; min-width: 12px; text-align: center; }
  .taxid { margin-top: 6px; font-size: 10px; color: #BDD0FF; }

  .body { padding: 28px 36px 36px; }
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 22px;
  }
  .doc-title {
    font-size: 34px;
    font-weight: 800;
    color: ${PRIMARY};
    letter-spacing: 1px;
    line-height: 1;
  }
  .meta {
    border-left: 4px solid ${PRIMARY};
    padding-left: 14px;
    min-width: 230px;
  }
  .mrow {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 2px 0;
  }
  .mlabel { font-weight: 700; text-transform: uppercase; font-size: 10.5px; color: #5a6473; letter-spacing: 0.5px; }
  .mval { text-align: right; font-weight: 600; color: #1c2430; }

  .billto { margin-bottom: 22px; }
  .billto-head {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.6px;
    color: ${PRIMARY};
    margin-bottom: 6px;
  }
  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${PRIMARY};
  }
  .bill-name { font-weight: 700; font-size: 14px; color: #1c2430; }
  .bill-info { margin-top: 3px; color: #5a6473; font-size: 11.5px; }

  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }
  table.items thead th {
    background: ${PRIMARY};
    color: #ffffff;
    text-transform: uppercase;
    font-size: 10.5px;
    letter-spacing: 0.5px;
    font-weight: 700;
    text-align: left;
    padding: 9px 10px;
  }
  table.items tbody td {
    padding: 9px 10px;
    border-bottom: 1px solid #E1E8F6;
    vertical-align: top;
  }
  table.items tbody tr:nth-child(even) { background: ${ZEBRA}; }
  .idesc { font-weight: 700; color: #1c2430; }
  .idetail { color: #6b7280; font-size: 11px; margin-top: 2px; }
  .c-num { width: 32px; text-align: center; color: #5a6473; }
  .c-qty { width: 56px; text-align: center; }
  .c-price { width: 100px; text-align: right; white-space: nowrap; }
  .c-amt { width: 110px; text-align: right; white-space: nowrap; font-weight: 600; }
  th.c-num, th.c-qty { text-align: center; }
  th.c-price, th.c-amt { text-align: right; }

  .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 26px; }
  .totals { width: 280px; }
  .trow {
    display: flex;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 12px;
    color: #3a4453;
  }
  .trow span:first-child { text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.4px; color: #5a6473; font-weight: 600; }
  .trow span:last-child { font-weight: 600; }
  .total-due {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${PRIMARY};
    color: #ffffff;
    padding: 11px 12px;
    margin-top: 6px;
    border-radius: 3px;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 0.4px;
  }

  .footer-grid {
    display: flex;
    gap: 32px;
    border-top: 2px solid ${ZEBRA};
    padding-top: 18px;
    margin-bottom: 24px;
  }
  .foot-col { flex: 1; }
  .foot-head {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.6px;
    color: ${PRIMARY};
    margin-bottom: 8px;
  }
  .prow { display: flex; justify-content: space-between; gap: 12px; padding: 2px 0; font-size: 11.5px; }
  .plabel { color: #5a6473; }
  .pval { font-weight: 600; text-align: right; }
  .pextra { margin-top: 6px; color: #3a4453; font-size: 11.5px; }
  .accept-pill {
    display: inline-block;
    margin-top: 10px;
    background: ${ZEBRA};
    color: ${PRIMARY};
    border: 1px solid ${ACCENT};
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .notes-body { color: #3a4453; font-size: 11.5px; }

  .thanks {
    text-align: center;
    color: ${PRIMARY};
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 12px;
    padding-top: 6px;
  }
</style>
</head>
<body>
  <div class="band">
    <div class="stripe s1"></div>
    <div class="stripe s2"></div>
    <div class="band-left">
      ${brandBlock}
      ${tagline}
    </div>
    <div class="band-right">
      ${contactHtml}
      ${taxId}
    </div>
  </div>

  <div class="body">
    <div class="title-row">
      <div class="doc-title">${title}</div>
      ${metaHtml}
    </div>

    ${billTo}

    ${itemsTable}

    <div class="totals-wrap">
      ${totalsHtml}
    </div>

    ${footerCols}

    <div class="thanks">${footerNote}</div>
  </div>
</body>
</html>`;
}
