// Post-build step for the Expo web (single-page) export.
// Expo's SPA output ships a fixed index.html template and ignores +html.tsx,
// so we inject the PWA tags (manifest, home-screen icons, standalone display)
// into dist/index.html after the export. Runs locally and on Netlify.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(file)) {
  console.error('[inject-pwa] dist/index.html not found — run `expo export -p web` first.');
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');

const tags = [
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="theme-color" content="#E11D26" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Trini Tradesman" />',
  '<meta name="description" content="Find trusted local tradesmen in Trinidad & Tobago." />',
].map((t) => '    ' + t).join('\n');

// Reserve the phone's home-indicator / nav-bar space at the bottom so the tab
// bar isn't cut off when the app is launched full-screen from the home screen.
const safeAreaStyle =
  '    <style>body{box-sizing:border-box;padding-bottom:env(safe-area-inset-bottom,0px)}</style>';

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', tags + '\n' + safeAreaStyle + '\n  </head>');
}

// App-like viewport: no pinch-zoom, cover the notch.
html = html.replace(
  /<meta name="viewport"[^>]*\/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />',
);

fs.writeFileSync(file, html);
console.log('[inject-pwa] patched dist/index.html with PWA tags');
