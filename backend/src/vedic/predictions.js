/**
 * Vedic Prediction Engine
 *
 * Generates predictions based on:
 *   1. Current Dasha (Mahadasha + Antardasha)
 *   2. Gochar (transits) — current planet positions vs birth chart
 *   3. Natal promise (birth chart analysis)
 */

import { calculateChart } from './chart.js';
import { getCurrentDasha } from './dasha.js';
import { DASHA_YEARS } from './nakshatra.js';
import { HOUSE_SIGNIFICATIONS, KENDRA_HOUSES, TRIKONA_HOUSES, DUSTHANA_HOUSES } from './houses.js';

// ──────────────────────────────────────────────────────────────────
// DASHA PREDICTIONS
// Each planet's Mahadasha / Antardasha themes
// ──────────────────────────────────────────────────────────────────

const DASHA_THEMES = {
  sun: {
    positive: [
      'Career growth and recognition from authorities',
      'Leadership opportunities and government favor',
      'Improved vitality and self-confidence',
      'Fame, honor, and social status rise',
      'Father or father-figure plays an important role',
    ],
    negative: [
      'Ego conflicts with others in power',
      'Possible health issues related to heart, eyes, or bones',
      'Arrogance or pride may cause setbacks',
    ],
    areas: 'Career, health, authority, father, government',
  },
  moon: {
    positive: [
      'Emotional fulfillment and domestic happiness',
      'Travel, especially near water or foreign lands',
      'Creative and intuitive faculties heightened',
      'Good period for relationships and social life',
      'Mother or mother-figure benefits',
    ],
    negative: [
      'Emotional instability if Moon is afflicted',
      'Mind may be restless or prone to anxiety',
      'Changes in residence or workplace',
    ],
    areas: 'Mind, emotions, mother, home, travel, public life',
  },
  mars: {
    positive: [
      'Courage, energy, and decisive action',
      'Success in competitions, sports, and technical fields',
      'Property acquisition and real estate gains',
      'Sibling relationships are highlighted',
    ],
    negative: [
      'Accidents, injuries, surgeries if afflicted',
      'Conflicts, disputes, aggression',
      'Hasty decisions may cause problems',
    ],
    areas: 'Energy, siblings, property, competitors, surgery',
  },
  mercury: {
    positive: [
      'Intelligence, communication, and learning flourish',
      'Business, trade, and commerce are favored',
      'Writing, teaching, and media opportunities',
      'Networking and short travels benefit you',
    ],
    negative: [
      'Nervous system issues, skin problems',
      'Over-analysis or indecisiveness',
      'Miscommunication in relationships',
    ],
    areas: 'Communication, business, education, travel, intellect',
  },
  jupiter: {
    positive: [
      'Expansion in all areas of life — career, wealth, wisdom',
      'Spiritual growth, philosophy, and higher education',
      'Marriage, children, and family blessings',
      'Teachers, mentors, and gurus play a key role',
      'Fame and respect in society',
    ],
    negative: [
      'Over-optimism or over-expansion',
      'Weight gain or liver issues',
      'Laziness or complacency',
    ],
    areas: 'Wisdom, expansion, wealth, children, marriage, religion',
  },
  venus: {
    positive: [
      'Love, romance, and relationships flourish',
      'Material comforts, luxury, and aesthetic pleasures',
      'Creative and artistic endeavors succeed',
      'Financial gains and prosperity',
    ],
    negative: [
      'Over-indulgence in pleasures',
      'Relationship complications',
      'Kidney or reproductive issues',
    ],
    areas: 'Love, beauty, luxury, arts, marriage, finances',
  },
  saturn: {
    positive: [
      'Hard work pays off — discipline and perseverance rewarded',
      'Promotion through sustained effort',
      'Spiritual maturity and detachment from materialism',
      'Long-term projects and structures built',
    ],
    negative: [
      'Delays, obstacles, and slowdowns',
      'Health issues related to joints, teeth, bones',
      'Loneliness or isolation',
      'Lessons in karma and responsibility',
    ],
    areas: 'Discipline, karma, longevity, servants, masses, hard work',
  },
  rahu: {
    positive: [
      'Foreign connections, unconventional opportunities',
      'Technology, media, and modern fields favored',
      'Sudden rise, material gains through worldly means',
      'Fame through unique or unconventional paths',
    ],
    negative: [
      'Confusion, illusion, and unpredictability',
      'Addictions, obsessions, or strange experiences',
      'Deception by others or misplaced ambitions',
    ],
    areas: 'Foreign lands, technology, illusion, fame, ambition',
  },
  ketu: {
    positive: [
      'Spiritual awakening and moksha-oriented tendencies',
      'Psychic abilities and intuition enhanced',
      'Liberation from past karmas',
      'Research, occult, and healing abilities',
    ],
    negative: [
      'Detachment from material life may cause loss',
      'Health issues, accidents, or sudden reversals',
      'Confusion about direction in life',
    ],
    areas: 'Spirituality, liberation, past life, occult, isolation',
  },
};

