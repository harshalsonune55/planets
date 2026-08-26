/**
 * Panchanga API routes
 *
 * Daily almanac: the five limbs (Tithi, Vara, Nakshatra, Yoga, Karana)
 * plus Hora, Choghadiya and the inauspicious Kaal periods.
 */

import express from 'express';
import { calculateDailyPanchanga, calculatePanchangaRange } from '../vedic/panchanga.js';

const router = express.Router();

/** Parse and validate the fields every Panchanga request shares. */
function parseRequest(body) {
  const { year, month, day, latitude, longitude, timezone = 0, ayanamsha = 'lahiri' } = body;

  if (!year || !month || !day) return { error: 'year, month and day are required' };
  if (latitude === undefined || longitude === undefined) {
    return { error: 'latitude and longitude are required — sunrise depends on them' };
  }

  const parsed = {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    day: parseInt(day, 10),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    timezone: parseFloat(timezone),
    ayanamsha,
  };

  if (Number.isNaN(parsed.latitude) || parsed.latitude < -90 || parsed.latitude > 90) {
    return { error: 'latitude must be between -90 and 90' };
  }
  if (Number.isNaN(parsed.longitude) || parsed.longitude < -180 || parsed.longitude > 180) {
    return { error: 'longitude must be between -180 and 180' };
  }
  if (Number.isNaN(parsed.timezone) || parsed.timezone < -12 || parsed.timezone > 14) {
    return { error: 'timezone must be a UTC offset between -12 and 14' };
  }
  if (parsed.month < 1 || parsed.month > 12) return { error: 'month must be 1–12' };
  if (parsed.day < 1 || parsed.day > 31) return { error: 'day must be 1–31' };

  return { params: parsed };
}

/**
 * POST /api/panchanga
 * Full Panchanga for one day at one place.
 *
 * Body: { year, month, day, latitude, longitude, timezone, ayanamsha? }
 */
router.post('/', (req, res) => {
  const { error, params } = parseRequest(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const { year, month, day, latitude, longitude, timezone, ayanamsha } = params;
    const data = calculateDailyPanchanga(year, month, day, latitude, longitude, timezone, ayanamsha);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Panchanga error:', err);
    res.status(500).json({ error: 'Panchanga calculation failed', details: err.message });
  }
});

/**
 * POST /api/panchanga/range
 * Panchanga, Hora and Choghadiya for each of `days` consecutive days.
 *
 * Body: { year, month, day, days = 7, latitude, longitude, timezone, ayanamsha? }
 */
router.post('/range', (req, res) => {
  const { error, params } = parseRequest(req.body);
  if (error) return res.status(400).json({ error });

  const days = parseInt(req.body.days ?? 7, 10);
  if (Number.isNaN(days) || days < 1 || days > 92) {
    return res.status(400).json({ error: 'days must be between 1 and 92' });
  }

  try {
    const data = calculatePanchangaRange({ ...params, days });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('Panchanga range error:', err);
    res.status(500).json({ error: 'Panchanga calculation failed', details: err.message });
  }
});

/**
 * POST /api/panchanga/hora
 * Just the 24 planetary hours for a day.
 */
router.post('/hora', (req, res) => {
  const { error, params } = parseRequest(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const { year, month, day, latitude, longitude, timezone, ayanamsha } = params;
    const { hora, date, sunrise, sunset } = calculateDailyPanchanga(
      year, month, day, latitude, longitude, timezone, ayanamsha
    );
    res.json({ success: true, data: { date, sunrise, sunset, hora } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/panchanga/choghadiya
 * Just the day and night Choghadiya for a day.
 */
router.post('/choghadiya', (req, res) => {
  const { error, params } = parseRequest(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const { year, month, day, latitude, longitude, timezone, ayanamsha } = params;
    const { choghadiya, kaal, date, sunrise, sunset } = calculateDailyPanchanga(
      year, month, day, latitude, longitude, timezone, ayanamsha
    );
    res.json({ success: true, data: { date, sunrise, sunset, choghadiya, kaal } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
