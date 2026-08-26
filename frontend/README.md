# Panchang — frontend

Next.js app that renders the almanac: the five limbs (Tithi, Vara, Nakshatra,
Yoga, Karana) with Hora, Choghadiya and the Kaal periods, for a chosen place
and date. No birth details are asked for — a place's coordinates and UTC offset
are all the sunrise-based calculations need.

All the astronomy happens in the `backend/` service; this app only draws it.

## Running locally

The app needs the API, so start both:

```bash
cd backend  && npm install && npm run dev   # http://localhost:3001
cd frontend && npm install && npm run dev   # http://localhost:3004
```

Then open **http://localhost:3004** (not 3000 — the dev script pins 3004).

If the page shows "Could not reach the astrology API", the backend is not
running or `NEXT_PUBLIC_API_URL` points somewhere else.

## Configuration

Copy `.env.example` to `.env.local` and adjust if the API is not on
`http://localhost:3001`:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_API_URL` is inlined at build time, so changing it needs a rebuild.

## Deploying to Netlify

`netlify.toml` in the repository root already points Netlify at this folder
(`base = "frontend"`, `publish = ".next"`, with `@netlify/plugin-nextjs`).

1. Connect the repository — Netlify picks up `netlify.toml` on its own.
2. Set **`NEXT_PUBLIC_API_URL`** under Site configuration → Environment
   variables to the public URL of the deployed backend, for example
   `https://planets-api.onrender.com`.
3. Deploy. Without step 2 the built site calls `http://localhost:3001` and
   every request fails in the visitor's browser.

The backend allows all origins (`app.use(cors())`), so no CORS setup is needed.

## Layout

| Path | What it holds |
| --- | --- |
| `app/page.tsx` | Owns place/date/span state and fetches the almanac |
| `app/components/PlaceBar.tsx` | Place, date and span controls; shows the coordinates |
| `app/components/DayCard.tsx` | One day: limbs, timeline, Kaal chips, Hora |
| `app/components/DayTimeline.tsx` | Sunrise-to-sunrise band: Choghadiya + Kaal + "now" |
| `app/components/HoraStrip.tsx` | The 24 planetary hours, sized by real duration |
| `app/components/MoonPhase.tsx` | The Moon drawn at its actual phase |
| `app/lib/api.ts` | API client and the base URL |
| `app/lib/places.ts` | Place list and coordinate formatting |
| `app/lib/vedic-ui.ts` | Graha glyphs/colours, quality palette, time helpers |