// ──────────────────────────────────────────────────────────────────
// TRANSIT (GOCHAR) ANALYSIS
// How current transiting planets affect natal chart positions
// ──────────────────────────────────────────────────────────────────

const TRANSIT_RULES = {
  // Jupiter transit through natal Moon's chart position
  jupiter_moon: {
    1: 'Jupiter over natal Moon — highly auspicious; new beginnings, optimism, and health improvement',
    5: 'Jupiter trining natal Moon — creative expansion, children, romance',
    9: 'Jupiter trining natal Moon — excellent for spirituality, travel, higher learning',
    7: 'Jupiter opposing natal Moon — relationship expansion; can also bring over-commitment',
    4: 'Jupiter squaring natal Moon — home changes, emotional growth',
  },
  saturn_moon: {
    1: 'Saturn over natal Moon (Sade Sati middle) — transformative but challenging; discipline needed',
    12: 'Saturn entering Sade Sati — period of reflection, preparation',
    2: 'Saturn leaving Sade Sati — period of rebuilding after trials',
  },
};

/**
 * Analyze transits of major planets over natal positions
 * @param {Object} transitPlanets - current planet positions
 * @param {Object} natalPlanets   - birth chart planet positions
 * @returns {Array} transit interpretations
 */
function analyzeTransits(transitPlanets, natalPlanets) {
  const interpretations = [];

  // Jupiter transits
  if (transitPlanets.jupiter && natalPlanets.moon) {
    const jupSid  = transitPlanets.jupiter.siderealLongitude;
    const moonSid = natalPlanets.moon.siderealLongitude;
    const jupSign  = Math.floor(jupSid / 30);
    const moonSign = Math.floor(moonSid / 30);
    const dist = ((jupSign - moonSign + 12) % 12) + 1;

    if ([1, 5, 9].includes(dist)) {
      interpretations.push({
        transit: 'Jupiter ↔ Natal Moon',
        type: 'benefic',
        house: dist,
        interpretation: TRANSIT_RULES.jupiter_moon[dist] ||
          `Jupiter transiting ${dist}th from natal Moon — generally favorable`,
        duration: 'approx 1 year in this sign',
      });
    } else if (dist === 7) {
      interpretations.push({
        transit: 'Jupiter ↔ Natal Moon',
        type: 'mixed',
        house: dist,
        interpretation: TRANSIT_RULES.jupiter_moon[7],
        duration: 'approx 1 year in this sign',
      });
    }
  }

  // Saturn Sade Sati (7.5 years — Saturn transits 12th, 1st, 2nd from natal Moon)
  if (transitPlanets.saturn && natalPlanets.moon) {
    const satSid  = transitPlanets.saturn.siderealLongitude;
    const moonSid = natalPlanets.moon.siderealLongitude;
    const satSign  = Math.floor(satSid / 30);
    const moonSign = Math.floor(moonSid / 30);
    const dist = ((satSign - moonSign + 12) % 12) + 1;

    if ([12, 1, 2].includes(dist)) {
      const phase = dist === 12 ? 'Beginning (preparatory)' : dist === 1 ? 'Peak (transformative)' : 'Ending (rebuilding)';
      interpretations.push({
        transit: 'Sade Sati — Saturn ↔ Natal Moon',
        type: dist === 1 ? 'challenging' : 'transformative',
        house: dist,
        phase,
        interpretation: `Saturn Sade Sati ${phase} — ${
          dist === 12
            ? 'increased expenses, isolation, introspection'
            : dist === 1
            ? 'maximum pressure, karmic lessons, but also great strength-building'
            : 'release from Sade Sati, rebuilding life'
        }`,
        duration: 'approx 2.5 years per phase',
      });
    }
  }

  // Jupiter transits over natal Jupiter (Jupiter return)
  if (transitPlanets.jupiter && natalPlanets.jupiter) {
    const tjSign = Math.floor(transitPlanets.jupiter.siderealLongitude / 30);
    const njSign = Math.floor(natalPlanets.jupiter.siderealLongitude / 30);
    if (tjSign === njSign) {
      interpretations.push({
        transit: 'Jupiter Return',
        type: 'benefic',
        house: 1,
        interpretation: 'Jupiter returns to its natal position (every ~12 years) — major expansion, new 12-year cycle beginning, wisdom and growth emphasized',
        duration: 'approx 1 year',
      });
    }
  }

  // Rahu / Ketu transits (18-month cycle)
  if (transitPlanets.rahu && natalPlanets.moon) {
    const rSid = transitPlanets.rahu.siderealLongitude;
    const mSid = natalPlanets.moon.siderealLongitude;
    const rSign = Math.floor(rSid / 30);
    const mSign = Math.floor(mSid / 30);
    const dist = ((rSign - mSign + 12) % 12) + 1;
    if (dist === 1) {
      interpretations.push({
        transit: 'Rahu over Natal Moon',
        type: 'karmic',
        house: 1,
        interpretation: 'Rahu transiting natal Moon — intense desires, foreign connections, unusual experiences, mind may be restless',
        duration: 'approx 18 months',
      });
    }
    if (dist === 7) {
      interpretations.push({
        transit: 'Ketu over Natal Moon',
        type: 'spiritual',
        house: 7,
        interpretation: 'Ketu transiting natal Moon — spiritual detachment, past-life memories surface, emotional introspection',
        duration: 'approx 18 months',
      });
    }
  }

  return interpretations;
}

