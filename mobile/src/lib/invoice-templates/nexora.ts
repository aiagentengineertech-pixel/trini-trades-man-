// "Nexora" invoice template — modern purple + teal, agency-style.
// Pure function (settings, draft) => standalone HTML document for expo-print → PDF.
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

// ---- palette -------------------------------------------------------------
const PURPLE = '#6B2FB3';
const TEAL = '#16A89B';
const ZEBRA = '#F4F1FA';
const INK = '#2A2533';
const MUTED = '#7C7689';

// Small purple/teal circle glyph used to lead meta + section labels.
const dot = (color: string) =>
  `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:7px;vertical-align:middle;"></span>`;

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const totals = computeTotals(d);
  const docTitle = DOC_LABEL[d.docType ?? 'invoice'];

  // ---- header brand block ------------------------------------------------
  const brand = s.logoUrl
    ? `<img src="${esc(s.logoUrl)}" alt="" style="max-height:56px;max-width:240px;display:block;"/>`
    : `<div style="font-size:24px;font-weight:800;color:${PURPLE};line-height:1.1;">${esc(
        s.businessName,
      )}</div>`;

  const subLabel = s.logoUrl
    ? `<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:${TEAL};text-transform:uppercase;margin-top:8px;">${esc(
        s.businessName,
      )}</div>`
    : '';

  const tagline = s.tagline
    ? `<div style="font-size:11px;color:${MUTED};line-height:1.5;margin-top:6px;max-width:320px;">${esc(
        s.tagline,
      )}</div>`
    : '';

  const headerContacts = contacts(s)
    .map(
      (c) =>
        `<div style="font-size:10.5px;color:${MUTED};line-height:1.6;">${esc(c)}</div>`,
    )
    .join('');

  const taxId = s.taxId
    ? `<div style="font-size:10.5px;color:${MUTED};line-height:1.6;">VAT/TIN: ${esc(
        s.taxId,
      )}</div>`
    : '';

  // ---- meta list (top-right) --------------------------------------------
  const metaRows: string[][] = [];
  const metaRow = (label: string, value: string, last: boolean) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;${
      last ? '' : `border-bottom:1px dotted #C9BEE0;`
    }">
       <span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:${INK};">${dot(
         PURPLE,
       )}${label}</span>
       <span style="font-size:11px;color:${INK};text-align:right;">${value}</span>
     </div>`;

  metaRows.push(['INVOICE NO.', esc(d.number)]);
  metaRows.push(['ISSUE DATE', esc(d.date)]);
  if (d.dueDate) metaRows.push(['DUE DATE', esc(d.dueDate)]);
  const metaHtml = metaRows
    .map((r, i) => metaRow(r[0], r[1], i === metaRows.length - 1))
    .join('');

  // ---- bill-to / project mid row ----------------------------------------
  const billTo = `
    <div style="flex:1;padding-right:24px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${TEAL};text-transform:uppercase;margin-bottom:6px;">${dot(
        TEAL,
      )}Bill To</div>
      <div style="font-size:13px;font-weight:700;color:${INK};line-height:1.4;">${esc(
        d.customerName,
      )}</div>
      ${
        d.customerInfo
          ? `<div style="font-size:11px;color:${MUTED};line-height:1.5;margin-top:3px;">${multiline(
              d.customerInfo,
            )}</div>`
          : ''
      }
    </div>`;

  const projectBlock = d.project
    ? `<div style="flex:1;padding-left:24px;border-left:1px solid #E7E0F2;">
         <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${PURPLE};text-transform:uppercase;margin-bottom:6px;">${dot(
           PURPLE,
         )}Project / Service</div>
         <div style="font-size:11px;color:${INK};line-height:1.5;">${multiline(
           d.project,
         )}</div>
       </div>`
    : '';

  // ---- items table -------------------------------------------------------
  const itemRows = d.lines
    .map((l, i) => {
      const bg = i % 2 === 1 ? ZEBRA : '#FFFFFF';
      const detail = l.detail
        ? `<div style="font-size:10px;color:${MUTED};line-height:1.4;margin-top:2px;">${esc(
            l.detail,
          )}</div>`
        : '';
      return `<tr style="background:${bg};">
        <td style="padding:9px 10px;font-size:11px;color:${INK};text-align:center;width:34px;">${
          i + 1
        }</td>
        <td style="padding:9px 10px;">
          <div style="font-size:11.5px;font-weight:700;color:${INK};line-height:1.4;">${esc(
            l.description,
          )}</div>${detail}
        </td>
        <td style="padding:9px 10px;font-size:11px;color:${INK};text-align:center;width:52px;">${
          l.qty
        }</td>
        <td style="padding:9px 10px;font-size:11px;color:${INK};text-align:right;width:96px;">${money(
          l.unitPrice,
        )}</td>
        <td style="padding:9px 10px;font-size:11px;font-weight:700;color:${INK};text-align:right;width:108px;">${money(
          (l.qty || 0) * (l.unitPrice || 0),
        )}</td>
      </tr>`;
    })
    .join('');

  // ---- totals ------------------------------------------------------------
  const totalLine = (label: string, value: string) =>
    `<div style="display:flex;justify-content:space-between;padding:7px 14px;background:${ZEBRA};border-radius:6px;margin-bottom:5px;">
       <span style="font-size:11px;color:${MUTED};font-weight:600;">${label}</span>
       <span style="font-size:11px;color:${INK};font-weight:600;">${value}</span>
     </div>`;

  const totalsRows: string[] = [];
  totalsRows.push(totalLine('SUBTOTAL', money(totals.subtotal)));
  if (totals.discount > 0)
    totalsRows.push(totalLine('DISCOUNT', `- ${money(totals.discount)}`));
  if (d.taxPct > 0) {
    const taxLabel =
      d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;
    totalsRows.push(totalLine(taxLabel, money(totals.tax)));
  }

  const totalDue = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;background:${TEAL};border-radius:8px;margin-top:3px;">
      <span style="font-size:12px;color:#FFFFFF;font-weight:800;letter-spacing:0.5px;">TOTAL DUE</span>
      <span style="font-size:15px;color:#FFFFFF;font-weight:800;">${money(
        totals.total,
      )}</span>
    </div>`;

  // ---- payment details ---------------------------------------------------
  type Pay = { label: string; value?: string | null };
  const payFields: Pay[] = [
    { label: 'Bank Name', value: s.bankName },
    { label: 'Account Name', value: s.bankAccountName },
    { label: 'Account Number', value: s.bankAccountNumber },
    { label: 'SWIFT', value: s.bankSwift },
    { label: 'Routing', value: s.bankRouting },
  ];
  const payRows = payFields
    .filter((p) => p.value)
    .map(
      (p) =>
        `<div style="display:flex;padding:3px 0;">
           <span style="font-size:10.5px;color:${MUTED};width:120px;font-weight:600;">${esc(
             p.label,
           )}</span>
           <span style="font-size:10.5px;color:${INK};flex:1;">${esc(
             p.value as string,
           )}</span>
         </div>`,
    )
    .join('');

  const payExtra = s.paymentExtra
    ? `<div style="font-size:10.5px;color:${INK};line-height:1.5;margin-top:5px;">${multiline(
        s.paymentExtra,
      )}</div>`
    : '';

  const paymentSection =
    payRows || payExtra
      ? `<div style="margin-bottom:14px;">
           <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${TEAL};text-transform:uppercase;margin-bottom:8px;">${dot(
             TEAL,
           )}Payment Details</div>
           ${payRows}${payExtra}
         </div>`
      : '';

  const callout = `
    <div style="border:1.5px solid ${TEAL};border-radius:8px;padding:11px 13px;background:#EAFBF9;">
      <div style="font-size:10.5px;color:#0E7167;line-height:1.5;">Please make payment by the due date. Thank you for your business!</div>
    </div>`;

  // ---- notes -------------------------------------------------------------
  const noteItems: string[] = [];
  if (d.notes) {
    d.notes
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean)
      .forEach((n) => noteItems.push(esc(n)));
  }
  if (s.paymentTerms) noteItems.push(esc(s.paymentTerms));

  const notesSection = noteItems.length
    ? `<div>
         <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${PURPLE};text-transform:uppercase;margin-bottom:8px;">${dot(
           PURPLE,
         )}Notes</div>
         <ul style="margin:0;padding-left:16px;">
           ${noteItems
             .map(
               (n) =>
                 `<li style="font-size:10.5px;color:${INK};line-height:1.55;margin-bottom:4px;">${n}</li>`,
             )
             .join('')}
         </ul>
       </div>`
    : '';

  // ---- footer (split purple / teal) -------------------------------------
  const footHalf = (color: string, rows: string[]) =>
    `<div style="flex:1;background:${color};padding:13px 18px;">
       ${rows
         .map(
           (r) =>
             `<div style="font-size:10px;color:#FFFFFF;line-height:1.7;opacity:0.96;">${r}</div>`,
         )
         .join('')}
     </div>`;

  const leftFoot: string[] = [];
  if (s.website) leftFoot.push(`&#9679; ${esc(s.website)}`);
  if (s.contactEmail) leftFoot.push(`&#9993; ${esc(s.contactEmail)}`);
  const rightFoot: string[] = [];
  if (s.contactPhone) rightFoot.push(`&#9742; ${esc(s.contactPhone)}`);
  if (s.address) rightFoot.push(`&#9678; ${esc(s.address)}`);

  const footerNote = s.footerNote
    ? `<div style="text-align:center;font-size:9.5px;color:${MUTED};padding:10px 0 0;">${esc(
        s.footerNote,
      )}</div>`
    : '';

  const footer =
    leftFoot.length || rightFoot.length
      ? `<div style="display:flex;border-radius:10px;overflow:hidden;margin-top:18px;">
           ${footHalf(PURPLE, leftFoot.length ? leftFoot : ['&nbsp;'])}
           ${footHalf(TEAL, rightFoot.length ? rightFoot : ['&nbsp;'])}
         </div>`
      : '';

  // ---- document ----------------------------------------------------------
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(docTitle)} ${esc(d.number)}</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: ${INK};
    background: #FFFFFF;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { max-width: 760px; margin: 0 auto; padding: 32px 36px 28px; }
  table { border-collapse: collapse; width: 100%; }
  .items thead th {
    background: ${PURPLE};
    color: #FFFFFF;
    text-transform: uppercase;
    font-size: 9.5px;
    letter-spacing: 0.6px;
    font-weight: 700;
    padding: 10px;
  }
  .items thead th:first-child { border-top-left-radius: 10px; }
  .items thead th:last-child { border-top-right-radius: 10px; }
  .items { border-radius: 10px; overflow: hidden; }
