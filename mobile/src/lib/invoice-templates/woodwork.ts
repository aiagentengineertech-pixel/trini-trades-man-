// "Woodwork" — illustrated rustic theme for carpenters/woodworkers.
// Decorative art is hosted on Supabase Storage; the live data is laid on top.
import { computeTotals, contacts, DOC_LABEL, esc, money, multiline, type InvoiceDraft, type InvoiceSettings } from './shared';

const ART = 'https://bhlflhyojzjzoksejekc.supabase.co/storage/v1/object/public/uploads/theme-assets/woodwork';
const V = '?v=2'; // cache-buster: art is now background-removed (transparent)
const INK = '#4A3220';
const BROWN = '#6E4A28';
const ACCENT = '#8B5E34';
const CREAM = '#FBF1DF';
const n = (v: number) => (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const { subtotal, discount, tax, total } = computeTotals(d);
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];
  const biz = esc(s.businessName || 'Your Business');
  const initial = esc((s.businessName || 'W').trim().charAt(0).toUpperCase());

  // Logo sits inside the wood-slice ring. Use the uploaded logo if present,
  // else the business initial over the crossed chisels.
  const ringInner = s.logoUrl
    ? `<img src="${s.logoUrl}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48%;height:48%;object-fit:contain"/>`
    : `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
         <img src="${ART}/chisels.png${V}" style="width:54px;opacity:.9"/>
         <div style="font-family:Georgia,serif;font-weight:700;font-size:40px;color:${INK};line-height:.6;margin-top:-30px">${initial}</div>
       </div>`;

  const icon = (path: string) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="${ACCENT}" style="margin-right:8px;flex:0 0 auto;vertical-align:-1px">${path}</svg>`;
  const PIN = '<path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>';
  const PHONE = '<path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.1 2.2z"/>';
  const MAIL = '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7L4 7v1l8 5 8-5V7l-8 5z"/>';
  const WEB = '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.5a15 15 0 0 0-1.3-3.2A8 8 0 0 1 18.9 8zM12 4c.8 1 1.5 2.4 1.9 4h-3.8C10.5 6.4 11.2 5 12 4zM4.3 14a7.8 7.8 0 0 1 0-4h2.9a17 17 0 0 0 0 4H4.3zm.8 2h2.5c.3 1.2.8 2.3 1.3 3.2A8 8 0 0 1 5.1 16zm2.5-8H5.1a8 8 0 0 1 3.8-3.2C8.4 5.7 8 6.8 7.6 8zM12 20c-.8-1-1.5-2.4-1.9-4h3.8c-.4 1.6-1.1 3-1.9 4zm2.3-6H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4zm.4 5.2c.5-1 1-2 1.3-3.2h2.5a8 8 0 0 1-3.8 3.2zM16.8 14a17 17 0 0 0 0-4h2.9a7.8 7.8 0 0 1 0 4h-2.9z"/>';

  const contactRows = [
    s.contactPhone ? `<div class="crow">${icon(PHONE)}<span>${esc(s.contactPhone)}</span></div>` : '',
    s.contactEmail ? `<div class="crow">${icon(MAIL)}<span>${esc(s.contactEmail)}</span></div>` : '',
    s.address ? `<div class="crow">${icon(PIN)}<span>${multiline(s.address)}</span></div>` : '',
    s.website ? `<div class="crow">${icon(WEB)}<span>${esc(s.website)}</span></div>` : '',
  ].join('');

  const metaRow = (label: string, value?: string) =>
    value ? `<div class="mrow"><span class="ml">${esc(label)}</span><span class="mv">${esc(value)}</span></div>` : '';
  const meta = metaRow('Invoice No.', d.number) + metaRow('Issue Date', d.date) + metaRow('Due Date', d.dueDate) + metaRow('Reference', d.reference);

  const projectBlock = (d.project || d.reference)
    ? `<div style="flex:1"><div class="sec">Project</div><div style="font-size:12.5px;color:${INK};line-height:1.5">${multiline(d.project)}${d.reference ? `<br/>PO No. ${esc(d.reference)}` : ''}</div></div>`
    : '';

  const rows = d.lines.map((l) => `<tr>
      <td class="c qty">${l.qty}</td>
      <td class="c"><div class="ld">${esc(l.description)}</div>${l.detail ? `<div class="ls">${esc(l.detail)}</div>` : ''}</td>
      <td class="c num">${n(l.unitPrice)}</td>
      <td class="c num amt">${n(l.qty * l.unitPrice)}</td>
    </tr>`).join('');

  const payRow = (label: string, value?: string) =>
    value ? `<tr><td class="pl">${esc(label)}</td><td class="pv">${esc(value)}</td></tr>` : '';
  const payRows = payRow('Bank:', s.bankName) + payRow('Account Name:', s.bankAccountName) + payRow('Account Number:', s.bankAccountNumber) + payRow('Account Type:', s.bankRouting) + payRow('SWIFT:', s.bankSwift);
  const hasPay = s.bankName || s.bankAccountName || s.bankAccountNumber || s.bankRouting || s.bankSwift || s.paymentExtra;
  const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=820"/>
<style>
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; }
  body {
    font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif; color:${INK}; font-size:12px;
    background:#FBF3E6 url('${ART}/woodgrain.png${V}'); background-size:cover;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .page { max-width:780px; margin:0 auto; padding:40px 44px 30px; position:relative; }
  .serif { font-family:Georgia,'Times New Roman',serif; }
  .doc { font-family:Georgia,'Times New Roman',serif; font-weight:800; font-size:44px; letter-spacing:1px; color:${INK}; line-height:.95; margin:0; white-space:nowrap; }
  .biz { font-family:Georgia,'Times New Roman',serif; font-weight:700; font-size:23px; color:${INK}; margin-top:2px; line-height:1.1; }
  .tag { font-family:Georgia,serif; font-style:italic; font-size:14px; color:${BROWN}; letter-spacing:1px; margin-top:2px; }
  .crow { display:flex; align-items:flex-start; font-size:12.5px; color:${INK}; line-height:1.5; margin-top:8px; }
  .mrow { display:flex; justify-content:space-between; align-items:center; border-bottom:1px dotted ${ACCENT}66; padding:7px 0; }
  .ml { font-weight:800; color:${INK}; font-size:12px; } .mv { color:${INK}; font-size:12.5px; }
  .sec { font-family:Georgia,serif; font-weight:800; font-size:13px; letter-spacing:1px; text-transform:uppercase; color:${ACCENT}; margin-bottom:6px; }
  table.items { width:100%; border-collapse:collapse; margin-top:6px; }
  table.items thead th { background:linear-gradient(${BROWN},${INK}); color:#FBF1DF; font-weight:800; font-size:10.5px; letter-spacing:.6px; text-transform:uppercase; text-align:left; padding:11px 12px; }
  table.items thead th.r { text-align:right; } table.items thead th.cn { text-align:center; }
  td.c { padding:11px 12px; border-bottom:1px solid #d8c4a4; vertical-align:top; }
  td.qty { text-align:center; width:46px; } td.num { text-align:right; white-space:nowrap; } td.amt { font-weight:700; }
  .ld { font-weight:700; color:${INK}; font-size:12.5px; } .ls { color:${BROWN}; font-size:11px; margin-top:2px; }
  .tot { display:flex; justify-content:space-between; padding:6px 12px; font-size:12.5px; }
  .tot .lbl { color:${BROWN}; font-weight:700; }
  .grand { display:flex; justify-content:space-between; align-items:baseline; border-top:2px solid ${INK}; margin-top:6px; padding:10px 12px 0; }
  .grand .gl { font-family:Georgia,serif; font-weight:800; font-size:13px; letter-spacing:.5px; color:${INK}; white-space:nowrap; padding-right:10px; }
  .grand .gv { font-family:Georgia,serif; font-weight:800; font-size:22px; color:${INK}; white-space:nowrap; }
  .paybox { border:1.5px solid ${ACCENT}; border-radius:10px; background:${CREAM}cc; padding:14px 16px; }
  .paybox .ph { text-align:center; font-family:Georgia,serif; font-weight:800; letter-spacing:1px; color:${INK}; font-size:13px; margin-bottom:10px; }
  table.pay td { font-size:11.5px; padding:2px 0; } td.pl { color:${INK}; font-weight:700; padding-right:14px; white-space:nowrap; } td.pv { color:${INK}; }
  .thanks { font-family:'Snell Roundhand','Brush Script MT',cursive; font-size:48px; color:${BROWN}; line-height:1; }
  .appreciate { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${INK}; }
  .footer { text-align:center; color:${BROWN}; font-size:10.5px; letter-spacing:2px; text-transform:uppercase; border-top:1px solid #cbb38c; margin-top:26px; padding-top:14px; }
</style></head>
<body><div class="page">

  <!-- HEADER -->
  <div style="display:flex; align-items:flex-start; gap:18px">
    <div style="position:relative; width:110px; height:110px; flex:0 0 auto">
      <img src="${ART}/slice.png${V}" style="width:110px;height:110px;object-fit:contain"/>
      ${ringInner}
    </div>
    <div style="flex:1; min-width:0; overflow:hidden">
      <div class="doc">${docLabel}</div>
      <div class="biz">${biz}</div>
      ${s.tagline ? `<div class="tag">${esc(s.tagline)}</div>` : ''}
    </div>
    <div style="flex:0 0 auto"><img src="${ART}/plane.png${V}" style="width:150px"/></div>
  </div>

  <!-- CONTACT + META -->
  <div style="display:flex; gap:40px; margin-top:18px">
    <div style="flex:1">${contactRows}</div>
    <div style="flex:1; max-width:360px">${meta}</div>
  </div>

  <!-- BILL TO + PROJECT -->
  <div style="display:flex; gap:40px; margin-top:24px; border-top:1px solid #cbb38c; padding-top:18px">
    <div style="flex:1">
      <div class="sec">Bill To</div>
      <div style="font-size:14px; font-weight:700; color:${INK}">${esc(d.customerName || 'Customer')}</div>
      ${d.customerInfo ? `<div style="font-size:12.5px; color:${INK}; line-height:1.5; margin-top:3px">${multiline(d.customerInfo)}</div>` : ''}
    </div>
    ${projectBlock}
  </div>

  <!-- ITEMS -->
  <table class="items">
    <thead><tr><th class="cn" style="width:46px">Qty</th><th>Description</th><th class="r">Unit Price (TTD)</th><th class="r">Amount (TTD)</th></tr></thead>
    <tbody>${rows || '<tr><td class="c" colspan="4" style="color:#9a7;">No items</td></tr>'}</tbody>
  </table>

  <!-- TOTALS + PAYMENT -->
  <div style="display:flex; gap:24px; margin-top:18px; align-items:flex-start">
    <div style="flex:1">
      ${hasPay ? `<div class="paybox">
        <div class="ph">— <img src="${ART}/chisels.png${V}" style="height:16px;vertical-align:-3px"/> PAYMENT DETAILS —</div>
        <table class="pay">${payRows}</table>
        ${s.paymentExtra ? `<div style="font-size:11.5px;margin-top:6px;color:${INK}">${multiline(s.paymentExtra)}</div>` : ''}
        <div style="font-size:11px;color:${BROWN};margin-top:8px;font-style:italic">Please include invoice number as reference.</div>
      </div>` : ''}
    </div>
    <div style="flex:1; max-width:320px">
      <div class="tot"><span class="lbl">SUBTOTAL</span><span>${n(subtotal)}</span></div>
      ${discount > 0 ? `<div class="tot"><span class="lbl">DISCOUNT (${d.discountPct}%)</span><span>- ${n(discount)}</span></div>` : ''}
      ${d.taxPct > 0 ? `<div class="tot"><span class="lbl">${taxLabel}</span><span>${n(tax)}</span></div>` : ''}
      <div class="grand"><span class="gl">TOTAL DUE (TTD)</span><span class="gv">${n(total)}</span></div>
    </div>
  </div>

  <!-- THANK YOU -->
  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:22px">
    <div>
      <div class="thanks">Thank you</div>
      <div class="appreciate">${esc(s.footerNote || 'We appreciate your business')}</div>
    </div>
    <img src="${ART}/sprig.png${V}" style="width:150px"/>
  </div>

  <div class="footer">Crafted in Trinidad &amp; Tobago</div>
</div></body></html>`;
}
