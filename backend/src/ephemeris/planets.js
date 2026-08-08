/**
 * Heliocentric planetary positions using VSOP87 truncated series
 * Then converts to geocentric ecliptic + equatorial coordinates.
 *
 * Reference: Jean Meeus, "Astronomical Algorithms" 2nd ed., Chapters 32-33
 */

import { julianMillennia, DEG2RAD, RAD2DEG, normalizeDeg } from './julian.js';
import { EARTH, MERCURY, VENUS, MARS, JUPITER, SATURN } from './vsop87data.js';
import { getNutation } from './nutation.js';

/**
 * Evaluate a VSOP87 series at given tau (Julian millennia from J2000.0)
 * @param {Array}  series   - [[A,B,C], ...]  for each power of tau
 * @param {number} tau      - Julian millennia
 * @returns {number} value in units of the series (10^-8 rad or 10^-8 AU)
 */
function evalVSOP87(series, tau) {
  let result = 0;
  for (let k = 0; k < series.length; k++) {
    let sum = 0;
    for (const [A, B, C] of series[k]) {
      sum += A * Math.cos(B + C * tau);
    }
    result += sum * Math.pow(tau, k);
  }
  return result;
}

/**
 * Get heliocentric ecliptic coordinates for a planet at a given JD
 * @param {Object} planetData - VSOP87 data object (e.g. EARTH, MARS …)
 * @param {number} jd
 * @returns {{ L: number, B: number, R: number }}
 *   L = heliocentric longitude (degrees, 0–360)
 *   B = heliocentric latitude  (degrees)
 *   R = radius vector (AU)
 */
function heliocentricEcliptic(planetData, jd) {
  const tau = julianMillennia(jd);
  const L = (evalVSOP87(planetData.L, tau) * 1e-8 * RAD2DEG);
  const B = (evalVSOP87(planetData.B, tau) * 1e-8 * RAD2DEG);
  const R = (evalVSOP87(planetData.R, tau) * 1e-8);
  return { L: normalizeDeg(L), B, R };
}

/**
 * Convert heliocentric ecliptic → geocentric ecliptic
 * by using Earth's position and the target planet's position.
 *
 * @param {{ L, B, R }} planet  - heliocentric ecliptic of target
 * @param {{ L, B, R }} earth   - heliocentric ecliptic of Earth
 * @returns {{ lambda: number, beta: number, delta: number }}
 *   lambda = geocentric ecliptic longitude (degrees)
 *   beta   = geocentric ecliptic latitude  (degrees)
 *   delta  = geocentric distance (AU)
 */
function helioToGeo(planet, earth) {
  // Convert to cartesian (heliocentric ecliptic)
  const pL = planet.L * DEG2RAD;
  const pB = planet.B * DEG2RAD;
  const eL = earth.L  * DEG2RAD;
  const eB = earth.B  * DEG2RAD;

  const px = planet.R * Math.cos(pB) * Math.cos(pL);
  const py = planet.R * Math.cos(pB) * Math.sin(pL);
  const pz = planet.R * Math.sin(pB);

  const ex = earth.R * Math.cos(eB) * Math.cos(eL);
  const ey = earth.R * Math.cos(eB) * Math.sin(eL);
  const ez = earth.R * Math.sin(eB);

  // Geocentric cartesian (heliocentric planet minus heliocentric Earth)
  const dx = px - ex;
  const dy = py - ey;
  const dz = pz - ez;

  const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);

  let lambda = Math.atan2(dy, dx) * RAD2DEG;
  const beta = Math.asin(dz / delta) * RAD2DEG;

  lambda = normalizeDeg(lambda);
  return { lambda, beta, delta };
}

/**
 * Apply FK5 correction to ecliptic longitude (small correction, ~0.09")
 */
function fk5Correction(lambda, beta, T) {
  const lambPrime = lambda - 1.397 * T - 0.00031 * T * T;
  const dL = -0.09033 + 0.03916 * (Math.cos(lambPrime * DEG2RAD) - Math.sin(lambPrime * DEG2RAD)) * Math.tan(beta * DEG2RAD);
  const dB = 0.03916 * (Math.cos(lambPrime * DEG2RAD) + Math.sin(lambPrime * DEG2RAD));
  return { dL: dL / 3600, dB: dB / 3600 };
}

/**
 * Get apparent geocentric ecliptic longitude & latitude (degrees)
 * including nutation but NOT yet converted to sidereal.
 *
 * @param {Object} planetData - VSOP87 data
 * @param {number} jd         - Julian Day
 * @returns {{ longitude, latitude, distance }}
 *   longitude: apparent geocentric ecliptic longitude in degrees
 *   latitude:  geocentric ecliptic latitude in degrees
 *   distance:  geocentric distance in AU
 */
