"use client";

/**
 * The 24 planetary hours, in order, from sunrise.
 *
 * Day and night Horas are not the same length — each is a twelfth of its own
 * half of the day — so the cells are sized by their real duration.
 */

import { durationMinutes, formatDuration, planet, quality, toMinutes } from "../lib/vedic-ui";

type Obj = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

type Props = {
  dayLord?: string;
  periods: Obj[];
  /** Minutes past midnight, when the viewer is looking at the current day. */
  nowMinutes?: number | null;
};

/** Does `now` fall inside this period? Handles periods that cross midnight. */
function isCurrent(item: Obj, now: number | null | undefined) {
  if (now === null || now === undefined) return false;
  const start = toMinutes(str(item.start));
  const end = toMinutes(str(item.end));
  if (start === null || end === null) return false;
  return end <= start ? now >= start || now < end : now >= start && now < end;
}

export default function HoraStrip({ dayLord, periods, nowMinutes }: Props) {
  const lord = planet(dayLord);

  return (
    <div>
      <div className="section-head">
        <span className="label" style={{ margin: 0 }}>Hora — 24 planetary hours</span>
        <span className="hora-daylord" style={{ color: lord.color, borderColor: lord.color }}>
          <span aria-hidden>{lord.glyph}</span> {lord.name} rules the day
        </span>
      </div>

      <div className="hora-strip">
        {periods.map((h, i) => {
          const p = planet(str(h.lord));
          const tone = quality(str(h.quality));
          const minutes = durationMinutes(str(h.start), str(h.end));
          const current = isCurrent(h, nowMinutes);
          return (
            <div
              key={i}
              className={`hora-cell${current ? " is-now" : ""}${h.part === "night" ? " is-night" : ""}`}
              style={{ flexGrow: Math.max(minutes, 1), borderTopColor: p.color }}
              title={`${p.name} hora · ${str(h.start)}–${str(h.end)} (${formatDuration(minutes)}) · ${tone.label} · ${str(h.effect) ?? ""}`}
            >
              <span className="hora-glyph" style={{ color: p.color }} aria-hidden>
                {p.glyph}
              </span>
              <span className="hora-time mono">{str(h.start)}</span>
              <i className="hora-quality" style={{ background: tone.color }} aria-hidden />
              <span className="sr-only">
                {p.name} hora, {str(h.start)} to {str(h.end)}, {tone.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
