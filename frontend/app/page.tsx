"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "./lib/api";
import type { PanchangaQuery } from "./lib/api";
import { DEFAULT_PLACE, formatCoords, formatOffset } from "./lib/places";
import type { Place } from "./lib/places";
import PlaceBar from "./components/PlaceBar";
import type { DateValue } from "./components/PlaceBar";
import PanchangaView from "./components/PanchangaView";

type Obj = Record<string, unknown>;

function today(): DateValue {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** One day, or a run of days — the range endpoint already returns an array. */
async function loadPanchanga(query: PanchangaQuery, days: number): Promise<Obj[]> {
  if (days === 1) return [(await api.panchanga(query)) as Obj];
  return (await api.panchangaRange({ ...query, days })) as Obj[];
}

export default function Home() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [date, setDate] = useState<DateValue>(today);
  const [days, setDays] = useState(1);
  const [result, setResult] = useState<Obj[] | null>(null);
  const [transit, setTransit] = useState<Obj | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { latitude, longitude, timezone } = place;
  const { year, month, day } = date;

  // Panchang, Hora and Choghadiya for the selected place — no birth details needed.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loadPanchanga(
        { year, month, day, latitude, longitude, timezone, ayanamsha: "lahiri" },
        days,
      );
      setResult(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not compute the panchang";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [year, month, day, latitude, longitude, timezone, days]);

  useEffect(() => { load(); }, [load]);

  // Current transits are independent of the selected day, so fetch them once.
  useEffect(() => {
    const now = new Date();
    api
      .transit({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        timezone: -(now.getTimezoneOffset() / 60),
      })
      .then((res) => setTransit(((res as Obj)?.planets as Obj) ?? null))
      .catch(() => {
        /* transits are supplementary — a failure here shouldn't hide the panchang */
      });
  }, []);

  return (
    <main className="page">
      <div className="page-inner">
        <header className="page-head">
          <h1 className="page-title">Panchang</h1>
          <p className="page-sub">
            Tithi, Nakshatra, Yoga, Karana and Vara — with Hora and Choghadiya for every day
          </p>
          <p className="page-note mono">
            {place.name} · {formatCoords(place.latitude, place.longitude)} · {formatOffset(place.timezone)}
          </p>
        </header>

        <div style={{ marginBottom: 26 }}>
          <PlaceBar
            place={place}
            onPlaceChange={setPlace}
            date={date}
            onDateChange={setDate}
            days={days}
            onDaysChange={setDays}
            loading={loading}
          />
        </div>

        {result && result.length > 0 && <PanchangaView days={result} transitData={transit} />}

        {error && !loading && (
          <div className="state-box">
            {error}
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={load}>Try again</button>
            </div>
          </div>
        )}

        {loading && !result && (
          <div className="state-box">
            <span className="spinner" />
            Computing the almanac…
          </div>
        )}
      </div>
    </main>
  );
}
