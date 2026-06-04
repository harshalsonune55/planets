/**
 * Dasha API routes
 */

import express from 'express';
import { calculateChart } from '../vedic/chart.js';
import {
  getMahadashaSequence,
  getAntardashas,
  getPratyantarDashas,
  getCurrentDasha,
} from '../vedic/dasha.js';

const router = express.Router();

/**
 * POST /api/dasha
 * Get complete Dasha timeline for a birth chart
 *
 * Body: same as /api/chart
 * Returns: Mahadasha sequence (120 years), current period, upcoming periods
 */
router.post('/', (req, res) => {
  try {
    const {
      year, month, day,
      hour = 0, minute = 0, second = 0,
      latitude = 0, longitude = 0, timezone = 0,
      ayanamsha = 'lahiri',
      queryYear, queryMonth, queryDay,
    } = req.body;

    if (!year || !month || !day) {
      return res.status(400).json({ error: 'year, month, day required' });
    }

    const chart = calculateChart({
      year: parseInt(year), month: parseInt(month), day: parseInt(day),
      hour: parseFloat(hour), minute: parseFloat(minute), second: parseFloat(second),
      latitude: parseFloat(latitude), longitude: parseFloat(longitude),
      timezone: parseFloat(timezone), ayanamsha,
    });

    const moonLong = chart.planets.moon.siderealLongitude;
    const birthDateTime = new Date(
      Date.UTC(
        parseInt(year), parseInt(month) - 1, parseInt(day),
        Math.floor(parseFloat(hour) - parseFloat(timezone)),
        parseInt(minute),
      )
    );

    const queryDate = queryYear
      ? new Date(Date.UTC(parseInt(queryYear), parseInt(queryMonth) - 1, parseInt(queryDay)))
      : new Date();

    const mahadashas = getMahadashaSequence(moonLong, birthDateTime);
    const currentInfo = getCurrentDasha(moonLong, birthDateTime, queryDate);

    // Build full hierarchy for current Mahadasha
    const currentMaha = currentInfo.currentMaha;
    let antardashaDetails = null;
    if (currentMaha) {
      const antars = getAntardashas(currentMaha.lord, currentMaha.startDate, currentMaha.endDate);
      const currentAntar = antars.find(a => queryDate >= a.startDate && queryDate < a.endDate);

      antardashaDetails = {
        all: antars,
        current: currentAntar,
        pratyantars: currentAntar
          ? getPratyantarDashas(currentMaha.lord, currentAntar.lord, currentAntar.startDate, currentAntar.endDate)
          : null,
      };
    }

    res.json({
      success: true,
      data: {
        birthData: {
          year, month, day, hour, minute,
          moonNakshatra: chart.planets.moon.nakshatra,
          moonSign: chart.planets.moon.name,
          moonLongitude: moonLong,
        },
        queryDate: queryDate.toISOString().split('T')[0],
        current: {
          mahadasha: currentInfo.currentMaha,
          antardasha: currentInfo.currentAntar,
          pratyantar: currentInfo.currentPratyantar,
        },
        antardashaDetails,
        allMahadashas: mahadashas,
        upcoming: currentInfo.upcomingMahadashas,
      },
    });
  } catch (err) {
    console.error('Dasha calculation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/dasha/antardasha
 * Get full Antardasha breakdown for a specific Mahadasha lord
 */
router.post('/antardasha', (req, res) => {
  try {
    const {
      year, month, day,
      hour = 0, minute = 0,
      timezone = 0, ayanamsha = 'lahiri',
      mahaLord,
    } = req.body;

    if (!mahaLord) return res.status(400).json({ error: 'mahaLord required' });

    const chart = calculateChart({
      year: parseInt(year), month: parseInt(month), day: parseInt(day),
      hour: parseFloat(hour), minute: parseFloat(minute), second: 0,
      latitude: 0, longitude: 0, timezone: parseFloat(timezone), ayanamsha,
    });

    const moonLong = chart.planets.moon.siderealLongitude;
    const birthDateTime = new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day),
        Math.floor(parseFloat(hour) - parseFloat(timezone)), parseInt(minute))
    );

    const mahadashas = getMahadashaSequence(moonLong, birthDateTime);
    const targetMaha = mahadashas.find(m => m.lord === mahaLord.toLowerCase());

    if (!targetMaha) {
      return res.status(404).json({ error: `Mahadasha for ${mahaLord} not found in range` });
    }

    const antars = getAntardashas(targetMaha.lord, targetMaha.startDate, targetMaha.endDate);
    const antarWithPratyantars = antars.map(antar => ({
      ...antar,
      pratyantars: getPratyantarDashas(targetMaha.lord, antar.lord, antar.startDate, antar.endDate),
    }));

    res.json({
      success: true,
      data: {
        mahadasha: targetMaha,
        antardashas: antarWithPratyantars,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
