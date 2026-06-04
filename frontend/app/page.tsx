"use client";

import { useEffect, useState } from "react";
import { api } from "./lib/api";

type Planet = {
  siderealLongitude: number;
  latitude: number;
  distance: number | null;
  rashi: string;
  rashiIndex: number;
  degree: number;
  nakshatra: { name: string; pada: number };
  dignity: string;
  retrograde?: boolean;
};

type PlanetsResult = {
  date: { year: number; month: number; day: number; hour: number; minute: number; timezone: number };
  ayanamsha: { system: string; value: number };
  planets: Record<string, Planet>;
};

const PLANET_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
const PLANET_LABELS: Record<string, string> = {
  sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury",
  jupiter: "Jupiter", venus: "Venus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu",
};

function degToDMS(deg: number) {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = Math.floor((mf - m) * 60);
  return `${d}° ${m}′ ${s}″`;
}

export default function Home() {
  const [data, setData] = useState<PlanetsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setTimeStr(now.toLocaleString(undefined, {
      weekday: "long", year: "numeric", month: "long",
      day: "numeric", hour: "2-digit", minute: "2-digit",
    }));
  }, []);

  useEffect(() => {
    const now = new Date();
    api.planets({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      timezone: -(now.getTimezoneOffset() / 60),
    })
      .then((res) => setData(res as PlanetsResult))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to fetch"));
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #eeeeff 30%, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}>
            Planetary Positions
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{timeStr}</p>
          {data && (
            <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
              Ayanamsha ({data.ayanamsha.system}): {data.ayanamsha.value.toFixed(4)}°
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="card" style={{ color: "#f87171", textAlign: "center", padding: 24 }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {!data && !error && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: 60 }}>
            <span className="spinner" style={{ display: "inline-block", marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>Computing positions…</p>
          </div>
        )}

        {/* Planet table */}
        {data && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Planet", "Rashi", "Longitude", "Nakshatra", "Dignity"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, color: "var(--text-dim)",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLANET_ORDER.map((key, i) => {
                  const p = data.planets[key];
                  if (!p) return null;
                  return (
                    <tr key={key} style={{
                      borderBottom: i < PLANET_ORDER.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>
                          {PLANET_LABELS[key]}
                        </span>
                        {p.retrograde && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#f59e0b" }}>℞</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>
                        {p.rashi}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {degToDMS(p.siderealLongitude)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)" }}>
                        {p.nakshatra.name} <span style={{ color: "var(--text-dim)" }}>pada {p.nakshatra.pada}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 4,
                          background: "var(--surface)", color: "var(--text-muted)",
                          textTransform: "capitalize",
                        }}>
                          {p.dignity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
