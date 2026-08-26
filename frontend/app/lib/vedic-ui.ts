/**
 * Presentation helpers shared by the almanac views.
 *
 * The API hands back clock times as "HH:MM" strings and a day that runs
 * sunrise → next sunrise, so most of this file is about placing those times
 * on a 24-hour band without tripping over midnight.
 */

export type Quality = "auspicious" | "neutral" | "inauspicious";

export const QUALITY = {
  auspicious:   { color: "#4ade80", soft: "rgba(74, 222, 128, 0.14)", label: "Auspicious" },
  neutral:      { color: "#8b8bb0", soft: "rgba(139, 139, 176, 0.14)", label: "Neutral" },
  inauspicious: { color: "#f87171", soft: "rgba(248, 113, 113, 0.14)", label: "Inauspicious" },
} as const;

/** Backend qualities read like "auspicious (best)" — match on the prefix. */
export function quality(raw?: string) {
  const key = (Object.keys(QUALITY) as Quality[]).find((k) => raw?.startsWith(k));
  return QUALITY[key ?? "neutral"];
}

export const PLANET: Record<string, { glyph: string; color: string; name: string }> = {
  sun:     { glyph: "☉", color: "#f5a524", name: "Sun" },
  moon:    { glyph: "☽", color: "#cbd5f5", name: "Moon" },
  mars:    { glyph: "♂", color: "#ef4444", name: "Mars" },
  mercury: { glyph: "☿", color: "#34d399", name: "Mercury" },
  jupiter: { glyph: "♃", color: "#fbbf24", name: "Jupiter" },
  venus:   { glyph: "♀", color: "#f472b6", name: "Venus" },
  saturn:  { glyph: "♄", color: "#60a5fa", name: "Saturn" },
  rahu:    { glyph: "☊", color: "#a78bfa", name: "Rahu" },
  ketu:    { glyph: "☋", color: "#fb923c", name: "Ketu" },
};

export function planet(lord?: string) {
  return PLANET[(lord ?? "").toLowerCase()] ?? { glyph: "•", color: "#8b8bb0", name: lord ?? "—" };
}

// ── Time on the sunrise-to-sunrise band ─────────────────────────────────

export const DAY_MINUTES = 1440;

/** "18:58" → 1138. Returns null for anything unparseable. */
export function toMinutes(time?: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Where a clock time falls on a band that starts at sunrise, in minutes.
 * Times after midnight land in the back half rather than wrapping to zero.
 */
export function offsetFromSunrise(time: string | undefined, sunrise: number): number | null {
  const t = toMinutes(time);
  if (t === null) return null;
  return (t - sunrise + DAY_MINUTES) % DAY_MINUTES;
}

export type Band = { left: number; width: number };

/**
 * A start/end pair as percentages of the 24-hour band. A period that ends
 * where it started has run the full circle (the last night Choghadiya ends
 * exactly at the next sunrise), so it is stretched rather than collapsed.
 */
export function band(start: string | undefined, end: string | undefined, sunrise: number): Band | null {
  const from = offsetFromSunrise(start, sunrise);
  const rawTo = offsetFromSunrise(end, sunrise);
  if (from === null || rawTo === null) return null;
  const to = rawTo <= from ? DAY_MINUTES : rawTo;
  return { left: (from / DAY_MINUTES) * 100, width: ((to - from) / DAY_MINUTES) * 100 };
}

/** Minutes between two clock times, crossing midnight if it has to. */
export function durationMinutes(start?: string, end?: string): number {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a === null || b === null) return 0;
  return b <= a ? b + DAY_MINUTES - a : b - a;
}

/** "1h 34m" */
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}

export type DayDate = { year: number; month: number; day: number };

/** Is this the calendar day the viewer is currently living in? */
export function isCurrentDay(date?: DayDate | null) {
  if (!date) return false;
  const now = new Date();
  return (
    date.year === now.getFullYear() &&
    date.month === now.getMonth() + 1 &&
    date.day === now.getDate()
  );
}
