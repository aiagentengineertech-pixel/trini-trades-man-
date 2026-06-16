// Builds a branded invoice as HTML and turns it into a shareable PDF.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { DocType, InvoiceSettings } from './store-types';

export interface InvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface InvoiceDraft {
  docType?: DocType;
  number: string;
  date: string; // display string
  customerName: string;
  customerInfo?: string;
  lines: InvoiceLine[];
  taxPct: number; // 0 = no VAT
  notes?: string;
  signedName?: string | null;
  signedDate?: string | null;
}

const DOC_LABEL: Record<DocType, string> = { invoice: 'INVOICE', bill: 'BILL', estimate: 'ESTIMATE', quote: 'QUOTE' };

const money = (n: number) => `TT$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (s: string) => (s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));

export function invoiceTotals(d: InvoiceDraft) {
  const subtotal = d.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const tax = Math.round(subtotal * (d.taxPct / 100) * 100) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function buildInvoiceHtml(s: InvoiceSettings, d: InvoiceDraft): string {
  const { subtotal, tax, total } = invoiceTotals(d);
  const color = s.brandColor || '#E11D26';
  const biz = esc(s.businessName || 'Your Business');
  const logo = s.logoUrl ? `<img src="${s.logoUrl}" style="max-height:64px;max-width:180px;object-fit:contain;" />` : `<div style="font-size:24px;font-weight:800;color:${color}">${biz}</div>`;

  const rows = d.lines
    .map(
      (l) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(l.description)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${l.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${money(l.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${money(l.qty * l.unitPrice)}</td>
      </tr>`,
    )
    .join('');

  const contactBits = [s.contactPhone, s.contactEmail, s.taxId ? `VAT/BIR: ${s.taxId}` : ''].filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ');
  const docLabel = DOC_LABEL[d.docType ?? 'invoice'];
  const signOff = d.signedName
    ? `<div style="margin-top:24px;padding:12px 14px;background:${color}0D;border-radius:8px;font-size:12px;color:#4a4f57;">✓ Approved by <strong>${esc(d.signedName)}</strong>${d.signedDate ? ` on ${esc(d.signedDate)}` : ''}</div>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color:#1a1d21; margin:0; padding:32px; }
    .bar { height:6px; background:${color}; border-radius:3px; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; margin-top:20px; }
    .title { text-align:right; }
    .title h1 { margin:0; font-size:30px; letter-spacing:1px; color:${color}; }
    .muted { color:#7a8089; font-size:12px; }
    .billto { margin-top:28px; font-size:13px; }
    table { width:100%; border-collapse:collapse; margin-top:20px; font-size:13px; }
    th { background:${color}11; color:${color}; text-align:left; padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
    .totals { margin-top:16px; margin-left:auto; width:280px; font-size:13px; }
    .totals .r { display:flex; justify-content:space-between; padding:6px 0; }
    .totals .grand { border-top:2px solid ${color}; margin-top:6px; padding-top:10px; font-size:18px; font-weight:800; color:${color}; }
    .terms { margin-top:32px; font-size:12px; color:#4a4f57; line-height:1.5; }
    .footer { margin-top:28px; border-top:1px solid #eee; padding-top:12px; text-align:center; color:#9aa0a6; font-size:11px; }
  </style></head><body>
    <div class="bar"></div>
    <div class="head">
      <div>${logo}<div class="muted" style="margin-top:8px;">${contactBits}</div></div>
      <div class="title"><h1>${docLabel}</h1><div class="muted">${esc(d.number)}<br/>${esc(d.date)}</div></div>
    </div>
    <div class="billto"><span class="muted">BILL TO</span><br/><strong>${esc(d.customerName || 'Customer')}</strong>${d.customerInfo ? `<br/>${esc(d.customerInfo)}` : ''}</div>
    <table>
      <thead><tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="padding:16px;color:#9aa0a6;">No items</td></tr>'}</tbody>
    </table>
    <div class="totals">
      <div class="r"><span class="muted">Subtotal</span><span>${money(subtotal)}</span></div>
      ${d.taxPct > 0 ? `<div class="r"><span class="muted">VAT (${d.taxPct}%)</span><span>${money(tax)}</span></div>` : ''}
      <div class="r grand"><span>Total</span><span>${money(total)}</span></div>
    </div>
    ${signOff}
    ${s.paymentTerms || d.notes ? `<div class="terms">${s.paymentTerms ? `<strong>Payment terms:</strong> ${esc(s.paymentTerms)}<br/>` : ''}${d.notes ? esc(d.notes) : ''}</div>` : ''}
    <div class="footer">${esc(s.footerNote || `${biz} · Generated with Trini Tradesman`)}</div>
  </body></html>`;
}

/** Generate the PDF and open the share sheet (native) or print dialog (web). */
export async function generateInvoicePdf(s: InvoiceSettings, d: InvoiceDraft): Promise<void> {
  const html = buildInvoiceHtml(s, d);
  if (Platform.OS === 'web') {
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); }
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${d.number}`, UTI: 'com.adobe.pdf' });
  }
}
