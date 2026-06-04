/**
 * Nutation in longitude (ΔΨ) and obliquity (Δε)
 * Reference: Jean Meeus, "Astronomical Algorithms" 2nd ed., Chapter 22
 * Using the IAU 1980 truncated nutation series (first 63 terms, cut at 0.5" per term)
 */

import { DEG2RAD } from './julian.js';

// Nutation table: [D_mul, M_mul, Mp_mul, F_mul, Omega_mul, psi_coeff, psi_t_coeff, eps_coeff, eps_t_coeff]
// ΔΨ (arcsec) = (psi_coeff + psi_t_coeff * T) * 0.0001 * sin(arg)
// Δε (arcsec) = (eps_coeff + eps_t_coeff * T) * 0.0001 * cos(arg)
const NUTATION_TABLE = [
  [0, 0, 0, 0, 1,   -171996, -174.2, 92025, 8.9],
  [-2, 0, 0, 2, 2,  -13187,   -1.6,  5736, -3.1],
  [0, 0, 0, 2, 2,   -2274,    -0.2,   977, -0.5],
  [0, 0, 0, 0, 2,    2062,     0.2,  -895,  0.5],
  [0, 1, 0, 0, 0,    1426,    -3.4,    54, -0.1],
  [0, 0, 1, 0, 0,     712,     0.1,    -7,  0.0],
  [-2, 1, 0, 2, 2,   -517,     1.2,   224, -0.6],
  [0, 0, 0, 2, 1,    -386,    -0.4,   200,  0.0],
  [0, 0, 1, 2, 2,    -301,     0.0,   129, -0.1],
  [-2,-1, 0, 2, 2,    217,    -0.5,   -95,  0.3],
  [-2, 0, 1, 0, 0,   -158,     0.0,     0,  0.0],
  [-2, 0, 0, 2, 1,    129,     0.1,   -70,  0.0],
  [0, 0,-1, 2, 2,    123,     0.0,   -53,  0.0],
  [2, 0, 0, 0, 0,     63,     0.0,     0,  0.0],
  [0, 0, 1, 0, 1,     63,     0.1,   -33,  0.0],
  [2, 0,-1, 2, 2,    -59,     0.0,    26,  0.0],
  [0, 0,-1, 0, 1,    -58,    -0.1,    32,  0.0],
  [0, 0, 1, 2, 1,    -51,     0.0,    27,  0.0],
  [-2, 0, 2, 0, 0,    48,     0.0,     0,  0.0],
  [0, 0,-2, 2, 1,    46,     0.0,   -24,  0.0],
  [2, 0, 0, 2, 2,   -38,     0.0,    16,  0.0],
  [0, 0, 2, 2, 2,   -31,     0.0,    13,  0.0],
  [0, 0, 2, 0, 0,    29,     0.0,     0,  0.0],
  [-2, 0, 1, 2, 2,    29,     0.0,   -12,  0.0],
  [0, 0, 0, 2, 0,    26,     0.0,     0,  0.0],
  [-2, 0, 0, 2, 0,   -22,     0.0,     0,  0.0],
  [0, 0,-1, 2, 1,    21,     0.0,   -10,  0.0],
  [0, 2, 0, 0, 0,    17,    -0.1,     0,  0.0],
  [2, 0,-1, 0, 1,    16,     0.0,    -8,  0.0],
  [-2, 2, 0, 2, 2,  -16,     0.1,     7,  0.0],
  [0, 1, 0, 0, 1,   -15,     0.0,     9,  0.0],
  [-2, 0, 1, 0, 1,  -13,     0.0,     7,  0.0],
  [0,-1, 0, 0, 1,   -12,     0.0,     6,  0.0],
  [0, 0, 2,-2, 0,    11,     0.0,     0,  0.0],
  [2, 0,-1, 2, 1,   -10,     0.0,     5,  0.0],
  [2, 0, 1, 2, 2,    -8,     0.0,     3,  0.0],
  [0, 1, 0, 2, 2,     7,     0.0,    -3,  0.0],
  [-2, 1, 1, 0, 0,   -7,     0.0,     0,  0.0],
  [0,-1, 0, 2, 2,    -7,     0.0,     3,  0.0],
  [2, 0, 0, 2, 1,    -7,     0.0,     3,  0.0],
  [2, 0, 1, 0, 0,     7,     0.0,     0,  0.0],
  [-2, 0, 2, 2, 2,   -6,     0.0,     3,  0.0],
  [-2, 0, 1, 2, 1,   -6,     0.0,     3,  0.0],
  [2, 0,-2, 0, 1,     6,     0.0,    -3,  0.0],
  [2, 0, 0, 0, 1,     6,     0.0,    -3,  0.0],
  [0,-1, 1, 0, 0,     6,     0.0,     0,  0.0],
  [-2,-1, 0, 2, 1,   -5,     0.0,     3,  0.0],
  [-2, 0, 0, 0, 1,   -5,     0.0,     3,  0.0],
  [0, 0, 2, 2, 1,    -5,     0.0,     3,  0.0],
  [-2, 0, 2, 0, 1,    5,     0.0,    -3,  0.0],
  [-2, 1, 0, 2, 1,    5,     0.0,    -3,  0.0],
  [0, 0, 1,-2, 0,    -5,     0.0,     0,  0.0],
  [-1, 0, 1, 0, 0,    4,     0.0,     0,  0.0],
  [-2, 1, 0, 0, 0,    4,     0.0,     0,  0.0],
  [1, 0, 0, 0, 0,     4,     0.0,     0,  0.0],
  [0, 0, 1, 2, 0,    -4,     0.0,     0,  0.0],
  [0, 0,-2, 2, 2,    -4,     0.0,     2,  0.0],
  [-1,-1, 1, 0, 0,   -4,     0.0,     0,  0.0],
  [0, 1, 1, 0, 0,    -4,     0.0,     0,  0.0],
  [0,-1, 1, 2, 2,     3,     0.0,    -1,  0.0],
  [2,-1,-1, 2, 2,    -3,     0.0,     1,  0.0],
  [0, 0, 3, 2, 2,    -3,     0.0,     1,  0.0],
  [2,-1, 0, 2, 2,    -3,     0.0,     1,  0.0],
];

