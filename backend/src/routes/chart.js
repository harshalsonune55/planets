/**
 * Chart API routes
 */

import express from 'express';
import { calculateChart } from '../vedic/chart.js';

const router = express.Router();


router.post('/', (req, res) => {
  try {
    const {
      year, month, day,
      hour = 0, minute = 0, second = 0,
      latitude, longitude, timezone = 0,
      ayanamsha = 'lahiri',
      houseSystem = 'wholesign',
    } = req.body;

    // Validation
    if (!year || !month || !day) {
      return res.status(400).json({ error: 'year, month, and day are required' });
    }
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    if (month < 1 || month > 12) return res.status(400).json({ error: 'month must be 1–12' });
    if (day < 1 || day > 31)     return res.status(400).json({ error: 'day must be 1–31' });
    if (latitude < -90 || latitude > 90) return res.status(400).json({ error: 'latitude must be -90 to 90' });
    if (longitude < -180 || longitude > 180) return res.status(400).json({ error: 'longitude must be -180 to 180' });

    const chart = calculateChart({
      year: parseInt(year), month: parseInt(month), day: parseInt(day),
      hour: parseFloat(hour), minute: parseFloat(minute), second: parseFloat(second),
      latitude: parseFloat(latitude), longitude: parseFloat(longitude),
      timezone: parseFloat(timezone),
      ayanamsha,
      houseSystem,
    });

    res.json({ success: true, data: chart });
  } catch (err) {
    console.error('Chart calculation error:', err);
    res.status(500).json({ error: 'Chart calculation failed', details: err.message });
  }
});


router.get('/test', (req, res) => {
  try {
    const chart = calculateChart({
      year: 1869, month: 10, day: 2,
      hour: 7, minute: 11, second: 0,
      latitude: 21.6355, longitude: 69.6099,
      timezone: 5.5,
      ayanamsha: 'lahiri',
      houseSystem: 'wholesign',
    });
    res.json({ success: true, label: 'Sample chart (MK Gandhi, historical)', data: chart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/planets', (req, res) => {
  try {
    const { year, month, day, hour = 12, minute = 0, timezone = 0, ayanamsha = 'lahiri' } = req.body;
    if (!year || !month || !day) {
      return res.status(400).json({ error: 'year, month, day required' });
    }
    const chart = calculateChart({
      year: parseInt(year), month: parseInt(month), day: parseInt(day),
      hour: parseFloat(hour), minute: parseFloat(minute), second: 0,
      latitude: 0, longitude: 0, timezone: parseFloat(timezone), ayanamsha,
    });

    res.json({
      success: true,
      data: {
        date: { year, month, day, hour, minute, timezone },
        ayanamsha: chart.ayanamsha,
        julianDay: chart.julianDay,
        planets: chart.planets,
        panchanga: chart.panchanga,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
