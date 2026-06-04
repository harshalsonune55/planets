# Vedic Astrology Backend

**Zero external API calls.** All planetary coordinates are computed on-device using classical astronomical algorithms.

## Astronomical Engine

| Body | Algorithm | Accuracy |
|------|-----------|----------|
| Sun | VSOP87 (Earth heliocentric) + FK5 + nutation + aberration | ~1 arcsecond |
| Moon | ELP2000 (60+60 term series, Meeus Ch. 47) | ~10 arcseconds |
| Mercury, Venus, Mars, Jupiter, Saturn | VSOP87 truncated series + light-time correction | ~1–2 arcminutes |
| Rahu / Ketu | Moon's mean ascending node (IAU formula) | ~1 arcminute |
| Nutation (ΔΨ, Δε) | IAU 1980 (63 terms) | ~1 arcsecond |
| Ayanamsha | Lahiri / Raman / KP / Fagan–Bradley | — |

Reference: Jean Meeus, *Astronomical Algorithms* 2nd ed.

## Vedic Features

- **Rashi** (zodiac sign) + exact degrees/minutes/seconds
- **Nakshatra** (all 27) + Pada + deity + symbol + qualities
- **Planet dignity** — exalted, debilitated, own sign, exact degree
- **Ascendant (Lagna)** + Midheaven
- **House system** — Whole Sign (default) or Equal House
- **Yogas** — Raj Yoga, Pancha Mahapurusha, Gajakesari, Dhana, Neecha Bhanga, Vipareeta, Kemadruma, Budha-Aditya, Chandra-Mangala, and more
- **Aspects (Drishti)** — full + special aspects (Mars 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th)
- **Vimshottari Dasha** — Mahadasha → Antardasha → Pratyantar → hierarchical breakdown
- **Panchanga** — Tithi, Vara, Nakshatra, Yoga (Nithya), Karana
- **Predictions** — Dasha themes + Gochar (transit) analysis

## Quick Start

```bash
npm install
npm start          # production
npm run dev        # with --watch (hot reload)
```

Server runs on **http://localhost:3001** by default.

## API Reference

### `GET /`
API documentation + sample request.

### `GET /api/chart/test`
Returns a fully computed chart for a historical figure (testing only).

---

### `POST /api/chart`
Full Vedic birth chart.

**Request body:**
```json
{
  "year":      1990,
  "month":     6,
  "day":       15,
  "hour":      10,
  "minute":    30,
  "second":    0,
  "latitude":  19.0760,
  "longitude": 72.8777,
  "timezone":  5.5,
  "ayanamsha": "lahiri",
  "houseSystem": "wholesign"
}
```

**Ayanamsha options:** `lahiri` (default) · `raman` · `kp` · `fagan`  
**House system:** `wholesign` (default) · `equal`

**Response includes:**
- `ayanamsha` — value + DMS
- `ascendant` — tropical + sidereal + Rashi + DMS
- `midheaven`
- `planets` — all 9 Grahas: longitude, Rashi, Nakshatra, Pada, dignity, house
- `houses` — 12 houses with sign, lord, signification, planets in house
- `aspects` — Graha Drishti list
- `yogas` — detected Yogas with strength + interpretation
- `dasha` — current Mahadasha + Antardasha + Pratyantar + remaining time
- `panchanga` — Tithi, Vara, Nakshatra, Yoga, Karana

---

### `POST /api/chart/planets`
Planetary positions only (no location required).

```json
{ "year": 2024, "month": 6, "day": 1, "timezone": 5.5 }
```

---

### `POST /api/dasha`
Full 120-year Vimshottari Dasha timeline.

Add `"queryYear"`, `"queryMonth"`, `"queryDay"` to check status at a specific date (defaults to today).

---

### `POST /api/dasha/antardasha`
Full Antardasha + Pratyantar breakdown for a specific Mahadasha lord.

```json
{
  "year": 1990, "month": 6, "day": 15, "hour": 10,
  "timezone": 5.5, "mahaLord": "saturn"
}
```

---

### `POST /api/predictions`
Full prediction report.

```json
{
  "birth": {
    "year": 1990, "month": 6, "day": 15, "hour": 10,
    "latitude": 19.076, "longitude": 72.8777, "timezone": 5.5
  },
  "query": { "year": 2025, "month": 1, "day": 1 }
}
```

**Response includes:**
- `currentDasha` — current period hierarchy
- `dashaPredictions` — themes for current Mahadasha + Antardasha
- `transitPredictions` — Gochar analysis (Jupiter, Saturn Sade Sati, Rahu/Ketu)
- `natalAnalysis` — strong/weak planets, strong houses, challenging areas
- `natalChart` + `currentTransits`

---

### `POST /api/predictions/panchanga`
Daily Panchanga for any date + location.

### `POST /api/predictions/transit`
Current planetary transit positions.

## Project Structure

```
src/
├── server.js                 ← Express server + route mounting
├── ephemeris/
│   ├── julian.js             ← JD conversions, utility math
│   ├── nutation.js           ← IAU 1980 nutation (63 terms)
│   ├── vsop87data.js         ← VSOP87 truncated series (Earth, Mercury,
│   │                            Venus, Mars, Jupiter, Saturn)
│   ├── planets.js            ← VSOP87 evaluator, helio→geo conversion,
│   │                            light-time correction, FK5, aberration
│   ├── moon.js               ← ELP2000 truncated Moon position
│   └── ayanamsha.js          ← Lahiri / Raman / KP / Fagan ayanamsha
└── vedic/
    ├── chart.js              ← Master chart calculator (calls all modules)
    ├── nakshatra.js          ← 27 Nakshatras data + Dasha sequence
    ├── rashi.js              ← 12 Rashis + dignity (exaltation etc.)
    ├── houses.js             ← LST, Ascendant, MC, house cusps
    ├── aspects.js            ← Graha Drishti (Vedic aspects)
    ├── yogas.js              ← Yoga detection engine
    ├── dasha.js              ← Vimshottari Dasha hierarchy
    └── predictions.js        ← Prediction generator
```
