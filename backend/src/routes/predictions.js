/**
 * Predictions API routes
 */

import express from 'express';
import { generatePredictions } from '../vedic/predictions.js';
import { calculateChart } from '../vedic/chart.js';
import { calculateDailyPanchanga } from '../vedic/panchanga.js';

const router = express.Router();

/**
 * POST /api/predictions
 * Generate comprehensive Vedic predictions
 *
 * Body:
 * {
 *   "birth": {
 *     "year": 1990, "month": 6, "day": 15,
 *     "hour": 10, "minute": 30,
 *     "latitude": 19.0760, "longitude": 72.8777,
 *     "timezone": 5.5,
 *     "ayanamsha": "lahiri"
 *   },
 *   "query": {               // optional — defaults to today
 *     "year": 2024, "month": 6, "day": 1
 *   }
 * }
 */
router.post('/', (req, res) => {
  try {
    const { birth, query } = req.body;

    if (!birth) return res.status(400).json({ error: 'birth object required' });
    if (!birth.year || !birth.month || !birth.day) {
      return res.status(400).json({ error: 'birth.year, birth.month, birth.day required' });
    }
    if (birth.latitude === undefined || birth.longitude === undefined) {
      return res.status(400).json({ error: 'birth.latitude and birth.longitude required' });
    }

    const birthParams = {
      year: parseInt(birth.year), month: parseInt(birth.month), day: parseInt(birth.day),
      hour: parseFloat(birth.hour || 0), minute: parseFloat(birth.minute || 0), second: 0,
      latitude: parseFloat(birth.latitude), longitude: parseFloat(birth.longitude),
      timezone: parseFloat(birth.timezone || 0),
      ayanamsha: birth.ayanamsha || 'lahiri',
      houseSystem: birth.houseSystem || 'wholesign',
    };

    let queryParams = null;
    if (query) {
      queryParams = {
        year: parseInt(query.year), month: parseInt(query.month), day: parseInt(query.day),
        hour: parseInt(query.hour || 12), minute: 0,
        latitude: birthParams.latitude, longitude: birthParams.longitude,
        timezone: birthParams.timezone, ayanamsha: birthParams.ayanamsha,
      };
    }

    const predictions = generatePredictions(birthParams, queryParams);
    res.json({ success: true, data: predictions });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/predictions/panchanga
 * Daily Panchanga for a date and location.
 * @deprecated Kept as an alias — use POST /api/panchanga instead.
 */
router.post('/panchanga', (req, res) => {
  try {
    const { year, month, day, hour = 6, latitude = 0, longitude = 0, timezone = 0, ayanamsha = 'lahiri' } = req.body;
    if (!year || !month || !day) return res.status(400).json({ error: 'year, month, day required' });

    const daily = calculateDailyPanchanga(
      parseInt(year),
      parseInt(month),
      parseInt(day),
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(timezone),
      ayanamsha
    );

    res.json({ success: true, data: daily });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/predictions/transit
 * Get transit of all planets for a specific date
 */
router.post('/transit', (req, res) => {
  try {
    const { year, month, day, hour = 12, latitude = 0, longitude = 0, timezone = 0, ayanamsha = 'lahiri' } = req.body;
    if (!year || !month || !day) return res.status(400).json({ error: 'year, month, day required' });

    const chart = calculateChart({
      year: parseInt(year), month: parseInt(month), day: parseInt(day),
      hour: parseFloat(hour), minute: 0, second: 0,
      latitude: parseFloat(latitude), longitude: parseFloat(longitude),
      timezone: parseFloat(timezone), ayanamsha,
    });

    res.json({
      success: true,
      data: {
        date: { year, month, day, hour, timezone },
        ayanamsha: chart.ayanamsha,
        planets: chart.planets,
        panchanga: chart.panchanga,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
