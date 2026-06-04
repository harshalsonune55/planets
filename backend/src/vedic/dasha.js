/**
 * Vimshottari Dasha system
 *
 * The most widely used Dasha (planetary period) system in Vedic astrology.
 * Total cycle = 120 years.
 * Starting point = Moon's Nakshatra at birth.
 *
 * Hierarchy:
 *   Mahadasha (main period)
 *   └── Antardasha (sub-period, also called Bhukti)
 *       └── Pratyantar Dasha (sub-sub-period)
 *           └── Sookshma Dasha (sub-sub-sub-period)
 *               └── Prana Dasha (smallest)
 */

import { DASHA_ORDER, DASHA_YEARS, DASHA_TOTAL_YEARS, getNakshatra } from './nakshatra.js';

const NAKSHATRA_SPAN = 360 / 27;

const DAYS_PER_YEAR = 365.25;

/**
 * Calculate the Mahadasha start date based on Moon's sidereal longitude at birth
 *
 * @param {number} moonLong      - Moon's sidereal longitude at birth (degrees)
 * @param {Date}   birthDateTime - Date object for birth time (UT)
 * @returns {{ lord, startDate, endDate, yearsRemaining, daysElapsed }}
 */
function getCurrentMahadasha(moonLong, birthDateTime) {
  const nk = getNakshatra(moonLong);

  // Fraction of Nakshatra already passed at birth
  const fraction = nk.degreeInNakshatra / (360 / 27);
  const nkLord   = nk.lord;

  // Total years of this lord's period
  const totalYears = DASHA_YEARS[nkLord];

  // Years already elapsed at birth
  const yearsElapsed = fraction * totalYears;
  const daysElapsed  = yearsElapsed * DAYS_PER_YEAR;

  // Start of current Mahadasha (going back in time)
  const currentStart = new Date(birthDateTime.getTime() - daysElapsed * 86400 * 1000);
  const currentEnd   = new Date(currentStart.getTime() + totalYears * DAYS_PER_YEAR * 86400 * 1000);

  return {
    lord: nkLord,
    startDate: currentStart,
    endDate: currentEnd,
    yearsRemaining: totalYears - yearsElapsed,
    yearsElapsed,
    totalYears,
  };
}

/**
 * Build the full Mahadasha sequence from birth (120 years)
 *
 * @param {number} moonLong      - Moon's sidereal longitude at birth
 * @param {Date}   birthDateTime - Date/time of birth (UT)
 * @returns {Array} Array of Mahadasha objects
 */
export function getMahadashaSequence(moonLong, birthDateTime) {
  const nk     = getNakshatra(moonLong);
  const nkLord = nk.lord;

  // Fraction of Nakshatra already elapsed
  const fraction     = nk.degreeInNakshatra / (360 / 27);
  const totalYears   = DASHA_YEARS[nkLord];
  const yearsElapsed = fraction * totalYears;
  const daysElapsed  = yearsElapsed * DAYS_PER_YEAR;

  // Start of current lord's Mahadasha = go back by elapsed days
  let cursor = new Date(birthDateTime.getTime() - daysElapsed * 86400 * 1000);

  // Find position in DASHA_ORDER of the birth Nakshatra lord
  const startIndex = DASHA_ORDER.indexOf(nkLord);

  const mahadashas = [];
  for (let i = 0; i < 9; i++) {
    const idx   = (startIndex + i) % 9;
    const lord  = DASHA_ORDER[idx];
    const years = DASHA_YEARS[lord];
    const start = new Date(cursor);
    const end   = new Date(cursor.getTime() + years * DAYS_PER_YEAR * 86400 * 1000);

    mahadashas.push({
      lord,
      years,
      startDate: start,
      endDate: end,
    });

    cursor = end;
  }

  return mahadashas;
}

/**
 * Calculate Antardasha (Bhukti) periods within a Mahadasha
 *
 * @param {string} mahaLord - Mahadasha lord
 * @param {Date}   startDate - Mahadasha start date
 * @param {Date}   endDate   - Mahadasha end date
 * @returns {Array} antardasha periods
 */
