// Shared contract for all invoice templates. Each template is a pure function
// (settings, draft) => HTML string, rendered to PDF by lib/invoice.ts.
import type { DocType, InvoiceSettings } from '../store-types';

export type { InvoiceSettings };

export interface InvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
  detail?: string; // optional sub-description shown under the title
}

export interface InvoiceDraft {
  docType?: DocType;
  number: string;
  date: string;           // issue date (display string)
  dueDate?: string;       // display string
  paymentTerms?: string;  // e.g. "Net 14 days"
  reference?: string;     // PO / reference
  project?: string;       // project / service description
  customerName: string;
  customerInfo?: string;  // multi-line bill-to details (\n)
  shipTo?: string;        // multi-line ship-to (\n); falls back to bill-to
  lines: InvoiceLine[];
  taxPct: number;         // 0 = none
  discountPct?: number;   // 0 = none
  notes?: string;
  signedName?: string | null;
  signedDate?: string | null;
}

export const DOC_LABEL: Record<DocType, string> = {
  invoice: 'INVOICE', bill: 'BILL', estimate: 'ESTIMATE', quote: 'QUOTE',
};

export const money = (n: number) =>
  `TT$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const esc = (s?: string) =>
  (s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));

// Turn "\n" in a multi-line field into <br/> (after escaping).
export const multiline = (s?: string) => esc(s).replace(/\n/g, '<br/>');

export function computeTotals(d: InvoiceDraft) {
  const subtotal = d.lines.reduce((s, l) => s + (l.qty || 0) * (l.unitPrice || 0), 0);
  const discount = Math.round(subtotal * ((d.discountPct || 0) / 100) * 100) / 100;
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * ((d.taxPct || 0) / 100) * 100) / 100;
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
}

// Convenience: the contact lines a header usually shows.
export function contacts(s: InvoiceSettings): string[] {
  return [s.address, s.contactPhone, s.contactEmail, s.website].filter(Boolean) as string[];
}

export interface Template {
  key: string;
  name: string;
  render: (s: InvoiceSettings, d: InvoiceDraft) => string;
}
