"use client";

import { useState } from "react";
import PlanetBadge from "./PlanetBadge";

type Obj = Record<string, unknown>;
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Obj) : undefined);
const arr = (v: unknown) => (Array.isArray(v) ? (v as Obj[]) : []);

type Props = { days: Obj[]; transitData?: Record<string, unknown> | null };

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

const QUALITY_COLOR: Record<string, string> = {
  auspicious: "#4ade80",
  neutral: "#7777aa",
  inauspicious: "#f87171",
};

function qualityColor(quality?: string) {
  if (!quality) return "var(--text-muted)";
  const key = Object.keys(QUALITY_COLOR).find((k) => quality.startsWith(k));
  return key ? QUALITY_COLOR[key] : "var(--text-muted)";
}

/** "ends 14:44" — or "ends 02:05 (10 Aug)" when the limb runs past midnight. */
function endsLabel(limb: Obj | undefined, dayDate: Obj | undefined) {
  const ends = obj(limb?.ends);
  if (!ends) return null;
  const time = ends.time as string;
  const [, , d] = String(ends.date ?? "").split("-");
  const sameDay = dayDate && Number(d) === Number(dayDate.day);
  return sameDay ? time : `${time} (+1d)`;
}

// ── One day ─────────────────────────────────────────────────────────────