export function getPlanetGeoLongitude(planetData, jd) {
  const T = (jd - 2451545.0) / 36525;

  // Iterative light-time correction (one iteration is enough for our accuracy)
  let tau_lt = 0;
  let geo;
  for (let i = 0; i < 2; i++) {
    const jd_lt = jd - tau_lt;
    const planet = heliocentricEcliptic(planetData, jd_lt);
    const earth  = heliocentricEcliptic(EARTH, jd);
    geo = helioToGeo(planet, earth);
    // light-time: 0.0057755183 days/AU
    tau_lt = 0.0057755183 * geo.delta;
  }

  // FK5 correction
  const { dL, dB } = fk5Correction(geo.lambda, geo.beta, T);
  geo.lambda = normalizeDeg(geo.lambda + dL);
  geo.beta  += dB;

  // Nutation in longitude (apply to get apparent longitude)
  const { deltaPsi } = getNutation(jd);
  const appLong = normalizeDeg(geo.lambda + deltaPsi / 3600);

  return {
    longitude: appLong,
    latitude: geo.beta,
    distance: geo.delta,
  };
}

/**
 * Compute Sun's apparent geocentric longitude
 * The Sun is Earth's heliocentric position + 180°
 */
export function getSunLongitude(jd) {
  const T    = (jd - 2451545.0) / 36525;
  const earth = heliocentricEcliptic(EARTH, jd);

  // Geocentric = heliocentric + 180
  let lambda = normalizeDeg(earth.L + 180);
  const beta = -earth.B;

  // FK5 correction
  const { dL, dB } = fk5Correction(lambda, beta, T);
  lambda = normalizeDeg(lambda + dL);

  // Aberration: −20.4898″ / R  (approximately)
  const aberration = -20.4898 / earth.R / 3600;

  // Nutation in longitude
  const { deltaPsi } = getNutation(jd);

  const appLong = normalizeDeg(lambda + aberration + deltaPsi / 3600);
  return {
    longitude: appLong,
    latitude: beta + dB,
    distance: earth.R,
  };
}

/**
 * Compute all planet geocentric sidereal longitudes
 * (for Vedic use, subtract Ayanamsha externally)
 */
export const PLANET_DATA = {
  mercury: MERCURY,
  venus:   VENUS,
  mars:    MARS,
  jupiter: JUPITER,
  saturn:  SATURN,
};

const ORBITAL_ELEMENTS = {
  uranus: {
    N: [74.0005, 1.3978e-5],
    i: [0.7733, 1.9e-8],
    w: [96.6612, 3.0565e-5],
    a: [19.18171, -1.55e-8],
    e: [0.047318, 7.45e-9],
    M: [142.5905, 0.011725806],
  },
  neptune: {
    N: [131.7806, 3.0173e-5],
    i: [1.7700, -2.55e-7],
    w: [272.8461, -6.027e-6],
    a: [30.05826, 3.313e-8],
    e: [0.008606, 2.15e-9],
    M: [260.2471, 0.005995147],
  },
  pluto: {
    N: [110.30347, 0],
    i: [17.14175, 0],
    w: [113.76329, 0],
    a: [39.48168677, 0],
    e: [0.24880766, 0],
    M: [14.53, 0.003975709],
  },
};

function element([base, rate], d) {
  return base + rate * d;
}

function solveKepler(M, e) {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < 8; i++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
}

function heliocentricFromElements(name, jd) {
  const d = jd - 2451543.5;
  const data = ORBITAL_ELEMENTS[name];
  const N = element(data.N, d) * DEG2RAD;
  const i = element(data.i, d) * DEG2RAD;
  const w = element(data.w, d) * DEG2RAD;
  const a = element(data.a, d);
  const e = element(data.e, d);
  const M = normalizeDeg(element(data.M, d)) * DEG2RAD;
  const E = solveKepler(M, e);

  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  const zh = r * Math.sin(v + w) * Math.sin(i);
  const L = normalizeDeg(Math.atan2(yh, xh) * RAD2DEG);
  const B = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * RAD2DEG;
  const R = Math.sqrt(xh * xh + yh * yh + zh * zh);

  return { L, B, R };
}

/**
 * Approximate apparent geocentric ecliptic position for Uranus, Neptune, Pluto.
 * This fills chart requirements where the project has no VSOP87 data tables for
 * trans-Saturn planets. Accuracy is suitable for sign/degree display, not
 * high-precision astronomical work.
 */
export function getOuterPlanetGeoLongitude(name, jd) {
  const T = (jd - 2451545.0) / 36525;
  let tauLt = 0;
  let geo;
  for (let i = 0; i < 2; i++) {
    const planet = heliocentricFromElements(name, jd - tauLt);
    const earth = heliocentricEcliptic(EARTH, jd);
    geo = helioToGeo(planet, earth);
    tauLt = 0.0057755183 * geo.delta;
  }

  const { dL, dB } = fk5Correction(geo.lambda, geo.beta, T);
  const { deltaPsi } = getNutation(jd);
  return {
    longitude: normalizeDeg(geo.lambda + dL + deltaPsi / 3600),
    latitude: geo.beta + dB,
    distance: geo.delta,
  };
}

export const OUTER_PLANETS = ['uranus', 'neptune', 'pluto'];
