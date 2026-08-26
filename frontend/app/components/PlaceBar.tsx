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

function shiftDays({ year, month, day }: DateValue, delta: number): DateValue {
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export default function PlaceBar({
  place, onPlaceChange, date, onDateChange, days, onDaysChange, loading,
}: Props) {
  // A custom place keeps its own coordinates; the dropdown falls back to "custom".
  const [custom, setCustom] = useState(false);
  const isCustom = custom || place.id === "custom";

  function selectPlace(id: string) {
    if (id === "custom") { setCustom(true); return; }
    const next = PLACES.find((p) => p.id === id);
    if (next) { setCustom(false); onPlaceChange(next); }
  }

  function editCoord(field: "latitude" | "longitude" | "timezone", raw: string) {
    const value = parseFloat(raw);
    onPlaceChange({
      ...place,
      id: "custom",
      name: "Custom location",
      region: "entered coordinates",
      [field]: Number.isNaN(value) ? 0 : value,
    });
  }

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="field field-grow">
          <label className="field-label" htmlFor="place">Place</label>
          <select
            id="place"
            className="input"
            value={isCustom ? "custom" : place.id}
            onChange={(e) => selectPlace(e.target.value)}
            style={{ appearance: "none" }}
          >
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.region}</option>
            ))}
            <option value="custom">Custom coordinates…</option>
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="date">Date</label>
          <div className="stepper">
            <button
              type="button"
              className="stepper-btn"
              aria-label="Previous day"
              onClick={() => onDateChange(shiftDays(date, -1))}
            >
              ‹
            </button>
            <input
              id="date"
              className="input stepper-input"
              type="date"
              value={toInputValue(date)}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split("-").map(Number);
                if (y && m && d) onDateChange({ year: y, month: m, day: d });
              }}
            />
            <button
              type="button"
              className="stepper-btn"
              aria-label="Next day"
              onClick={() => onDateChange(shiftDays(date, 1))}
            >
              ›
            </button>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Span</span>
          <div className="seg">
            {DAY_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className={`seg-btn${days === n ? " active" : ""}`}
                onClick={() => onDaysChange(n)}
              >
                {n}d
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label" aria-hidden>&nbsp;</span>
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
      </div>

      {/* The coordinates every calculation below is based on */}
      <div className="coord-strip">
        <span className="coord-pin" aria-hidden>◎</span>
        <div>
          <div className="coord-name">{place.name}</div>
          <div className="coord-region">{place.region}</div>
        </div>
        <div className="coord-val">
          <span className="coord-key">Coordinates</span>
          <span className="mono">{formatCoords(place.latitude, place.longitude)}</span>
        </div>
        <div className="coord-val">
          <span className="coord-key">Time zone</span>
          <span className="mono">{formatOffset(place.timezone)}</span>
        </div>
        {loading && (
          <span className="coord-loading">
            <span className="spinner" /> computing
          </span>
        )}
      </div>

      {isCustom && (
        <div className="custom-coords">
          {([
            { label: "Latitude", field: "latitude" as const, step: 0.0001 },
            { label: "Longitude", field: "longitude" as const, step: 0.0001 },
            { label: "Timezone (UTC+)", field: "timezone" as const, step: 0.25 },
          ]).map(({ label, field, step }) => (
            <div className="field" key={field}>
              <label className="field-label" htmlFor={`coord-${field}`}>{label}</label>
              <input
                id={`coord-${field}`}
                className="input"
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
