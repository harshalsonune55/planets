"use client";

import { useState } from "react";
import PlanetBadge, { PLANET_COLORS } from "./PlanetBadge";
import { api } from "../lib/api";
import type { BirthData } from "../lib/api";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = { data: any; birthData: BirthData };

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function fmtDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fmtRemaining(item: Record<string, unknown>) {
  if (item.remainingDays != null) {
    const days = item.remainingDays as number;
    if (days < 30) return `${Math.round(days)}d`;
    return `${Math.round(days / 30)}m`;
  }
  if (item.remainingYears != null) {
    const yrs = item.remainingYears as number;
    const y = Math.floor(yrs);
    const m = Math.round((yrs - y) * 12);
    return m > 0 ? `${y}y ${m}m` : `${y}y`;
  }
  return null;
}

export default function DashaView({ data, birthData }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [antarData, setAntarData] = useState<Record<string, unknown> | null>(null);
  const [loadingLord, setLoadingLord] = useState<string | null>(null);

  // /api/dasha returns: { current: { mahadasha: {lord}, antardasha: {lord}, pratyantar: {lord} }, allMahadashas: [...] }
  const current = data.current as Record<string, unknown> | undefined;
  const allMahadashas = (data.allMahadashas ?? data.mahadashas ?? []) as Record<string, unknown>[];

  const currentMahaLord = (current?.mahadasha as Record<string, unknown>)?.lord as string;
  const currentAntarLord = (current?.antardasha as Record<string, unknown>)?.lord as string;
  const currentPratLord = (current?.pratyantar as Record<string, unknown>)?.lord as string;

  async function loadAntardasha(lord: string) {
    if (expanded === lord) { setExpanded(null); return; }
    setExpanded(lord);
    if (antarData && (antarData as Record<string, unknown>).__lord === lord) return;
    setLoadingLord(lord);
    try {
      const res = await api.antardasha({ ...birthData, mahaLord: lord.toLowerCase() });
      setAntarData({ ...(res as object), __lord: lord });
    } catch {
      toast.error("Failed to load antardasha");
    } finally {
      setLoadingLord(null);
    }
  }

  return (
    <div className="grid gap-6">
      {/* Current period */}
      {current && (
        <div className="card fade-up" style={{ animationDelay: "0ms", borderColor: "rgba(167,139,250,0.25)" }}>
          <span className="label">Current Dasha Period</span>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "Mahadasha", lord: currentMahaLord, item: current.mahadasha as Record<string, unknown> },
              { label: "Antardasha", lord: currentAntarLord, item: current.antardasha as Record<string, unknown> },
              { label: "Pratyantar", lord: currentPratLord, item: current.pratyantar as Record<string, unknown> },
            ].filter(x => x.lord).map(({ label, lord, item }, idx) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {idx > 0 && <span style={{ color: "var(--text-dim)", fontSize: 18 }}>›</span>}
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    {label}
                  </div>
                  <PlanetBadge name={cap(lord)} />
                  {fmtRemaining(item) && (
                    <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, fontWeight: 500 }}>
                      {fmtRemaining(item)} left
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mahadasha timeline */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Vimshottari Mahadasha Timeline
        </h3>
        <div className="grid gap-1">
          {allMahadashas.map((md, i) => {
            const lord = md.lord as string;
            const name = cap(lord);
            const colors = PLANET_COLORS[name] ?? { bg: "rgba(255,255,255,0.04)", text: "#aaa", border: "rgba(255,255,255,0.08)" };
            const isCurrent = lord === currentMahaLord;
            const isExpanded = expanded === lord;
            const isLoading = loadingLord === lord;

            return (
              <div key={`${lord}-${i}`} className="fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                <button
                  onClick={() => loadAntardasha(lord)}
                  className="card"
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "160px 1fr 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "12px 16px",
                    borderColor: isCurrent ? colors.border : "var(--border)",
                    background: isCurrent ? colors.bg : "var(--surface)",
                    textAlign: "left",
                    transition: "border-color 150ms ease, background 150ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isCurrent && (
                      <span style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: colors.text, flexShrink: 0,
                        boxShadow: `0 0 6px ${colors.text}`,
                      }} />
                    )}
                    <PlanetBadge name={name} />
                  </div>
                  <div>
                    <span className="label">Start</span>
                    <div className="mono" style={{ fontSize: 13, color: "var(--text)", marginTop: 2 }}>
                      {fmtDate(md.startDate as string)}
                    </div>
                  </div>
                  <div>
                    <span className="label">End · Years</span>
                    <div className="mono" style={{ fontSize: 13, color: "var(--text)", marginTop: 2 }}>
                      {fmtDate(md.endDate as string)}
                      <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>{md.years as number}y</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isCurrent && fmtRemaining(md) && (
                      <span style={{ fontSize: 12, color: colors.text }}>{fmtRemaining(md)}</span>
                    )}
                    {isLoading
                      ? <span className="spinner" />
                      : <span style={{ color: "var(--text-dim)", fontSize: 18, display: "inline-block", transition: "transform 200ms ease", transform: isExpanded ? "rotate(90deg)" : "none" }}>›</span>
                    }
                  </div>
                </button>

                {/* Antardasha expansion */}
                {isExpanded && antarData && (antarData as Record<string, unknown>).__lord === lord && (
                  <div style={{ paddingLeft: 24, paddingTop: 2, paddingBottom: 4 }}>
                    <div className="grid gap-1">
                      {((antarData as Record<string, unknown>).antardashas as Record<string, unknown>[] ?? []).map((ad, j) => {
                        const adLord = ad.lord as string;
                        const adName = cap(adLord);
                        const adColors = PLANET_COLORS[adName] ?? { bg: "rgba(255,255,255,0.04)", text: "#aaa", border: "rgba(255,255,255,0.08)" };
                        const isCurrentAD = adLord === currentAntarLord && isCurrent;
                        return (
                          <div
                            key={`${adLord}-${j}`}
                            className="card fade-up"
                            style={{
                              animationDelay: `${j * 20}ms`,
                              padding: "10px 14px",
                              display: "grid",
                              gridTemplateColumns: "140px 1fr 1fr",
                              gap: 12,
                              alignItems: "center",
                              borderColor: isCurrentAD ? adColors.border : "var(--border)",
                              background: isCurrentAD ? adColors.bg : "var(--surface-2)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {isCurrentAD && (
                                <span style={{ width: 5, height: 5, borderRadius: 3, background: adColors.text, flexShrink: 0 }} />
                              )}
                              <PlanetBadge name={adName} size="sm" />
                            </div>
                            <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {fmtDate(ad.startDate as string)}
                            </span>
                            <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {fmtDate(ad.endDate as string)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
