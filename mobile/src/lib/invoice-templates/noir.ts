// "Noir" — luxury black + gold invoice template.
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

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const BLACK = '#141414';
  const GOLD = '#C9A24B';
  const CREAM = '#FBF8F1';

  const title = DOC_LABEL[d.docType ?? 'invoice'];
  const totals = computeTotals(d);
  const lines = Array.isArray(d.lines) ? d.lines : [];

  // ---- Header left: black angled brand panel ------------------------------
  const brandInner = s.logoUrl
    ? `<img src="${esc(s.logoUrl)}" alt="" style="max-height:60px;max-width:240px;display:block;" />`
    : `<div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:${GOLD};line-height:1.1;">${esc(
        s.businessName,
      )}</div>`;

  const taglineHtml = s.tagline
    ? `<div style="margin-top:8px;color:${GOLD};font-size:9px;letter-spacing:3px;text-transform:uppercase;font-variant:small-caps;">${esc(
        s.tagline,
      )}</div>`
    : '';

  // ---- Business contact lines under header --------------------------------
  const contactLines = contacts(s)
    .map(
      (c) =>
        `<div style="font-size:10px;color:#555;line-height:1.5;">${multiline(c)}</div>`,
    )
    .join('');
  const taxIdHtml = s.taxId
    ? `<div style="font-size:10px;color:#555;line-height:1.5;">${esc(s.taxId)}</div>`
    : '';

  // ---- Right meta rows (gold bullet) --------------------------------------
  const metaRow = (label: string, value: string) =>
    `<tr>
      <td style="padding:3px 0;white-space:nowrap;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${GOLD};margin-right:8px;vertical-align:middle;"></span>
        <span style="font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BLACK};">${esc(
          label,
        )}</span>
      </td>
      <td style="padding:3px 0;text-align:right;font-size:11px;color:#333;">${esc(value)}</td>
    </tr>`;

  const metaRows = [
    metaRow('Invoice No.', d.number),
    metaRow('Issue Date', d.date),
    d.dueDate ? metaRow('Due Date', d.dueDate) : '',
  ].join('');

  // ---- Project / reference (gold labels, right side of bill-to) -----------
  const projRefBlocks: string[] = [];
  if (d.project) {
    projRefBlocks.push(
      `<div style="margin-bottom:8px;"><div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};">Project / Description</div><div style="font-size:11px;color:#333;margin-top:2px;">${esc(
        d.project,
      )}</div></div>`,
    );
  }
  if (d.reference) {
    projRefBlocks.push(
      `<div><div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};">PO / Reference</div><div style="font-size:11px;color:#333;margin-top:2px;">${esc(
        d.reference,
      )}</div></div>`,
    );
  }
  const projRefHtml = projRefBlocks.length
    ? `<td style="vertical-align:top;text-align:left;padding-left:24px;width:42%;">${projRefBlocks.join(
        '',
      )}</td>`
    : `<td style="width:42%;"></td>`;

  // ---- Bill to ------------------------------------------------------------
  const billInfo = d.customerInfo
    ? `<div style="font-size:11px;color:#444;line-height:1.5;margin-top:3px;">${multiline(
        d.customerInfo,
      )}</div>`
    : '';
  const billToHtml = `
    <td style="vertical-align:top;width:58%;">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};">Bill To</div>
      <div style="font-size:14px;font-weight:700;color:${BLACK};margin-top:4px;">${esc(
        d.customerName,
      )}</div>
      ${billInfo}
    </td>`;

  // ---- Items table --------------------------------------------------------
  const rows = lines
    .map((l, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : CREAM;
      const detail = l.detail
        ? `<div style="font-style:italic;color:#888;font-size:10px;margin-top:2px;">${esc(
            l.detail,
          )}</div>`
        : '';
      const lineTotal = (l.qty || 0) * (l.unitPrice || 0);
      return `<tr style="background:${bg};">
        <td style="padding:10px 8px;border-bottom:1px solid ${GOLD}33;text-align:center;font-size:11px;color:#666;width:6%;">${
        i + 1
      }</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${GOLD}33;">
          <div style="font-weight:700;color:${BLACK};font-size:11.5px;">${esc(l.description)}</div>
          ${detail}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid ${GOLD}33;text-align:center;font-size:11px;color:#444;width:10%;">${
        l.qty || 0
      }</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${GOLD}33;text-align:right;font-size:11px;color:#444;width:17%;">${money(
        l.unitPrice,
      )}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${GOLD}33;text-align:right;font-size:11px;font-weight:700;color:${BLACK};width:17%;">${money(
        lineTotal,
      )}</td>
      </tr>`;
    })
    .join('');

  // ---- Totals -------------------------------------------------------------
  const totalRow = (label: string, value: string) =>
    `<tr>
      <td style="padding:5px 14px;text-align:right;font-size:11px;color:#555;letter-spacing:0.5px;text-transform:uppercase;">${esc(
        label,
      )}</td>
      <td style="padding:5px 0;text-align:right;font-size:11px;color:#333;width:90px;">${esc(value)}</td>
    </tr>`;

  const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;
  const totalsRows = [
    totalRow('Subtotal', money(totals.subtotal)),
    totals.discount > 0 ? totalRow('Discount', `-${money(totals.discount)}`) : '',
    d.taxPct > 0 ? totalRow(taxLabel, money(totals.tax)) : '',
  ].join('');

  const totalDueBar = `
    <table style="width:100%;border-collapse:collapse;margin-top:6px;background:${BLACK};">
      <tr>
        <td style="padding:11px 14px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};">Total Due</td>
        <td style="padding:11px 14px;text-align:right;font-size:15px;font-weight:700;color:${GOLD};width:90px;white-space:nowrap;">${money(
          totals.total,
        )}</td>
      </tr>
    </table>`;

  // ---- Payment information (footer left) ----------------------------------
  const payRow = (label: string, value?: string) =>
    value
      ? `<div style="font-size:10px;color:#444;line-height:1.6;"><span style="color:${GOLD};font-weight:700;letter-spacing:0.5px;text-transform:uppercase;font-size:9px;">${esc(
          label,
        )}:</span> ${esc(value)}</div>`
      : '';

  const payRows = [
    payRow('Bank Name', s.bankName),
    payRow('Account Name', s.bankAccountName),
    payRow('Account Number', s.bankAccountNumber),
    payRow('Routing', s.bankRouting),
    payRow('SWIFT', s.bankSwift),
  ].join('');

  const payExtra = s.paymentExtra
    ? `<div style="font-size:10px;color:#444;line-height:1.6;margin-top:4px;">${multiline(
        s.paymentExtra,
      )}</div>`
    : '';
  const acceptNote = s.acceptNote
    ? `<div style="font-size:9.5px;color:#777;font-style:italic;margin-top:6px;">Accepted: ${esc(
        s.acceptNote,
      )}</div>`
    : '';

  const hasPayment =
    s.bankName ||
    s.bankAccountName ||
    s.bankAccountNumber ||
    s.bankRouting ||
    s.bankSwift ||
    s.paymentExtra ||
    s.acceptNote;

  const paymentBlock = hasPayment
    ? `<td style="vertical-align:top;width:50%;padding-right:18px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};margin-bottom:6px;">Payment Information</div>
        ${payRows}${payExtra}${acceptNote}
      </td>`
    : '';

  // ---- Terms & conditions (footer right) ----------------------------------
  const termsParts: string[] = [];
  if (d.notes) {
    termsParts.push(
      `<div style="font-size:10px;color:#444;line-height:1.6;">${multiline(d.notes)}</div>`,
    );
  }
  if (s.paymentTerms) {
    termsParts.push(
      `<div style="font-size:10px;color:#444;line-height:1.6;margin-top:6px;">${multiline(
        s.paymentTerms,
      )}</div>`,
    );
  }
  const hasTerms = termsParts.length > 0;
  const termsBlock = hasTerms
    ? `<td style="vertical-align:top;width:50%;padding-left:18px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};margin-bottom:6px;">Terms &amp; Conditions</div>
        ${termsParts.join('')}
      </td>`
    : '';

  const footerInfoRow =
    hasPayment || hasTerms
      ? `<table style="width:100%;border-collapse:collapse;margin-top:26px;"><tr>${paymentBlock}${termsBlock}</tr></table>`
      : '';

  const footerNote = s.footerNote
    ? `<div style="text-align:center;font-size:9.5px;color:#888;margin-top:18px;line-height:1.5;">${multiline(
        s.footerNote,
      )}</div>`
    : '';

  // ---- Document -----------------------------------------------------------
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system,'Segoe UI',Helvetica,Arial,sans-serif;
    color: ${BLACK};
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { padding: 0 36px 0 0; }
  h1,h2,h3 { font-family: Georgia,'Times New Roman',serif; }
  table { border-collapse: collapse; }
