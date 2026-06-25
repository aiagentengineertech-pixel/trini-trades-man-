// Invoice/quote generation. Picks a template by settings.template and renders
// it to a shareable PDF. Templates live in ./invoice-templates/*.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { InvoiceSettings, InvoiceTemplateKey } from './store-types';
import { computeTotals, type InvoiceDraft, type InvoiceLine } from './invoice-templates/shared';
import { render as classic } from './invoice-templates/classic';
import { render as corporate } from './invoice-templates/corporate';
import { render as editorial } from './invoice-templates/editorial';
import { render as landscaping } from './invoice-templates/landscaping';
import { render as monarch } from './invoice-templates/monarch';
import { render as nexora } from './invoice-templates/nexora';
import { render as noir } from './invoice-templates/noir';
import { render as trini } from './invoice-templates/trini';
import { render as woodwork } from './invoice-templates/woodwork';

export type { InvoiceDraft, InvoiceLine } from './invoice-templates/shared';

// Totals (kept name for existing callers); now also returns `discount`.
export const invoiceTotals = computeTotals;

export interface TemplateMeta {
  key: InvoiceTemplateKey;
  name: string;
  blurb: string;
  render: (s: InvoiceSettings, d: InvoiceDraft) => string;
}

export const INVOICE_TEMPLATES: TemplateMeta[] = [
  { key: 'woodwork', name: 'Woodwork', blurb: 'Rustic illustrated — carpenters', render: woodwork },
  { key: 'landscaping', name: 'Landscaping', blurb: 'Green botanical — outdoors', render: landscaping },
  { key: 'trini', name: 'Trinidad', blurb: 'Red & black flag — local & bold', render: trini },
  { key: 'classic', name: 'Classic', blurb: 'Clean branded, uses your colour', render: classic },
  { key: 'corporate', name: 'Corporate', blurb: 'Blue, professional', render: corporate },
  { key: 'noir', name: 'Noir & Gold', blurb: 'Black & gold, premium', render: noir },
  { key: 'nexora', name: 'Nexora', blurb: 'Purple & teal, agency', render: nexora },
  { key: 'monarch', name: 'Monarch', blurb: 'Minimal monochrome', render: monarch },
  { key: 'editorial', name: 'Editorial', blurb: 'Navy & blush, elegant', render: editorial },
];

export function buildInvoiceHtml(s: InvoiceSettings, d: InvoiceDraft): string {
  const key = s.template ?? 'classic';
  const tpl = INVOICE_TEMPLATES.find((t) => t.key === key) ?? INVOICE_TEMPLATES.find((t) => t.key === 'classic')!;
  return tpl.render(s, d);
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
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${d.docType ?? 'Invoice'} ${d.number}`, UTI: 'com.adobe.pdf' });
  }
}
