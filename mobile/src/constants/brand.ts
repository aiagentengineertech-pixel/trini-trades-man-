// Trini Side Hustle brand palette — maroon red.
export const Brand = {
  red: '#8C1C2B',        // primary (maroon red)
  redDark: '#6E1320',
  redSoft: '#F6E7E9',    // tints / banners
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
