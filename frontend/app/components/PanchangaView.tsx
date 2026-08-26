"use client";

import DayCard from "./DayCard";
import { planet } from "../lib/vedic-ui";

type Obj = Record<string, unknown>;
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Obj) : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

type Props = { days: Obj[]; transitData?: Record<string, unknown> | null };

/** Where each graha sits right now — supplementary to the almanac itself. */
function Transits({ data }: { data: Record<string, unknown> }) {
  return (
    <section>
      <div className="section-head">
        <span className="label" style={{ margin: 0 }}>Graha positions right now</span>
      </div>
      <div className="transit-grid">
        {Object.entries(data).map(([key, value], i) => {
          const p = obj(value);
          if (!p) return null;
          const glyph = planet(key);
          return (
            <div key={key} className="transit-card fade-up" style={{ animationDelay: `${i * 35}ms` }}>
              <span className="transit-glyph" style={{ color: glyph.color }} aria-hidden>
                {glyph.glyph}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="transit-name">
                  {glyph.name}
                  {p.retrograde === true && <span className="transit-retro" title="Retrograde">℞</span>}
                </div>
                <div className="transit-rashi">
                  {str(p.name) ?? "—"}
                  {str(p.english) && <span className="transit-dim"> {str(p.english)}</span>}
                </div>
                {str(obj(p.nakshatra)?.name) && (
                  <div className="transit-dim">{str(obj(p.nakshatra)?.name)}</div>
                )}
                {str(p.dmsFormatted) && <div className="transit-deg mono">{str(p.dmsFormatted)}</div>}
                {typeof p.dignity === "string" && p.dignity !== "neutral" && p.dignity !== "node" && (
                  <span className="transit-dignity">{p.dignity}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function PanchangaView({ days, transitData }: Props) {
  return (
    <div className="grid gap-6">
      {days.map((d, i) => (
        <DayCard key={`${d.sunrise}-${i}`} day={d} index={i} />
      ))}

      {transitData && Object.keys(transitData).length > 0 && <Transits data={transitData} />}
    </div>
  );
}
