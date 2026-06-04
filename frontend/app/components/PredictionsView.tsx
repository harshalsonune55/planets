"use client";

import PlanetBadge from "./PlanetBadge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = { data: any };

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <div className="fade-up" style={{ animationDelay: `${delay}ms` }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function PredictionsView({ data }: Props) {
  // currentDasha: { currentMaha, currentAntar, currentPratyantar, allMahadashas }
  const cd = data.currentDasha as Record<string, unknown> ?? {};
  const currentMaha = cd.currentMaha as Record<string, unknown> ?? {};
  const currentAntar = cd.currentAntar as Record<string, unknown> ?? {};
  const currentPrat = cd.currentPratyantar as Record<string, unknown> ?? {};

  // dashaPredictions: { mahadasha: {lord, themes: {positive, negative, areas}}, antardasha: {...}, combined: {...} }
  const dashaPreds = data.dashaPredictions as Record<string, unknown> ?? {};

  // transitPredictions: array of { transit, type, house, interpretation, duration }
  const transitPreds = (data.transitPredictions ?? []) as Record<string, unknown>[];

  // natalAnalysis: { strongPlanets: [{planet, dignity, house}], weakPlanets, strongHouses: [{house, planets, signification}], challengingAreas, keyYogas }
  const natal = data.natalAnalysis as Record<string, unknown> ?? {};

  // currentTransits: { planets: { sun: {...}, ... }, panchanga }
  const transitPlanets = (data.currentTransits as Record<string, unknown>)?.planets as Record<string, unknown> ?? {};

  const PERIOD_COLORS: Record<string, string> = { mahadasha: "#a78bfa", antardasha: "#67e8f9", combined: "#86efac" };

  return (
    <div className="grid gap-6">
      {/* Current dasha period */}
      {(!!currentMaha.lord || !!currentAntar.lord) && (
        <div className="card fade-up" style={{ animationDelay: "0ms", borderColor: "rgba(167,139,250,0.2)" }}>
          <span className="label">Active Dasha Period</span>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "Mahadasha", item: currentMaha },
              { label: "Antardasha", item: currentAntar },
              { label: "Pratyantar", item: currentPrat },
            ].filter(x => x.item.lord).map(({ label, item }, idx) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {idx > 0 && <span style={{ color: "var(--text-dim)", fontSize: 18 }}>›</span>}
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    {label}
                  </div>
                  <PlanetBadge name={cap(item.lord as string)} />
                  {item.remainingYears != null && (
                    <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>
                      {(item.remainingYears as number).toFixed(1)}y left
                    </div>
                  )}
                  {item.remainingDays != null && (
                    <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>
                      {Math.round(item.remainingDays as number)}d left
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dasha predictions */}
      {Object.keys(dashaPreds).length > 0 && (
        <Section title="Dasha Predictions" delay={60}>
          <div className="grid gap-3">
            {Object.entries(dashaPreds).filter(([, pred]) => pred != null).map(([period, pred], i) => {
              const p = pred as Record<string, unknown>;
              const lord = p.lord as string;
              const themes = p.themes as Record<string, unknown> ?? {};
              const positive = themes.positive as string[] ?? [];
              const negative = themes.negative as string[] ?? [];
              const areas = themes.areas as string;
              return (
                <div key={period} className="card fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                      color: PERIOD_COLORS[period] ?? "var(--accent)",
                    }}>
                      {period} Dasha
                    </span>
                    {lord && <PlanetBadge name={cap(lord)} size="sm" />}
                  </div>
                  {areas && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.6, fontStyle: "italic" }}>{areas}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {positive.length > 0 && (
                      <div>
                        <span className="label" style={{ color: "rgba(52,211,153,0.7)" }}>Positive Themes</span>
                        <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", display: "grid", gap: 4 }}>
                          {positive.slice(0, 4).map((t, j) => (
                            <li key={j} style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 6 }}>
                              <span style={{ color: "#34d399", flexShrink: 0 }}>+</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {negative.length > 0 && (
                      <div>
                        <span className="label" style={{ color: "rgba(248,113,113,0.7)" }}>Challenges</span>
                        <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", display: "grid", gap: 4 }}>
                          {negative.slice(0, 4).map((t, j) => (
                            <li key={j} style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 6 }}>
                              <span style={{ color: "#f87171", flexShrink: 0 }}>−</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Transit predictions */}
      {transitPreds.length > 0 && (
        <Section title="Gochar (Transit) Analysis" delay={120}>
          <div className="grid gap-2">
            {transitPreds.map((t, i) => (
              <div key={i} className="card fade-up" style={{ animationDelay: `${i * 35}ms`, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {t.transit as string}
                  </span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {(t.type as string) && (
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 12,
                        background: (t.type as string) === "transformative" ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)",
                        color: (t.type as string) === "transformative" ? "#f87171" : "#34d399",
                        border: `1px solid ${(t.type as string) === "transformative" ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)"}`,
                      }}>
                        {t.type as string}
                      </span>
                    )}
                    {(t.phase as string) && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.phase as string}</span>
                    )}
                  </div>
                </div>
                {(t.interpretation as string) && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>{t.interpretation as string}</p>
                )}
                {(t.duration as string) && (
                  <span style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4, display: "block" }}>{t.duration as string}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Natal analysis */}
      <div className="grid grid-cols-2 gap-4">
        {(natal.strongPlanets as Record<string, unknown>[])?.length > 0 && (
          <div className="card fade-up" style={{ animationDelay: "180ms" }}>
            <span className="label">Strong Planets</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {(natal.strongPlanets as Record<string, unknown>[]).map((sp, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <PlanetBadge name={cap(sp.planet as string)} size="sm" />
                  {(sp.dignity as string) && sp.dignity !== "neutral" && (
                    <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{sp.dignity as string}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {(natal.weakPlanets as unknown[])?.length > 0 && (
          <div className="card fade-up" style={{ animationDelay: "200ms" }}>
            <span className="label">Weak Planets</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {(natal.weakPlanets as Record<string, unknown>[]).map((wp, i) => (
                <PlanetBadge key={i} name={cap((wp.planet ?? wp) as string)} size="sm" />
              ))}
            </div>
          </div>
        )}
        {(natal.strongHouses as Record<string, unknown>[])?.length > 0 && (
          <div className="card fade-up" style={{ animationDelay: "220ms" }}>
            <span className="label">Strong Houses</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {(natal.strongHouses as Record<string, unknown>[]).map((h, i) => (
                <span key={i} style={{
                  fontSize: 12, padding: "3px 10px", borderRadius: 12,
                  background: "rgba(52,211,153,0.08)", color: "#34d399",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}>
                  H{h.house as number}
                </span>
              ))}
            </div>
          </div>
        )}
        {(natal.challengingAreas as Record<string, unknown>[])?.length > 0 && (
          <div className="card fade-up" style={{ animationDelay: "240ms" }}>
            <span className="label">Challenging Areas</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {(natal.challengingAreas as Record<string, unknown>[]).map((a, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 12,
                  background: "rgba(239,68,68,0.08)", color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.18)",
                }}>
                  H{a.house as number}
                  {(a.note as string) && <span style={{ marginLeft: 4, opacity: 0.7 }}>·</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current transits snapshot */}
      {Object.keys(transitPlanets).length > 0 && (
        <Section title="Current Planet Positions" delay={260}>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(transitPlanets).map(([pKey, pos], i) => {
              const p = pos as Record<string, unknown>;
              const nakshatra = p.nakshatra as Record<string, unknown>;
              return (
                <div key={pKey} className="card fade-up" style={{ animationDelay: `${i * 25}ms`, padding: "10px 14px" }}>
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
                    {(p.retrograde as boolean) && (
                      <span style={{ fontSize: 10, color: "#f97316", marginTop: 3, display: "block" }}>℞ Retrograde</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
