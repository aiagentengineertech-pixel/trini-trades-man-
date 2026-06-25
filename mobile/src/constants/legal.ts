// ============================================================================
// Legal & policy content for Trini Side Hustle.
//
// IMPORTANT: These documents are tailored starting templates, NOT legal advice.
// Have a qualified Trinidad & Tobago attorney review and adapt them before you
// launch publicly or take real payments. Update LEGAL_INFO below with your
// registered business details — every document reads from it.
// ============================================================================

export const LEGAL_INFO = {
  appName: 'Trini Side Hustle',
  // TODO: replace with your registered business / legal entity name.
  company: 'Trini Side Hustle',
  // TODO: replace with your real support / privacy contact address.
  email: 'support@trinitradesman.com',
  website: 'www.trinitradesman.com',
  jurisdiction: 'Trinidad and Tobago',
  // Update whenever you materially change a policy.
  effectiveDate: '17 June 2026',
};

const I = LEGAL_INFO;

export interface LegalDoc {
  key: string;
  title: string;
  summary: string;   // one line shown in the legal hub
  updated: string;
  body: string;      // markup: "## Heading", "- bullet", blank line = new paragraph
}

const TERMS = `These Terms of Service ("Terms") are a binding agreement between you and ${I.company} ("${I.appName}", "we", "us"). They govern your use of the ${I.appName} mobile and web applications and related services (the "Platform"). By creating an account or using the Platform you agree to these Terms. If you do not agree, do not use the Platform.

## 1. What ${I.appName} is
${I.appName} is an online marketplace that connects customers who need trade and home services with independent tradesmen and service providers ("Tradesmen") in ${I.jurisdiction}. We provide the venue and tools (listings, bidding, messaging, scheduling and payment facilitation). We are not a builder, contractor, employer of Tradesmen, or a party to the service agreement formed between a customer and a Tradesman.

## 2. Eligibility
You must be at least 18 years old and able to form a binding contract to use the Platform. By using it you confirm that the information you provide is accurate and that you will keep it up to date.

## 3. Your account
You are responsible for your login credentials and for all activity under your account. Tell us immediately at ${I.email} if you suspect unauthorised use. We may suspend or close accounts that breach these Terms, that we reasonably believe are fraudulent, or that create risk for other users.

## 4. Jobs, bids and the customer–Tradesman contract
Customers post jobs; Tradesmen submit quotes ("bids"). When a customer accepts a bid, a direct service contract is formed between that customer and that Tradesman. ${I.appName} is not a party to it. Customers are responsible for describing work accurately; Tradesmen are responsible for assessing scope, pricing fairly and performing work competently and lawfully.

## 5. Payments
Payments are processed by a licensed third-party payment processor. ${I.appName} does not store full card numbers and does not hold your funds as a bank or money-transfer service. Where the Platform places a hold on a customer's payment method for a job, the hold is authorised through the processor and captured or released according to our Refund & Cancellation Policy. Service fees, if any, are shown before you confirm.

## 6. Off-platform dealing
Keep job communication, bidding and payment on the Platform. Arranging payment off-platform removes your protections, breaches these Terms, and may lead to account suspension. Never share card numbers, banking passwords or one-time codes with another user.

## 7. Verification is not a guarantee
Badges such as "verified" mean we performed certain checks (for example email, phone or identity). They are not a warranty of a Tradesman's skill, licensing, insurance or conduct. Customers should exercise their own judgement, confirm relevant licences for regulated work, and agree scope in writing.

## 8. Reviews and content
You may post reviews, photos, listings and messages ("User Content"). You keep ownership of your User Content but grant us a non-exclusive, royalty-free licence to host and display it to operate the Platform. You must have the rights to what you post, and it must be truthful and lawful. We may remove content that breaches our Acceptable Use Policy.

## 9. Fees
Use of the Platform may be free for customers. Tradesmen may pay subscription or service fees for premium features. Current fees are shown in the app before you subscribe and may change with reasonable notice.

## 10. Disclaimers
The Platform is provided "as is". To the fullest extent permitted by law, we disclaim implied warranties and do not warrant that the Platform will be uninterrupted or error-free, or that any Tradesman or customer will perform as expected.

## 11. Limitation of liability
To the fullest extent permitted by law, ${I.company} is not liable for the acts, omissions, workmanship or conduct of any user, and our total liability arising out of the Platform is limited to the fees you paid us in the 12 months before the claim. We are not liable for indirect or consequential losses. Nothing here excludes liability that cannot lawfully be excluded.

## 12. Indemnity
You agree to indemnify ${I.company} against claims arising from your use of the Platform, your User Content, or your breach of these Terms.

## 13. Suspension and termination
You may stop using the Platform at any time. We may suspend or end your access if you breach these Terms or create risk for others. Sections that by their nature should survive (for example payments owed, disclaimers, liability and governing law) survive termination.

## 14. Changes
We may update these Terms. We will post the new version in the app and update the date below. Continued use after changes means you accept them.

## 15. Governing law
These Terms are governed by the laws of ${I.jurisdiction}, and the courts of ${I.jurisdiction} have exclusive jurisdiction.

## 16. Contact
Questions about these Terms: ${I.email}.`;

