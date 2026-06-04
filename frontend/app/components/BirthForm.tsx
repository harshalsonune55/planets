"use client";

import { useState } from "react";
import type { BirthData } from "../lib/api";

const DEFAULTS: BirthData = {
  year: 1990, month: 6, day: 15,
  hour: 10, minute: 30, second: 0,
  latitude: 19.076, longitude: 72.8777,
  timezone: 5.5,
  ayanamsha: "lahiri",
  houseSystem: "wholesign",
};

type Props = {
  onSubmit: (data: BirthData) => void;
  loading: boolean;
};

export default function BirthForm({ onSubmit, loading }: Props) {
  const [d, setD] = useState<BirthData>(DEFAULTS);

  const num = (field: keyof BirthData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setD((p) => ({ ...p, [field]: parseFloat(e.target.value) || 0 }));

  const sel = (field: keyof BirthData) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setD((p) => ({ ...p, [field]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(d); }}
      className="grid gap-5"
    >
      {/* Date */}
      <div>
        <span className="label">Date of Birth</span>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Year</label>
            <input className="input mt-1" type="number" value={d.year} onChange={num("year")} placeholder="1990" />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Month</label>
            <input className="input mt-1" type="number" min={1} max={12} value={d.month} onChange={num("month")} placeholder="6" />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Day</label>
            <input className="input mt-1" type="number" min={1} max={31} value={d.day} onChange={num("day")} placeholder="15" />
          </div>
        </div>
      </div>

      {/* Time */}
      <div>
        <span className="label">Time of Birth</span>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Hour (0–23)</label>
            <input className="input mt-1" type="number" min={0} max={23} value={d.hour} onChange={num("hour")} />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Minute</label>
            <input className="input mt-1" type="number" min={0} max={59} value={d.minute} onChange={num("minute")} />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Second</label>
            <input className="input mt-1" type="number" min={0} max={59} value={d.second} onChange={num("second")} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <span className="label">Birth Location</span>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Latitude</label>
            <input className="input mt-1" type="number" step="0.0001" value={d.latitude} onChange={num("latitude")} placeholder="19.0760" />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Longitude</label>
            <input className="input mt-1" type="number" step="0.0001" value={d.longitude} onChange={num("longitude")} placeholder="72.8777" />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>Timezone (UTC+)</label>
            <input className="input mt-1" type="number" step="0.5" value={d.timezone} onChange={num("timezone")} placeholder="5.5" />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="label">Ayanamsha</span>
          <select className="input" value={d.ayanamsha} onChange={sel("ayanamsha")} style={{ appearance: "none" }}>
            <option value="lahiri">Lahiri (default)</option>
            <option value="raman">Raman</option>
            <option value="kp">KP</option>
            <option value="fagan">Fagan–Bradley</option>
          </select>
        </div>
        <div>
          <span className="label">House System</span>
          <select className="input" value={d.houseSystem} onChange={sel("houseSystem")} style={{ appearance: "none" }}>
            <option value="wholesign">Whole Sign</option>
            <option value="equal">Equal House</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
          {loading ? (
            <><span className="spinner" />Computing chart…</>
          ) : (
            "Compute Birth Chart"
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setD(DEFAULTS);
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
