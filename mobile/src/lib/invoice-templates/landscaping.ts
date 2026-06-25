// "Landscaping" — fresh green botanical theme. Art hosted on Supabase Storage.
import { computeTotals, DOC_LABEL, esc, money, multiline, type InvoiceDraft, type InvoiceSettings } from './shared';

const ART = 'https://bhlflhyojzjzoksejekc.supabase.co/storage/v1/object/public/uploads/theme-assets/landscaping';
const V = '?v=1';
const GREEN = '#2E7D32';
const DEEP = '#1F5C2E';
const INK = '#27331F';
const ZEBRA = '#F1F7EE';
const num = (v: number) => (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const { subtotal, discount, tax, total } = computeTotals(d);
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];
  const biz = esc(s.businessName || 'Your Business');
  const logo = s.logoUrl
    ? `<img src="${s.logoUrl}" style="max-height:64px;max-width:160px;object-fit:contain"/>`
    : `<div style="font-family:Georgia,serif;font-weight:700;font-size:26px;color:${GREEN}">${biz}</div>`;

  const circle = (svg: string, size = 34) =>
    `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${GREEN};flex:0 0 auto">${svg}</span>`;
  const ic = (path: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">${path}</svg>`;
  const PERSON = '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z"/>';
  const LEAF = '<path d="M17 8C8 10 5.9 16.2 4 22l1.5.5C7 18 10 16 12 15c-1 .9-2 2.8-2.5 5C16 19 20 14 20 6c0-1.1-.1-2-.3-3-1 1-1.7 2-2.7 5z"/>';
  const BANK = '<path d="M12 2 2 7v2h20V7L12 2zM4 11v7H3v3h18v-3h-1v-7h-2v7h-3v-7h-2v7H9v-7H7v7H6v-7H4z"/>';
  const sIcon = (path: string) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="${GREEN}" style="margin-right:8px;flex:0 0 auto">${path}</svg>`;
  const PHONE = '<path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.1 2.2z"/>';
  const MAIL = '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7L4 7v1l8 5 8-5V7l-8 5z"/>';
  const PIN = '<path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>';
  const WEB = '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.5a15 15 0 0 0-1.3-3.2A8 8 0 0 1 18.9 8zM12 4c.8 1 1.5 2.4 1.9 4h-3.8C10.5 6.4 11.2 5 12 4zM4.3 14a7.8 7.8 0 0 1 0-4h2.9a17 17 0 0 0 0 4H4.3zm.8 2h2.5c.3 1.2.8 2.3 1.3 3.2A8 8 0 0 1 5.1 16zm2.5-8H5.1a8 8 0 0 1 3.8-3.2C8.4 5.7 8 6.8 7.6 8zM12 20c-.8-1-1.5-2.4-1.9-4h3.8c-.4 1.6-1.1 3-1.9 4zm2.3-6H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4zm.4 5.2c.5-1 1-2 1.3-3.2h2.5a8 8 0 0 1-3.8 3.2zM16.8 14a17 17 0 0 0 0-4h2.9a7.8 7.8 0 0 1 0 4h-2.9z"/>';

  const contactRows = [
    s.contactPhone ? `<div class="crow">${sIcon(PHONE)}<span>${esc(s.contactPhone)}</span></div>` : '',
    s.contactEmail ? `<div class="crow">${sIcon(MAIL)}<span>${esc(s.contactEmail)}</span></div>` : '',
    s.address ? `<div class="crow">${sIcon(PIN)}<span>${multiline(s.address)}</span></div>` : '',
    s.website ? `<div class="crow">${sIcon(WEB)}<span>${esc(s.website)}</span></div>` : '',
  ].join('');

  const metaRow = (label: string, value?: string) =>
    value ? `<div class="mrow"><span class="ml">${esc(label)}</span><span class="mc">:</span><span class="mv">${esc(value)}</span></div>` : '';
  const meta = metaRow('Invoice No.', d.number) + metaRow('Issue Date', d.date) + metaRow('Due Date', d.dueDate) + metaRow('Reference', d.reference);

  const project = (d.project || d.reference)
    ? `<div style="flex:1;display:flex;gap:12px"><div>${circle(ic(LEAF))}</div><div style="min-width:0"><div class="bh">Project:</div><div class="bd">${multiline(d.project)}${d.reference ? `<br/>Contract No. ${esc(d.reference)}` : ''}</div></div></div>`
    : '';

  const rows = d.lines.map((l, i) => `<tr style="${i % 2 ? `background:${ZEBRA}` : ''}">
      <td class="c cn">${i + 1}</td>
      <td class="c"><span class="ld">${esc(l.description)}</span>${l.detail ? `<div class="ls">${esc(l.detail)}</div>` : ''}</td>
      <td class="c cn">${l.qty}</td>
      <td class="c num">${num(l.unitPrice)}</td>
      <td class="c num amt">${num(l.qty * l.unitPrice)}</td>
    </tr>`).join('');

  const payRow = (label: string, value?: string) =>
    value ? `<tr><td class="pl">${esc(label)}</td><td class="pc">:</td><td class="pv">${esc(value)}</td></tr>` : '';
  const payRows = payRow('Bank Name', s.bankName) + payRow('Account Name', s.bankAccountName) + payRow('Account No.', s.bankAccountNumber) + payRow('Account Type', s.bankRouting) + payRow('SWIFT', s.bankSwift);
  const hasPay = s.bankName || s.bankAccountName || s.bankAccountNumber || s.bankRouting || s.bankSwift || s.paymentExtra;
  const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;
  const footerBar = esc(s.footerNote || 'Designing & maintaining beautiful outdoor spaces across Trinidad & Tobago').toUpperCase();

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=820"/>
<style>
  *{box-sizing:border-box} html,body{margin:0;padding:0}
  body{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};font-size:12px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:820px;margin:0 auto;position:relative;overflow:hidden;padding-bottom:0}
  .inner{padding:40px 44px 26px;position:relative;z-index:2}
  .corner{position:absolute;top:0;right:0;width:300px;pointer-events:none;z-index:1}
  .water{position:absolute;bottom:46px;left:-20px;width:360px;opacity:.16;pointer-events:none;z-index:0}
  .doc{font-family:-apple-system,'Arial Black','Segoe UI',Helvetica,sans-serif;font-weight:900;font-size:54px;letter-spacing:1px;color:${DEEP};margin:0;line-height:.95}
  .biz{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:30px;color:${GREEN};line-height:1.05;margin-top:6px}
  .tag{font-size:13px;font-weight:700;color:${GREEN};letter-spacing:.5px;margin-top:4px}
  .crow{display:flex;align-items:flex-start;font-size:12.5px;color:${INK};line-height:1.5;margin-top:9px}
  .mrow{display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #e3eede}
  .ml{font-weight:800;color:${INK};font-size:13px;width:110px} .mc{color:${GREEN};font-weight:800;margin:0 12px} .mv{color:${GREEN};font-weight:800;font-size:13px}
  .bh{font-family:Georgia,serif;font-weight:800;font-size:14px;color:${DEEP}} .bd{font-size:12.5px;color:${INK};line-height:1.5;margin-top:4px}
  table.items{width:100%;border-collapse:collapse;margin-top:6px}
  table.items thead th{background:${GREEN};color:#fff;font-weight:800;font-size:10.5px;letter-spacing:.5px;text-transform:uppercase;text-align:left;padding:11px 12px}
  table.items thead th.r{text-align:right} table.items thead th.cn{text-align:center}
  td.c{padding:11px 12px;border-bottom:1px solid #e3eede;vertical-align:top}
  td.cn{text-align:center} td.num{text-align:right;white-space:nowrap} td.amt{font-weight:700}
  .ld{font-weight:600;color:${INK}} .ls{color:#6f8466;font-size:11px;margin-top:2px}
  .tot{display:flex;justify-content:space-between;padding:8px 14px;font-size:13px}
  .tot .l{color:${INK};font-weight:700}
  .grand{display:flex;justify-content:space-between;align-items:center;background:${GREEN};color:#fff;padding:12px 14px;margin-top:4px}
  .grand .gl{font-weight:800;font-size:13px;letter-spacing:.5px} .grand .gv{font-weight:900;font-size:22px}
  .paybox{border:1.5px solid ${GREEN}66;border-radius:14px;background:#ffffffcc;padding:16px 18px}
  .ph{display:flex;align-items:center;gap:10px;font-family:Georgia,serif;font-weight:800;letter-spacing:.5px;color:${DEEP};font-size:13px;margin-bottom:10px}
  table.pay td{font-size:11.5px;padding:2px 0;color:${INK}} td.pl{font-weight:700;white-space:nowrap;padding-right:6px} td.pc{color:${GREEN};padding:0 8px} td.pv{}
  .thanks{font-family:'Snell Roundhand','Brush Script MT',cursive;font-size:46px;color:${GREEN};line-height:1}
  .footerbar{background:${DEEP};color:#fff;text-align:center;font-size:10.5px;letter-spacing:1.5px;padding:12px 16px;display:flex;align-items:center;justify-content:center;gap:14px;margin-top:26px}
</style></head>
<body><div class="page">
  <img class="corner" src="${ART}/corner.png${V}"/>
  <img class="water" src="${ART}/foliage.png${V}"/>
  <div class="inner">

    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
      <div style="flex:1;min-width:0">
        ${logo}
        <div class="biz">${biz}</div>
        ${s.tagline ? `<div class="tag">${esc(s.tagline)}</div>` : ''}
        <div style="height:2px;background:${GREEN}55;width:70%;margin-top:12px"></div>
      </div>
      <div style="flex:0 0 auto;text-align:right;padding-top:8px"><div class="doc">${docLabel}</div></div>
    </div>

    <!-- CONTACT + META -->
    <div style="display:flex;gap:0;margin-top:18px">
      <div style="flex:1;padding-right:30px">${contactRows}</div>
      <div style="width:1px;background:${GREEN}40"></div>
      <div style="flex:1;padding-left:30px">${meta}</div>
    </div>

    <!-- BILL TO + PROJECT -->
    <div style="display:flex;gap:30px;margin-top:22px;border-top:1px solid #e3eede;padding-top:18px">
      <div style="flex:1;display:flex;gap:12px">
        <div>${circle(ic(PERSON))}</div>
        <div style="min-width:0"><div class="bh">Bill To:</div>
          <div class="bd"><b>${esc(d.customerName || 'Customer')}</b>${d.customerInfo ? `<br/>${multiline(d.customerInfo)}` : ''}</div>
        </div>
      </div>
      ${project}
    </div>

    <!-- ITEMS -->
    <table class="items">
      <thead><tr><th class="cn" style="width:38px">#</th><th>Description</th><th class="cn" style="width:46px">Qty</th><th class="r">Unit Price (TTD)</th><th class="r">Amount (TTD)</th></tr></thead>
      <tbody>${rows || '<tr><td class="c" colspan="5" style="color:#9a7">No items</td></tr>'}</tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:flex-end;margin-top:12px">
      <div style="width:300px">
        <div class="tot"><span class="l">SUBTOTAL</span><span>${num(subtotal)}</span></div>
        ${discount > 0 ? `<div class="tot"><span class="l">DISCOUNT (${d.discountPct}%)</span><span>- ${num(discount)}</span></div>` : ''}
        ${d.taxPct > 0 ? `<div class="tot"><span class="l">${taxLabel}</span><span>${num(tax)}</span></div>` : ''}
        <div class="grand"><span class="gl">TOTAL DUE (TTD)</span><span class="gv">${num(total)}</span></div>
      </div>
    </div>

    <!-- PAYMENT + THANK YOU -->
    <div style="display:flex;gap:24px;margin-top:20px;align-items:flex-start">
      <div style="flex:1">
        ${hasPay ? `<div class="paybox">
          <div class="ph">${circle(ic(BANK), 30)} PAYMENT DETAILS</div>
          <table class="pay">${payRows}</table>
          ${s.paymentExtra ? `<div style="font-size:11.5px;margin-top:6px;color:${INK}">${multiline(s.paymentExtra)}</div>` : ''}
          <div style="border-top:1px solid ${GREEN}33;margin-top:10px;padding-top:8px;font-size:11px;color:#6f8466">Please include the invoice number as reference when making payment. Thank you.</div>
        </div>` : ''}
      </div>
      <div style="flex:1;text-align:right">
        <div style="display:flex;align-items:flex-end;justify-content:flex-end;gap:8px">
          <div class="thanks">Thank you</div>
          <img src="${ART}/sprig.png${V}" style="width:96px"/>
        </div>
        <div style="font-size:12px;color:${INK};line-height:1.5;margin-top:6px">${esc(s.acceptNote || 'We appreciate your business and look forward to working with you again.')}</div>
      </div>
    </div>
  </div>

  <div class="footerbar">${circle(ic(LEAF), 22)}<span>${footerBar}</span>${circle(ic(LEAF), 22)}</div>
</div></body></html>`;
}