export function getAntardashas(mahaLord, startDate, endDate) {
  const mahaYears = DASHA_YEARS[mahaLord];
  const mahaStart = DASHA_ORDER.indexOf(mahaLord);
  let cursor = new Date(startDate);

  return DASHA_ORDER.map((_, i) => {
    const idx       = (mahaStart + i) % 9;
    const antarLord = DASHA_ORDER[idx];
    const years     = (DASHA_YEARS[mahaLord] * DASHA_YEARS[antarLord]) / DASHA_TOTAL_YEARS;
    const start     = new Date(cursor);
    const end       = new Date(cursor.getTime() + years * DAYS_PER_YEAR * 86400 * 1000);
    cursor = end;

    return {
      lord: antarLord,
      years: Math.round(years * 1000) / 1000,
      startDate: start,
      endDate: end,
    };
  });
}

/**
 * Calculate Pratyantar Dasha within an Antardasha
 *
 * @param {string} mahaLord  - Mahadasha lord
 * @param {string} antarLord - Antardasha lord
 * @param {Date}   startDate - Antardasha start
 * @param {Date}   endDate   - Antardasha end
 * @returns {Array}
 */
export function getPratyantarDashas(mahaLord, antarLord, startDate, endDate) {
  const antarStart = DASHA_ORDER.indexOf(antarLord);
  let cursor = new Date(startDate);
  const antarYears = (DASHA_YEARS[mahaLord] * DASHA_YEARS[antarLord]) / DASHA_TOTAL_YEARS;

  return DASHA_ORDER.map((_, i) => {
    const idx         = (antarStart + i) % 9;
    const pratLord    = DASHA_ORDER[idx];
    const years       = (antarYears * DASHA_YEARS[pratLord]) / DASHA_TOTAL_YEARS;
    const start       = new Date(cursor);
    const end         = new Date(cursor.getTime() + years * DAYS_PER_YEAR * 86400 * 1000);
    cursor = end;

    return {
      lord: pratLord,
      years: Math.round(years * 10000) / 10000,
      startDate: start,
      endDate: end,
    };
  });
}

/**
 * Get current and upcoming Dasha periods for a given date
 *
 * @param {number} moonLong      - Moon sidereal longitude at birth
 * @param {Date}   birthDateTime - Birth date/time (UT)
 * @param {Date}   queryDate     - Date to query (default = today)
 * @returns {{ currentMaha, currentAntar, currentPratyantar, upcoming }}
 */
export function getCurrentDasha(moonLong, birthDateTime, queryDate = new Date()) {
  const mahaSequence = getMahadashaSequence(moonLong, birthDateTime);

  // Find current Mahadasha
  const currentMaha = mahaSequence.find(
    m => queryDate >= m.startDate && queryDate < m.endDate
  );

  if (!currentMaha) {
    return { error: 'Query date is outside the calculated Dasha range (birth ± 120 years)' };
  }

  // Get Antardashas for current Mahadasha
  const antardashas = getAntardashas(currentMaha.lord, currentMaha.startDate, currentMaha.endDate);
  const currentAntar = antardashas.find(
    a => queryDate >= a.startDate && queryDate < a.endDate
  );

  // Get Pratyantar Dashas for current Antardasha
  let currentPratyantar = null;
  if (currentAntar) {
    const pratyantars = getPratyantarDashas(
      currentMaha.lord, currentAntar.lord, currentAntar.startDate, currentAntar.endDate
    );
    currentPratyantar = pratyantars.find(
      p => queryDate >= p.startDate && queryDate < p.endDate
    );
  }

  // Next 3 Mahadashas
  const currentMahaIndex = mahaSequence.indexOf(currentMaha);
  const upcoming = mahaSequence.slice(currentMahaIndex + 1, currentMahaIndex + 4);

  // Remaining time in current periods
  const msDiff = (a, b) => (b - a) / (1000 * 60 * 60 * 24 * 365.25);

  return {
    currentMaha: {
      ...currentMaha,
      remainingYears: Math.round(msDiff(queryDate, currentMaha.endDate) * 100) / 100,
    },
    currentAntar: currentAntar
      ? {
          ...currentAntar,
          remainingYears: Math.round(msDiff(queryDate, currentAntar.endDate) * 100) / 100,
        }
      : null,
    currentPratyantar: currentPratyantar
      ? {
          ...currentPratyantar,
          remainingDays: Math.round((currentPratyantar.endDate - queryDate) / (86400 * 1000)),
        }
      : null,
    allMahadashas: mahaSequence,
    upcomingMahadashas: upcoming,
  };
}
