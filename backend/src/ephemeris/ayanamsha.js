/**
 * Ayanamsha (sidereal correction) calculations
 *
 * The Ayanamsha is the difference between the tropical zodiac (moving with the
 * vernal equinox) and the sidereal zodiac (fixed to the stars). Vedic astrology
 * uses sidereal positions.
 *
 * Multiple ayanamsha systems are supported.
 *
 * Reference:
 *   - Lahiri (Chitrapaksha): official Govt of India ayanamsha; most widely used
 *   - Raman: B.V. Raman's ayanamsha
 *   - Krishnamurti (KP): used in KP astrology system
 *   - Fagan-Bradley: western sidereal astrology
 */

/**
 * Lahiri (Chitrapaksha) Ayanamsha
 *
 * At J2000.0 (JD 2451545.0) = 23° 51' 11.4"  (= 23.85316667°)
 * Annual precession ≈ 50.2388 arcseconds/year
 *
 * @param {number} jd - Julian Day
 * @returns {number} Ayanamsha in degrees
 */
export function getLahiriAyanamsha(jd) {
  // Julian years from J2000.0
  const years = (jd - 2451545.0) / 365.25;
  // Lahiri value at J2000.0 (from the Rashtriya Panchang tables)
  const A2000 = 23.853092;        // degrees
  // General precession rate  (50.2388475 arcsec/tropical year)
  const rate  = 50.2388475 / 3600; // degrees per year
  return A2000 + rate * years;
}

/**
 * Raman Ayanamsha (B.V. Raman)
 * @param {number} jd
 * @returns {number} degrees
 */
export function getRamanAyanamsha(jd) {
  const years = (jd - 2451545.0) / 365.25;
  const A2000 = 22.46038;
  const rate  = 50.2388475 / 3600;
  return A2000 + rate * years;
}

/**
 * Krishnamurti (KP) Ayanamsha
 * @param {number} jd
 * @returns {number} degrees
 */
export function getKPAyanamsha(jd) {
  const years = (jd - 2451545.0) / 365.25;
  const A2000 = 23.86442;
  const rate  = 50.2388475 / 3600;
  return A2000 + rate * years;
}

/**
 * Fagan-Bradley (Western Sidereal)
 * @param {number} jd
 * @returns {number} degrees
 */
export function getFaganBradleyAyanamsha(jd) {
  const years = (jd - 2451545.0) / 365.25;
  const A2000 = 24.74181;
  const rate  = 50.2388475 / 3600;
  return A2000 + rate * years;
}

/**
 * Get Ayanamsha by name
 * @param {number} jd
 * @param {string} system - 'lahiri'|'raman'|'kp'|'fagan'
 * @returns {number} Ayanamsha in degrees
 */
export function getAyanamsha(jd, system = 'lahiri') {
  switch (system.toLowerCase()) {
    case 'lahiri':  return getLahiriAyanamsha(jd);
    case 'raman':   return getRamanAyanamsha(jd);
    case 'kp':      return getKPAyanamsha(jd);
    case 'fagan':   return getFaganBradleyAyanamsha(jd);
    default:        return getLahiriAyanamsha(jd);
  }
}

/**
 * Convert tropical longitude to sidereal longitude
 * @param {number} tropicalLong - degrees (0–360)
 * @param {number} jd
 * @param {string} system
 * @returns {number} sidereal longitude (0–360)
 */
export function toSidereal(tropicalLong, jd, system = 'lahiri') {
  const ayanamsha = getAyanamsha(jd, system);
  return ((tropicalLong - ayanamsha) % 360 + 360) % 360;
}
