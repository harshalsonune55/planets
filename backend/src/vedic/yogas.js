/**
 * Yoga calculations for Vedic astrology
 *
 * A "Yoga" is a specific planetary combination that produces particular effects.
 * This module calculates:
 *  - Raj Yogas (combinations for power/status/success)
 *  - Dhana Yogas (combinations for wealth)
 *  - Arishta Yogas (combinations for difficulties)
 *  - Pancha Mahapurusha Yogas (5 great person yogas)
 *  - Other important Yogas
 */

import { KENDRA_HOUSES, TRIKONA_HOUSES, DUSTHANA_HOUSES } from './houses.js';
import { DASHA_YEARS } from './nakshatra.js';
import { EXALTATION, DEBILITATION, OWN_SIGNS } from './rashi.js';

/**
 * Helper: check if planet is in its own sign
 */
function inOwnSign(planet, longitude) {
  const signIndex = Math.floor(longitude / 30);
  return OWN_SIGNS[planet]?.includes(signIndex) || false;
}

/**
 * Helper: check if planet is exalted
 */
function isExalted(planet, longitude) {
  if (!EXALTATION[planet]) return false;
  const signIndex = Math.floor(longitude / 30);
  return signIndex === Math.floor(EXALTATION[planet] / 30);
}

/**
 * Helper: check if planet is in a Kendra
 */
function inKendra(houseNumber) {
  return KENDRA_HOUSES.includes(houseNumber);
}

/**
 * Helper: check if planet is in a Trikona
 */
function inTrikona(houseNumber) {
  return TRIKONA_HOUSES.includes(houseNumber);
}

/**
 * Helper: check if planet is in a Dusthana (6, 8, 12)
 */
function inDusthana(houseNumber) {
  return DUSTHANA_HOUSES.includes(houseNumber);
}

/**
 * Get the sign lord for a given sign index (0-11)
 */
function getSignLord(signIndex) {
  const lords = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
                 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
  return lords[signIndex];
}

/**
 * Main Yoga calculator
 *
 * @param {Object} planets - { sun: { siderealLongitude, house }, moon: ..., ... }
 * @param {number} ascLong - sidereal Ascendant longitude
 * @returns {Array} found yogas
 */
