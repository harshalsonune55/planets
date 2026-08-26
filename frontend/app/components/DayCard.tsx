"use client";

/** One day of the almanac: the five limbs, the day band, Hora and Choghadiya. */

import { useState } from "react";
import MoonPhase from "./MoonPhase";
import DayTimeline from "./DayTimeline";
import HoraStrip from "./HoraStrip";
import { formatDuration, durationMinutes, isCurrentDay, planet, quality, toMinutes } from "../lib/vedic-ui";

type Obj = Record<string, unknown>;
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Obj) : undefined);
const arr = (v: unknown) => (Array.isArray(v) ? (v as Obj[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const num = (v: unknown) => (typeof v === "number" ? v : undefined);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "ends 08:00", or "ends 00:49 tomorrow" when the limb runs past midnight. */
function endsLabel(limb: Obj | undefined, dayDate: Obj | undefined) {
  const ends = obj(limb?.ends);
  if (!ends) return null;
  const [, , d] = String(ends.date ?? "").split("-");
  const sameDay = dayDate && Number(d) === Number(dayDate.day);
  return { time: str(ends.time) ?? "", suffix: sameDay ? "" : " +1d" };
}

/** A limb with how far through it we are, and when it gives way to the next. */
function LimbMeter({
  label, value, sub, accent, percent, ends, next,
}: {
  label: string;
  value?: string;
  sub?: string;
  accent: string;
  percent?: number;
  ends?: { time: string; suffix: string } | null;
  next?: string;
}) {
  return (
    <div className="limb" style={{ ["--limb" as string]: accent }}>
      <div className="limb-label">{label}</div>
      <div className="limb-value">{value ?? "—"}</div>
      {sub && <div className="limb-sub">{sub}</div>}
      {percent !== undefined && (
        <div className="limb-track" title={`${percent.toFixed(0)}% elapsed`}>
          <div className="limb-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
      )}
      {ends && (
        <div className="limb-ends mono">
          upto {ends.time}
          {ends.suffix}
          {next && <span className="limb-next"> → {next}</span>}
        </div>
      )}
    </div>
  );
}

export default function DayCard({ day, index }: { day: Obj; index: number }) {
  const [showChoghadiya, setShowChoghadiya] = useState(false);

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
  const elongation = num(obj(p.positions)?.elongation) ?? 0;

  const today = isCurrentDay(
    date ? { year: Number(date.year), month: Number(date.month), day: Number(date.day) } : null,
  );
  const now = new Date();
  const nowMinutes = today ? now.getHours() * 60 + now.getMinutes() : null;

  const varaLord = planet(str(vara?.lord));
  const waxing = str(tithi?.pakshaEnglish) === "waxing";

  return (
    <article className="day-card fade-up" style={{ animationDelay: `${index * 70}ms` }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="day-head">
        <div>
          <div className="day-date">
            <span className="day-num">{date?.day as number}</span>
            <span className="day-mon">
              {MONTHS[(Number(date?.month) || 1) - 1]} {date?.year as number}
            </span>
            <span className="day-weekday" style={{ color: varaLord.color }}>
              {date?.weekday as string}
            </span>
            {today && <span className="chip-today">Today</span>}
          </div>
          <div className="day-meta">
            {lunarMonth && <span>{lunarMonth.purnimanta as string} māsa</span>}
            {typeof p.ritu === "string" && <span>{p.ritu}</span>}
            {samvat && <span>Vikram {samvat.vikram as number}</span>}
          </div>
        </div>
        <div className="day-sun">
          <span className="mono"><b style={{ color: "#f5a524" }}>☀</b> {day.sunrise as string}</span>
          <span className="day-sun-arrow" aria-hidden>→</span>
          <span className="mono"><b style={{ color: "#8b8bb0" }}>☾</b> {day.sunset as string}</span>
          <span className="day-len">{day.dayLength as string}</span>
        </div>
      </header>

      {/* ── Hero: moon, tithi, nakshatra ────────────────────────── */}
      <div className="day-hero">
        <div className="moon-wrap">
          <MoonPhase elongation={elongation} size={92} />
          <span className="moon-caption">
            {str(tithi?.paksha)} <span style={{ color: "var(--text-dim)" }}>({waxing ? "waxing" : "waning"})</span>
          </span>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="limb-label">Tithi</div>
            <div className="hero-value">{str(tithi?.name) ?? "—"}</div>
            <div className="limb-sub">{str(tithi?.group)}</div>
            <div className="limb-track" style={{ ["--limb" as string]: "#a78bfa" }}>
              <div className="limb-fill" style={{ width: `${num(tithi?.percentComplete) ?? 0}%` }} />
            </div>
            <div className="limb-ends mono">
              upto {obj(tithi?.ends)?.time as string}
              {str(tithi?.next) && <span className="limb-next"> → {str(tithi?.next)}</span>}
            </div>
          </div>

          <div className="hero-stat">
            <div className="limb-label">Nakshatra</div>
            <div className="hero-value">{str(nakshatra?.name) ?? "—"}</div>
            <div className="limb-sub">
              Pada {nakshatra?.pada as number} · {planet(str(nakshatra?.lord)).glyph}{" "}
              {planet(str(nakshatra?.lord)).name}
              {str(nakshatra?.deity) && ` · ${str(nakshatra?.deity)}`}
            </div>
            <div className="limb-track" style={{ ["--limb" as string]: planet(str(nakshatra?.lord)).color }}>
              <div className="limb-fill" style={{ width: `${num(nakshatra?.percentComplete) ?? 0}%` }} />
            </div>
            <div className="limb-ends mono">
              upto {obj(nakshatra?.ends)?.time as string}
              {str(nakshatra?.next) && <span className="limb-next"> → {str(nakshatra?.next)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Vara, Yoga, Karana ──────────────────────────────────── */}
      <div className="limb-row">
        <LimbMeter
          label="Vara"
          value={str(vara?.name)}
          sub={`${str(vara?.english) ?? ""} · ${varaLord.glyph} ${varaLord.name}`}
          accent={varaLord.color}
        />
        <LimbMeter
          label="Yoga"
          value={str(yoga?.name)}
          sub={quality(str(yoga?.quality)).label}
          accent={quality(str(yoga?.quality)).color}
          percent={num(yoga?.percentComplete)}
          ends={endsLabel(yoga, date)}
          next={str(yoga?.next)}
        />
        <LimbMeter
          label="Karana"
          value={str(karana?.name)}
          sub={str(karana?.type)}
          accent={quality(str(karana?.quality)).color}
          ends={endsLabel(karana, date)}
          next={str(karana?.next)}
        />
      </div>

      {/* ── The day on one band ─────────────────────────────────── */}
      {choghadiya && (
        <section className="day-section">
          <div className="section-head">
            <span className="label" style={{ margin: 0 }}>Choghadiya &amp; Kaal — sunrise to sunrise</span>
            <button className="link-btn" onClick={() => setShowChoghadiya((s) => !s)}>
              {showChoghadiya ? "Hide list" : "Show list"}
            </button>
          </div>
          <div className="scroll-x">
            <div style={{ minWidth: 640 }}>
              <DayTimeline
                sunrise={day.sunrise as string}
                sunset={day.sunset as string}
                choghadiya={{ day: arr(choghadiya.day), night: arr(choghadiya.night) }}
                kaal={kaal}
                nowMinutes={nowMinutes}
              />
            </div>
          </div>

          {showChoghadiya && (
            <div className="chog-lists">
              {[
                { title: "Day", items: arr(choghadiya.day) },
                { title: "Night", items: arr(choghadiya.night) },
              ].map(({ title, items }) => (
                <div key={title}>
                  <div className="chog-title">{title}</div>
                  {items.map((c, i) => {
                    const tone = quality(str(c.quality));
                    const current =
                      nowMinutes !== null && insideNow(str(c.start), str(c.end), nowMinutes);
                    return (
                      <div key={i} className={`chog-row${current ? " is-now" : ""}`}>
                        <i style={{ background: tone.color }} aria-hidden />
                        <span className="chog-name" style={{ color: tone.color }}>{str(c.name)}</span>
                        <span className="chog-meaning">{str(c.meaning)}</span>
                        <span className="chog-time mono">
                          {str(c.start)}–{str(c.end)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Inauspicious windows, spelled out ───────────────────── */}
      {kaal && (
        <section className="day-section">
          <div className="kaal-chips">
            {[
              { key: "rahuKaal", label: "Rahu Kaal", color: "#f87171" },
              { key: "yamaganda", label: "Yamaganda", color: "#fb7185" },
              { key: "gulikaKaal", label: "Gulika Kaal", color: "#fb923c" },
              { key: "abhijitMuhurta", label: "Abhijit", color: "#4ade80" },
            ].map(({ key, label, color }) => {
              const item = obj(kaal[key]);
              const off = item?.applicable === false;
              return (
                <div key={key} className="kaal-chip" title={str(item?.note)} style={{ ["--tone" as string]: color }}>
                  <span className="kaal-chip-label">{label}</span>
                  <span className="kaal-chip-time mono">
                    {off ? "not today" : `${str(item?.start)}–${str(item?.end)}`}
                  </span>
                  {!off && (
                    <span className="kaal-chip-len">
                      {formatDuration(durationMinutes(str(item?.start), str(item?.end)))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Hora ────────────────────────────────────────────────── */}
      {hora && (
        <section className="day-section">
          <div className="scroll-x">
            <div style={{ minWidth: 640 }}>
              <HoraStrip
                dayLord={str(hora.dayLord)}
                periods={arr(hora.periods)}
                nowMinutes={nowMinutes}
              />
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

/** Whether `now` (minutes past midnight) falls inside a possibly-wrapping period. */
function insideNow(start?: string, end?: string, now?: number | null) {
  if (now === null || now === undefined) return false;
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a === null || b === null) return false;
  return b <= a ? now >= a || now < b : now >= a && now < b;
}
