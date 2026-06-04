"use client";

import PlanetBadge, { PLANET_COLORS } from "./PlanetBadge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = { data: any };

// Capitalize first letter for PlanetBadge (api returns lowercase)
function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

const DIGNITY_LABEL: Record<string, string> = {
  exalted: "⬆ Exalted",
  debilitated: "⬇ Debilitated",
  "own sign": "◎ Own Sign",
  "moolatrikona": "◎ Moolatrikona",
};

const RASHI_NAMES = [
  "Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya",
  "Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"
];

export default function ChartView({ data }: Props) {
  const planets: { key: string; p: Record<string, unknown> }[] = Object.entries(
    (data.planets ?? {}) as Record<string, Record<string, unknown>>
  ).map(([key, p]) => ({ key, p }));

  const asc = data.ascendant as Record<string, unknown> ?? {};
  const ayanamsha = data.ayanamsha as Record<string, unknown> ?? {};
  const panchanga = data.panchanga as Record<string, unknown> ?? {};

  return (
    <div className="grid gap-6">
      {/* Ascendant & Meta */}
      <div className="card fade-up" style={{ animationDelay: "0ms" }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="label">Ascendant (Lagna)</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
                {(asc.name as string) ?? "—"}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {(asc.english as string) ?? ""}
              </span>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {(asc.dmsFormatted as string) ?? ""}
              </span>
            </div>
          </div>
          <div>
            <span className="label">Ayanamsha</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                {(ayanamsha.dms as string) ?? "—"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {ayanamsha.system as string}
              </span>
            </div>
          </div>
        </div>

        {/* Panchanga strip */}
        {panchanga && Object.keys(panchanga).length > 0 && (
          <>
            <div className="divider" />
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "Tithi", value: panchanga.tithi as string },
                { label: "Vara", value: panchanga.vara as string },
                { label: "Nakshatra", value: panchanga.nakshatra as string },
                { label: "Yoga", value: panchanga.yoga as string },
                { label: "Karana", value: panchanga.karana as string },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="label">{label}</span>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>
                    {value ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Planets */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Grahas (Planets)
        </h3>
        <div className="grid gap-2">
          {planets.map(({ key, p }, i) => {
            const name = cap(key);
            const colors = PLANET_COLORS[name] ?? { bg: "rgba(255,255,255,0.04)", text: "#aaa", border: "rgba(255,255,255,0.08)" };
            const nakshatra = p.nakshatra as Record<string, unknown> | undefined;
            const dignity = p.dignity as string;
            return (
              <div
                key={key}
                className="card fade-up"
                style={{
                  animationDelay: `${i * 45}ms`,
                  borderColor: colors.border,
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 1fr 1fr",
                  gap: 16,
                  alignItems: "center",
                  padding: "12px 16px",
                }}
              >
                <PlanetBadge name={name} />

                <div>
                  <span className="label">Sign · House</span>
                  <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2 }}>
                    {(p.name as string) ?? "—"}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                      ({(p.english as string) ?? ""})
                    </span>
                    {p.house != null && (
                      <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>H{p.house as number}</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="label">Nakshatra · Pada</span>
                  <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2 }}>
                    {nakshatra?.name as string ?? "—"}
                    {nakshatra?.pada != null && (
                      <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>P{nakshatra.pada as number}</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="label">Longitude · Dignity</span>
                  <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="mono" style={{ color: colors.text }}>
                      {(p.dmsFormatted as string) ?? (typeof p.siderealLongitude === "number" ? `${(p.siderealLongitude as number).toFixed(2)}°` : "—")}
                    </span>
                    {dignity && dignity !== "neutral" && dignity !== "node" && (
                      <span style={{ fontSize: 11, color: colors.text, opacity: 0.85 }}>
                        {DIGNITY_LABEL[dignity] ?? dignity}
                      </span>
                    )}
                    {(p.retrograde as boolean) && (
                      <span style={{ fontSize: 11, color: "#f97316" }}>℞</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Houses */}
      {data.houses && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Houses (Bhavas)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(data.houses as Record<string, unknown>[]).map((house, i) => {
              const planetsInHouse = (house.planets as string[]) ?? [];
              const signIdx = typeof house.sign === "number" ? house.sign - 1 : -1;
              const rashiName = signIdx >= 0 ? RASHI_NAMES[signIdx] : "—";
              return (
                <div
                  key={i}
                  className="card fade-up"
                  style={{ animationDelay: `${i * 30}ms`, padding: "10px 14px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600 }}>H{i + 1}</span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>
                        {rashiName}
                      </div>
                    </div>
                    {(house.lord as string) && (
                      <PlanetBadge name={cap(house.lord as string)} size="sm" />
                    )}
                  </div>
                  {planetsInHouse.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                      {planetsInHouse.map((pn) => (
                        <PlanetBadge key={pn} name={cap(pn)} size="sm" />
                      ))}
                    </div>
                  )}
                  {(house.signification as string) && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.4 }}>
                      {(house.signification as string).split("(")[0].trim()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yogas */}
      {data.yogas && (data.yogas as unknown[]).length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Yogas Detected
          </h3>
          <div className="grid gap-2">
            {(data.yogas as Record<string, unknown>[]).map((yoga, i) => (
              <div
                key={i}
                className="card fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
                      {yoga.name as string}
                    </span>
                    {(yoga.type as string) && yoga.type !== yoga.name && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{yoga.type as string}</span>
                    )}
                  </div>
                  {(yoga.strength as string) && (
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 12,
                      background: "rgba(167,139,250,0.1)", color: "var(--accent)",
                      border: "1px solid rgba(167,139,250,0.2)",
                    }}>
                      {yoga.strength as string}
                    </span>
                  )}
                </div>
                {(yoga.meaning as string) && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    {yoga.meaning as string}
                  </p>
                )}
                {(yoga.planets as string[])?.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {(yoga.planets as string[]).map((pn) => (
                      <PlanetBadge key={pn} name={cap(pn)} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aspects */}
      {data.aspects && (data.aspects as unknown[]).length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Graha Drishti (Aspects)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(data.aspects as Record<string, unknown>[]).map((a, i) => (
              <div key={i} className="card fade-up" style={{ animationDelay: `${i * 25}ms`, padding: "10px 14px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <PlanetBadge name={cap(a.aspectant as string)} size="sm" />
                  <span style={{ color: "var(--text-dim)", fontSize: 14 }}>→</span>
                  <PlanetBadge name={cap(a.target as string)} size="sm" />
                  {(a.type as string) && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                      {a.type as string}
                    </span>
                  )}
                  {(a.strength as number) != null && (
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      {a.strength as number}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
