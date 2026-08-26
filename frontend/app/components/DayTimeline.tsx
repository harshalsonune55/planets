"use client";

/**
 * The whole Vedic day on one band.
 *
 * The band runs sunrise → next sunrise, which is how Choghadiya, Hora and the
 * Kaal periods are all reckoned. Everything below shares that coordinate
 * space, so the auspicious and inauspicious stretches line up vertically.
 */

import { band, durationMinutes, formatDuration, offsetFromSunrise, quality, toMinutes } from "../lib/vedic-ui";
import type { Band } from "../lib/vedic-ui";

type Obj = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

type Props = {
  sunrise: string;
  sunset: string;
  choghadiya: { day: Obj[]; night: Obj[] };
  kaal?: Obj;
  /** Minutes past midnight, when the viewer is looking at the current day. */
  nowMinutes?: number | null;
};

const KAAL_ROWS = [
  { key: "rahuKaal", label: "Rahu Kaal", color: "#f87171" },
  { key: "yamaganda", label: "Yamaganda", color: "#fb7185" },
  { key: "gulikaKaal", label: "Gulika", color: "#fb923c" },
  { key: "abhijitMuhurta", label: "Abhijit", color: "#4ade80" },
] as const;

/** Marks every third hour along the band so the bars can be read as clock time. */
function ticks(sunriseMinutes: number) {
  const out: { left: number; label: string }[] = [];
  for (let h = 0; h < 24; h += 3) {
    const minutes = (sunriseMinutes + h * 60) % 1440;
    out.push({
      left: (h / 24) * 100,
      label: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
    });
  }
  return out;
}

function Segment({ item, place }: { item: Obj; place: Band }) {
  const tone = quality(str(item.quality));
  const name = str(item.name) ?? "";
  const from = str(item.start);
  const to = str(item.end);
  return (
    <div
      className="tl-seg"
      title={`${name} · ${from}–${to} · ${str(item.meaning) ?? tone.label}`}
      style={{
        left: `${place.left}%`,
        width: `${place.width}%`,
        background: tone.soft,
        borderColor: tone.color,
        color: tone.color,
      }}
    >
      <span className="tl-seg-name">{name}</span>
      <span className="tl-seg-time">{from}</span>
    </div>
  );
}

export default function DayTimeline({ sunrise, sunset, choghadiya, kaal, nowMinutes }: Props) {
  const sunriseMinutes = toMinutes(sunrise);
  if (sunriseMinutes === null) return null;

  const segments = [...choghadiya.day, ...choghadiya.night]
    .map((item) => ({ item, place: band(str(item.start), str(item.end), sunriseMinutes) }))
    .filter((s): s is { item: Obj; place: Band } => s.place !== null);

  const sunsetLeft = offsetFromSunrise(sunset, sunriseMinutes);
  const nowLeft =
    nowMinutes === null || nowMinutes === undefined
      ? null
      : ((nowMinutes - sunriseMinutes + 1440) % 1440) / 1440 * 100;

  return (
    <div className="tl">
      {/* Axis */}
      <div className="tl-axis">
        {ticks(sunriseMinutes).map(({ left, label }) => (
          <span key={label + left} className="tl-tick mono" style={{ left: `${left}%` }}>
            {label}
          </span>
        ))}
        {sunsetLeft !== null && (
          <span className="tl-tick tl-tick-sunset mono" style={{ left: `${(sunsetLeft / 1440) * 100}%` }}>
            ☾ {sunset} sunset
          </span>
        )}
      </div>

      <div className="tl-body">
        {/* Night shading behind everything, from sunset to the end of the band */}
        {sunsetLeft !== null && (
          <div className="tl-night" style={{ left: `${(sunsetLeft / 1440) * 100}%` }} aria-hidden />
        )}

        {/* Choghadiya */}
        <div className="tl-row" style={{ height: 44 }}>
          {segments.map(({ item, place }, i) => (
            <Segment key={`${str(item.name)}-${i}`} item={item} place={place} />
          ))}
        </div>

        {/* Kaal periods */}
        {kaal && (
          <div className="tl-kaal">
            {KAAL_ROWS.map(({ key, label, color }) => {
              const item = kaal[key] as Obj | undefined;
              if (!item || item.applicable === false) return null;
              const place = band(str(item.start), str(item.end), sunriseMinutes);
              if (!place) return null;
              const minutes = durationMinutes(str(item.start), str(item.end));
              return (
                <div key={key} className="tl-row" style={{ height: 20 }}>
                  <div
                    className="tl-kaal-bar"
                    title={`${label} · ${str(item.start)}–${str(item.end)} (${formatDuration(minutes)}) · ${str(item.note) ?? ""}`}
                    style={{
                      left: `${place.left}%`,
                      width: `${place.width}%`,
                      background: color,
                    }}
                  >
                    <span>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sunset and "now" markers sit above every row */}
        {sunsetLeft !== null && (
          <div className="tl-marker tl-marker-sunset" style={{ left: `${(sunsetLeft / 1440) * 100}%` }} aria-hidden />
        )}
        {nowLeft !== null && (
          <div className="tl-marker tl-marker-now" style={{ left: `${nowLeft}%` }}>
            <span className="tl-marker-label tl-now-label mono">now</span>
          </div>
        )}
      </div>

      <div className="tl-legend">
        <span className="mono" style={{ color: "var(--text-dim)" }}>☀ {sunrise} sunrise</span>
        {(["auspicious", "neutral", "inauspicious"] as const).map((k) => (
          <span key={k} className="tl-legend-item">
            <i style={{ background: quality(k).color }} />
            {quality(k).label}
          </span>
        ))}
      </div>
    </div>
  );
}
