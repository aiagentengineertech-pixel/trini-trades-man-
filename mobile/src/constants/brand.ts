// Trini Tradesman brand palette — derived from the app design.
export const Brand = {
  red: '#E11D26',        // primary
  redDark: '#B5151C',
  redSoft: '#FDECEC',    // tints / banners
  ink: '#0E1116',        // near-black headings
  body: '#3A3F47',       // body text
  muted: '#7A8089',      // secondary text
  line: '#ECEDEF',       // hairline borders
  surface: '#FFFFFF',
  surfaceAlt: '#F6F7F9', // cards / inputs
  star: '#F5A623',
  green: '#1FA463',
} as const;

// Maps a trade name to an Ionicons glyph (cross-platform).
export const TRADE_ICONS: Record<string, string> = {
  Electrician: 'flash',
  Plumbing: 'water',
  'AC Repair': 'snow',
  Carpentry: 'hammer',
  Painting: 'color-fill',
  Masonry: 'cube',
};
