// The single source of truth for trade categories across the app.
// NOTE: these names must also exist in the Supabase `trades` table (see schema.sql)
// so jobs and tradesman profiles can link to a trade_id.
export const TRADES = [
  'Electrician',
  'Plumbing',
  'AC Repair',
  'Carpentry',
  'Painting',
  'Masonry',
  'Landscaping',
  'Powerwashing',
  'Roofing',
  'Tiling',
  'Welding',
  'Appliance Repair',
  'Pest Control',
  'Cleaning',
  'Handyman',
  'CAD / Drafting',
  'Auto Mechanic',
  'Aluminium & Glass',
];
