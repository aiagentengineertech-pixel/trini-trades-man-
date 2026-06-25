// "Floral" — elegant purple anemone/wisteria theme with gold accents.
import { computeTotals, DOC_LABEL, esc, money, multiline, type InvoiceDraft, type InvoiceSettings } from './shared';

const ART = 'https://bhlflhyojzjzoksejekc.supabase.co/storage/v1/object/public/uploads/theme-assets/floral';
const V = '?v=1';
const PURPLE = '#43286E';
const PURPLE_D = '#33205A';
const GOLD = '#C29A47';
const LAV = '#F2ECF9';
const LILAC = '#E3D6F2';
const INK = '#2E2440';

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const { subtotal, discount, tax, total } = computeTotals(d);
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];
  const biz = esc(s.businessName || 'Your Business');
  const logo = s.logoUrl
    ? `<img src="${s.logoUrl}" style="width:60px;height:60px;object-fit:contain"/>`
    : `<img src="${ART}/iris.png${V}" style="width:54px;height:60px;object-fit:contain"/>`;

  const ic = (p: string) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="${PURPLE}" style="margin-right:7px;vertical-align:-2px">${p}</svg>`;
  const ENV = '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7L4 7v1l8 5 8-5V7l-8 5z"/>';
  const PERSON = '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z"/>';

  const detailRow = (label: string, value?: string) =>
    value ? `<div style="display:flex;margin:3px 0"><span style="font-weight:800;color:${PURPLE};width:78px">${esc(label)}</span><span style="color:${INK}">${esc(value)}</span></div>` : '';
  const details = detailRow('Invoice #:', d.number) + detailRow('Date:', d.date) + detailRow('Project:', d.project ? d.project.split('\n')[0] : undefined) + detailRow('Due Date:', d.dueDate);

  const rows = d.lines.map((l, i) => `<tr>
      <td class="c qty">${i + 1}.</td>
      <td class="c"><div class="ld">${esc(l.description)}</div>${l.detail ? `<div class="ls">- ${esc(l.detail)}</div>` : ''}</td>
      <td class="c num">${money(l.unitPrice)}</td>
      <td class="c num amt">${money(l.qty * l.unitPrice)}</td>
    </tr>`).join('');

  const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `Service Tax (${d.taxPct}%)`;
  const bankLines = [
    s.bankName ? `<div style="font-weight:800;margin-top:6px">${esc(s.bankName)}</div>` : '',
    s.bankAccountNumber ? `<div>Account number: ${esc(s.bankAccountNumber)}</div>` : '',
    s.bankRouting ? `<div>Routing: ${esc(s.bankRouting)}</div>` : '',
    s.bankSwift ? `<div>SWIFT: ${esc(s.bankSwift)}</div>` : '',
    s.paymentExtra ? `<div>${multiline(s.paymentExtra)}</div>` : '',
  ].join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=820"/>
<style>
  *{box-sizing:border-box} html,body{margin:0;padding:0}
  body{font-family:Georgia,'Times New Roman',serif;color:${INK};font-size:12px;background:${LAV};-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:820px;margin:0 auto;position:relative;overflow:hidden;background:${LAV}}
  .band{background:${PURPLE};height:92px;position:relative}
  .band .doc{font-family:Georgia,serif;font-weight:700;font-size:46px;letter-spacing:6px;color:${GOLD};padding:22px 0 0 44px;margin:0}
  .ctl{position:absolute;top:-6px;left:-6px;width:230px;z-index:5;pointer-events:none}
  .ctr{position:absolute;top:-6px;right:-6px;width:200px;z-index:5;pointer-events:none}
  .cbr{position:absolute;bottom:54px;right:-10px;width:240px;z-index:1;pointer-events:none}
  .cbl{position:absolute;bottom:54px;left:-20px;width:200px;z-index:1;pointer-events:none;transform:scaleX(-1)}
  .inner{padding:18px 44px 0;position:relative;z-index:3}
  .detbox{background:${LILAC};border-radius:14px;padding:14px 18px;width:300px;margin-left:auto;font-size:12.5px}
  .sec{font-family:Georgia,serif;font-style:italic;font-size:15px;color:${PURPLE};font-weight:700}
  .nm{font-weight:800;color:${INK};margin-top:3px}
  .addr{color:${INK};line-height:1.5;font-size:12px;margin-top:2px}
  table.items{width:100%;border-collapse:collapse;margin-top:22px}
  table.items thead th{font-family:Georgia,serif;font-style:italic;font-size:14px;color:${PURPLE};text-align:left;padding:8px 10px;border-bottom:1.5px solid ${PURPLE}88}
  table.items thead th.r{text-align:right}
  td.c{padding:11px 10px;border-bottom:1px solid #d9cbe9;vertical-align:top}
  td.qty{width:40px;color:${INK}} td.num{text-align:right;white-space:nowrap;font-family:-apple-system,Helvetica,Arial,sans-serif} td.amt{font-weight:700}
  .ld{font-weight:700;color:${INK};font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:13px} .ls{color:#7a6c88;font-size:11.5px;margin-top:2px;font-family:-apple-system,Helvetica,Arial,sans-serif}
  .tot{display:flex;justify-content:flex-end;gap:30px;padding:4px 10px;font-size:13px;color:${INK}}
  .tot .lab{color:${INK}} .grand{display:flex;justify-content:flex-end;gap:18px;align-items:baseline;padding:10px;margin-top:4px}
  .grand .gl{font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:20px;color:${GOLD}} .grand .gv{font-weight:800;font-size:22px;color:${INK}}
  .sign{font-family:'Snell Roundhand','Brush Script MT',cursive;font-size:30px;color:${INK};line-height:1}
  .footer{background:${PURPLE};color:#fff;padding:16px 44px;position:relative;z-index:3;margin-top:18px}
  .ft{font-weight:800;letter-spacing:.5px;color:#fff;font-size:13px}
  .fbody{font-size:12px;color:#e7ddf3;line-height:1.6;margin-top:4px;font-family:-apple-system,Helvetica,Arial,sans-serif}
</style></head>
<body><div class="page">
  <div class="band"><div class="doc">${docLabel}</div></div>
  <img class="ctl" src="${ART}/corner-tl.png${V}"/>
  <img class="ctr" src="${ART}/corner-tr.png${V}"/>
  <img class="cbr" src="${ART}/corner-b.png${V}"/>
  <img class="cbl" src="${ART}/corner-b.png${V}"/>

  <div class="inner">
    <!-- details box -->
    <div class="detbox">${details}</div>

    <!-- sender / client -->
    <div style="display:flex;gap:24px;margin-top:18px">
      <div style="flex:1;display:flex;gap:14px;align-items:flex-start">
        <div>${logo}</div>
        <div style="min-width:0"><div class="sec">${ic(ENV)}Sender</div><div class="nm">${biz}</div><div class="addr">${multiline(s.address)}${s.contactPhone ? `<br/>${esc(s.contactPhone)}` : ''}</div></div>
      </div>
      <div style="width:1px;background:${PURPLE}44"></div>
      <div style="flex:1"><div class="sec">${ic(PERSON)}Client</div><div class="nm">${esc(d.customerName || 'Customer')}</div><div class="addr">${multiline(d.customerInfo)}</div></div>
    </div>

    <!-- items -->
    <table class="items">
      <thead><tr><th style="width:40px">Qty</th><th style="font-style:italic">Description</th><th class="r">Unit Price</th><th class="r">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td class="c" colspan="4" style="color:#9a7">No items</td></tr>'}</tbody>
    </table>

    <!-- totals -->
    <div style="margin-top:14px">
      <div class="tot"><span class="lab">Subtotal:</span><span style="min-width:90px;text-align:right">${money(subtotal)}</span></div>
      ${discount > 0 ? `<div class="tot"><span class="lab">Discount (${d.discountPct}%):</span><span style="min-width:90px;text-align:right">- ${money(discount)}</span></div>` : ''}
      ${d.taxPct > 0 ? `<div class="tot"><span class="lab">${taxLabel}:</span><span style="min-width:90px;text-align:right">${money(tax)}</span></div>` : ''}
      <div class="grand"><span class="gl">TOTAL DUE:</span><span class="gv">${money(total)}</span></div>
    </div>

    <!-- signature -->
    ${s.signatureName ? `<div style="text-align:right;margin-top:26px;padding-right:20px">
      <div class="sign">/s/ ${esc(s.signatureName)}</div>
      <div style="border-top:1px solid ${INK};width:200px;margin:4px 0 0 auto;padding-top:4px;font-size:11px;letter-spacing:1px;color:${INK}">Signature</div>
    </div>` : '<div style="height:30px"></div>'}
  </div>

  <!-- footer band -->
  <div class="footer">
    <div class="ft">TERMS &amp; PAYMENT:</div>
    <div class="fbody">${esc(s.paymentTerms || 'Please complete payment within 30 days via bank transfer. Thank you for your support!')}</div>
    ${bankLines ? `<div class="fbody">${bankLines}</div>` : ''}
  </div>
</div></body></html>`;
}