/**
 * Compute nutation in longitude (ΔΨ) and obliquity (Δε)
 * @param {number} jd - Julian Day
 * @returns {{ deltaPsi: number, deltaEps: number, epsilon: number }}
 *   deltaPsi  = nutation in longitude (arcseconds)
 *   deltaEps  = nutation in obliquity (arcseconds)
 *   epsilon   = true obliquity of the ecliptic (degrees)
 */
export function getNutation(jd) {
  const T  = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;

  // Fundamental arguments (degrees → radians for sin/cos)
  // D:  Mean elongation of the Moon
  const D = (297.85036 + 445267.111480 * T - 0.0019142 * T2 + T3 / 189474) * DEG2RAD;
  // M:  Mean anomaly of the Sun
  const M = (357.52772 + 35999.050340 * T - 0.0001603 * T2 - T3 / 300000) * DEG2RAD;
  // Mp: Mean anomaly of the Moon
  const Mp = (134.96298 + 477198.867398 * T + 0.0086972 * T2 + T3 / 56250) * DEG2RAD;
  // F:  Moon's argument of latitude
  const F = (93.27191 + 483202.017538 * T - 0.0036825 * T2 + T3 / 327270) * DEG2RAD;
  // Ω:  Longitude of the ascending node of Moon's mean orbit
  const Omega = (125.04452 - 1934.136261 * T + 0.0020708 * T2 + T3 / 450000) * DEG2RAD;

  let deltaPsi = 0;
  let deltaEps = 0;

  for (const [Dm, Mm, Mpm, Fm, Om, psi0, psiT, eps0, epsT] of NUTATION_TABLE) {
    const arg = Dm * D + Mm * M + Mpm * Mp + Fm * F + Om * Omega;
    deltaPsi += (psi0 + psiT * T) * Math.sin(arg);
    deltaEps += (eps0 + epsT * T) * Math.cos(arg);
  }
  // Convert from units of 0.0001" to arcseconds
  deltaPsi *= 0.0001;
  deltaEps *= 0.0001;

  // Mean obliquity (Laskar's formula, degrees)
  const U = T / 100;
  const eps0 =
    84381.448 - 4680.93 * U - 1.55 * U * U + 1999.25 * Math.pow(U, 3) -
    51.38 * Math.pow(U, 4) - 249.67 * Math.pow(U, 5) -
    39.05 * Math.pow(U, 6) + 7.12 * Math.pow(U, 7) +
    27.87 * Math.pow(U, 8) + 5.79 * Math.pow(U, 9) +
    2.45 * Math.pow(U, 10);

  const epsilon = (eps0 + deltaEps) / 3600; // in degrees

  return { deltaPsi, deltaEps, epsilon };
}