/**
 * Generate comprehensive Vedic predictions
 *
 * @param {Object} birthParams   - same as calculateChart params
 * @param {Object} queryParams   - { year, month, day } for query date (defaults to today)
 * @returns {Object} predictions
 */
export function generatePredictions(birthParams, queryParams = null) {
  // Calculate birth chart
  const natalChart = calculateChart(birthParams);

  // Calculate transit chart for query date
  const today = new Date();
  const qp = queryParams || {
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
    day: today.getUTCDate(),
    hour: today.getUTCHours(),
    minute: today.getUTCMinutes(),
    latitude: birthParams.latitude,
    longitude: birthParams.longitude,
    timezone: birthParams.timezone,
    ayanamsha: birthParams.ayanamsha || 'lahiri',
    houseSystem: birthParams.houseSystem || 'wholesign',
  };

  const transitChart = calculateChart(qp);

  // Get current dasha
  const birthDateTime = new Date(
    Date.UTC(
      birthParams.year,
      birthParams.month - 1,
      birthParams.day,
      birthParams.hour - (birthParams.timezone || 0),
      birthParams.minute || 0,
    )
  );
  const queryDateTime = new Date(
    Date.UTC(qp.year, qp.month - 1, qp.day)
  );
  const dashaInfo = getCurrentDasha(
    natalChart.planets.moon.siderealLongitude,
    birthDateTime,
    queryDateTime
  );

  // Dasha themes
  const mahaLord  = dashaInfo.currentMaha?.lord;
  const antarLord = dashaInfo.currentAntar?.lord;

  const dashaPredictions = {
    mahadasha: mahaLord
      ? { lord: mahaLord, themes: DASHA_THEMES[mahaLord] }
      : null,
    antardasha: antarLord
      ? { lord: antarLord, themes: DASHA_THEMES[antarLord] }
      : null,
    combined: mahaLord && antarLord
      ? generateCombinedDashaPrediction(mahaLord, antarLord, natalChart)
      : null,
  };

  // Transit analysis
  const transitPredictions = analyzeTransits(transitChart.planets, natalChart.planets);

  // Natal promises (based on birth chart)
  const natalAnalysis = analyzeNatalChart(natalChart);

  return {
    queryDate: `${qp.year}-${String(qp.month).padStart(2, '0')}-${String(qp.day).padStart(2, '0')}`,
    currentDasha: dashaInfo,
    dashaPredictions,
    transitPredictions,
    natalAnalysis,
    natalChart: {
      ascendant: natalChart.ascendant,
      planets: natalChart.planets,
      yogas: natalChart.yogas,
      panchanga: natalChart.panchanga,
    },
    currentTransits: {
      planets: transitChart.planets,
      panchanga: transitChart.panchanga,
    },
  };
}