export function calculateYogas(planets, ascLong) {
  const yogas = [];
  const ascSignIndex = Math.floor(ascLong / 30);

  // ──────────────────────────────────────────────
  // PANCHA MAHAPURUSHA YOGAS
  // (5 great-person yogas — Mars, Mercury, Jupiter, Venus, Saturn
  //  must be in own sign OR exalted, AND in a Kendra)
  // ──────────────────────────────────────────────
  const mahapurushaConfig = [
    { planet: 'mars',    name: 'Ruchaka', meaning: 'Courage, leadership, military prowess' },
    { planet: 'mercury', name: 'Bhadra',  meaning: 'Intelligence, communication, business acumen' },
    { planet: 'jupiter', name: 'Hamsa',   meaning: 'Wisdom, spirituality, good fortune' },
    { planet: 'venus',   name: 'Malavya', meaning: 'Beauty, luxury, artistic talent, prosperity' },
    { planet: 'saturn',  name: 'Sasa',    meaning: 'Discipline, authority, large following, longevity' },
  ];

  for (const { planet, name, meaning } of mahapurushaConfig) {
    if (!planets[planet]) continue;
    const lon   = planets[planet].siderealLongitude;
    const house = planets[planet].house;
    if ((inOwnSign(planet, lon) || isExalted(planet, lon)) && inKendra(house)) {
      yogas.push({
        name,
        type: 'Pancha Mahapurusha',
        planets: [planet],
        strength: isExalted(planet, lon) ? 'Very Strong' : 'Strong',
        meaning,
        formed: true,
      });
    }
  }

  // ──────────────────────────────────────────────
  // RAJ YOGAS
  // Lord of a Kendra + lord of a Trikona in conjunction, mutual aspect, or exchange
  // ──────────────────────────────────────────────

  const kendraLords  = KENDRA_HOUSES.map(h => getHouseLordByNumber(h, ascSignIndex));
  const trikonaLords = TRIKONA_HOUSES.map(h => getHouseLordByNumber(h, ascSignIndex));

  for (const kl of kendraLords) {
    for (const tl of trikonaLords) {
      if (kl === tl) continue; // same planet rules both → auto Raj Yoga
      if (!planets[kl] || !planets[tl]) continue;

      const klSign = Math.floor(planets[kl].siderealLongitude / 30);
      const tlSign = Math.floor(planets[tl].siderealLongitude / 30);

      // Conjunction (same sign)
      if (klSign === tlSign) {
        yogas.push({
          name: 'Raj Yoga',
          type: 'Raj Yoga',
          planets: [kl, tl],
          strength: 'Strong',
          meaning: `${kl} (Kendra lord) and ${tl} (Trikona lord) are conjunct — power, status, recognition`,
          formed: true,
          house: planets[kl].house,
        });
      }

      // Mutual aspect (7th sign from each other)
      if (Math.abs(klSign - tlSign) === 6) {
        yogas.push({
          name: 'Raj Yoga (Mutual Aspect)',
          type: 'Raj Yoga',
          planets: [kl, tl],
          strength: 'Moderate',
          meaning: `${kl} and ${tl} mutually aspect — authority and achievement`,
          formed: true,
        });
      }

      // Sign exchange (Parivartana)
      const klLord = getSignLord(klSign);
      const tlLord = getSignLord(tlSign);
      if (klLord === tl && tlLord === kl) {
        yogas.push({
          name: 'Parivartana Raj Yoga',
          type: 'Raj Yoga',
          planets: [kl, tl],
          strength: 'Very Strong',
          meaning: `${kl} and ${tl} exchange signs — exceptional power and rise in life`,
          formed: true,
        });
      }
    }
  }

  // ──────────────────────────────────────────────
  // DHANA YOGAS (Wealth combinations)
  // ──────────────────────────────────────────────

  // 2nd and 11th lords together → wealth
  const lord2  = getHouseLordByNumber(2, ascSignIndex);
  const lord11 = getHouseLordByNumber(11, ascSignIndex);
  if (planets[lord2] && planets[lord11]) {
    const s2  = Math.floor(planets[lord2].siderealLongitude / 30);
    const s11 = Math.floor(planets[lord11].siderealLongitude / 30);
    if (s2 === s11) {
      yogas.push({
        name: 'Dhana Yoga',
        type: 'Dhana Yoga',
        planets: [lord2, lord11],
        strength: 'Strong',
        meaning: '2nd lord and 11th lord conjunct — financial gains and accumulated wealth',
        formed: true,
        house: planets[lord2].house,
      });
    }
  }

  // Jupiter in 2nd, 5th, 9th, or 11th
  if (planets.jupiter && [2, 5, 9, 11].includes(planets.jupiter.house)) {
    yogas.push({
      name: 'Jupiter in Dhana House',
      type: 'Dhana Yoga',
      planets: ['jupiter'],
      strength: 'Moderate',
      meaning: `Jupiter in house ${planets.jupiter.house} — wealth, wisdom, and prosperity`,
      formed: true,
      house: planets.jupiter.house,
    });
  }

  // ──────────────────────────────────────────────
  // GAJAKESARI YOGA
  // Jupiter in Kendra from Moon
  // ──────────────────────────────────────────────
  if (planets.jupiter && planets.moon) {
    const moonSign = Math.floor(planets.moon.siderealLongitude / 30);
    const jupSign  = Math.floor(planets.jupiter.siderealLongitude / 30);
    const dist = ((jupSign - moonSign + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(dist)) {
      yogas.push({
        name: 'Gajakesari Yoga',
        type: 'Prosperity Yoga',
        planets: ['jupiter', 'moon'],
        strength: 'Very Strong',
        meaning: 'Jupiter in Kendra from Moon — renowned, intelligent, prosperous, respected leader',
        formed: true,
      });
    }
  }

  // ──────────────────────────────────────────────
  // BUDHA-ADITYA YOGA (Sun + Mercury conjunction)
  // ──────────────────────────────────────────────
  if (planets.sun && planets.mercury) {
    const sunSign  = Math.floor(planets.sun.siderealLongitude / 30);
    const mercSign = Math.floor(planets.mercury.siderealLongitude / 30);
    if (sunSign === mercSign) {
      yogas.push({
        name: 'Budha-Aditya Yoga',
        type: 'Intelligence Yoga',
        planets: ['sun', 'mercury'],
        strength: 'Moderate',
        meaning: 'Sun and Mercury conjunct — sharp intellect, good communication, respect from authorities',
        formed: true,
        house: planets.sun.house,
      });
    }
  }

  // ──────────────────────────────────────────────
  // CHANDRA-MANGALA YOGA (Moon + Mars conjunction)
  // ──────────────────────────────────────────────
  if (planets.moon && planets.mars) {
    const moonSign = Math.floor(planets.moon.siderealLongitude / 30);
    const marsSign = Math.floor(planets.mars.siderealLongitude / 30);
    if (moonSign === marsSign) {
      yogas.push({
        name: 'Chandra-Mangala Yoga',
        type: 'Wealth Yoga',
        planets: ['moon', 'mars'],
        strength: 'Moderate',
        meaning: 'Moon and Mars conjunct — wealth through business, determined mindset, entrepreneurial',
        formed: true,
        house: planets.moon.house,
      });
    }
  }

  // ──────────────────────────────────────────────
  // KEMADRUMA YOGA (Moon alone, no planets on either side)
  // ──────────────────────────────────────────────
  if (planets.moon) {
    const moonSign = Math.floor(planets.moon.siderealLongitude / 30);
    const prevSign = (moonSign - 1 + 12) % 12;
    const nextSign = (moonSign + 1) % 12;
    const otherPlanets = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const hasAdjacent = otherPlanets.some(p => {
      if (!planets[p]) return false;
      const s = Math.floor(planets[p].siderealLongitude / 30);
      return s === prevSign || s === nextSign || s === moonSign;
    });
    if (!hasAdjacent) {
      yogas.push({
        name: 'Kemadruma Yoga',
        type: 'Challenging Yoga',
        planets: ['moon'],
        strength: 'Negative',
        meaning: 'Moon is isolated — possible emotional instability, challenges in early life; mitigated by other beneficial yogas',
        formed: true,
        house: planets.moon.house,
      });
    }
  }

  // ──────────────────────────────────────────────
  // NEECHA BHANGA RAJ YOGA
  // Debilitated planet's dispositor is in Kendra → cancellation of debilitation
  // ──────────────────────────────────────────────
  for (const [planet, lon] of Object.entries(DEBILITATION)) {
    if (!planets[planet]) continue;
    const planSign = Math.floor(planets[planet].siderealLongitude / 30);
    const debSign  = Math.floor(lon / 30);
    if (planSign !== debSign) continue; // planet not debilitated

    // Dispositor = lord of the sign where debilitated planet sits
    const dispositor = getSignLord(planSign);
    if (!planets[dispositor]) continue;
    if (inKendra(planets[dispositor].house)) {
      yogas.push({
        name: 'Neecha Bhanga Raj Yoga',
        type: 'Raj Yoga',
        planets: [planet, dispositor],
        strength: 'Strong',
        meaning: `${planet} is debilitated but ${dispositor} (dispositor) is in a Kendra — debilitation is cancelled; powerful rise after initial struggles`,
        formed: true,
      });
    }
  }

  // ──────────────────────────────────────────────
  // VIPAREETA RAJA YOGA
  // Lords of 6, 8, 12 in dusthana or each other's houses → paradoxical rise
  // ──────────────────────────────────────────────
  const dusthanaLords = DUSTHANA_HOUSES.map(h => getHouseLordByNumber(h, ascSignIndex));
  for (const lord of dusthanaLords) {
    if (!planets[lord]) continue;
    if (inDusthana(planets[lord].house)) {
      yogas.push({
        name: 'Vipareeta Raja Yoga',
        type: 'Raj Yoga',
        planets: [lord],
        strength: 'Moderate',
        meaning: `${lord} (lord of a dusthana) is in a dusthana house — unexpected rise through others' losses, resilience`,
        formed: true,
        house: planets[lord].house,
      });
    }
  }

  return yogas;
}

/**
 * Helper: get house lord by house number and ascendant sign index
 */
function getHouseLordByNumber(houseNumber, ascSignIndex) {
  const lords = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
                 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
  const signIndex = (ascSignIndex + houseNumber - 1) % 12;
  return lords[signIndex];
}
