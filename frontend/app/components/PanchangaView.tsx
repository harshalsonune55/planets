"use client";

import { useState } from "react";
import { api } from "../lib/api";
import type { BirthData } from "../lib/api";
import PlanetBadge from "./PlanetBadge";
import { toast } from "sonner";

type Props = { birthData: BirthData; transitData?: Record<string, unknown> | null };

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

const PANCHANGA_LABELS = [
  { key: "tithi", label: "Tithi", desc: "Lunar day" },
  { key: "vara", label: "Vara", desc: "Day of week" },
  { key: "nakshatra", label: "Nakshatra", desc: "Moon mansion" },
  { key: "yoga", label: "Yoga", desc: "Nithya yoga" },
  { key: "karana", label: "Karana", desc: "Half tithi" },
];

export default function PanchangaView({ birthData, transitData }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [panchangaData, setPanchangaData] = useState<Record<string, unknown> | null>(null);

  async function fetchPanchanga() {
    setLoading(true);
    try {
      const res = await api.panchanga({
        year, month, day,
        hour: 6, minute: 0,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
      }) as Record<string, unknown>;
      setPanchangaData(res);
    } catch {
      toast.error("Failed to fetch panchanga");
    } finally {
      setLoading(false);
    }
  }

  // panchanga response: { panchanga: { tithi, vara, nakshatra, yoga, karana, paksha } }
  const panchanga = (panchangaData?.panchanga ?? panchangaData) as Record<string, unknown> | null;

  return (
    <div className="grid gap-6">
      {/* Date picker */}
      <div className="card fade-up" style={{ animationDelay: "0ms" }}>
        <span className="label">Panchanga for Date</span>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Year", val: year, set: setYear, w: 90, min: 1900, max: 2100 },
              { label: "Month", val: month, set: setMonth, w: 80, min: 1, max: 12 },
              { label: "Day", val: day, set: setDay, w: 80, min: 1, max: 31 },
            ].map(({ label, val, set, w, min, max }) => (
              <div key={label}>
                <label className="text-xs" style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{label}</label>
                <input
                  className="input"
                  type="number"
                  min={min}
                  max={max}
                  value={val}
                  onChange={(e) => set(+e.target.value)}
                  style={{ width: w }}
                />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={fetchPanchanga} disabled={loading}>
            {loading ? <><span className="spinner" />Loading…</> : "Get Panchanga"}
          </button>
        </div>
      </div>

      {/* Panchanga result */}
      {panchanga && (
        <>
          <div className="grid grid-cols-5 gap-3 fade-up" style={{ animationDelay: "0ms" }}>
            {PANCHANGA_LABELS.map(({ key, label, desc }, i) => {
              const val = panchanga[key] as string | undefined;
              return (
                <div
                  key={key}
                  className="card fade-up"
                  style={{ animationDelay: `${i * 50}ms`, textAlign: "center", padding: "16px 12px" }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>
                    {val ?? "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>{desc}</div>
                </div>
              );
            })}
          </div>
          {panchanga.paksha && (
            <div className="card fade-up" style={{ animationDelay: "80ms", padding: "10px 16px" }}>
              <span className="label">Paksha</span>
              <div style={{ fontSize: 14, color: "var(--text)", marginTop: 4 }}>{panchanga.paksha as string}</div>
            </div>
          )}
        </>
      )}

      {/* Current transits */}
      {transitData && Object.keys(transitData).length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Current Planetary Transits
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(transitData).map(([pKey, pos], i) => {
              const p = pos as Record<string, unknown>;
              if (!p || typeof p !== "object") return null;
              const nakshatra = p.nakshatra as Record<string, unknown> | undefined;
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