function DayCard({ day, index }: { day: Obj; index: number }) {
  const [showHora, setShowHora] = useState(index === 0);

  const date = obj(day.date);
  const p = obj(day.panchanga) ?? {};
  const kaal = obj(day.kaal);
  const choghadiya = obj(day.choghadiya);
  const hora = obj(day.hora);

  const tithi = obj(p.tithi);
  const vara = obj(p.vara);
  const nakshatra = obj(p.nakshatra);
  const yoga = obj(p.yoga);
  const karana = obj(p.karana);
  const lunarMonth = obj(p.lunarMonth);
  const samvat = obj(p.samvat);

  const limbs = [
    {
      key: "tithi",
      label: "Tithi",
      value: tithi && `${tithi.paksha as string} ${tithi.name as string}`,
      sub: tithi && (tithi.group as string),
      ends: endsLabel(tithi, date),
    },
    {
      key: "vara",
      label: "Vara (day)",
      value: vara?.name as string,
      sub: vara && `${vara.english as string} · ${cap(vara.lord as string)}`,
      ends: null,
    },
    {
      key: "nakshatra",
      label: "Nakshatra",
      value: nakshatra?.name as string,
      sub: nakshatra && `Pada ${nakshatra.pada as number} · ${cap(nakshatra.lord as string)}`,
      ends: endsLabel(nakshatra, date),
    },
    {
      key: "yoga",
      label: "Yoga",
      value: yoga?.name as string,
      sub: yoga?.quality as string,
      ends: endsLabel(yoga, date),
    },
    {
      key: "karana",
      label: "Karana",
      value: karana?.name as string,
      sub: karana?.type as string,
      ends: endsLabel(karana, date),
    },
  ];

  return (
    <div className="card fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      {/* Day header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            {date && `${date.day as number}/${date.month as number}/${date.year as number}`}
            <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 8, fontWeight: 500 }}>
              {date?.weekday as string}
            </span>
          </div>
          {lunarMonth && (
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>
              {lunarMonth.purnimanta as string} (purnimanta) · {lunarMonth.amanta as string} (amanta)
              {samvat && ` · Vikram ${samvat.vikram as number} / Shaka ${samvat.shaka as number}`}
            </div>
          )}
        </div>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          ☀ {day.sunrise as string} – {day.sunset as string}
          <span style={{ color: "var(--text-dim)", marginLeft: 8 }}>{day.dayLength as string}</span>
        </div>
      </div>

      {/* The five limbs */}
      <div className="divider" />
      <div className="grid grid-cols-5 gap-3">
        {limbs.map(({ key, label, value, sub, ends }) => (
          <div key={key}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 4, lineHeight: 1.3 }}>
              {value ?? "—"}
            </div>
            {sub && (
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3, textTransform: "capitalize" }}>{sub}</div>
            )}
            {ends && (
              <div className="mono" style={{ fontSize: 10, color: "var(--accent)", marginTop: 3 }}>
                upto {ends}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Inauspicious periods + Abhijit */}
      {kaal && (
        <>
          <div className="divider" />
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Rahu Kaal", item: obj(kaal.rahuKaal), tone: "#f87171" },
              { label: "Yamaganda", item: obj(kaal.yamaganda), tone: "#f87171" },
              { label: "Gulika Kaal", item: obj(kaal.gulikaKaal), tone: "#fb923c" },
              { label: "Abhijit", item: obj(kaal.abhijitMuhurta), tone: "#4ade80" },
            ].map(({ label, item, tone }) => {
              const off = item?.applicable === false;
              return (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {label}
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: off ? "var(--text-dim)" : tone, marginTop: 4 }}>
                    {off ? "—" : `${item?.start as string}–${item?.end as string}`}
                  </div>
                  {off && <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{item?.note as string}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Choghadiya */}
      {choghadiya && (
        <>
          <div className="divider" />
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Choghadiya
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[
              { title: "Day", items: arr(choghadiya.day) },
              { title: "Night", items: arr(choghadiya.night) },
            ].map(({ title, items }) => (
              <div key={title}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>{title}</div>
                <div className="grid gap-1">
                  {items.map((c, i) => (
                    <div
                      key={`${title}-${i}`}
                      title={c.meaning as string}
                      style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}
                    >
                      <span style={{ fontSize: 12, color: qualityColor(c.quality as string), fontWeight: 600 }}>
                        {c.name as string}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {c.start as string}–{c.end as string}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hora */}
      {hora && (
        <>
          <div className="divider" />
          <button
            onClick={() => setShowHora((s) => !s)}
            className="btn btn-ghost"
            style={{ padding: "4px 10px", fontSize: 11 }}
          >
            {showHora ? "Hide" : "Show"} Hora — 24 planetary hours (day lord {cap(hora.dayLord as string)})
          </button>
          {showHora && (
            <div className="grid grid-cols-4 gap-2" style={{ marginTop: 10 }}>
              {arr(hora.periods).map((h, i) => (
                <div
                  key={i}
                  title={h.effect as string}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "7px 9px",
                    opacity: h.part === "night" ? 0.72 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: qualityColor(h.quality as string) }}>
                      {cap(h.lord as string)}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{h.part as string}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {h.start as string}–{h.end as string}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab ─────────────────────────────────────────────────────────────────

export default function PanchangaView({ days, transitData }: Props) {
  return (
    <div className="grid gap-6">
      {/* One card per day */}
      {days.map((d, i) => (
        <DayCard key={`${d.sunrise}-${i}`} day={d} index={i} />
      ))}

      {/* Current transits */}
      {transitData && Object.keys(transitData).length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Current Planetary Transits
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(transitData).map(([pKey, pos], i) => {
              const p = obj(pos);
              if (!p) return null;
              const nakshatra = obj(p.nakshatra);
              return (
                <div key={pKey} className="card fade-up" style={{ animationDelay: `${i * 30}ms`, padding: "10px 14px" }}>
                  <PlanetBadge name={cap(pKey)} size="sm" />
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {(p.name as string) ?? "—"}
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                        {(p.english as string) ?? ""}
                      </span>
                    </div>
                    {!!nakshatra?.name && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{nakshatra.name as string}</div>
                    )}
                    {(p.dmsFormatted as string) && (
                      <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                        {p.dmsFormatted as string}
                      </div>
                    )}
                    {(p.retrograde as boolean) && (
                      <span style={{ fontSize: 10, color: "#f97316", marginTop: 3, display: "block" }}>℞ Retrograde</span>
                    )}
                    {typeof p.dignity === "string" && p.dignity !== "neutral" && p.dignity !== "node" && (
                      <span style={{ fontSize: 10, color: "var(--accent)", marginTop: 2, display: "block" }}>{p.dignity as string}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
