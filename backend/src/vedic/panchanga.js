/**
 * Panchanga — the five limbs of the Vedic almanac, plus the day divisions
 * that hang off sunrise/sunset (Hora, Choghadiya, Rahu Kaal …).
 *
 * The five limbs (Panchanga = "five limbs"):
 *   1. Tithi     — lunar day        (Moon − Sun elongation / 12°)
 *   2. Vara      — weekday          (sunrise to sunrise)
 *   3. Nakshatra — lunar mansion    (Moon longitude / 13°20′)
 *   4. Yoga      — Nithya Yoga      ((Sun + Moon) / 13°20′)
 *   5. Karana    — half tithi       (elongation / 6°)
 *
 * Every limb is reported with the moment it ends, found by iterating the
 * true ephemeris rather than assuming a constant rate.
 */

import { calendarToJD, jdToCalendar, normalizeDeg, DEG2RAD, RAD2DEG } from '../ephemeris/julian.js';
import { getSunLongitude } from '../ephemeris/planets.js';
import { getMoonPosition } from '../ephemeris/moon.js';
import { toSidereal } from '../ephemeris/ayanamsha.js';
import { getNakshatra } from './nakshatra.js';
import { getRashi } from './rashi.js';

// ── Mean daily motion, used only to seed / step the root finder ──────────
const MOON_RATE  = 13.176358;   // °/day
const SUN_RATE   = 0.985647;    // °/day
const ELONG_RATE = MOON_RATE - SUN_RATE;
const YOGA_RATE  = MOON_RATE + SUN_RATE;

const NAKSHATRA_SPAN = 360 / 27;
const YOGA_SPAN      = 360 / 27;
const TITHI_SPAN     = 12;
const KARANA_SPAN    = 6;

// ── Names ───────────────────────────────────────────────────────────────

const TITHI_NAMES = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
];

/** Tithis fall into five groups of five, each with its own character. */
const TITHI_GROUPS = ['Nanda (joy)', 'Bhadra (auspicious)', 'Jaya (victory)', 'Rikta (empty)', 'Purna (full)'];

const VARAS = [
  { name: 'Ravivara',    english: 'Sunday',    lord: 'sun' },
  { name: 'Somavara',    english: 'Monday',    lord: 'moon' },
  { name: 'Mangalavara', english: 'Tuesday',   lord: 'mars' },
  { name: 'Budhavara',   english: 'Wednesday', lord: 'mercury' },
  { name: 'Guruvara',    english: 'Thursday',  lord: 'jupiter' },
  { name: 'Shukravara',  english: 'Friday',    lord: 'venus' },
  { name: 'Shanivara',   english: 'Saturday',  lord: 'saturn' },
];

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Mahendra', 'Vaidhriti',
];

/** The nine yogas traditionally treated as inauspicious. */
const INAUSPICIOUS_YOGAS = new Set([
  'Vishkambha', 'Atiganda', 'Shula', 'Ganda', 'Vyaghata',
  'Vajra', 'Vyatipata', 'Parigha', 'Vaidhriti',
]);

/**
 * Karanas repeat over the 60 half-tithis of a lunar month:
 * one fixed karana opens the cycle, the seven movable karanas then repeat
 * eight times (half-tithis 1–56), and three fixed karanas close it.
 */
const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Vishti'];
const FIXED_KARANAS   = { 0: 'Kimstughna', 57: 'Shakuni', 58: 'Chatushpada', 59: 'Naga' };

/** Amanta lunar months, named by the sign the Sun occupies at the new moon. */
const LUNAR_MONTHS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

const RITUS = ['Vasanta (spring)', 'Grishma (summer)', 'Varsha (monsoon)',
               'Sharad (autumn)', 'Hemanta (pre-winter)', 'Shishira (winter)'];

// ── Angle helpers ───────────────────────────────────────────────────────

/** Wrap a degree difference into (−180, 180]. */
function signedDeg(deg) {
  const n = normalizeDeg(deg);
  return n > 180 ? n - 360 : n;
}

