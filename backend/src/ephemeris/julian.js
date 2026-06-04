/**
 * Julian Day Number utilities
 * Reference: Jean Meeus, "Astronomical Algorithms" 2nd ed., Chapter 7
 */

/**
 * Convert a calendar date/time (UT) to Julian Day Number
 * @param {number} year   - Gregorian year (e.g. 1990)
 * @param {number} month  - Month 1-12
 * @param {number} day    - Day 1-31
 * @param {number} hour   - Hour 0-23 (UT)
 * @param {number} minute - Minute 0-59
 * @param {number} second - Second 0-59
 * @returns {number} Julian Day Number (JD)
 */
export function calendarToJD(year, month, day, hour = 0, minute = 0, second = 0) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayDecimal = day + (hour + minute / 60 + second / 3600) / 24;
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    dayDecimal + B - 1524.5
  );
}

/**
 * Convert a Julian Day Number back to a calendar date
 * @param {number} jd - Julian Day Number
 * @returns {{ year, month, day, hour, minute, second }}
 */
export function jdToCalendar(jd) {
  const jd1 = jd + 0.5;
  const Z = Math.floor(jd1);
  const F = jd1 - Z;
  let A;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const totalHours = F * 24;
  const hour = Math.floor(totalHours);
  const totalMinutes = (totalHours - hour) * 60;
  const minute = Math.floor(totalMinutes);
  const second = Math.round((totalMinutes - minute) * 60);

  return { year, month, day, hour, minute, second };
}

/**
 * Julian centuries from J2000.0
 * @param {number} jd
 * @returns {number} T in Julian centuries
 */
export function julianCenturies(jd) {
  return (jd - 2451545.0) / 36525.0;
}

/**
 * Julian millennia from J2000.0 (used in VSOP87: tau = T/10)
 * @param {number} jd
 * @returns {number} tau
 */
export function julianMillennia(jd) {
  return (jd - 2451545.0) / 365250.0;
}

/**
 * Convert degrees to radians
 */
export const DEG2RAD = Math.PI / 180;

/**
 * Convert radians to degrees
 */
export const RAD2DEG = 180 / Math.PI;

/**
 * Normalize degrees to [0, 360)
 */
export function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

/**
 * Normalize radians to [0, 2π)
 */
export function normalizeRad(rad) {
  return ((rad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}
