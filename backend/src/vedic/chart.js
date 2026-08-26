/**
 * Birth Chart Calculator
 *
 * Computes a complete Vedic (Jyotish) birth chart:
 *  - All 9 Grahas (planets) with sidereal longitude, Rashi, Nakshatra
 *  - Ascendant (Lagna)
 *  - House cusps (Whole Sign)
 *  - Rahu / Ketu (mean lunar nodes)
 *  - Planetary aspects (Drishti)
 *  - Yogas
 *  - Dasha
 *  - Panchanga elements
 */

import { calendarToJD, julianCenturies, normalizeDeg } from '../ephemeris/julian.js';
import {
  getSunLongitude,
  getPlanetGeoLongitude,
  getOuterPlanetGeoLongitude,
  PLANET_DATA,
  OUTER_PLANETS,
} from '../ephemeris/planets.js';
import { getMoonPosition } from '../ephemeris/moon.js';
import { toSidereal, getAyanamsha } from '../ephemeris/ayanamsha.js';
import { getNakshatra } from './nakshatra.js';
import { getRashi, getPlanetDignity } from './rashi.js';
import {
  getTropicalAscendant, getMidheaven,
  getWholeSignCusps, getEqualHouseCusps,
  getHouseNumber, getHouseLord,
  HOUSE_SIGNIFICATIONS,
} from './houses.js';
import { calculateAspects } from './aspects.js';
import { calculateYogas } from './yogas.js';
import { getCurrentDasha, getMahadashaSequence } from './dasha.js';
import {
  calculatePanchanga,
  calculateDailyPanchanga,
  calculatePanchangaRange,
  getDayBounds,
  getWeekdayIndex,
  localJd,
  toTime,
} from './panchanga.js';

/**
 * Compute the Moon's mean ascending node (Rahu) sidereal longitude
 * @param {number} jd
 * @returns {number} sidereal longitude of Rahu in degrees
 */
function getRahuLongitude(jd) {
  const T  = julianCenturies(jd);
  const T2 = T * T;
  const T3 = T2 * T;

  // Mean ascending node of the Moon (tropical)
  const omega = normalizeDeg(
    125.044555 - 1934.136261 * T + 0.0020708 * T2 + T3 / 450000
  );
  return omega; // tropical; will be converted to sidereal by caller
}

/**
 * Format degrees as DMS string
 */