</style>
</head>
<body>
  <div class="page">

    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;">
      <div style="flex:1;padding-right:24px;">
        ${brand}
        ${subLabel}
        ${tagline}
        <div style="margin-top:10px;">${headerContacts}${taxId}</div>
      </div>
      <div style="width:240px;">
        <div style="text-align:right;">
          <div style="font-size:34px;font-weight:800;color:${PURPLE};letter-spacing:1px;line-height:1;">${esc(
            docTitle,
          )}</div>
          <div style="height:0;border-top:2px dotted ${TEAL};width:90px;margin:7px 0 14px auto;"></div>
        </div>
        ${metaHtml}
      </div>
    </div>

    <!-- BILL TO / PROJECT -->
    <div style="display:flex;margin-bottom:24px;">
      ${billTo}
      ${projectBlock}
    </div>

    <!-- ITEMS -->
    <table class="items">
      <thead>
        <tr>
          <th style="text-align:center;width:34px;">#</th>
          <th style="text-align:left;">Description</th>
          <th style="text-align:center;width:52px;">Qty</th>
          <th style="text-align:right;width:96px;">Unit Price</th>
          <th style="text-align:right;width:108px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:flex-end;margin-top:18px;">
      <div style="width:280px;">
        ${totalsRows.join('')}
        ${totalDue}
      </div>
    </div>

    <!-- PAYMENT / NOTES -->
    <div style="display:flex;margin-top:26px;gap:28px;">
      <div style="flex:1;">
        ${paymentSection}
        ${callout}
      </div>
      <div style="flex:1;">
        ${notesSection}
      </div>
    </div>

    ${footer}
    ${footerNote}

  </div>
</body>
</html>`;
}