</style>
</head>
<body>
  <div class="page">

    <!-- HEADER -->
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:top;width:55%;padding:0;">
          <div style="position:relative;background:${BLACK};transform:skewX(-12deg);transform-origin:top left;padding:24px 44px 24px 36px;margin-left:-2px;">
            <div style="transform:skewX(12deg);">
              ${brandInner}
              ${taglineHtml}
            </div>
          </div>
        </td>
        <td style="vertical-align:top;text-align:right;padding:18px 36px 0 0;width:45%;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:40px;font-weight:700;letter-spacing:4px;color:${BLACK};line-height:1;">${esc(
            title,
          )}</div>
          <table style="width:100%;border-collapse:collapse;margin-top:14px;">
            ${metaRows}
          </table>
        </td>
      </tr>
    </table>

    <!-- BUSINESS CONTACT -->
    <div style="padding:18px 0 0 36px;">
      ${contactLines}
      ${taxIdHtml}
    </div>

    <!-- BILL TO + PROJECT/REF -->
    <table style="width:100%;border-collapse:collapse;margin:22px 0 0 0;padding-left:36px;">
      <tr>
        <td style="padding-left:36px;width:0;"></td>
        ${billToHtml}
        ${projRefHtml}
      </tr>
    </table>

    <!-- ITEMS -->
    <table style="width:100%;border-collapse:collapse;margin:24px 0 0 36px;width:calc(100% - 36px);">
      <thead>
        <tr style="background:${BLACK};">
          <th style="padding:10px 8px;text-align:center;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${GOLD};width:6%;">#</th>
          <th style="padding:10px 8px;text-align:left;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${GOLD};">Description</th>
          <th style="padding:10px 8px;text-align:center;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${GOLD};width:10%;">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${GOLD};width:17%;">Unit Price</th>
          <th style="padding:10px 8px;text-align:right;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${GOLD};width:17%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- TOTALS -->
    <table style="width:100%;border-collapse:collapse;margin-top:14px;padding-right:36px;">
      <tr>
        <td style="width:58%;"></td>
        <td style="width:42%;padding-right:36px;">
          <table style="width:100%;border-collapse:collapse;">
            ${totalsRows}
          </table>
          ${totalDueBar}
        </td>
      </tr>
    </table>

    <!-- FOOTER INFO -->
    <div style="padding:0 36px 0 36px;">
      ${footerInfoRow}
      ${footerNote}
    </div>

    <!-- APPRECIATION BAR -->
    <div style="background:${BLACK};margin-top:30px;padding:16px 0;text-align:center;">
      <span style="color:${GOLD};font-size:11px;font-weight:700;letter-spacing:5px;text-transform:uppercase;">We Appreciate Your Business</span>
    </div>

  </div>
</body>
</html>`;
}
