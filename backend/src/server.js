/**
 * Vedic Astrology Backend — Express server
 *
 * Planet coordinates computed locally using:
 *   • VSOP87 truncated series (Meeus) for Sun, Mercury, Venus, Mars, Jupiter, Saturn
 *   • ELP2000 truncated series (Meeus) for Moon
 *   • Mean orbital formula for Rahu/Ketu (lunar nodes)
 *
 * No external API calls — all calculations are pure JavaScript.
 */

import express from 'express';
import cors from 'cors';

import chartRouter       from './routes/chart.js';
import dashaRouter       from './routes/dasha.js';
import predictionsRouter from './routes/predictions.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger ──────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/chart',       chartRouter);
app.use('/api/dasha',       dashaRouter);
app.use('/api/predictions', predictionsRouter);

// ── Root ─────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name:        'Vedic Astrology API',
    version:     '1.0.0',
    description: 'Planet coordinates (VSOP87 + ELP2000) + full Vedic prediction engine',
    noExternalAPI: true,
    endpoints: {
      'POST /api/chart':                  'Full Vedic birth chart (planets, houses, yogas, dasha, panchanga)',
      'GET  /api/chart/test':             'Sample chart (historical figure, for testing)',
      'POST /api/chart/planets':          'Planetary positions only (no location needed)',
      'POST /api/dasha':                  'Vimshottari Dasha timeline',
      'POST /api/dasha/antardasha':       'Antardasha + Pratyantar breakdown for a Mahadasha',
      'POST /api/predictions':            'Full Vedic predictions (dasha + transits + natal analysis)',
      'POST /api/predictions/panchanga':  'Daily Panchanga (Tithi, Vara, Nakshatra, Yoga, Karana)',
      'POST /api/predictions/transit':    'Current planetary transits',
    },
    sampleChartRequest: {
      url: 'POST /api/chart',
      body: {
        year: 1990, month: 6, day: 15,
        hour: 10, minute: 30, second: 0,
        latitude: 19.0760, longitude: 72.8777,
        timezone: 5.5,
        ayanamsha: 'lahiri',
        houseSystem: 'wholesign',
      },
    },
  });
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// ── Error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌟 Vedic Astrology API running on http://localhost:${PORT}`);
  console.log(`📖 API docs: http://localhost:${PORT}/`);
  console.log(`🪐 Engine: VSOP87 + ELP2000 (no external API calls)\n`);
});

export default app;