function sunLongitude(jd, ayanamsha) {
  return toSidereal(getSunLongitude(jd).longitude, jd, ayanamsha);
}

function moonLongitude(jd, ayanamsha) {
  return toSidereal(getMoonPosition(jd).longitude, jd, ayanamsha);
}

/**
 * Find the Julian Day at which `angleFn` next reaches `target`.
 * Seeds from the mean rate, then refines against the true ephemeris.
 *
 * @param {(jd:number)=>number} angleFn  - returns an angle in [0,360)
 * @param {number} target                - the angle to reach, degrees
 * @param {number} jdFrom                - search starts here
 * @param {number} rate                  - mean motion of angleFn, °/day
 * @param {number} direction             - +1 for the next crossing, −1 for the previous
 */
function findCrossing(angleFn, target, jdFrom, rate, direction = 1) {
  // Seed: how far the angle must still travel, always in the search direction.
  const gap = direction > 0
    ? normalizeDeg(target - angleFn(jdFrom))
    : -normalizeDeg(angleFn(jdFrom) - target);
  let jd = jdFrom + gap / rate;

  // Refine — the true rate varies by ±20%, so this converges geometrically.
  for (let i = 0; i < 15; i++) {
    const delta = signedDeg(target - angleFn(jd));
    if (Math.abs(delta) < 1e-7) break;
    jd += delta / rate;
  }
  return jd;
}

// ── Date / time helpers ─────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