const PRIVACY = `This Privacy Policy explains how ${I.company} ("${I.appName}", "we") collects, uses and protects your personal information when you use the Platform. We aim to handle data consistently with the Data Protection Act of ${I.jurisdiction} and good international practice.

## 1. Information we collect
- Account details: name, email, phone number, password (stored hashed), and role (customer or tradesman).
- Profile details: photo, banner, trades/skills, bio, years of experience, service area, and portfolio photos you upload.
- Location: the area you set, and (with your permission) device location to match you with nearby jobs and show distances.
- Activity: jobs, bids, messages, reviews, and notifications.
- Payment data: processed by our payment processor. We receive limited confirmation data (such as the last four digits and status); we do not store full card numbers.
- Technical data: device type, app version, and basic logs used to keep the service secure and working.

## 2. How we use your information
- To create and operate your account and profile.
- To match jobs with Tradesmen and show relevant listings, distances and quotes.
- To process and confirm payments through our processor.
- To send service messages and, where you allow it, push notifications.
- To keep the Platform safe, prevent fraud and abuse, and meet legal obligations.
- To improve features and understand how the Platform is used (in aggregate).

## 3. When we share information
- With other users as needed for the service (for example a customer sees a Tradesman's profile, area and quotes).
- With service providers who help us run the Platform — our database/auth/storage host and our payment processor — under confidentiality obligations.
- Where required by law, or to protect the rights, safety and property of users or the public.
We do not sell your personal information.

## 4. Payment processing
Card payments are handled by a licensed third-party processor on their secure systems. Their handling of your data is also governed by their own privacy terms.

## 5. Data retention
We keep personal information for as long as your account is active and as needed for the purposes above, then delete or anonymise it, unless we must keep records for legal, tax or dispute-resolution reasons.

## 6. Your rights
Subject to applicable law you may request access to, correction of, or deletion of your personal information, and you may object to certain processing. You can edit most details in the app, or contact us at ${I.email}. You can disable location and notification permissions in your device settings.

## 7. Security
We use access controls, encryption in transit, and row-level database security to protect your data. No system is perfectly secure, so we cannot guarantee absolute security.

## 8. Children
The Platform is not intended for anyone under 18, and we do not knowingly collect their data.

## 9. Changes
We may update this policy and will post the new version in the app with an updated date.

## 10. Contact
Privacy questions or requests: ${I.email}.`;

const ACCEPTABLE_USE = `This Acceptable Use Policy applies to everyone who uses ${I.appName}. Breaking it can lead to content removal, suspension or permanent removal from the Platform, and may be reported to the authorities.

## You must not
- Post false, misleading or fraudulent listings, bids, reviews or identities.
- Impersonate another person or business, or claim licences, insurance or qualifications you do not hold.
- Move payment off-platform to avoid protections or fees, or ask others to do so.
- Request or share card numbers, banking passwords, PINs or one-time codes.
- Harass, threaten, discriminate against or abuse any user.
- Post unlawful, hateful, sexual, violent or infringing content.
- Offer or request work that is illegal or that requires a licence you do not hold.
- Scrape, hack, overload, reverse-engineer or disrupt the Platform, or bypass security.
- Use the Platform to spam or to advertise unrelated goods or services.

## Reporting
If you see a listing, message or user that breaks these rules, report it in the app or email ${I.email}. We review reports and act where appropriate.

## Enforcement
We may remove content and suspend or remove accounts that breach this policy, at our reasonable discretion, with or without notice depending on severity.`;

