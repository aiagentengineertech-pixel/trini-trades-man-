// "Marshall" — clean red engineering / infrastructure invoice.
// Professional crimson + charcoal on white, a faint painted watermark, a bold
// BALANCE DUE block and a hand-lettered thank-you. Pure CSS, no external art.
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

const RED = '#C8102E';
const RED_D = '#9E0C24';
const INK = '#1E232B';
const GREY = '#6B7280';
const HAIR = '#E6E8EC';
const FAINT = '#FBEDEF';

const HEAVY = "-apple-system,'Arial Black','Segoe UI',Helvetica,sans-serif";
const BODY = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const CURSIVE = "'Snell Roundhand','Brush Script MT',cursive";

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function icon(kind: 'pin' | 'phone' | 'mail' | 'web'): string {
  const c = `width="11" height="11" viewBox="0 0 24 24" fill="${RED}" style="vertical-align:-1px;margin-right:6px;flex:0 0 auto"`;
  switch (kind) {
    case 'pin':
      return `<svg ${c}><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`;
    case 'phone':
      return `<svg ${c}><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.1 2.2z"/></svg>`;
    case 'mail':
      return `<svg ${c}><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7L4 7v1l8 5 8-5V7l-8 5z"/></svg>`;
    case 'web':
      return `<svg ${c}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.5a15 15 0 0 0-1.3-3.2A8 8 0 0 1 18.9 8zM12 4c.8 1 1.5 2.4 1.9 4h-3.8C10.5 6.4 11.2 5 12 4zM4.3 14a7.8 7.8 0 0 1 0-4h2.9a17 17 0 0 0 0 4H4.3zm.8 2h2.5c.3 1.2.8 2.3 1.3 3.2A8 8 0 0 1 5.1 16zm2.5-8H5.1a8 8 0 0 1 3.8-3.2C8.4 5.7 8 6.8 7.6 8zM12 20c-.8-1-1.5-2.4-1.9-4h3.8c-.4 1.6-1.1 3-1.9 4zm2.3-6H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4zm.4 5.2c.5-1 1-2 1.3-3.2h2.5a8 8 0 0 1-3.8 3.2zM16.8 14a17 17 0 0 0 0-4h2.9a7.8 7.8 0 0 1 0 4h-2.9z"/></svg>`;
  }
}

