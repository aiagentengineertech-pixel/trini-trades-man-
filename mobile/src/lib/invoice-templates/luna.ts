// "Luna" — elegant editorial invoice with a hand-painted watercolour brush.
// Navy ink on white with a pastel accent; shipped in 4 brush colours
// (blush / sage / lilac / slate). Decorative art on theme-assets/luna.
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

const ART = 'https://bhlflhyojzjzoksejekc.supabase.co/storage/v1/object/public/uploads/theme-assets/luna';
const V = '?v=1';

const NAVY = '#1C2740';
const INK = '#2A2F3A';
const GREY = '#7A8194';
const HAIR = '#E7E2E4';

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const CURSIVE = "'Snell Roundhand','Brush Script MT',cursive";

export interface LunaPalette {
  brush: string;   // brush asset filename
  accent: string;  // medium pastel (header band, dots)
  soft: string;    // pale wash (logo ring, item zebra)
}

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function renderLuna(s: InvoiceSettings, d: InvoiceDraft, pal: LunaPalette): string {
  const totals = computeTotals(d);
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];

  // ---- Header meta rows (omit empties) ----
  const metaRows: Array<[string, string]> = [];
  if (d.number) metaRows.push(['INVOICE NO.', d.number]);
  if (d.date) metaRows.push(['ISSUE DATE', d.date]);
  if (d.dueDate) metaRows.push(['DUE DATE', d.dueDate]);
  if (d.paymentTerms) metaRows.push(['PAYMENT TERMS', d.paymentTerms]);
  const metaHtml = metaRows
    .map(([k, v]) => `<tr><td class="meta-k">${esc(k)}</td><td class="meta-v">${esc(v)}</td></tr>`)
    .join('');

  // ---- Logo holder (default = accent ring + initials) ----
  const logoHtml = s.logoUrl
    ? `<div class="logo"><img src="${esc(s.logoUrl)}" alt=""/></div>`
    : `<div class="logo logo-fallback">${esc(initials(s.businessName))}</div>`;

  const taglineHtml = s.tagline ? `<div class="tagline">${esc(s.tagline)}</div>` : '';
  const contactHtml = contacts(s)
    .map((c) => `<div class="contact"><span class="dot"></span><span>${esc(c)}</span></div>`)
    .join('');
  const taxIdHtml = s.taxId ? `<div class="taxid">${esc(s.taxId)}</div>` : '';

  const billInfoHtml = d.customerInfo
    ? `<div class="bill-info">${multiline(d.customerInfo)}</div>`
    : '';

  // ---- Items ----
  const itemRows = d.lines
    .map((l) => {
      const detail = l.detail ? `<div class="it-detail">${esc(l.detail)}</div>` : '';
      const amount = (l.qty || 0) * (l.unitPrice || 0);
      return (
        `<tr>` +
        `<td class="it-desc"><div class="it-title">${esc(l.description)}</div>${detail}</td>` +
        `<td class="it-num">${esc(String(l.qty ?? ''))}</td>` +
        `<td class="it-num">${money(l.unitPrice)}</td>` +
        `<td class="it-num it-amt">${money(amount)}</td>` +
        `</tr>`
      );
    })
    .join('');

  // ---- Totals ----
  const totalRows: string[] = [];
  totalRows.push(`<tr><td class="t-k">SUBTOTAL</td><td class="t-v">${money(totals.subtotal)}</td></tr>`);
  if (totals.discount > 0) {
    totalRows.push(`<tr><td class="t-k">DISCOUNT</td><td class="t-v">-${money(totals.discount)}</td></tr>`);
  }
  if ((d.taxPct || 0) > 0) {
    const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;
    totalRows.push(`<tr><td class="t-k">${esc(taxLabel)}</td><td class="t-v">${money(totals.tax)}</td></tr>`);
  }
  const totalsHtml = totalRows.join('');

  // ---- Signature ----
  const signatureHtml = s.signatureName
    ? `<div class="sign">` +
      `<div class="sign-name">${esc(s.signatureName)}</div>` +
      `<div class="sign-line"></div>` +
      (s.signatureTitle ? `<div class="sign-title">${esc(s.signatureTitle)}</div>` : '') +
      `</div>`
    : '';

  // ---- Payment information ----
  const bankRows: Array<[string, string | undefined]> = [
    ['Bank', s.bankName],
    ['Account Name', s.bankAccountName],
    ['Account No.', s.bankAccountNumber],
    ['Routing', s.bankRouting],
    ['SWIFT', s.bankSwift],
  ];
  const bankHtml = bankRows
    .filter(([, v]) => !!v)
    .map(
      ([k, v]) =>
        `<div class="pay-row"><span class="pay-k">${esc(k)}</span><span class="pay-v">${esc(
          v as string
        )}</span></div>`
    )
    .join('');
  const extraHtml = s.paymentExtra
    ? `<div class="pay-row"><span class="pay-v pay-extra">${esc(s.paymentExtra)}</span></div>`
    : '';
  const hasPayment = !!(bankHtml || extraHtml);
  const paymentBlock = hasPayment
    ? `<div class="pay"><div class="pay-head">PAYMENT INFORMATION</div>${bankHtml}${extraHtml}</div>`
    : '';

  // ---- Notes ----
  const noteText = d.notes || s.paymentTerms;
  const notesHtml = noteText
    ? `<div class="notes"><div class="notes-head">NOTES</div><div class="notes-body">${multiline(
        noteText
      )}</div></div>`
    : '';

  const footerNoteHtml = s.footerNote ? `<div class="foot-note">${multiline(s.footerNote)}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=800"/>
<title>${esc(docLabel)} ${esc(d.number || '')}</title>
<style>
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    font-family: ${SANS};
    color: ${INK};
    background: #ffffff;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 44px 48px 38px;
    overflow: hidden;
  }
  /* hand-painted brush behind the masthead */
  .brush {
    position: absolute;
    top: 14px;
    left: 26px;
    width: 440px;
    transform: rotate(-7deg);
    z-index: 0;
    pointer-events: none;
  }
  .page > *:not(.brush) { position: relative; z-index: 1; }

  /* ===== Top band ===== */
  .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
  .doc-title {
    font-family: ${SERIF};
    color: ${NAVY};
    font-size: 58px;
    line-height: 0.9;
    letter-spacing: 2px;
    font-weight: 400;
    margin: 0;
  }
  .doc-underline { width: 88px; height: 5px; background: ${pal.accent}; margin-top: 14px; border-radius: 3px; }
  .meta { border-collapse: collapse; min-width: 230px; }
  .meta td { padding: 4px 0; vertical-align: top; }
  .meta-k {
    font-weight: 700; color: ${NAVY}; text-transform: uppercase; letter-spacing: 0.7px;
    font-size: 9.5px; padding-right: 18px; border-right: 1px solid ${HAIR}; white-space: nowrap;
  }
  .meta-v { color: ${INK}; font-size: 11px; padding-left: 18px; text-align: right; }

  /* ===== Identity / Bill to ===== */
  .id-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 36px; margin-bottom: 28px; }
  .id-left { display: flex; gap: 16px; align-items: flex-start; max-width: 60%; }
  .logo {
    width: 66px; height: 66px; min-width: 66px; border-radius: 50%;
    background: #fff; border: 2px solid ${pal.accent}; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .logo img { width: 66px; height: 66px; object-fit: cover; border-radius: 50%; display: block; }
  .logo-fallback { font-family: ${CURSIVE}; color: ${NAVY}; font-size: 30px; line-height: 1; }
  .biz-name {
    font-family: ${SERIF}; color: ${NAVY}; text-transform: uppercase; letter-spacing: 3px;
    font-size: 17px; font-weight: 700; margin: 2px 0;
  }
  .tagline { font-style: italic; color: ${GREY}; font-size: 11.5px; margin-bottom: 8px; }
  .contact { display: flex; align-items: center; gap: 7px; color: ${INK}; font-size: 10.5px; margin-top: 3px; }
  .contact .dot { width: 6px; height: 6px; border-radius: 50%; background: ${pal.accent}; display: inline-block; flex: 0 0 auto; }
  .taxid { margin-top: 7px; font-size: 10px; color: ${GREY}; letter-spacing: 0.3px; }
  .bill { text-align: right; max-width: 40%; }
  .bill-label { color: ${pal.accent}; font-weight: 700; letter-spacing: 1.6px; font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
  .bill-name { font-weight: 700; color: ${NAVY}; font-size: 13px; }
  .bill-info { color: ${INK}; font-size: 11px; margin-top: 4px; line-height: 1.55; }

  /* ===== Items ===== */
  .items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .items thead th {
    background: ${pal.accent}; color: ${NAVY}; text-transform: uppercase; letter-spacing: 1px;
    font-size: 9.5px; font-weight: 700; text-align: left; padding: 10px 14px;
  }
  .items thead th.r { text-align: right; }
  .items tbody td { padding: 13px 14px; border-bottom: 1px solid ${HAIR}; vertical-align: top; }
  .items tbody tr:nth-child(even) td { background: ${pal.soft}55; }
  .it-title { font-weight: 700; color: ${NAVY}; font-size: 12px; }
  .it-detail { color: ${GREY}; font-size: 10.5px; margin-top: 3px; }
  .it-num { text-align: right; white-space: nowrap; font-size: 11.5px; }
  .it-amt { font-weight: 700; color: ${NAVY}; }

  /* ===== Totals ===== */
  .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 22px; }
  .totals { border-collapse: collapse; min-width: 280px; }
  .totals td { padding: 6px 0; }
  .t-k { color: ${GREY}; text-transform: uppercase; letter-spacing: 0.8px; font-size: 10px; font-weight: 700; }
  .t-v { text-align: right; font-size: 11.5px; color: ${INK}; }
  .totals tr.total-due td { padding-top: 12px; border-top: 1.5px solid ${NAVY}; }
  .totals tr.total-due .t-k { color: ${NAVY}; font-size: 12px; }
  .totals tr.total-due .t-v { color: ${NAVY}; font-family: ${SERIF}; font-size: 22px; font-weight: 700; }

  /* ===== Signature ===== */
  .sign { margin: 6px 0 22px; max-width: 240px; }
  .sign-name { font-family: ${CURSIVE}; color: ${NAVY}; font-size: 30px; line-height: 1; padding-bottom: 4px; }
  .sign-line { height: 1px; background: ${NAVY}; opacity: 0.5; }
  .sign-title { margin-top: 6px; text-transform: uppercase; letter-spacing: 1.2px; font-size: 9.5px; color: ${GREY}; font-weight: 700; }

  /* ===== Notes ===== */
  .notes { margin-bottom: 22px; max-width: 60%; }
  .notes-head { color: ${NAVY}; text-transform: uppercase; letter-spacing: 1.2px; font-size: 10px; font-weight: 700; margin-bottom: 5px; }
  .notes-body { color: ${INK}; font-size: 11px; line-height: 1.55; }

  /* ===== Footer ===== */
  .footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 36px; margin-top: 8px; padding-top: 18px; border-top: 1px solid ${HAIR}; }
  .thanks-img { width: 230px; max-width: 48vw; height: auto; display: block; }
  .pay { text-align: right; min-width: 240px; }
  .pay-head { color: ${NAVY}; text-transform: uppercase; letter-spacing: 1.4px; font-size: 10px; font-weight: 700; margin-bottom: 8px; }
  .pay-row { display: flex; justify-content: space-between; gap: 16px; font-size: 10.5px; padding: 2px 0; }
  .pay-k { color: ${GREY}; } .pay-v { color: ${INK}; font-weight: 600; } .pay-extra { font-weight: 600; }
  .foot-note { text-align: center; color: ${GREY}; font-size: 9.5px; margin-top: 14px; line-height: 1.5; }
</style>
</head>
<body>
  <div class="page">
    <img class="brush" src="${ART}/${pal.brush}${V}" alt=""/>

    <div class="top">
      <div>
        <h1 class="doc-title">${esc(docLabel)}</h1>
        <div class="doc-underline"></div>
      </div>
      ${metaHtml ? `<table class="meta"><tbody>${metaHtml}</tbody></table>` : ''}
    </div>

    <div class="id-row">
      <div class="id-left">
        ${logoHtml}
        <div>
          ${s.businessName ? `<div class="biz-name">${esc(s.businessName)}</div>` : ''}
          ${taglineHtml}
          ${contactHtml}
          ${taxIdHtml}
        </div>
      </div>
      <div class="bill">
        <div class="bill-label">Bill To</div>
        ${d.customerName ? `<div class="bill-name">${esc(d.customerName)}</div>` : ''}
        ${billInfoHtml}
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="r">Qty</th>
          <th class="r">Unit Price</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="totals-wrap">
      <table class="totals"><tbody>
        ${totalsHtml}
        <tr class="total-due"><td class="t-k">TOTAL DUE</td><td class="t-v">${money(totals.total)}</td></tr>
      </tbody></table>
    </div>

    ${signatureHtml}
    ${notesHtml}

    <div class="footer">
      <img class="thanks-img" src="${ART}/thankyou.png${V}" alt="Thank you for your business"/>
      ${paymentBlock}
    </div>

    ${footerNoteHtml}
  </div>
</body>
</html>`;
}

const BLUSH: LunaPalette = { brush: 'brush-blush.png', accent: '#E7B7B5', soft: '#F6E4E4' };
const SAGE: LunaPalette = { brush: 'brush-sage.png', accent: '#A9B79A', soft: '#EBF0E6' };
const LILAC: LunaPalette = { brush: 'brush-lilac.png', accent: '#B9A2DA', soft: '#EEE7F7' };
const SLATE: LunaPalette = { brush: 'brush-slate.png', accent: '#8197BC', soft: '#E7ECF3' };

export const renderLunaBlush = (s: InvoiceSettings, d: InvoiceDraft) => renderLuna(s, d, BLUSH);
export const renderLunaSage = (s: InvoiceSettings, d: InvoiceDraft) => renderLuna(s, d, SAGE);
export const renderLunaLilac = (s: InvoiceSettings, d: InvoiceDraft) => renderLuna(s, d, LILAC);
export const renderLunaSlate = (s: InvoiceSettings, d: InvoiceDraft) => renderLuna(s, d, SLATE);
