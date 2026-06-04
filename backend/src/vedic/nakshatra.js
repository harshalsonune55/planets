/**
 * Nakshatra (Lunar Mansion) calculations
 *
 * The zodiac is divided into 27 Nakshatras, each spanning 13°20' (800').
 * Each Nakshatra has 4 Padas of 3°20' each.
 *
 * Nakshatra lord sequence (Vimshottari Dasha order):
 *   Ashwini → Ketu, Bharani → Venus, Krittika → Sun …
 */

export const NAKSHATRAS = [
  {
    number: 1, name: 'Ashwini',    start:   0.000, end:  13.333, lord: 'ketu',
    deity: 'Ashwini Kumaras', symbol: 'Horse head',
    qualities: 'Quick, healing, beginnings',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 2, name: 'Bharani',    start:  13.333, end:  26.667, lord: 'venus',
    deity: 'Yama', symbol: 'Yoni (female organ)',
    qualities: 'Receptive, transformative, creative',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 3, name: 'Krittika',   start:  26.667, end:  40.000, lord: 'sun',
    deity: 'Agni', symbol: 'Razor / knife',
    qualities: 'Cutting, purifying, burning',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 4, name: 'Rohini',     start:  40.000, end:  53.333, lord: 'moon',
    deity: 'Brahma', symbol: 'Cart / chariot',
    qualities: 'Growth, beauty, fertility',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 5, name: 'Mrigashira', start:  53.333, end:  66.667, lord: 'mars',
    deity: 'Soma', symbol: 'Deer head',
    qualities: 'Searching, gentle, curious',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 6, name: "Ardra",      start:  66.667, end:  80.000, lord: 'rahu',
    deity: 'Rudra', symbol: 'Teardrop / diamond',
    qualities: 'Stormy, transforming, emotional',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 7, name: 'Punarvasu',  start:  80.000, end:  93.333, lord: 'jupiter',
    deity: 'Aditi', symbol: 'Quiver of arrows',
    qualities: 'Return, renewal, goodness',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 8, name: 'Pushya',     start:  93.333, end: 106.667, lord: 'saturn',
    deity: 'Brihaspati', symbol: 'Flower / circle',
    qualities: 'Nourishing, protective, spiritual',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 9, name: 'Ashlesha',   start: 106.667, end: 120.000, lord: 'mercury',
    deity: 'Naga', symbol: 'Coiled serpent',
    qualities: 'Cunning, clinging, mystical',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 10, name: 'Magha',     start: 120.000, end: 133.333, lord: 'ketu',
    deity: 'Pitris', symbol: 'Royal throne',
    qualities: 'Powerful, ancestral, royal',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 11, name: 'Purva Phalguni', start: 133.333, end: 146.667, lord: 'venus',
    deity: 'Bhaga', symbol: 'Front legs of bed',
    qualities: 'Pleasure, rest, creativity',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 12, name: 'Uttara Phalguni', start: 146.667, end: 160.000, lord: 'sun',
    deity: 'Aryaman', symbol: 'Back legs of bed',
    qualities: 'Patronage, friendship, marriage',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 13, name: 'Hasta',     start: 160.000, end: 173.333, lord: 'moon',
    deity: 'Savitar', symbol: 'Open hand',
    qualities: 'Skill, dexterity, service',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 14, name: 'Chitra',    start: 173.333, end: 186.667, lord: 'mars',
    deity: 'Vishvakarma', symbol: 'Bright jewel / pearl',
    qualities: 'Creative, bright, artistic',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 15, name: 'Swati',     start: 186.667, end: 200.000, lord: 'rahu',
    deity: 'Vayu', symbol: 'Sword / coral',
    qualities: 'Independent, flexible, business',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 16, name: 'Vishakha',  start: 200.000, end: 213.333, lord: 'jupiter',
    deity: 'Indra-Agni', symbol: "Archway / potter's wheel",
    qualities: 'Goal-oriented, determined, fiery',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 17, name: 'Anuradha', start: 213.333, end: 226.667, lord: 'saturn',
    deity: 'Mitra', symbol: 'Lotus',
    qualities: 'Devoted, friendly, disciplined',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 18, name: 'Jyeshtha', start: 226.667, end: 240.000, lord: 'mercury',
    deity: 'Indra', symbol: 'Circular amulet',
    qualities: 'Protective, eldest, power',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 19, name: 'Mula',     start: 240.000, end: 253.333, lord: 'ketu',
    deity: 'Nirriti', symbol: 'Tied bunch of roots',
    qualities: 'Investigating, uprooting, direct',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 20, name: 'Purva Ashadha', start: 253.333, end: 266.667, lord: 'venus',
    deity: 'Apas', symbol: 'Fan / winnowing basket',
    qualities: 'Proud, early victory, persuasive',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 21, name: 'Uttara Ashadha', start: 266.667, end: 280.000, lord: 'sun',
    deity: 'Vishvadevas', symbol: 'Tusk of elephant',
    qualities: 'Final victory, immovable, virtuous',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 22, name: 'Shravana', start: 280.000, end: 293.333, lord: 'moon',
    deity: 'Vishnu', symbol: 'Three footprints / ear',
    qualities: 'Listening, learning, connecting',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 23, name: 'Dhanishtha', start: 293.333, end: 306.667, lord: 'mars',
    deity: 'Ashta Vasus', symbol: 'Drum / flute',
    qualities: 'Wealth, musical, ambitious',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 24, name: 'Shatabhisha', start: 306.667, end: 320.000, lord: 'rahu',
    deity: 'Varuna', symbol: '100 stars / circle',
    qualities: 'Healing, mysterious, independent',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
  {
    number: 25, name: 'Purva Bhadrapada', start: 320.000, end: 333.333, lord: 'jupiter',
    deity: 'Aja Ekapad', symbol: 'Front legs of funeral cot',
    qualities: 'Passionate, intense, dual',
    pada: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  {
    number: 26, name: 'Uttara Bhadrapada', start: 333.333, end: 346.667, lord: 'saturn',
    deity: 'Ahir Budhnya', symbol: 'Back legs of funeral cot',
    qualities: 'Depth, wisdom, charitable',
    pada: ['Leo', 'Virgo', 'Libra', 'Scorpio'],
  },
  {
    number: 27, name: 'Revati',   start: 346.667, end: 360.000, lord: 'mercury',
    deity: 'Pushan', symbol: 'Fish / drum',
    qualities: 'Nurturing, journey, completion',
    pada: ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  },
];

/**
 * Nakshatra span in degrees
 */
const NAKSHATRA_SPAN = 360 / 27; // = 13.333...°

/**
 * Get Nakshatra data for a sidereal longitude
 * @param {number} longitude - sidereal longitude (0–360)
 * @returns {object} nakshatra details
 */
export function getNakshatra(longitude) {
  const lon = ((longitude % 360) + 360) % 360;
  const index = Math.floor(lon / NAKSHATRA_SPAN);
  const nk = NAKSHATRAS[index];
  const degInNakshatra = lon - nk.start;
  const padaNumber = Math.floor(degInNakshatra / (NAKSHATRA_SPAN / 4)) + 1;
  const percentComplete = (degInNakshatra / NAKSHATRA_SPAN) * 100;

  return {
    number: nk.number,
    name: nk.name,
    lord: nk.lord,
    deity: nk.deity,
    symbol: nk.symbol,
    qualities: nk.qualities,
    pada: padaNumber,
    padaRashi: nk.pada[padaNumber - 1],
    degreeInNakshatra: degInNakshatra,
    percentComplete: Math.round(percentComplete * 100) / 100,
  };
}

/**
 * Get remaining degrees in current Nakshatra
 */
export function getRemainingNakshatraDegrees(longitude) {
  const lon = ((longitude % 360) + 360) % 360;
  const index = Math.floor(lon / NAKSHATRA_SPAN);
  const nk = NAKSHATRAS[index];
  return nk.end - lon;
}

/**
 * Vimshottari Dasha years for each Nakshatra lord
 */
export const DASHA_YEARS = {
  ketu:    7,
  venus:  20,
  sun:     6,
  moon:   10,
  mars:    7,
  rahu:   18,
  jupiter: 16,
  saturn:  19,
  mercury: 17,
};

/**
 * Ordered sequence of Dasha lords (repeating cycle)
 */
export const DASHA_ORDER = [
  'ketu', 'venus', 'sun', 'moon', 'mars',
  'rahu', 'jupiter', 'saturn', 'mercury'
];

/**
 * Total years in one full Vimshottari Dasha cycle
 */
export const DASHA_TOTAL_YEARS = 120;