/**
 * Generate predictions based on combined Mahadasha + Antardasha
 */
function generateCombinedDashaPrediction(mahaLord, antarLord, natalChart) {
  const combinations = {
    'sun-jupiter':  'Authority and wisdom combine — excellent for career advancement and spiritual growth',
    'sun-venus':    'Status meets luxury — good for creative pursuits and romantic partnerships',
    'sun-saturn':   'Disciplined effort for authority — demanding but rewarding period for career',
    'moon-jupiter': 'Emotional wisdom — excellent for family, education, and spiritual matters',
    'moon-venus':   'Harmony and pleasure — favorable for relationships, arts, and domestic happiness',
    'mars-saturn':  'Determined action — can produce tremendous results through focused hard work',
    'jupiter-venus':'Expansion and prosperity — one of the most favorable combinations for wealth and relationships',
    'mercury-venus':'Intellect meets beauty — excellent for arts, business, and communication',
    'venus-jupiter':'Prosperity and wisdom — highly auspicious for wealth, love, and spiritual growth',
    'saturn-mercury':'Disciplined thought — good for analytical work, research, and systematic planning',
  };

  const key1 = `${mahaLord}-${antarLord}`;
  const key2 = `${antarLord}-${mahaLord}`;

  const description = combinations[key1] || combinations[key2] ||
    `${mahaLord} Mahadasha / ${antarLord} Antardasha — mixed influences; consult natal chart strengths`;

  // Check if Dasha lords are favorable for the native
  const mahaHouse  = natalChart.planets[mahaLord]?.house;
  const antarHouse = natalChart.planets[antarLord]?.house;

  return {
    period: `${mahaLord} / ${antarLord}`,
    description,
    mahaHousePosition: mahaHouse
      ? `${mahaLord} is in house ${mahaHouse} natally (${HOUSE_SIGNIFICATIONS[mahaHouse]})`
      : null,
    antarHousePosition: antarHouse
      ? `${antarLord} is in house ${antarHouse} natally (${HOUSE_SIGNIFICATIONS[antarHouse]})`
      : null,
  };
}

/**
 * Analyze natal chart for inherent strengths and challenges
 */
function analyzeNatalChart(chart) {
  const analysis = {
    strongPlanets:    [],
    weakPlanets:      [],
    strongHouses:     [],
    challengingAreas: [],
    keyYogas:         chart.yogas,
  };

  for (const [name, data] of Object.entries(chart.planets)) {
    if (['exalted', 'exalted (exact)', 'own sign'].includes(data.dignity)) {
      analysis.strongPlanets.push({
        planet: name,
        dignity: data.dignity,
        house: data.house,
        signification: HOUSE_SIGNIFICATIONS[data.house],
      });
    } else if (['debilitated', 'debilitated (exact)'].includes(data.dignity)) {
      // Check if Neecha Bhanga is present
      const hasNeechaBhanga = chart.yogas.some(
        y => y.name === 'Neecha Bhanga Raj Yoga' && y.planets.includes(name)
      );
      analysis.weakPlanets.push({
        planet: name,
        dignity: data.dignity,
        house: data.house,
        note: hasNeechaBhanga ? 'Neecha Bhanga present — weakness mitigated' : 'Needs strengthening',
      });
    }
  }

  // Kendra houses with planets
  for (const h of KENDRA_HOUSES) {
    const planetsInKendra = Object.entries(chart.planets)
      .filter(([, d]) => d.house === h)
      .map(([n]) => n);
    if (planetsInKendra.length > 0) {
      analysis.strongHouses.push({
        house: h,
        planets: planetsInKendra,
        signification: HOUSE_SIGNIFICATIONS[h],
      });
    }
  }

  // Check dusthana (6, 8, 12) concentration
  for (const h of DUSTHANA_HOUSES) {
    const planetsHere = Object.entries(chart.planets)
      .filter(([, d]) => d.house === h)
      .map(([n]) => n);
    if (planetsHere.length >= 2) {
      analysis.challengingAreas.push({
        house: h,
        planets: planetsHere,
        signification: HOUSE_SIGNIFICATIONS[h],
        note: `Multiple planets in house ${h} — area needs attention`,
      });
    }
  }

  return analysis;
}