export function render(s: InvoiceSettings, d: InvoiceDraft): string {
  const t = computeTotals(d);
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];

  const brandMark = s.logoUrl
    ? `<img src="${esc(s.logoUrl)}" alt="" style="max-height:60px;max-width:170px;object-fit:contain;display:block"/>`
    : `<div style="display:flex;align-items:center;gap:10px">
         <div style="width:46px;height:46px;background:${RED};position:relative;transform:rotate(0deg)">
           <div style="position:absolute;top:7px;left:7px;width:32px;height:32px;background:#fff"></div>
           <div style="position:absolute;top:14px;left:14px;width:18px;height:18px;background:${RED}"></div>
         </div>
         <div style="font-family:${HEAVY};font-weight:900;font-size:20px;letter-spacing:1px;color:${INK}">${esc(
        (s.businessName || 'Marshall').split(/\s+/)[0]
      ).toUpperCase()}</div>
       </div>`;

  // contacts with red icons
  const list = contacts(s);
  const kinds: Array<'pin' | 'phone' | 'mail' | 'web'> = [];
  if (s.address) kinds.push('pin');
  if (s.contactPhone) kinds.push('phone');
  if (s.contactEmail) kinds.push('mail');
  if (s.website) kinds.push('web');
  const contactRows = list
    .map(
      (c, i) =>
        `<div style="display:flex;align-items:flex-start;font-size:10.5px;color:${INK};line-height:1.4;margin-top:3px">${icon(
          kinds[i] || 'pin'
        )}<span>${multiline(c)}</span></div>`
    )
    .join('');

  const metaRow = (k: string, v?: string) =>
    v
      ? `<tr><td style="padding:3px 14px 3px 0;font-size:9.5px;letter-spacing:.6px;text-transform:uppercase;color:${GREY};white-space:nowrap;text-align:right">${esc(
          k
        )}</td><td style="padding:3px 0;font-size:11px;font-weight:700;color:${INK};text-align:right;white-space:nowrap">${esc(
          v
        )}</td></tr>`
      : '';
  const metaRows = [
    metaRow('Invoice No.', d.number),
    metaRow('Issue Date', d.date),
    metaRow('Due Date', d.dueDate),
    metaRow('Terms', d.paymentTerms),
  ].join('');

  const billInfo = d.customerInfo
    ? `<div style="font-size:11px;color:${INK};line-height:1.55;margin-top:3px">${multiline(d.customerInfo)}</div>`
    : '';

  const itemRows = d.lines
    .map((l, i) => {
      const amount = (l.qty || 0) * (l.unitPrice || 0);
      const detail = l.detail
        ? `<div style="font-size:10px;color:${GREY};margin-top:2px;line-height:1.4">${multiline(l.detail)}</div>`
        : '';
      return `<tr style="background:${i % 2 ? FAINT + '99' : '#fff'}">
        <td style="padding:11px 14px;font-size:11px;color:${GREY};vertical-align:top;text-align:center;width:30px">${i + 1}</td>
        <td style="padding:11px 14px;vertical-align:top">
          <div style="font-size:11.5px;font-weight:700;color:${INK};line-height:1.4">${multiline(l.description)}</div>${detail}
        </td>
        <td style="padding:11px 14px;font-size:11px;color:${INK};vertical-align:top;text-align:center;white-space:nowrap">${l.qty || 0}</td>
        <td style="padding:11px 14px;font-size:11px;color:${INK};vertical-align:top;text-align:right;white-space:nowrap">${money(l.unitPrice)}</td>
        <td style="padding:11px 14px;font-size:11px;font-weight:700;color:${INK};vertical-align:top;text-align:right;white-space:nowrap">${money(amount)}</td>
      </tr>`;
    })
    .join('');

  const taxLabel = d.taxPct === 12.5 ? 'VAT (12.5%)' : `Tax (${d.taxPct}%)`;
  const sumLine = (k: string, v: string) =>
    `<div style="display:flex;justify-content:space-between;gap:24px;padding:5px 0;font-size:11px"><span style="color:${GREY};text-transform:uppercase;letter-spacing:.5px">${k}</span><span style="color:${INK};font-weight:600;white-space:nowrap">${v}</span></div>`;

  const bankRow = (k: string, v?: string) =>
    v
      ? `<div style="display:flex;justify-content:space-between;gap:16px;font-size:10.5px;padding:2px 0"><span style="color:${GREY}">${esc(
          k
        )}</span><span style="color:${INK};font-weight:600">${esc(v)}</span></div>`
      : '';
  const bankRows = [
    bankRow('Bank', s.bankName),
    bankRow('Account Name', s.bankAccountName),
    bankRow('Account No.', s.bankAccountNumber),
    bankRow('Routing', s.bankRouting),
    bankRow('SWIFT', s.bankSwift),
    s.paymentExtra ? `<div style="font-size:10.5px;color:${INK};margin-top:4px">${multiline(s.paymentExtra)}</div>` : '',
  ].join('');
  const hasBank = !!(s.bankName || s.bankAccountName || s.bankAccountNumber || s.bankRouting || s.bankSwift || s.paymentExtra);

  const signature = s.signatureName
    ? `<div style="margin-top:10px">
         <div style="font-family:${CURSIVE};font-size:28px;color:${INK};line-height:1">${esc(s.signatureName)}</div>
         <div style="border-top:1.5px solid ${INK};width:160px;margin-top:4px;padding-top:4px;font-size:10px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:${INK}">${esc(
        s.signatureName
      )}${s.signatureTitle ? `<div style="font-size:9px;color:${RED};font-weight:700;margin-top:1px">${esc(s.signatureTitle)}</div>` : ''}</div>
       </div>`
    : '';

  const footer = s.footerNote
    ? `<div style="font-size:9.5px;color:${GREY};line-height:1.5;text-align:center;border-top:1px solid ${HAIR};padding-top:10px;margin-top:18px">${multiline(
        s.footerNote
      )}</div>`
    : '';

  const tagline = s.tagline
    ? `<div style="font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${RED};margin-top:4px">${esc(
        s.tagline
      )}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=800"/>
<title>${esc(docLabel)} ${esc(d.number)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: ${BODY}; color: ${INK}; background: #fff; font-size: 12px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 0; }
  .page { position: relative; overflow: hidden; width: 100%; max-width: 800px; margin: 0 auto;
    background: #fff; padding: 44px 48px 46px; min-height: 1040px; }
  /* faint painted watermark, lower-left */
  .wm { position: absolute; left: -60px; bottom: 150px; width: 460px; height: 150px; z-index: 0; pointer-events: none;
    background: linear-gradient(100deg, ${RED} 0%, ${RED_D} 60%, rgba(200,16,46,0) 100%);
    opacity: 0.06; transform: rotate(-9deg); border-radius: 50% 40% 45% 55%; filter: blur(3px); }
  .content { position: relative; z-index: 2; }
  h1.doc { font-family: ${HEAVY}; font-weight: 900; font-size: 48px; letter-spacing: 1px;
    color: ${RED}; margin: 0; line-height: 1; }
  table { border-collapse: collapse; }
  .items thead th { background: ${RED}; color: #fff; font-family: ${HEAVY}; font-weight: 900;
    font-size: 9.5px; letter-spacing: 1px; text-transform: uppercase; text-align: left; padding: 11px 14px; }
  .label { font-family: ${HEAVY}; font-weight: 900; font-size: 11px; letter-spacing: 1.2px;
    text-transform: uppercase; color: ${RED}; margin-bottom: 5px; }
</style>
</head>
<body>
  <div class="page">
    <div class="wm"></div>
    <div class="content">

      <!-- HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px">
        <div style="flex:1 1 0;min-width:0">
          ${brandMark}
          ${tagline}
          <div style="margin-top:10px">${contactRows}</div>
          ${s.taxId ? `<div style="font-size:10px;color:${GREY};margin-top:6px">VAT / TAX ID: ${esc(s.taxId)}</div>` : ''}
        </div>
        <div style="flex:0 0 auto;text-align:right">
          <h1 class="doc">${esc(docLabel)}</h1>
          <table style="margin-top:12px;margin-left:auto">${metaRows}</table>
        </div>
      </div>

      <div style="height:3px;background:${RED};margin:22px 0 24px"></div>

      <!-- BILL TO -->
      <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:24px">
        <div style="flex:1 1 0;min-width:0">
          <div class="label">Bill To</div>
          <div style="font-size:13px;font-weight:800;color:${INK}">${esc(d.customerName)}</div>
          ${billInfo}
        </div>
        ${
          d.project
            ? `<div style="flex:1 1 0;min-width:0"><div class="label">Project</div><div style="font-size:11px;color:${INK};line-height:1.5">${multiline(
                d.project
              )}</div></div>`
            : ''
        }
      </div>

      <!-- ITEMS -->
      <table class="items" style="width:100%;border:1px solid ${HAIR}">
        <thead><tr>
          <th style="text-align:center;width:30px">#</th>
          <th>Description</th>
          <th style="text-align:center;width:50px">Qty</th>
          <th style="text-align:right;width:100px">Rate</th>
          <th style="text-align:right;width:104px">Amount</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- SUMMARY + BALANCE DUE -->
      <div style="display:flex;justify-content:space-between;gap:30px;margin-top:24px;align-items:flex-start">
        <div style="flex:1 1 0;min-width:0">
          ${signature}
        </div>
        <div style="flex:0 0 auto;width:300px">
          ${sumLine('Subtotal', money(t.subtotal))}
          ${t.discount > 0 ? sumLine('Discount', `- ${money(t.discount)}`) : ''}
          ${d.taxPct > 0 ? sumLine(taxLabel, money(t.tax)) : ''}
          <div style="background:${RED};color:#fff;border-radius:5px;padding:13px 16px;margin-top:10px;display:flex;justify-content:space-between;align-items:baseline">
            <span style="font-family:${HEAVY};font-weight:900;font-size:12px;letter-spacing:1px;text-transform:uppercase">Balance Due</span>
            <span style="font-family:${HEAVY};font-weight:900;font-size:22px;white-space:nowrap">${money(t.total)}</span>
          </div>
        </div>
      </div>

      <!-- PAYMENT + THANK YOU -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-top:30px;border-top:1px solid ${HAIR};padding-top:20px">
        <div style="flex:1 1 0;min-width:0">
          ${
            hasBank
              ? `<div class="label" style="margin-bottom:8px">Payment Information</div>${bankRows}`
              : ''
          }
        </div>
        <div style="flex:0 0 auto;text-align:right">
          <div style="font-family:${CURSIVE};font-size:40px;color:${RED};line-height:1">Thank you</div>
          <div style="font-size:9.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${INK};margin-top:2px">For Your Business</div>
        </div>
      </div>

      ${footer}

    </div>
  </div>
</body>
</html>`;
}
