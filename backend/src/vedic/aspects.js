/**
 * Vedic Aspects (Drishti)
 *
 * In Vedic astrology, aspects are always whole-sign (from one sign to another).
 * All planets have a full (100%) aspect on the 7th house from them.
 *
 * Special aspects:
 *   Mars:    full aspect on 4th and 8th houses
 *   Jupiter: full aspect on 5th and 9th houses
 *   Saturn:  full aspect on 3rd and 10th houses
 *   Rahu/Ketu: 5th and 9th (disputed; some use 7th only)
 *
 * Graha Drishti (planetary aspect) — aspectant → aspected
 */

/**
 * Aspect strength by house distance
 * 7th = full (100%), special aspects also full (100%)
 * Some schools also give partial aspects:
 *   3rd/10th → 75%  (Saturn special)
 *   5th/9th  → 75%  (Jupiter special)
 *   4th/8th  → 75%  (Mars special)
 */
export const ASPECT_RULES = {
  sun:     { 7: 100 },
  moon:    { 7: 100 },
  mercury: { 7: 100 },
  venus:   { 7: 100 },
  mars:    { 4: 75, 7: 100, 8: 75 },
  jupiter: { 5: 75, 7: 100, 9: 75 },
  saturn:  { 3: 75, 7: 100, 10: 75 },
  rahu:    { 5: 75, 7: 100, 9: 75 },
  ketu:    { 5: 75, 7: 100, 9: 75 },
};

/**
 * Calculate the house distance from sign A to sign B (1-indexed, 1–12)
 * @param {number} fromSign - 0-indexed sign of aspectant
 * @param {number} toSign   - 0-indexed sign of target
 * @returns {number} house distance 1–12
 */
function houseDistance(fromSign, toSign) {
  return ((toSign - fromSign + 12) % 12) + 1;
}

/**
 * Get all aspects cast by the planets on a given chart
 *
 * @param {Object} planets  - { sun: { longitude }, moon: { longitude }, ... }
 * @returns {Array} list of aspect objects
 */
export function calculateAspects(planets) {
  const aspects = [];
  const planetNames = Object.keys(planets);

  for (const aspectant of planetNames) {
    const rule = ASPECT_RULES[aspectant];
    if (!rule) continue;

    const aSign = Math.floor(planets[aspectant].siderealLongitude / 30);

    for (const [houseDist, strength] of Object.entries(rule)) {
      const targetSignIndex = (aSign + parseInt(houseDist) - 1) % 12;

      // Find which planets are in the target sign
      for (const target of planetNames) {
        if (target === aspectant) continue;
        const tSign = Math.floor(planets[target].siderealLongitude / 30);

        if (tSign === targetSignIndex) {
          aspects.push({
            aspectant,
            target,
            houseDistance: parseInt(houseDist),
            strength,
            type: strength === 100 ? 'Full' : 'Partial (75%)',
          });
        }
      }

      // Also record aspects on empty houses (for house analysis)
      aspects.push({
        aspectant,
        aspectedSign: targetSignIndex + 1, // 1-indexed sign number
        houseDistance: parseInt(houseDist),
        strength,
        type: strength === 100 ? 'Full' : 'Partial (75%)',
        note: 'sign aspected',
      });
    }
  }

  return aspects;
}

/**
 * Get aspects received by a specific planet
 * @param {string} targetPlanet - name of the planet
 * @param {Object} planets
 * @returns {Array} incoming aspects
 */
export function getAspectsOn(targetPlanet, planets) {
  const all = calculateAspects(planets);
  return all.filter(a => a.target === targetPlanet);
}

/**
 * Check if two planets are mutually aspecting each other
 * (both cast a 7th-house aspect = they are in opposite signs)
 */
export function areMutuallyAspecting(planet1, planet2, planets) {
  const s1 = Math.floor(planets[planet1].siderealLongitude / 30);
  const s2 = Math.floor(planets[planet2].siderealLongitude / 30);
  return Math.abs(s1 - s2) === 6 || Math.abs(s1 - s2) === 6;
}

/**
 * Check if a planet is aspected by Jupiter (benefic influence)
 */
export function hasJupiterAspect(planet, planets) {
  const jupSign  = Math.floor(planets.jupiter.siderealLongitude / 30);
  const planSign = Math.floor(planets[planet].siderealLongitude / 30);
  const dist = ((planSign - jupSign + 12) % 12) + 1;
  return [5, 7, 9].includes(dist);
}

/**
 * Check if a planet is aspected by Saturn
 */
export function hasSaturnAspect(planet, planets) {
  const satSign  = Math.floor(planets.saturn.siderealLongitude / 30);
  const planSign = Math.floor(planets[planet].siderealLongitude / 30);
  const dist = ((planSign - satSign + 12) % 12) + 1;
  return [3, 7, 10].includes(dist);
}

/**
 * Rashi Drishti (Sign aspects)
 * Movable signs aspect Fixed signs except adjacent
 * Fixed signs aspect Dual signs except adjacent
 * Dual signs aspect Movable signs except adjacent
 *
 * Actually the standard: each sign aspects all signs of the opposite quality except adjacent
 */
export function getRashiAspects(signIndex) {
  // signIndex: 0=Aries, 1=Taurus, ... 11=Pisces
  const movable = [0, 3, 6, 9];   // Aries, Cancer, Libra, Capricorn
  const fixed   = [1, 4, 7, 10];  // Taurus, Leo, Scorpio, Aquarius
  const dual    = [2, 5, 8, 11];  // Gemini, Virgo, Sagittarius, Pisces

  if (movable.includes(signIndex)) {
    return fixed.filter(s => Math.abs(s - signIndex) !== 1 && Math.abs(s - signIndex) !== 11);
  } else if (fixed.includes(signIndex)) {
    return dual.filter(s => Math.abs(s - signIndex) !== 1 && Math.abs(s - signIndex) !== 11);
  } else {
    return movable.filter(s => Math.abs(s - signIndex) !== 1 && Math.abs(s - signIndex) !== 11);
  }
}
