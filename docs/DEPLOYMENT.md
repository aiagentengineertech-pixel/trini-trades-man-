# Deployment (web / PWA)

The app ships as an installable web app (PWA) on **Netlify**, auto-deploying from `main`.

## Config (already set)
`netlify.toml` at the repo root:
- **Base directory**: `mobile`
- **Build command**: `npx expo export -p web && node scripts/inject-pwa.js`
- **Publish directory**: `mobile/dist`
- **Node**: 20
- SPA redirect: `/*` → `/index.html`

`scripts/inject-pwa.js` runs after the Expo export and injects the PWA tags into
`dist/index.html` (manifest, apple-touch icon, theme color, and the standalone height fix).

## Environment variables (required)
Netlify builds the app itself, so it needs the Supabase keys as env vars (the local
`mobile/.env` is gitignored and not available on the build server):

```
EXPO_PUBLIC_SUPABASE_URL        = https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY   = <anon / publishable key>
```

Set them in **Site settings → Environment variables**. Without them the deployed site loads blank.

## First-time connect (GitHub auto-deploy)
1. Netlify → **Add new project → Import from Git → GitHub** → pick the repo.
2. It reads `netlify.toml` — leave the build settings as-is.
3. Add the two env vars above.
4. Deploy. Every push to `main` now rebuilds and redeploys automatically.

## Supabase Auth for the deployed site
- Add the Netlify URL to Supabase → **Authentication → URL Configuration** (Site URL +
  redirect allow-list) so confirmation / reset links work.
- For easy friend-testing, turn **off** "Confirm email" so sign-ups are instant.

## Install on a phone (PWA)
Open the site → **Add to Home Screen** (iOS Safari: Share → Add to Home Screen; Android
Chrome: ⋮ → Install app). It launches full-screen with the Trini Tradesman icon.
After a new deploy, fully close and reopen the home-screen app to load the latest build.

## Build minutes
Free Netlify includes ~300 build min/month (~3–5 min per build). Batch changes into one
push when possible. The admin console is **not** deployed here (see [ADMIN.md](ADMIN.md)).