function toDMS(deg) {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = Math.floor((mf - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

function calculateUpagrahas(year, month, day, latitude, longitude, timezone, ayanamsha) {
  const { sunrise, sunset } = getDayBounds(year, month, day, latitude, longitude, timezone);
  const weekday = getWeekdayIndex(year, month, day);
  const gulikaSegmentByWeekday = [7, 6, 5, 4, 3, 2, 1];
  const segmentLength = (sunset - sunrise) / 8;
  const gulikaStart = sunrise + (gulikaSegmentByWeekday[weekday] - 1) * segmentLength;
  const maandiTime = gulikaStart + segmentLength / 2;

  function pointAt(localHour) {
    const jd = localJd(year, month, day, localHour, timezone);
    const tropicalLongitude = getTropicalAscendant(jd, latitude, longitude);
    const siderealLongitude = toSidereal(tropicalLongitude, jd, ayanamsha);
    return {
      tropicalLongitude,
      siderealLongitude,
      ...getRashi(siderealLongitude),
      nakshatra: getNakshatra(siderealLongitude),
      dms: toDMS(siderealLongitude),
      localTime: toTime(localHour),
    };
  }

  return {
    gulika: pointAt(gulikaStart),
    maandi: pointAt(maandiTime),
    method: 'Gulika is calculated at the start of Saturn segment of the daytime; Maandi at its midpoint.',
  };
}

/**
 * Compute all planet data for a given Julian Day
 * Returns an object with each planet's tropical + sidereal info
 */
function computeAllPlanets(jd, ayanamshaSystem) {
  const results = {};

  // ── Sun ──
  const sunTrop = getSunLongitude(jd);
  const sunSid  = toSidereal(sunTrop.longitude, jd, ayanamshaSystem);
  results.sun = {
    tropicalLongitude: sunTrop.longitude,
    siderealLongitude: sunSid,
    latitude: sunTrop.latitude,
    distance: sunTrop.distance,
    ...getRashi(sunSid),
    nakshatra: getNakshatra(sunSid),
    dignity: getPlanetDignity('sun', sunSid),
  };

  // ── Moon ──
  const moonTrop = getMoonPosition(jd);
  const moonSid  = toSidereal(moonTrop.longitude, jd, ayanamshaSystem);
  results.moon = {
    tropicalLongitude: moonTrop.longitude,
    siderealLongitude: moonSid,
    latitude: moonTrop.latitude,
    distance: moonTrop.distance,
    ...getRashi(moonSid),
    nakshatra: getNakshatra(moonSid),
    dignity: getPlanetDignity('moon', moonSid),
  };

  // ── Outer planets using VSOP87 ──
  for (const [name, data] of Object.entries(PLANET_DATA)) {
    const trop = getPlanetGeoLongitude(data, jd);
    const sid  = toSidereal(trop.longitude, jd, ayanamshaSystem);
    results[name] = {
      tropicalLongitude: trop.longitude,
      siderealLongitude: sid,
      latitude: trop.latitude,
      distance: trop.distance,
      ...getRashi(sid),
      nakshatra: getNakshatra(sid),
      dignity: getPlanetDignity(name, sid),
    };
  }

  for (const name of OUTER_PLANETS) {
    const trop = getOuterPlanetGeoLongitude(name, jd);
    const sid = toSidereal(trop.longitude, jd, ayanamshaSystem);
    results[name] = {
      tropicalLongitude: trop.longitude,
      siderealLongitude: sid,
      latitude: trop.latitude,
      distance: trop.distance,
      ...getRashi(sid),
      nakshatra: getNakshatra(sid),
      dignity: getPlanetDignity(name, sid),
      approximate: true,
    };
  }

  // ── Rahu (mean North Node) ──
  const rahuTrop = getRahuLongitude(jd);
  const rahuSid  = toSidereal(rahuTrop, jd, ayanamshaSystem);
  results.rahu = {
    tropicalLongitude: rahuTrop,
    siderealLongitude: rahuSid,
    latitude: 0,
    distance: null,
    ...getRashi(rahuSid),
    nakshatra: getNakshatra(rahuSid),
    dignity: 'node',
    retrograde: true, // Rahu always retrograde (mean node)
  };

  // ── Ketu (South Node = Rahu + 180°) ──
  const ketuSid = normalizeDeg(rahuSid + 180);
  results.ketu = {
    tropicalLongitude: normalizeDeg(rahuTrop + 180),
    siderealLongitude: ketuSid,
    latitude: 0,
    distance: null,
    ...getRashi(ketuSid),
    nakshatra: getNakshatra(ketuSid),
    dignity: 'node',
    retrograde: true,
  };

  // Add house numbers (after Ascendant is computed, done in calculateChart)
  return results;
}

/**
 * Calculate a complete Vedic birth chart
 *
 * @param {Object} params
 *   @param {number} params.year       - Gregorian year
 *   @param {number} params.month      - Month 1–12
 *   @param {number} params.day        - Day 1–31
 *   @param {number} params.hour       - Hour 0–23 (local time)
 *   @param {number} params.minute     - Minute 0–59
 *   @param {number} params.second     - Second 0–59 (default 0)
 *   @param {number} params.latitude   - Geographic latitude (N positive)
 *   @param {number} params.longitude  - Geographic longitude (E positive)
 *   @param {number} params.timezone   - UTC offset in hours (e.g. +5.5 for IST)
 *   @param {string} params.ayanamsha  - 'lahiri'|'raman'|'kp'|'fagan' (default 'lahiri')
 *   @param {string} params.houseSystem- 'wholesign'|'equal' (default 'wholesign')
 *
 * @returns {Object} Complete chart data
 */
export function calculateChart(params) {
  const {
    year, month, day,
    hour = 0, minute = 0, second = 0,
    latitude, longitude,
    timezone = 0,
    ayanamsha = 'lahiri',
    houseSystem = 'wholesign',
  } = params;

  // Convert local time to UT
  const utHour = hour - timezone;
  const jd = calendarToJD(year, month, day, utHour, minute, second);

  // Ayanamsha value
  const ayanamshaValue = getAyanamsha(jd, ayanamsha);

  // Compute all planet positions
  const planets = computeAllPlanets(jd, ayanamsha);

  // ── Ascendant ──
  const tropAsc  = getTropicalAscendant(jd, latitude, longitude);
  const sideAsc  = toSidereal(tropAsc, jd, ayanamsha);
  const ascRashi = getRashi(sideAsc);

  // ── Midheaven ──
  const tropMC  = getMidheaven(jd, longitude);
  const sideMC  = toSidereal(tropMC, jd, ayanamsha);
  const mcRashi = getRashi(sideMC);

  // ── House cusps ──
  const cusps = houseSystem === 'wholesign'
    ? getWholeSignCusps(sideAsc)
    : getEqualHouseCusps(sideAsc);

  // ── Assign houses to planets ──
  for (const [name, pdata] of Object.entries(planets)) {
    pdata.house = getHouseNumber(pdata.siderealLongitude, sideAsc);
    pdata.houseLord = getHouseLord(pdata.house, sideAsc);
  }

  // ── Aspects ──
  const aspects = calculateAspects(planets);
  // Filter out the "sign aspected" entries for the planet-to-planet list
  const planetAspects = aspects.filter(a => a.target);

  // ── Yogas ──
  const yogas = calculateYogas(planets, sideAsc);

  // ── Dasha ──
  const birthDateTime = new Date(
    Date.UTC(year, month - 1, day, Math.floor(utHour), minute, second)
  );
  const dashaInfo = getCurrentDasha(planets.moon.siderealLongitude, birthDateTime);
  const mahadashas = getMahadashaSequence(planets.moon.siderealLongitude, birthDateTime);

  // ── House analysis ──
  const houses = cusps.map((cusp, i) => ({
    number: i + 1,
    cusp,
    sign: Math.floor(cusp / 30) + 1,
    lord: getHouseLord(i + 1, sideAsc),
    signification: HOUSE_SIGNIFICATIONS[i + 1],
    planets: Object.entries(planets)
      .filter(([, pd]) => pd.house === i + 1)
      .map(([name]) => name),
  }));

  // ── Panchanga: at the exact birth moment, and for the whole birth day ──
  const panchanga = calculatePanchanga(jd, ayanamsha, timezone);
  const dailyPanchanga = calculateDailyPanchanga(year, month, day, latitude, longitude, timezone, ayanamsha);
  const upagrahas = calculateUpagrahas(year, month, day, latitude, longitude, timezone, ayanamsha);

  return {
    input: { year, month, day, hour, minute, second, latitude, longitude, timezone, ayanamsha, houseSystem },
    julianDay: jd,
    ayanamsha: {
      system: ayanamsha,
      value: Math.round(ayanamshaValue * 10000) / 10000,
      dms: toDMS(ayanamshaValue),
    },
    ascendant: {
      tropicalLongitude: tropAsc,
      siderealLongitude: sideAsc,
      ...ascRashi,
      // The Lagna is read like a graha, so it carries the same nakshatra detail.
      nakshatra: getNakshatra(sideAsc),
      dms: toDMS(sideAsc),
    },
    midheaven: {
      tropicalLongitude: tropMC,
      siderealLongitude: sideMC,
      ...mcRashi,
    },
    planets,
    houses,
    aspects: planetAspects,
    yogas,
    dasha: dashaInfo,
    mahadashas,
    panchanga,
    dailyPanchanga,
    upagrahas,
  };
}

// Panchanga, Hora, Choghadiya and the Kaal periods live in their own module;
// re-exported here so existing importers of chart.js keep working.
export { calculatePanchanga, calculateDailyPanchanga, calculatePanchangaRange };
