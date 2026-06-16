import './types';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (process.env.ADMIN_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean) || true,
  }),
);

// Health check (public).
app.get('/health', (_req, res) => res.json({ ok: true }));

// Hidden super-admin console API.
app.use('/api/admin', adminRoutes);

// Anything else -> 404 (don't reveal route structure).
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => console.log(`[admin-server] listening on :${port}`));
