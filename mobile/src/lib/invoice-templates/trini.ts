// "Trini" — flagship invoice template.
// Bold Trinidad & Tobago flag theme: RED #EF1B2D + BLACK #141414 on white,
// with the black diagonal band edged in white. Pure (settings, draft) => HTML,
// rendered to PDF by lib/invoice.ts via expo-print. No external resources.
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

const RED = '#EF1B2D';
const BLACK = '#141414';
const GREY = '#6b6b6b';
const LINE = '#e6e6e6';

const HEAVY =
  "-apple-system,'Arial Black','Segoe UI',Helvetica,sans-serif";
const BODY =
  "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const CURSIVE = "'Snell Roundhand','Brush Script MT',cursive";

// Tiny inline SVG icons (no external resources). Each tinted RED.
function icon(kind: 'pin' | 'phone' | 'mail' | 'web' | 'bank'): string {
  const common = `width="11" height="11" viewBox="0 0 24 24" fill="${RED}" style="vertical-align:-1px;margin-right:6px;flex:0 0 auto"`;
  switch (kind) {
    case 'pin':
      return `<svg ${common}><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`;
    case 'phone':
      return `<svg ${common}><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.1 2.2z"/></svg>`;
    case 'mail':
      return `<svg ${common}><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7L4 7v1l8 5 8-5V7l-8 5z"/></svg>`;
    case 'web':
      return `<svg ${common}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.5a15 15 0 0 0-1.3-3.2A8 8 0 0 1 18.9 8zM12 4c.8 1 1.5 2.4 1.9 4h-3.8C10.5 6.4 11.2 5 12 4zM4.3 14a7.8 7.8 0 0 1 0-4h2.9a17 17 0 0 0 0 4H4.3zm.8 2h2.5c.3 1.2.8 2.3 1.3 3.2A8 8 0 0 1 5.1 16zm2.5-8H5.1a8 8 0 0 1 3.8-3.2C8.4 5.7 8 6.8 7.6 8zM12 20c-.8-1-1.5-2.4-1.9-4h3.8c-.4 1.6-1.1 3-1.9 4zm2.3-6H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4zm.4 5.2c.5-1 1-2 1.3-3.2h2.5a8 8 0 0 1-3.8 3.2zM16.8 14a17 17 0 0 0 0-4h2.9a7.8 7.8 0 0 1 0 4h-2.9z"/></svg>`;
    case 'bank':
      return `<svg ${common}><path d="M12 2 2 7v2h20V7L12 2zM4 11v7H3v3h18v-3h-1v-7h-2v7h-3v-7h-2v7H9v-7H7v7H6v-7H4z"/></svg>`;
  }
}

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const t = computeTotals(d);
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];

  // ---- Brand / logo block ----
  const initials =
    (esc(s.businessName) || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'T';

  const brandMark = s.logoUrl
    ? `<img src="${esc(s.logoUrl)}" alt="" style="max-height:64px;max-width:180px;object-fit:contain;display:block"/>`
    : `<div style="width:64px;height:64px;border-radius:10px;background:${BLACK};color:#fff;font-family:${HEAVY};font-size:26px;font-weight:900;display:flex;align-items:center;justify-content:center;border:3px solid ${RED};box-sizing:border-box">${initials}</div>`;

  // ---- Contact lines (each with a small red icon) ----
  const contactList = contacts(s);
  const contactKinds: Array<'pin' | 'phone' | 'mail' | 'web'> = [];
  if (s.address) contactKinds.push('pin');
  if (s.contactPhone) contactKinds.push('phone');
  if (s.contactEmail) contactKinds.push('mail');
  if (s.website) contactKinds.push('web');
  const contactRows = contactList
    .map(
      (c, i) =>
        `<div style="display:flex;align-items:flex-start;font-size:10.5px;color:${BLACK};line-height:1.4;margin-top:3px">${icon(
          contactKinds[i] || 'pin'
        )}<span>${multiline(c)}</span></div>`
    )
    .join('');

  const taxIdRow = s.taxId
    ? `<div style="font-size:10px;color:${GREY};margin-top:6px;letter-spacing:.3px">VAT / TAX ID: ${esc(
        s.taxId
      )}</div>`
    : '';

  // ---- Invoice details rows (omit empty) ----
  const detailRow = (label: string, value?: string) =>
    value
      ? `<tr>
           <td style="padding:4px 12px 4px 0;font-size:9.5px;letter-spacing:.6px;text-transform:uppercase;color:${GREY};white-space:nowrap;vertical-align:top">${esc(
             label
           )}</td>
           <td style="width:1px;background:${LINE}"></td>
           <td style="padding:4px 0 4px 12px;font-size:11px;font-weight:700;color:${BLACK};text-align:right;vertical-align:top">${esc(
             value
           )}</td>
         </tr>`
      : '';

  const detailsRows = [
    detailRow('Invoice No.', d.number),
    detailRow('Issue Date', d.date),
    detailRow('Due Date', d.dueDate),
    detailRow('Payment Terms', d.paymentTerms),
  ].join('');

  // ---- Bill to ----
  const billInfo = d.customerInfo
    ? `<div style="font-size:11px;color:${BLACK};line-height:1.5;margin-top:3px">${multiline(
        d.customerInfo
      )}</div>`
    : '';

  // ---- Items ----
  const showNumbers = d.lines.length > 1;
  const itemRows = d.lines
    .map((l, i) => {
      const amount = (l.qty || 0) * (l.unitPrice || 0);
      const detail = l.detail
        ? `<div style="font-size:10px;color:${GREY};margin-top:2px;line-height:1.4">${multiline(
            l.detail
          )}</div>`
        : '';
      const num = showNumbers
        ? `<td style="padding:11px 8px;font-size:11px;color:${GREY};border-bottom:1px solid ${LINE};vertical-align:top;text-align:center;width:26px">${i +
            1}</td>`
        : '';
      return `<tr>
        ${num}
        <td style="padding:11px 8px;border-bottom:1px solid ${LINE};vertical-align:top">
          <div style="font-size:11.5px;font-weight:700;color:${BLACK};line-height:1.4">${multiline(
        l.description
      )}</div>
          ${detail}
        </td>
        <td style="padding:11px 8px;font-size:11px;color:${BLACK};border-bottom:1px solid ${LINE};vertical-align:top;text-align:center;white-space:nowrap">${l.qty ||
        0}</td>
        <td style="padding:11px 8px;font-size:11px;color:${BLACK};border-bottom:1px solid ${LINE};vertical-align:top;text-align:right;white-space:nowrap">${money(
        l.unitPrice
      )}</td>
        <td style="padding:11px 8px;font-size:11px;font-weight:700;color:${BLACK};border-bottom:1px solid ${LINE};vertical-align:top;text-align:right;white-space:nowrap">${money(
        amount
      )}</td>
      </tr>`;
    })
    .join('');

  const headNum = showNumbers
    ? `<th style="padding:10px 8px;text-align:center;width:26px">#</th>`
    : '';

  // ---- Totals ----
  const taxLabel =
    d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;
  const totalRow = (
    label: string,
    value: string,
    opts?: { strong?: boolean }
  ) =>
    `<tr>
       <td style="padding:5px 14px 5px 0;font-size:${
         opts?.strong ? '11px' : '10.5px'
       };letter-spacing:.5px;text-transform:uppercase;color:${
      opts?.strong ? BLACK : GREY
    };text-align:right">${label}</td>
       <td style="padding:5px 0;font-size:${
         opts?.strong ? '12px' : '11px'
       };font-weight:700;color:${BLACK};text-align:right;white-space:nowrap">${value}</td>
     </tr>`;

  const totalsRows = [
    totalRow('Subtotal', money(t.subtotal)),
    t.discount > 0 ? totalRow('Discount', `- ${money(t.discount)}`) : '',
    d.taxPct > 0 ? totalRow(taxLabel, money(t.tax)) : '',
  ].join('');

  // ---- Signature ----
  const signature = s.signatureName
    ? `<div style="margin-top:34px">
         <div style="font-family:${CURSIVE};font-size:30px;color:${BLACK};line-height:1">${esc(
        s.signatureName
      )}</div>
         <div style="border-top:1.5px solid ${BLACK};width:170px;margin-top:4px;padding-top:5px">
           <div style="font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:${BLACK}">${esc(
        s.signatureName
      )}</div>
           ${
             s.signatureTitle
               ? `<div style="font-size:9.5px;letter-spacing:.6px;text-transform:uppercase;color:${RED};margin-top:1px">${esc(
                   s.signatureTitle
                 )}</div>`
               : ''
           }
         </div>
       </div>`
    : '';

  // ---- Payment information ----
  const bankRow = (label: string, value?: string) =>
    value
      ? `<tr>
           <td style="padding:2px 14px 2px 0;font-size:9.5px;letter-spacing:.5px;text-transform:uppercase;color:${GREY};white-space:nowrap;vertical-align:top">${esc(
             label
           )}</td>
           <td style="padding:2px 0;font-size:10.5px;font-weight:600;color:${BLACK};vertical-align:top">${esc(
             value
           )}</td>
         </tr>`
      : '';

  const bankRows = [
    bankRow('Bank', s.bankName),
    bankRow('Account Name', s.bankAccountName),
    bankRow('Account No.', s.bankAccountNumber),
    bankRow('Routing', s.bankRouting),
    bankRow('SWIFT', s.bankSwift),
  ].join('');

  const hasBank =
    s.bankName ||
    s.bankAccountName ||
    s.bankAccountNumber ||
    s.bankRouting ||
    s.bankSwift;

  const alsoAccepted = s.paymentExtra
    ? `<div style="display:flex;align-items:flex-start;font-size:10px;color:${BLACK};margin-top:8px;line-height:1.4">${icon(
        'phone'
      )}<span><b>Also accepted:</b> ${esc(s.paymentExtra)}</span></div>`
    : '';

  const paymentBlock =
    hasBank || alsoAccepted
      ? `<div style="flex:1 1 0;min-width:0">
           <div style="display:flex;align-items:center;font-family:${HEAVY};font-size:11px;font-weight:900;letter-spacing:1px;color:${BLACK};text-transform:uppercase;margin-bottom:8px">${icon(
          'bank'
        )}<span>Payment Information</span></div>
           ${
             hasBank
               ? `<table style="border-collapse:collapse;width:100%">${bankRows}</table>`
               : ''
           }
           ${alsoAccepted}
         </div>`
      : '';

  const footer = s.footerNote
    ? `<div style="font-size:9.5px;color:${GREY};line-height:1.5;text-align:center;border-top:1px solid ${LINE};padding-top:10px;margin-top:18px">${multiline(
        s.footerNote
      )}</div>`
    : '';

  // ---- Decorative flag corners (rotated solid divs, no images) ----
  // TOP-RIGHT: red + black diagonal band edged white. BOTTOM-LEFT: smaller echo.
  const cornerTR = `
    <div style="position:absolute;top:-90px;right:-90px;width:300px;height:300px;pointer-events:none">
      <div style="position:absolute;inset:0;background:${RED};transform:rotate(45deg);transform-origin:center"></div>
      <div style="position:absolute;top:60px;left:0;width:300px;height:64px;background:#fff;transform:rotate(45deg);transform-origin:center"></div>
      <div style="position:absolute;top:60px;left:0;width:300px;height:48px;background:${BLACK};transform:rotate(45deg);transform-origin:center"></div>
    </div>`;
  const cornerBL = `
    <div style="position:absolute;bottom:-70px;left:-70px;width:210px;height:210px;pointer-events:none">
      <div style="position:absolute;inset:0;background:${RED};transform:rotate(45deg);transform-origin:center"></div>
      <div style="position:absolute;top:40px;left:0;width:210px;height:46px;background:#fff;transform:rotate(45deg);transform-origin:center"></div>
      <div style="position:absolute;top:40px;left:0;width:210px;height:34px;background:${BLACK};transform:rotate(45deg);transform-origin:center"></div>
    </div>`;

  const tagline = s.tagline
    ? `<div style="font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${RED};margin-top:2px">${esc(
        s.tagline
      )}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(docLabel)} ${esc(d.number)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${BODY};
    color: ${BLACK};
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 12px;
  }
  @page { margin: 0; }
  .page {
    position: relative;
    overflow: hidden;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    background: #fff;
    padding: 40px 44px 44px;
    min-height: 1040px;
  }
  .content { position: relative; z-index: 2; }
  h1.doc {
    font-family: ${HEAVY};
    font-weight: 900;
    font-size: 56px;
    line-height: .92;
    letter-spacing: -1px;
    color: ${RED};
    margin: 0 0 18px;
  }
  table { border-collapse: collapse; }
  .items thead th {
    background: ${RED};
    color: #fff;
    font-family: ${HEAVY};
    font-weight: 900;
    font-size: 9.5px;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-align: left;
    padding: 10px 8px;
  }
  .label {
    font-family: ${HEAVY};
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: ${RED};
    margin-bottom: 4px;
  }
</style>
</head>
<body>
  <div class="page">
    ${cornerTR}
    ${cornerBL}
    <div class="content">

      <!-- HEADER -->
      <h1 class="doc">${esc(docLabel)}</h1>

      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:30px">
        <div style="flex:0 0 auto">${brandMark}</div>
        <div style="flex:1 1 0;min-width:0">
          <div style="font-family:${HEAVY};font-size:19px;font-weight:900;color:${BLACK};line-height:1.1">${esc(
    s.businessName
  )}</div>
          ${tagline}
          ${contactRows}
          ${taxIdRow}
        </div>
      </div>

      <!-- BILL TO + DETAILS -->
      <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:26px">
        <div style="flex:1 1 0;min-width:0">
          <div class="label">Bill To</div>
          <div style="font-size:13px;font-weight:800;color:${BLACK}">${esc(
    d.customerName
  )}</div>
          ${billInfo}
        </div>
        <div style="flex:0 0 auto;min-width:240px;border:1px solid ${LINE};border-top:3px solid ${RED};border-radius:4px;padding:12px 16px">
          <div class="label" style="margin-bottom:8px">Invoice Details</div>
          <table style="width:100%">${detailsRows}</table>
        </div>
      </div>

      <!-- ITEMS -->
      <table class="items" style="width:100%;margin-bottom:4px">
        <thead>
          <tr>
            ${headNum}
            <th>Description</th>
            <th style="text-align:center;width:50px">Qty</th>
            <th style="text-align:right;width:96px">Unit Price</th>
            <th style="text-align:right;width:100px">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- TOTALS -->
      <div style="display:flex;justify-content:flex-end;margin-top:14px">
        <div style="min-width:280px;border-top:2.5px solid ${RED};padding-top:10px">
          <table style="width:100%">
            ${totalsRows}
          </table>
          <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid ${LINE};margin-top:8px;padding-top:10px">
            <div style="font-family:${HEAVY};font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${BLACK}">Total Due</div>
            <div style="font-family:${HEAVY};font-weight:900;font-size:24px;color:${RED};white-space:nowrap">${money(
    t.total
  )}</div>
          </div>
        </div>
      </div>

      <!-- SIGNATURE + THANK YOU -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px">
        <div style="flex:1 1 0;min-width:0">${signature}</div>
        <div style="flex:0 0 auto;text-align:right">
          <div style="font-family:${CURSIVE};font-size:38px;color:${RED};line-height:1">Thank You!</div>
          <div style="font-size:9.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${BLACK};margin-top:2px">For Your Business</div>
        </div>
      </div>

      <!-- PAYMENT -->
      ${
        paymentBlock
          ? `<div style="display:flex;gap:24px;margin-top:30px;border-top:1px solid ${LINE};padding-top:18px">${paymentBlock}</div>`
          : ''
      }

      ${footer}

    </div>
  </div>
</body>
</html>`;
}
