// "Events" — elegant lilac/plum event-planning theme (silk + confetti + wreath).
import { computeTotals, DOC_LABEL, esc, money, multiline, type InvoiceDraft, type InvoiceSettings } from './shared';

const ART = 'https://bhlflhyojzjzoksejekc.supabase.co/storage/v1/object/public/uploads/theme-assets/events';
const V = '?v=1';
const PLUM = '#6E1E55';
const PLUM2 = '#8A3A6E';
const LILAC = '#EAD9EE';
const ICONBG = '#E3D1E9';
const INK = '#3a2433';
const num = (v: number) => (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const { subtotal, discount, tax, total } = computeTotals(d);
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];
  const biz = esc(s.businessName || 'Your Business');
  const initial = esc((s.businessName || 'E').trim().charAt(0).toUpperCase());

  const emblem = `<div style="position:relative;width:90px;height:90px;flex:0 0 auto">
      <img src="${ART}/wreath.png${V}" style="width:90px;height:90px;object-fit:contain"/>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;background:#FFFFFF"></div>
      ${s.logoUrl
        ? `<img src="${s.logoUrl}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;object-fit:contain;border-radius:50%"/>`
        : `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:Georgia,serif;font-weight:700;font-size:34px;color:${PLUM}">${initial}</div>`}
    </div>`;

  const circle = (svg: string, size = 32) =>
    `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${ICONBG};flex:0 0 auto">${svg}</span>`;
  const ic = (p: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="${PLUM}">${p}</svg>`;
  const PERSON = '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z"/>';
  const CAL = '<path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14z"/>';
  const BANK = '<path d="M12 2 2 7v2h20V7L12 2zM4 11v7H3v3h18v-3h-1v-7h-2v7h-3v-7h-2v7H9v-7H7v7H6v-7H4z"/>';
  const sIcon = (p: string) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="${PLUM}" style="margin-right:9px;flex:0 0 auto">${p}</svg>`;
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
    value ? `<div class="mrow"><span class="ml">${esc(label)}</span><span class="mv">${esc(value)}</span></div>` : '';
  const meta = metaRow('Invoice No.', d.number) + metaRow('Issue Date', d.date) + metaRow('Due Date', d.dueDate) + metaRow('Reference', d.reference);

  const eventBlock = (d.project || d.reference)
    ? `<div style="flex:1;display:flex;gap:12px">${circle(ic(CAL))}<div style="min-width:0"><div class="bh">Event Details</div><div class="proj">${multiline(d.project)}</div></div></div>`
    : '';

  const rows = d.lines.map((l, i) => `<tr>
      <td class="c cn">${i + 1}.</td>
      <td class="c iconcell"><img src="${ART}/item${(i % 6) + 1}.png${V}" style="width:22px;height:22px;object-fit:contain"/></td>
      <td class="c"><span class="ld">${esc(l.description)}</span>${l.detail ? `<div class="ls">${esc(l.detail)}</div>` : ''}</td>
      <td class="c cn">${l.qty}</td>
      <td class="c num">${num(l.unitPrice)}</td>
      <td class="c num amt">${num(l.qty * l.unitPrice)}</td>
    </tr>`).join('');

  const payRow = (label: string, value?: string) =>
    value ? `<tr><td class="pl">${esc(label)}:</td><td class="pv">${esc(value)}</td></tr>` : '';
  const payRows = payRow('Bank Name', s.bankName) + payRow('Account Name', s.bankAccountName) + payRow('Account Number', s.bankAccountNumber) + payRow('Account Type', s.bankRouting) + payRow('SWIFT', s.bankSwift);
  const hasPay = s.bankName || s.bankAccountName || s.bankAccountNumber || s.bankRouting || s.bankSwift || s.paymentExtra;
  const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `TAX (${d.taxPct}%)`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=820"/>
<style>
  *{box-sizing:border-box} html,body{margin:0;padding:0}
  body{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};font-size:12px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:820px;margin:0 auto;position:relative;overflow:hidden}
  .inner{padding:40px 44px 26px;position:relative;z-index:3}
  .silkT{position:absolute;top:0;right:0;width:330px;z-index:1;pointer-events:none}
  .silkB{position:absolute;bottom:0;left:0;width:300px;z-index:1;pointer-events:none}
  .conf{position:absolute;width:230px;z-index:2;pointer-events:none;opacity:.9}
  .doc{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:60px;letter-spacing:4px;color:${PLUM};margin:0;line-height:.9}
  .biz{font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:30px;color:${PLUM};line-height:1.05}
  .tag{font-size:13px;font-weight:600;color:${PLUM2};letter-spacing:3px;margin-top:3px}
  .crow{display:flex;align-items:flex-start;font-size:12.5px;color:${INK};line-height:1.5;margin-top:9px}
  .mrow{display:flex;align-items:center;padding:9px 0;border-bottom:1px solid #e8dcec}
  .ml{font-family:Georgia,serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${PLUM};font-size:12px;width:130px}
  .mv{color:${INK};font-size:13px}
  .bh{font-family:Georgia,serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${PLUM};font-size:13px;margin-bottom:5px}
  .bd{font-size:12.5px;color:${INK};line-height:1.5}
  .proj{font-size:12.5px;color:${INK};line-height:1.6;margin-top:2px}
  .proj-name{font-family:Georgia,serif;font-style:italic;font-size:16px;color:${PLUM}}
  table.items{width:100%;border-collapse:collapse;margin-top:6px}
  table.items thead th{background:${LILAC};color:${PLUM};font-weight:800;font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;text-align:left;padding:11px 10px}
  table.items thead th.r{text-align:right} table.items thead th.cn{text-align:center}
  td.c{padding:10px;border-bottom:1px dotted #d9c7df;vertical-align:middle}
  td.cn{text-align:center;font-weight:700;color:${PLUM}} td.iconcell{width:30px;text-align:center} td.num{text-align:right;white-space:nowrap} td.amt{font-weight:700}
  .ld{color:${INK}} .ls{color:#9a7f94;font-size:11px;margin-top:2px}
  .tot{display:flex;justify-content:space-between;padding:9px 14px;font-size:13px;border-bottom:1px solid #efe6f2}
  .tot .l{color:${INK}}
  .grand{display:flex;justify-content:space-between;align-items:center;background:${LILAC};padding:13px 14px;margin-top:2px}
  .grand .gl{font-weight:800;letter-spacing:.5px;color:${PLUM};font-size:14px} .grand .gv{font-weight:900;font-size:22px;color:${PLUM}}
  .paybox{border:1.5px solid ${PLUM}44;border-radius:14px;padding:16px 18px;background:#ffffffcc}
  .ph{display:flex;align-items:center;gap:10px;font-family:Georgia,serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${PLUM};font-size:13px;margin-bottom:10px}
  table.pay td{font-size:11.5px;padding:2px 0;color:${INK};vertical-align:top} td.pl{font-weight:700;white-space:nowrap;padding-right:14px} td.pv{}
</style></head>
<body><div class="page">
  <img class="silkT" src="${ART}/silk-top.png${V}"/>
  <img class="silkB" src="${ART}/silk-bottom.png${V}"/>
  <img class="conf" src="${ART}/confetti.png${V}" style="top:120px;right:60px"/>
  <div class="inner">

    <!-- HEADER -->
    <div class="doc">${docLabel}</div>
    <div style="display:flex;align-items:center;gap:16px;margin-top:8px">
      ${emblem}
      <div><div class="biz">${biz}</div>${s.tagline ? `<div class="tag">${esc(s.tagline)}</div>` : ''}</div>
    </div>

    <!-- CONTACT + META -->
    <div style="display:flex;margin-top:22px">
      <div style="flex:1;padding-right:30px">${contactRows}</div>
      <div style="width:1px;background:${PLUM}33"></div>
      <div style="flex:1;padding-left:30px">${meta}</div>
    </div>

    <!-- BILL TO + EVENT -->
    <div style="display:flex;gap:30px;margin-top:22px;border-top:1px solid #e8dcec;padding-top:18px">
      <div style="flex:1;display:flex;gap:12px">${circle(ic(PERSON))}<div style="min-width:0"><div class="bh">Bill To</div><div class="bd"><b>${esc(d.customerName || 'Customer')}</b>${d.customerInfo ? `<br/>${multiline(d.customerInfo)}` : ''}</div></div></div>
      ${eventBlock}
    </div>

    <!-- ITEMS -->
    <table class="items">
      <thead><tr><th class="cn" style="width:34px">Item</th><th style="width:30px"></th><th>Description</th><th class="cn" style="width:44px">Qty</th><th class="r">Unit Price (TTD)</th><th class="r">Amount (TTD)</th></tr></thead>
      <tbody>${rows || '<tr><td class="c" colspan="6" style="color:#9a7">No items</td></tr>'}</tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:flex-end;margin-top:12px">
      <div style="width:320px">
        <div class="tot"><span class="l">SUBTOTAL</span><span>${num(subtotal)}</span></div>
        ${discount > 0 ? `<div class="tot"><span class="l">DISCOUNT (${d.discountPct}%)</span><span>- ${num(discount)}</span></div>` : ''}
        ${d.taxPct > 0 ? `<div class="tot"><span class="l">${taxLabel}</span><span>${num(tax)}</span></div>` : ''}
        <div class="grand"><span class="gl">TOTAL DUE (TTD)</span><span class="gv">$${num(total)}</span></div>
      </div>
    </div>

    <!-- PAYMENT + THANK YOU -->
    <div style="display:flex;gap:24px;margin-top:18px;align-items:flex-end">
      <div style="flex:1">
        ${hasPay ? `<div class="paybox">
          <div class="ph">${circle(ic(BANK), 30)} Payment Details</div>
          <table class="pay">${payRows}</table>
          ${s.paymentExtra ? `<div style="font-size:11.5px;margin-top:6px;color:${INK}">${multiline(s.paymentExtra)}</div>` : ''}
          <div style="font-size:11px;color:${PLUM2};font-style:italic;margin-top:10px">Please include invoice number as reference.</div>
        </div>` : ''}
      </div>
      <div style="flex:1;text-align:center">
        <img src="${ART}/thankyou.png${V}" style="width:280px;max-width:100%"/>
        <div style="font-family:Georgia,serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${PLUM};margin-top:2px">${esc(s.acceptNote || 'For celebrating with us!')}</div>
      </div>
    </div>
  </div>
</div></body></html>`;
}