const REFUNDS = `This Refund & Cancellation Policy explains how payments, holds and refunds work on ${I.appName}. It supplements our Terms of Service.

## 1. How payment holds work
When a customer hires a Tradesman, the agreed amount may be authorised ("held") on the customer's payment method through our payment processor. A hold is not a charge — the funds are captured only when the conditions below are met.

## 2. Releasing payment
Payment is captured and released to the Tradesman when the job is marked complete and accepted, or after any agreed milestone. Customers should confirm the work is done before releasing.

## 3. Cancellations by the customer
- Before a Tradesman starts: the hold is released and the customer is not charged.
- After work has started: the customer pays for work properly done up to cancellation, as agreed between the parties.

## 4. Cancellations by the Tradesman
If a Tradesman cancels before starting, any hold is released to the customer in full. Repeated cancellations may affect a Tradesman's standing on the Platform.

## 5. Disputes
If a customer and Tradesman disagree about whether work was completed or its quality, either party may open a dispute in the app or contact ${I.email}. We may pause the release of funds while we gather information from both sides. ${I.appName} can facilitate but is not the contractor and does not adjudicate workmanship as a court would; we encourage fair resolution and, where needed, independent assessment.

## 6. Service fees
Platform or subscription fees are described before you pay. Subscription fees are generally non-refundable for the current billing period unless the law requires otherwise.

## 7. Timing
Refunds and released holds are processed through our payment processor; the time for funds to appear depends on the bank or card issuer.

## 8. Contact
Payment questions: ${I.email}.`;

const PROVIDER = `These Service Provider Terms apply in addition to the Terms of Service for anyone using ${I.appName} as a Tradesman or service business ("you").

## 1. Independent contractor
You are an independent contractor, not an employee, agent or partner of ${I.company}. You control how you perform work, set your own prices through bids, and are responsible for your own tools, transport and staff.

## 2. Your obligations
- Provide accurate profile, trade and experience information.
- Hold and maintain any licences, permits or insurance the law requires for the work you offer, especially for regulated trades (for example electrical work).
- Perform work competently, safely and on the terms you agree with the customer.
- Communicate and quote honestly, and honour accepted bids.

## 3. Verification
You authorise us to perform reasonable checks (such as email, phone and identity). Verification badges reflect those checks only and are not our guarantee of your work to customers.

## 4. Payments and payouts
Customer payments are facilitated through our payment processor and released per the Refund & Cancellation Policy. You are responsible for providing accurate payout details and for any processor requirements (such as identity verification) needed to receive funds.

## 5. Taxes
You are solely responsible for reporting and paying your own taxes (including to the Board of Inland Revenue) on income earned through the Platform. ${I.company} does not withhold taxes on your behalf.

## 6. Fees
Premium tools and business features may carry subscription or service fees, shown before you subscribe.

## 7. Standing and removal
Ratings, response times, completion rates and customer reports affect your visibility. We may suspend or remove providers for fraud, repeated cancellations, safety concerns or policy breaches.

## 8. Liability
You are responsible for the work you perform and any damage or loss arising from it, and you agree to indemnify ${I.company} for claims arising from your services or your breach of these terms.

## 9. Contact
Provider questions: ${I.email}.`;

const COOKIES = `This Cookie Policy explains how the ${I.appName} website uses cookies and similar technologies. The mobile app uses on-device storage rather than browser cookies.

## What we use
- Essential storage: keeps you signed in and remembers basic preferences. The Platform does not work properly without these.
- Functional storage: remembers choices such as your selected area or filters.
- Analytics (if enabled): helps us understand, in aggregate, how the Platform is used so we can improve it.

## Managing cookies
You can clear or block cookies in your browser settings. Blocking essential cookies may stop you from signing in or using key features. Where required, we ask for your consent to non-essential cookies and you can decline.

## Contact
Questions about this policy: ${I.email}.`;

export const LEGAL_DOCS: LegalDoc[] = [
  { key: 'terms', title: 'Terms of Service', summary: 'The rules for using Trini Side Hustle', updated: I.effectiveDate, body: TERMS },
  { key: 'privacy', title: 'Privacy Policy', summary: 'What data we collect and how we use it', updated: I.effectiveDate, body: PRIVACY },
  { key: 'acceptable-use', title: 'Acceptable Use Policy', summary: "What's allowed and what isn't", updated: I.effectiveDate, body: ACCEPTABLE_USE },
  { key: 'refunds', title: 'Refund & Cancellation Policy', summary: 'How payments, holds and refunds work', updated: I.effectiveDate, body: REFUNDS },
  { key: 'provider-terms', title: 'Service Provider Terms', summary: 'Extra terms for tradesmen', updated: I.effectiveDate, body: PROVIDER },
  { key: 'cookies', title: 'Cookie Policy', summary: 'Cookies on the website', updated: I.effectiveDate, body: COOKIES },
];

export function getLegalDoc(key: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.key === key);
}
