/**
 * House (Bhava) calculations for Vedic astrology
 *
 * Supported systems:
 *  - Whole Sign (most common in Vedic)
 *  - Equal House
 *  - Placidus (sometimes used)
 *
 * Also calculates:
 *  - Ascendant (Lagna)
 *  - Midheaven (MC)
 *  - House lords
 */

import { DEG2RAD, RAD2DEG, normalizeDeg } from '../ephemeris/julian.js';
import { getNutation } from '../ephemeris/nutation.js';

/**
 * Calculate the Local Sidereal Time (LST) in degrees
 * @param {number} jd           - Julian Day (UT)
 * @param {number} longitude    - Geographic longitude (degrees East positive)
 * @returns {number} LST in degrees (0–360)
 */
export function getLocalSiderealTime(jd, longitude) {
  const T = (jd - 2451545.0) / 36525;

  // Greenwich Mean Sidereal Time (GMST) in degrees
  const GMST = normalizeDeg(
    280.46061837 +
    360.98564736629 * (jd - 2451545) +
    0.000387933 * T * T -
    (T * T * T) / 38710000
  );

  // Nutation correction to get Greenwich Apparent Sidereal Time
  const { deltaPsi, epsilon } = getNutation(jd);
  const eqEquinoxes = deltaPsi * Math.cos(epsilon * DEG2RAD) / 3600; // degrees

  const GAST = normalizeDeg(GMST + eqEquinoxes);
  const LST  = normalizeDeg(GAST + longitude);
  return LST;
}

/**
 * Calculate the tropical Ascendant (Lagna)
 * @param {number} jd           - Julian Day (UT)
 * @param {number} latitude     - Geographic latitude (degrees, North positive)
 * @param {number} longitude    - Geographic longitude (degrees East)
 * @returns {number} Tropical Ascendant in degrees (0–360)
 */
export function getTropicalAscendant(jd, latitude, longitude) {
  const lst = getLocalSiderealTime(jd, longitude);
  const { epsilon } = getNutation(jd);

  const RAMC = lst; // Right Ascension of MC = LST
  const phi  = latitude * DEG2RAD;
  const e    = epsilon * DEG2RAD;
  const theta = RAMC * DEG2RAD;

  // Ascendant formula (standard)
  const y = -Math.cos(theta);
  const x = Math.sin(e) * Math.tan(phi) + Math.cos(e) * Math.sin(theta);
  let asc = Math.atan2(y, x) * RAD2DEG;
  asc = normalizeDeg(asc);

  // Ensure in the right quadrant based on RAMC
  if (RAMC >= 0 && RAMC < 180) {
    if (asc < 180) asc += 180;
  } else {
    if (asc >= 180) asc -= 180;
  }
  return normalizeDeg(asc);
}

/**
 * Calculate Midheaven (MC / 10th house cusp)
 * @param {number} jd
 * @param {number} longitude - geographic longitude
 * @returns {number} MC in tropical degrees
 */
export function getMidheaven(jd, longitude) {
  const lst = getLocalSiderealTime(jd, longitude);
  const { epsilon } = getNutation(jd);

  const RAMC = lst * DEG2RAD;
  const e    = epsilon * DEG2RAD;

  // MC = atan(tan(RAMC) / cos(ε))
  let mc = Math.atan2(Math.sin(RAMC), Math.cos(RAMC) * Math.cos(e)) * RAD2DEG;
  mc = normalizeDeg(mc);

  // Ensure MC is in the upper hemisphere
  return mc;
}

/**
 * Get Whole Sign house cusps (sidereal)
 * In Whole Sign houses, each house = one complete sign.
 * House 1 = the sign of the Ascendant
 *
 * @param {number} siderealAsc - sidereal Ascendant in degrees (0–360)
 * @returns {number[]} 12 house cusps in sidereal degrees
 */
export function getWholeSignCusps(siderealAsc) {
  const ascSign = Math.floor(siderealAsc / 30); // 0-indexed sign number
  const cusps = [];
  for (let i = 0; i < 12; i++) {
    cusps.push(((ascSign + i) * 30) % 360);
  }
  return cusps;
}

/**
 * Get Equal House cusps (sidereal)
 * House 1 starts at exact Ascendant degree; each subsequent house is 30° later.
 *
 * @param {number} siderealAsc - sidereal Ascendant in degrees
 * @returns {number[]} 12 house cusps
 */
export function getEqualHouseCusps(siderealAsc) {
  return Array.from({ length: 12 }, (_, i) => normalizeDeg(siderealAsc + i * 30));
}

/**
 * Determine which house a planet is in (Whole Sign system)
 * @param {number} planetLong - sidereal longitude of planet (0–360)
 * @param {number} ascLong    - sidereal Ascendant longitude (0–360)
 * @returns {number} house number (1–12)
 */
export function getHouseNumber(planetLong, ascLong) {
  const ascSign  = Math.floor(ascLong / 30);
  const planSign = Math.floor(planetLong / 30);
  let house = planSign - ascSign + 1;
  if (house <= 0) house += 12;
  return house;
}

/**
 * Get the house lord (sign lord = house lord in Vedic astrology)
 * @param {number} houseNumber - 1-12
 * @param {number} ascLong     - sidereal Ascendant longitude
 * @returns {string} planet name
 */
export function getHouseLord(houseNumber, ascLong) {
  const ascSignIndex = Math.floor(ascLong / 30); // 0–11
  const houseSignIndex = (ascSignIndex + houseNumber - 1) % 12;
  const signLords = [
    'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
    'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'
  ];
  return signLords[houseSignIndex];
}

/**
 * Significance of each house in Vedic astrology
 */
export const HOUSE_SIGNIFICATIONS = {
  1:  'Self, body, personality, health, vitality (Lagna/Tanu)',
  2:  'Wealth, family, speech, food, early education (Dhana)',
  3:  'Siblings, courage, short travel, communication, arts (Sahaja)',
  4:  'Mother, home, property, education, happiness (Sukha)',
  5:  'Children, intelligence, creativity, romance, past-life merit (Putra)',
  6:  'Enemies, disease, debts, service, competition (Ari)',
  7:  'Spouse, partnerships, business, sex, foreign travel (Yuvati)',
  8:  'Longevity, death, transformation, occult, inheritance (Ayur)',
  9:  'Fortune, father, religion, guru, long travel, dharma (Dharma)',
  10: 'Career, status, authority, government, karma (Karma)',
  11: 'Income, gains, friends, elder siblings, desires (Labha)',
  12: 'Expenses, losses, foreign lands, spirituality, moksha (Vyaya)',
};

/**
 * Kendra (angular) houses
 */
export const KENDRA_HOUSES = [1, 4, 7, 10];

/**
 * Trikona (trine) houses
 */
export const TRIKONA_HOUSES = [1, 5, 9];

/**
 * Dusthana (malefic) houses
 */
export const DUSTHANA_HOUSES = [6, 8, 12];

/**
 * Upachaya (growing) houses
 */
export const UPACHAYA_HOUSES = [3, 6, 10, 11];