/** Normalize a possibly out-of-range calendar date (e.g. day 32). */
export function addDays(year, month, day, offset) {
  const d = new Date(Date.UTC(year, month - 1, day + offset));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function dayOfYear(year, month, day) {
  const ms = Date.UTC(year, month - 1, day);
  return Math.round((ms - Date.UTC(new Date(ms).getUTCFullYear(), 0, 0)) / 86400000);
}

/** Weekday index for a civil date: 0 = Sunday … 6 = Saturday. */
export function getWeekdayIndex(year, month, day) {
  return Math.floor(calendarToJD(year, month, day, 0, 0, 0) + 1.5) % 7;
}

/** Julian Day for a local wall-clock hour on a given civil date. */
function localJd(year, month, day, localHour, timezone) {
  return calendarToJD(year, month, day, localHour - timezone, 0, 0);
}

/** Format decimal hours-since-local-midnight as HH:MM (wrapping past 24h). */
function toTime(hours) {
  const total = Math.round((((hours % 24) + 24) % 24) * 60);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** Format a Julian Day as a local date + time, rounded to the nearest minute. */
function formatInstant(jd, timezone) {
  const c = jdToCalendar(jd + timezone / 24 + 30 / 86400);
  return {
    jd,
    date: `${c.year}-${pad(c.month)}-${pad(c.day)}`,
    time: `${pad(c.hour)}:${pad(c.minute)}`,
  };
}

function formatPeriod(startHour, endHour) {
  return { start: toTime(startHour), end: toTime(endHour) };
}

// ── Sunrise / sunset ────────────────────────────────────────────────────

/**
 * Sunrise and sunset for a civil date, in decimal hours of local time.
 * Standard low-precision almanac algorithm; good to roughly a minute.
 * Returns `null` for a period when the Sun never crosses the horizon.
 *
 * @returns {{ sunrise: number|null, sunset: number|null, circumpolar: boolean }}
 */
export function getSunriseSunset(year, month, day, latitude, longitude, timezone) {
  const ZENITH = 90.833; // official sunrise: 90° + refraction + solar semidiameter
  const n = dayOfYear(year, month, day);
  const lngHour = longitude / 15;

  function calc(isRise) {
    const t = n + ((isRise ? 6 : 18) - lngHour) / 24;
    const M = normalizeDeg(0.9856 * t - 3.289);
    const L = normalizeDeg(M + 1.916 * Math.sin(M * DEG2RAD) + 0.020 * Math.sin(2 * M * DEG2RAD) + 282.634);

    let RA = normalizeDeg(Math.atan(0.91764 * Math.tan(L * DEG2RAD)) * RAD2DEG);
    RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90; // put RA in L's quadrant
    RA /= 15;

    const sinDec = 0.39782 * Math.sin(L * DEG2RAD);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(ZENITH * DEG2RAD) - sinDec * Math.sin(latitude * DEG2RAD)) /
                 (cosDec * Math.cos(latitude * DEG2RAD));
    if (cosH > 1 || cosH < -1) return null; // Sun stays down / up all day

    const H = (isRise ? 360 - Math.acos(cosH) * RAD2DEG : Math.acos(cosH) * RAD2DEG) / 15;
    const T = H + RA - 0.06571 * t - 6.622;
    return ((T - lngHour + timezone) % 24 + 24) % 24;
  }

  const sunrise = calc(true);
  const sunset = calc(false);
  return { sunrise, sunset, circumpolar: sunrise === null || sunset === null };
}

/**
 * Day and night boundaries in decimal local hours, with the next sunrise
 * carried past 24 so night periods stay monotonic.
 * Falls back to a nominal 06:00/18:00 day inside the polar circles.
 */
function getDayBounds(year, month, day, latitude, longitude, timezone) {
  const today = getSunriseSunset(year, month, day, latitude, longitude, timezone);
  const next = addDays(year, month, day, 1);
  const tomorrow = getSunriseSunset(next.year, next.month, next.day, latitude, longitude, timezone);

  const sunrise = today.sunrise ?? 6;
  const sunset = today.sunset ?? 18;
  // Guard against the wrap-around cases the almanac formula can produce.
  const rawNext = (tomorrow.sunrise ?? 6) + 24;
  const nextSunrise = rawNext > sunset ? rawNext : sunset + 12;

  return { sunrise, sunset, nextSunrise, approximate: today.circumpolar };
}

// ── The five limbs ──────────────────────────────────────────────────────

/**
 * Compute the five limbs of the Panchanga at a single instant.
 *
 * @param {number} jd         - Julian Day (UT)
 * @param {string} ayanamsha  - ayanamsha system name
 * @param {number} timezone   - UTC offset in hours, used to label end times
 * @returns {Object} tithi, vara, nakshatra, yoga and karana, each with its end moment
 */
export function calculatePanchanga(jd, ayanamsha = 'lahiri', timezone = 0) {
  const sun = sunLongitude(jd, ayanamsha);
  const moon = moonLongitude(jd, ayanamsha);
  const elongation = normalizeDeg(moon - sun);
  const yogaAngle = normalizeDeg(sun + moon);

  const elongationFn = (t) => normalizeDeg(moonLongitude(t, ayanamsha) - sunLongitude(t, ayanamsha));
  const moonFn = (t) => moonLongitude(t, ayanamsha);
  const yogaFn = (t) => normalizeDeg(sunLongitude(t, ayanamsha) + moonLongitude(t, ayanamsha));

  // ── 1. Tithi ──
  const tithiIndex = Math.floor(elongation / TITHI_SPAN);          // 0–29
  const isShukla = tithiIndex < 15;
  const tithiInPaksha = (tithiIndex % 15) + 1;                     // 1–15
  const tithiName = tithiInPaksha === 15
    ? (isShukla ? 'Purnima' : 'Amavasya')
    : TITHI_NAMES[tithiInPaksha - 1];

  const tithiEnd = findCrossing(elongationFn, (tithiIndex + 1) * TITHI_SPAN % 360, jd, ELONG_RATE);
  const tithiStart = findCrossing(elongationFn, tithiIndex * TITHI_SPAN, jd, ELONG_RATE, -1);
  const nextTithiIndex = (tithiIndex + 1) % 30;

  const tithi = {
    number: tithiIndex + 1,                 // 1–30 across the whole lunar month
    numberInPaksha: tithiInPaksha,          // 1–15 within the paksha
    name: tithiName,
    paksha: isShukla ? 'Shukla' : 'Krishna',
    pakshaEnglish: isShukla ? 'waxing' : 'waning',
    group: TITHI_GROUPS[(tithiInPaksha - 1) % 5],
    percentComplete: Math.round(((elongation % TITHI_SPAN) / TITHI_SPAN) * 10000) / 100,
    starts: formatInstant(tithiStart, timezone),
    ends: formatInstant(tithiEnd, timezone),
    next: nextTithiIndex % 15 === 14
      ? (nextTithiIndex < 15 ? 'Purnima' : 'Amavasya')
      : TITHI_NAMES[nextTithiIndex % 15],
  };

  // ── 2. Vara (the weekday of the local civil date) ──
  const local = jdToCalendar(jd + timezone / 24);
  const weekdayIndex = getWeekdayIndex(local.year, local.month, local.day);
  const vara = { index: weekdayIndex, ...VARAS[weekdayIndex] };

  // ── 3. Nakshatra ──
  const nakshatraIndex = Math.floor(moon / NAKSHATRA_SPAN);
  const nakshatraDetail = getNakshatra(moon);
  const nakshatraEnd = findCrossing(moonFn, (nakshatraIndex + 1) * NAKSHATRA_SPAN % 360, jd, MOON_RATE);
  const nakshatraStart = findCrossing(moonFn, nakshatraIndex * NAKSHATRA_SPAN, jd, MOON_RATE, -1);

  // Pada boundaries are quarter-nakshatras.
  const padaSpan = NAKSHATRA_SPAN / 4;
  const padaEnd = findCrossing(moonFn, (Math.floor(moon / padaSpan) + 1) * padaSpan % 360, jd, MOON_RATE);

  const nakshatra = {
    ...nakshatraDetail,
    starts: formatInstant(nakshatraStart, timezone),
    ends: formatInstant(nakshatraEnd, timezone),
    padaEnds: formatInstant(padaEnd, timezone),
    next: getNakshatra(normalizeDeg((nakshatraIndex + 1) * NAKSHATRA_SPAN)).name,
  };

  // ── 4. Yoga ──
  const yogaIndex = Math.floor(yogaAngle / YOGA_SPAN);
  const yogaEnd = findCrossing(yogaFn, (yogaIndex + 1) * YOGA_SPAN % 360, jd, YOGA_RATE);
  const yogaStart = findCrossing(yogaFn, yogaIndex * YOGA_SPAN, jd, YOGA_RATE, -1);

  const yoga = {
    number: yogaIndex + 1,
    name: YOGA_NAMES[yogaIndex],
    quality: INAUSPICIOUS_YOGAS.has(YOGA_NAMES[yogaIndex]) ? 'inauspicious' : 'auspicious',
    percentComplete: Math.round(((yogaAngle % YOGA_SPAN) / YOGA_SPAN) * 10000) / 100,
    starts: formatInstant(yogaStart, timezone),
    ends: formatInstant(yogaEnd, timezone),
    next: YOGA_NAMES[(yogaIndex + 1) % 27],
  };

  // ── 5. Karana ──
  const karanaIndex = Math.floor(elongation / KARANA_SPAN);        // 0–59
  const karanaEnd = findCrossing(elongationFn, (karanaIndex + 1) * KARANA_SPAN % 360, jd, ELONG_RATE);
  const karanaStart = findCrossing(elongationFn, karanaIndex * KARANA_SPAN, jd, ELONG_RATE, -1);

  const karana = {
    number: karanaIndex + 1,
    name: karanaName(karanaIndex),
    type: FIXED_KARANAS[karanaIndex] ? 'fixed (sthira)' : 'movable (chara)',
    // Vishti (Bhadra) is the one karana traditionally avoided for new undertakings.
    quality: karanaName(karanaIndex) === 'Vishti' ? 'inauspicious (Bhadra)' : 'neutral',
    starts: formatInstant(karanaStart, timezone),
    ends: formatInstant(karanaEnd, timezone),
    next: karanaName((karanaIndex + 1) % 60),
  };

  return {
    tithi,
    vara,
    nakshatra,
    yoga,
    karana,
    positions: {
      sun: { longitude: sun, ...pick(getRashi(sun)) },
      moon: { longitude: moon, ...pick(getRashi(moon)) },
      elongation,
    },
    ...lunarCalendar(jd, ayanamsha, isShukla, local),
  };
}

/** Name of the karana occupying half-tithi `index` (0–59). */
function karanaName(index) {
  return FIXED_KARANAS[index] ?? MOVABLE_KARANAS[(index - 1) % 7];
}

function pick(rashi) {
  return { rashi: rashi.name, rashiEnglish: rashi.english, rashiLord: rashi.lord, dms: rashi.dmsFormatted };
}

/**
 * Lunar month, season and era.
 * The amanta month is named for the sign the Sun occupies at the new moon
 * that opened it; the purnimanta month runs half a month ahead.
 */
function lunarCalendar(jd, ayanamsha, isShukla, local) {
  const elongationFn = (t) => normalizeDeg(moonLongitude(t, ayanamsha) - sunLongitude(t, ayanamsha));
  const lastNewMoon = findCrossing(elongationFn, 0, jd, ELONG_RATE, -1);
  const sunAtNewMoon = sunLongitude(lastNewMoon, ayanamsha);

  const amantaIndex = (Math.floor(sunAtNewMoon / 30) + 1) % 12;
  const purnimantaIndex = isShukla ? amantaIndex : (amantaIndex + 1) % 12;

  // The lunar year opens at Chaitra Shukla Pratipada, always in March or April.
  const afterLunarNewYear = local.month >= 5 ||
    ((local.month === 3 || local.month === 4) && amantaIndex !== 11);
  const shaka = local.year - (afterLunarNewYear ? 78 : 79);

  return {
    lunarMonth: {
      amanta: LUNAR_MONTHS[amantaIndex],
      purnimanta: LUNAR_MONTHS[purnimantaIndex],
    },
    ritu: RITUS[Math.floor(amantaIndex / 2)],
    samvat: { shaka, vikram: shaka + 135 },
  };
}

// ── Hora ────────────────────────────────────────────────────────────────

/**
 * The 24 planetary hours of a Vedic day.
 *
 * Each hora is 1/12 of the daylight (or of the night), not a clock hour.
 * The first hora after sunrise belongs to the lord of the weekday, and
 * successive horas descend the Chaldean order:
 *   Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon → Saturn …
 * After 24 horas that lands on the next day's lord, which is what makes
 * the weekday names run Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn.
 */
const CHALDEAN_ORDER = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

const HORA_EFFECT = {
  sun:     'Authority, government, health, dealings with superiors',
  moon:    'Travel, water, mother, emotional and domestic matters',
  mars:    'Courage, disputes, surgery, property, physical effort',
  mercury: 'Study, trade, writing, negotiation, communication',
  jupiter: 'Learning, ceremony, finance, counsel — broadly auspicious',
  venus:   'Marriage, art, comfort, purchases, relationships',
  saturn:  'Labour, discipline, endings — avoid new beginnings',
};

const AUSPICIOUS_HORAS = new Set(['jupiter', 'venus', 'mercury', 'moon']);

export function calculateHora(year, month, day, latitude, longitude, timezone) {
  const { sunrise, sunset, nextSunrise } = getDayBounds(year, month, day, latitude, longitude, timezone);
  const weekday = getWeekdayIndex(year, month, day);

  let index = CHALDEAN_ORDER.indexOf(VARAS[weekday].lord);
  const dayLength = sunset - sunrise;
  const nightLength = nextSunrise - sunset;
  const periods = [];

  function push(start, end, part) {
    const lord = CHALDEAN_ORDER[index];
    periods.push({
      lord,
      part,
      quality: AUSPICIOUS_HORAS.has(lord) ? 'auspicious' : 'inauspicious',
      effect: HORA_EFFECT[lord],
      ...formatPeriod(start, end),
    });
    index = (index + 1) % 7; // next hora descends the Chaldean order
  }

  for (let i = 0; i < 12; i++) {
    push(sunrise + (i * dayLength) / 12, sunrise + ((i + 1) * dayLength) / 12, 'day');
  }
  for (let i = 0; i < 12; i++) {
    push(sunset + (i * nightLength) / 12, sunset + ((i + 1) * nightLength) / 12, 'night');
  }

  return { sunrise: toTime(sunrise), sunset: toTime(sunset), dayLord: VARAS[weekday].lord, periods };
}

// ── Choghadiya ──────────────────────────────────────────────────────────

/**
 * Choghadiya — eight equal parts of the daylight and eight of the night.
 * The name of the first part depends on the weekday; the rest follow a
 * fixed cycle. The eighth repeats the first.
 */
const CHOGHADIYA_DAY_CYCLE = ['Udveg', 'Chal', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
const CHOGHADIYA_NIGHT_CYCLE = ['Shubh', 'Amrit', 'Chal', 'Rog', 'Kaal', 'Labh', 'Udveg'];

/** Index into each cycle at which the weekday's first choghadiya starts. */
const DAY_START_BY_WEEKDAY   = [0, 3, 6, 2, 5, 1, 4]; // Sun→Udveg, Mon→Amrit, Tue→Rog …
const NIGHT_START_BY_WEEKDAY = [0, 2, 4, 6, 1, 3, 5]; // Sun→Shubh, Mon→Chal, Tue→Kaal …

const CHOGHADIYA_MEANING = {
  Amrit: { quality: 'auspicious',   lord: 'moon',    meaning: 'Nectar — best for anything of importance' },
  Shubh: { quality: 'auspicious',   lord: 'jupiter', meaning: 'Auspicious — ceremonies, marriage' },
  Labh:  { quality: 'auspicious',   lord: 'mercury', meaning: 'Gain — business, study, new ventures' },
  Chal:  { quality: 'neutral',      lord: 'venus',   meaning: 'Moving — travel and errands' },
  Udveg: { quality: 'inauspicious', lord: 'sun',     meaning: 'Anxiety — government work only' },
  Kaal:  { quality: 'inauspicious', lord: 'saturn',  meaning: 'Death — avoid, though used for wealth accumulation' },
  Rog:   { quality: 'inauspicious', lord: 'mars',    meaning: 'Illness — avoid, except confronting opponents' },
};

export function calculateChoghadiya(year, month, day, latitude, longitude, timezone) {
  const { sunrise, sunset, nextSunrise } = getDayBounds(year, month, day, latitude, longitude, timezone);
  const weekday = getWeekdayIndex(year, month, day);

  function build(start, end, cycle, offset, part) {
    const length = (end - start) / 8;
    return Array.from({ length: 8 }, (_, i) => {
      const name = cycle[(offset + i) % 7];
      return {
        name,
        part,
        ...CHOGHADIYA_MEANING[name],
        ...formatPeriod(start + i * length, start + (i + 1) * length),
      };
    });
  }

  return {
    sunrise: toTime(sunrise),
    sunset: toTime(sunset),
    day: build(sunrise, sunset, CHOGHADIYA_DAY_CYCLE, DAY_START_BY_WEEKDAY[weekday], 'day'),
    night: build(sunset, nextSunrise, CHOGHADIYA_NIGHT_CYCLE, NIGHT_START_BY_WEEKDAY[weekday], 'night'),
  };
}

// ── Kaal periods and muhurtas ───────────────────────────────────────────

/**
 * Which eighth of the daylight each inauspicious period occupies,
 * indexed by weekday (Sunday first). Values are 1-based segments.
 */
const RAHU_KAAL_SEGMENT   = [8, 2, 7, 5, 6, 4, 3];
const YAMAGANDA_SEGMENT   = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_KAAL_SEGMENT = [7, 6, 5, 4, 3, 2, 1];

/**
 * Rahu Kaal, Yamaganda and Gulika Kaal, plus the Abhijit muhurta.
 * All are derived from the same eight-fold division of the daylight
 * that Choghadiya uses.
 */
export function calculateKaalPeriods(year, month, day, latitude, longitude, timezone) {
  const { sunrise, sunset } = getDayBounds(year, month, day, latitude, longitude, timezone);
  const weekday = getWeekdayIndex(year, month, day);
  const eighth = (sunset - sunrise) / 8;

  const segment = (table, note) => {
    const start = sunrise + (table[weekday] - 1) * eighth;
    return { ...formatPeriod(start, start + eighth), segment: table[weekday], note };
  };

  // Abhijit is the 8th of the 15 muhurtas of daylight — straddling local noon.
  const muhurta = (sunset - sunrise) / 15;
  const abhijitStart = sunrise + 7 * muhurta;

  return {
    rahuKaal: segment(RAHU_KAAL_SEGMENT, 'Avoid starting anything new'),
    yamaganda: segment(YAMAGANDA_SEGMENT, 'Avoid travel and important work'),
    gulikaKaal: segment(GULIKA_KAAL_SEGMENT, 'Repeats its results — avoid inauspicious acts'),
    abhijitMuhurta: {
      ...formatPeriod(abhijitStart, abhijitStart + muhurta),
      // Abhijit overrides other doshas on every day but Wednesday.
      applicable: weekday !== 3,
      note: weekday === 3
        ? 'Not observed on Wednesday'
        : 'Most auspicious muhurta of the day; overrides other doshas',
    },
  };
}

// ── Whole-day assembly ──────────────────────────────────────────────────

/**
 * Everything a Panchang page shows for one calendar day at one place.
 * The five limbs are computed at sunrise, which is where the Vedic day begins.
 *
 * @param {number} year
 * @param {number} month     - 1–12
 * @param {number} day       - 1–31
 * @param {number} latitude  - degrees, north positive
 * @param {number} longitude - degrees, east positive
 * @param {number} timezone  - UTC offset in hours
 * @param {string} ayanamsha
 */
export function calculateDailyPanchanga(year, month, day, latitude, longitude, timezone, ayanamsha = 'lahiri') {
  const bounds = getDayBounds(year, month, day, latitude, longitude, timezone);
  const jdSunrise = localJd(year, month, day, bounds.sunrise, timezone);
  const weekday = getWeekdayIndex(year, month, day);
  const dayMinutes = Math.round((bounds.sunset - bounds.sunrise) * 60);

  return {
    date: { year, month, day, timezone, weekday: VARAS[weekday].english },
    location: { latitude, longitude, timezone },
    sunrise: toTime(bounds.sunrise),
    sunset: toTime(bounds.sunset),
    nextSunrise: toTime(bounds.nextSunrise),
    dayLength: `${Math.floor(dayMinutes / 60)}h ${dayMinutes % 60}m`,
    approximate: bounds.approximate || undefined,
    panchanga: calculatePanchanga(jdSunrise, ayanamsha, timezone),
    hora: calculateHora(year, month, day, latitude, longitude, timezone),
    choghadiya: calculateChoghadiya(year, month, day, latitude, longitude, timezone),
    kaal: calculateKaalPeriods(year, month, day, latitude, longitude, timezone),
  };
}

/**
 * Daily Panchanga for a run of consecutive days.
 *
 * @param {Object} params - as calculateDailyPanchanga, plus `days` (1–92)
 * @returns {Object[]} one entry per day, starting at the given date
 */
export function calculatePanchangaRange({ year, month, day, days = 7, latitude, longitude, timezone = 0, ayanamsha = 'lahiri' }) {
  const count = Math.max(1, Math.min(92, Math.floor(days)));
  return Array.from({ length: count }, (_, i) => {
    const d = addDays(year, month, day, i);
    return calculateDailyPanchanga(d.year, d.month, d.day, latitude, longitude, timezone, ayanamsha);
  });
}

export { toTime, localJd, formatPeriod, getDayBounds, VARAS };
