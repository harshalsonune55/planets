/**
 * Rashi (Zodiac Sign) data and utilities
 *
 * 12 Rashis, each spanning 30° of the sidereal zodiac
 */

export const RASHIS = [
  {
    number: 1,  name: 'Mesha',      english: 'Aries',       lord: 'mars',
    element: 'Fire',  quality: 'Movable', gender: 'Male',
    body_part: 'Head',
    nature: 'Fiery, active, ambitious, courageous',
  },
  {
    number: 2,  name: 'Vrishabha',  english: 'Taurus',      lord: 'venus',
    element: 'Earth', quality: 'Fixed',   gender: 'Female',
    body_part: 'Face & neck',
    nature: 'Stable, sensual, patient, artistic',
  },
  {
    number: 3,  name: 'Mithuna',    english: 'Gemini',      lord: 'mercury',
    element: 'Air',   quality: 'Dual',    gender: 'Male',
    body_part: 'Arms & shoulders',
    nature: 'Adaptable, intellectual, communicative',
  },
  {
    number: 4,  name: 'Karka',      english: 'Cancer',      lord: 'moon',
    element: 'Water', quality: 'Movable', gender: 'Female',
    body_part: 'Chest & heart',
    nature: 'Nurturing, sensitive, intuitive',
  },
  {
    number: 5,  name: 'Simha',      english: 'Leo',         lord: 'sun',
    element: 'Fire',  quality: 'Fixed',   gender: 'Male',
    body_part: 'Stomach & back',
    nature: 'Proud, generous, leadership, dramatic',
  },
  {
    number: 6,  name: 'Kanya',      english: 'Virgo',       lord: 'mercury',
    element: 'Earth', quality: 'Dual',    gender: 'Female',
    body_part: 'Intestines & waist',
    nature: 'Analytical, practical, detail-oriented',
  },
  {
    number: 7,  name: 'Tula',       english: 'Libra',       lord: 'venus',
    element: 'Air',   quality: 'Movable', gender: 'Male',
    body_part: 'Kidneys & lower back',
    nature: 'Balanced, diplomatic, aesthetic',
  },
  {
    number: 8,  name: 'Vrischika',  english: 'Scorpio',     lord: 'mars',
    element: 'Water', quality: 'Fixed',   gender: 'Female',
    body_part: 'Genitals & excretory organs',
    nature: 'Intense, transformative, secretive',
  },
  {
    number: 9,  name: 'Dhanu',      english: 'Sagittarius', lord: 'jupiter',
    element: 'Fire',  quality: 'Dual',    gender: 'Male',
    body_part: 'Thighs & hips',
    nature: 'Philosophical, adventurous, optimistic',
  },
  {
    number: 10, name: 'Makara',     english: 'Capricorn',   lord: 'saturn',
    element: 'Earth', quality: 'Movable', gender: 'Female',
    body_part: 'Knees & skin',
    nature: 'Ambitious, disciplined, responsible',
  },
  {
    number: 11, name: 'Kumbha',     english: 'Aquarius',    lord: 'saturn',
    element: 'Air',   quality: 'Fixed',   gender: 'Male',
    body_part: 'Calves & ankles',
    nature: 'Humanitarian, innovative, unconventional',
  },
  {
    number: 12, name: 'Meena',      english: 'Pisces',      lord: 'jupiter',
    element: 'Water', quality: 'Dual',    gender: 'Female',
    body_part: 'Feet',
    nature: 'Compassionate, spiritual, intuitive',
  },
];

/**
 * Get Rashi (sign) for a sidereal longitude
 * @param {number} longitude - 0–360 sidereal degrees
 * @returns {object} rashi details + degrees in sign
 */
export function getRashi(longitude) {
  const lon = ((longitude % 360) + 360) % 360;
  const index = Math.floor(lon / 30);
  const rashi = RASHIS[index];
  const degInSign = lon - index * 30;

  // Degrees, minutes, seconds in sign
  const degrees = Math.floor(degInSign);
  const minutesFull = (degInSign - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = Math.floor((minutesFull - minutes) * 60);

  return {
    ...rashi,
    longitude,
    degInSign,
    degrees,
    minutes,
    seconds,
    dmsFormatted: `${degrees}° ${minutes}' ${seconds}"`,
  };
}

/**
 * Natural malefics and benefics (standard Vedic classification)
 */
export const NATURAL_MALEFICS  = ['sun', 'mars', 'saturn', 'rahu', 'ketu'];
export const NATURAL_BENEFICS  = ['moon', 'mercury', 'jupiter', 'venus'];

/**
 * Exaltation and debilitation longitudes (sidereal)
 */
export const EXALTATION = {
  sun:     10,    // Aries 10°
  moon:    33,    // Taurus  3°
  mars:   298,    // Capricorn 28°
  mercury: 165,   // Virgo  15°
  jupiter:  95,   // Cancer  5°
  venus:    357,  // Pisces 27°
  saturn:   200,  // Libra  20°
  rahu:      60,  // Gemini  0° (various opinions)
  ketu:     240,  // Sagittarius 0°
};

export const DEBILITATION = {
  sun:     190,   // Libra 10°
  moon:    213,   // Scorpio 3°
  mars:    118,   // Cancer 28°
  mercury: 345,   // Pisces 15°
  jupiter: 275,   // Capricorn 5°
  venus:   177,   // Virgo 27°
  saturn:   20,   // Aries 20°
  rahu:    240,   // Sagittarius
  ketu:     60,   // Gemini
};

/**
 * Own signs (Moolatrikona and own)
 */
export const OWN_SIGNS = {
  sun:     [4],           // Leo
  moon:    [3],           // Cancer
  mars:    [0, 7],        // Aries, Scorpio
  mercury: [2, 5],        // Gemini, Virgo
  jupiter: [8, 11],       // Sagittarius, Pisces
  venus:   [1, 6],        // Taurus, Libra
  saturn:  [9, 10],       // Capricorn, Aquarius
};

/**
 * Check dignity of a planet
 * @param {string} planet - planet name
 * @param {number} longitude - sidereal longitude (0–360)
 * @returns {string} 'exalted'|'debilitated'|'own'|'neutral'
 */
export function getPlanetDignity(planet, longitude) {
  const lon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(lon / 30);

  const exalSign = Math.floor(EXALTATION[planet] / 30);
  const debSign  = Math.floor(DEBILITATION[planet] / 30);

  // Within 1° of exact exaltation degree = strong exaltation
  const diffExalt = Math.abs(lon - EXALTATION[planet]);
  const diffDebil = Math.abs(lon - DEBILITATION[planet]);

  if (diffExalt < 1) return 'exalted (exact)';
  if (diffDebil < 1) return 'debilitated (exact)';
  if (signIndex === exalSign) return 'exalted';
  if (signIndex === debSign)  return 'debilitated';
  if (OWN_SIGNS[planet]?.includes(signIndex)) return 'own sign';
  return 'neutral';
}
