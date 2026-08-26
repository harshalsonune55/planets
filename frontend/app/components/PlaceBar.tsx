"use client";

import { useState } from "react";
import { PLACES, formatCoords, formatOffset } from "../lib/places";
import type { Place } from "../lib/places";

export type DateValue = { year: number; month: number; day: number };

type Props = {
  place: Place;
  onPlaceChange: (place: Place) => void;
  date: DateValue;
  onDateChange: (date: DateValue) => void;
  days: number;
  onDaysChange: (days: number) => void;
  loading: boolean;
};

const DAY_OPTIONS = [1, 3, 7, 15, 30];

/** yyyy-mm-dd, the value a native date input expects. */
function toInputValue({ year, month, day }: DateValue) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function PlaceBar({
  place, onPlaceChange, date, onDateChange, days, onDaysChange, loading,
}: Props) {
  // A custom place keeps its own coordinates; the dropdown falls back to "custom".
  const [custom, setCustom] = useState(false);

  function selectPlace(id: string) {
    if (id === "custom") { setCustom(true); return; }
    const next = PLACES.find((p) => p.id === id);
    if (next) { setCustom(false); onPlaceChange(next); }
  }

  function editCoord(field: "latitude" | "longitude" | "timezone", raw: string) {
    const value = parseFloat(raw);
    onPlaceChange({
      ...place,
      name: "Custom location",
      region: "entered coordinates",
      id: "custom",
      [field]: Number.isNaN(value) ? 0 : value,
    });
  }

  return (
    <div className="card fade-up">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
          <label className="label" htmlFor="place">Place</label>
          <select
            id="place"
            className="input"
            value={custom || place.id === "custom" ? "custom" : place.id}
            onChange={(e) => selectPlace(e.target.value)}
            style={{ appearance: "none" }}
          >
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.region}
              </option>
            ))}
            <option value="custom">Custom coordinates…</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="date">Date</label>
          <input
            id="date"
            className="input"
            type="date"
            value={toInputValue(date)}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-").map(Number);
              if (y && m && d) onDateChange({ year: y, month: m, day: d });
            }}
            style={{ minWidth: 160 }}
          />
        </div>

        <div>
          <label className="label" htmlFor="days">Days</label>
          <select
            id="days"
            className="input"
            value={days}
            onChange={(e) => onDaysChange(Number(e.target.value))}
            style={{ appearance: "none", minWidth: 110 }}
          >
            {DAY_OPTIONS.map((n) => (
              <option key={n} value={n}>{n === 1 ? "1 day" : `${n} days`}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const now = new Date();
            onDateChange({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
          }}
        >
          Today
        </button>
      </div>

      {/* The coordinates every calculation below is based on */}
      <div className="divider" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Coordinates
          </div>
          <div className="mono" style={{ fontSize: 14, color: "var(--text)", marginTop: 3 }}>
            {formatCoords(place.latitude, place.longitude)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Time zone
          </div>
          <div className="mono" style={{ fontSize: 14, color: "var(--text)", marginTop: 3 }}>
            {formatOffset(place.timezone)}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", flex: 1, minWidth: 180 }}>
          Sunrise-based at {place.name}
          {loading && <span style={{ marginLeft: 8 }}><span className="spinner" />computing…</span>}
        </div>
      </div>

      {(custom || place.id === "custom") && (
        <div className="grid grid-cols-3 gap-2" style={{ marginTop: 12 }}>
          {([
            { label: "Latitude", field: "latitude" as const, step: 0.0001 },
            { label: "Longitude", field: "longitude" as const, step: 0.0001 },
            { label: "Timezone (UTC+)", field: "timezone" as const, step: 0.25 },
          ]).map(({ label, field, step }) => (
            <div key={field}>
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</label>
              <input
                className="input mt-1"
                type="number"
                step={step}
                value={place[field]}
                onChange={(e) => editCoord(field, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
