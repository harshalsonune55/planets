"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "./lib/api";
import type { BirthData } from "./lib/api";
import BirthForm from "./components/BirthForm";
import ChartView from "./components/ChartView";
import DashaView from "./components/DashaView";
import PredictionsView from "./components/PredictionsView";
import PanchangaView from "./components/PanchangaView";
import Tabs from "./components/Tabs";

const TABS = [
  { id: "chart", label: "Birth Chart" },
  { id: "dasha", label: "Dasha" },
  { id: "predictions", label: "Predictions" },
  { id: "panchanga", label: "Panchanga" },
];

type ChartResult = {
  chart: Record<string, unknown>;
  dasha: Record<string, unknown>;
  predictions: Record<string, unknown>;
  transit: Record<string, unknown>;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChartResult | null>(null);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [activeTab, setActiveTab] = useState("chart");

  async function handleSubmit(data: BirthData) {
    setLoading(true);
    setBirthData(data);
    try {
      const [chart, dasha, predictions, transit] = await Promise.all([
        api.chart(data),
        api.dasha(data),
        api.predictions(data),
        api.transit({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
          timezone: data.timezone,
        }),
      ]);
      setResult({
        chart: chart as Record<string, unknown>,
        dasha: dasha as Record<string, unknown>,
        predictions: predictions as Record<string, unknown>,
        transit: transit as Record<string, unknown>,
      });
      setActiveTab("chart");
      toast.success("Chart computed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to compute chart");
    } finally {
      setLoading(false);
    }
  }

  async function loadTestChart() {
    setLoading(true);
    try {
      const chart = await api.chartTest();
      const c = chart as Record<string, unknown>;
      const td = (c.input ?? c.inputData ?? c) as BirthData;
      setBirthData(td);

      const [dasha, predictions, transit] = await Promise.all([
        api.dasha(td),
        api.predictions(td),
        api.transit({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
          timezone: td.timezone,
        }),
      ]);
      setResult({
        chart: c,
        dasha: dasha as Record<string, unknown>,
        predictions: predictions as Record<string, unknown>,
        transit: transit as Record<string, unknown>,
      });
      setActiveTab("chart");
      toast.success("Test chart loaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load test chart");
    } finally {
      setLoading(false);
    }
  }

  const lagna =
    (result?.chart?.ascendant as Record<string, unknown>)?.siderealRashi as string ??
    (result?.chart?.ascendant as Record<string, unknown>)?.rashi as string;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(6,6,15,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🪐</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Jyotish
          </span>
          <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 2 }}>
            Vedic Astrology
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {result && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => { setResult(null); setBirthData(null); }}
            >
              New Chart
            </button>
          )}
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: "5px 12px" }}
            onClick={loadTestChart}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Load Sample"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        {!result ? (
          <div className="fade-up" style={{ animationDelay: "0ms" }}>
            <div style={{ marginBottom: 32, textAlign: "center" }}>
              <h1 style={{
                fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em",
                color: "var(--text)", marginBottom: 8,
                background: "linear-gradient(135deg, #eeeeff 30%, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Your Vedic Birth Chart
              </h1>
              <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 480, margin: "0 auto" }}>
                Computed locally using VSOP87 &amp; ELP2000 — no external APIs.
                Enter your birth details for a full Jyotish analysis.
              </p>
            </div>
            <div className="card" style={{ maxWidth: 580, margin: "0 auto" }}>
              <BirthForm onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>
        ) : (
          <div>
            <div className="fade-up" style={{ animationDelay: "0ms", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    Birth Chart
                  </h2>
                  {birthData && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                      {birthData.day}/{birthData.month}/{birthData.year} ·{" "}
                      {String(birthData.hour).padStart(2, "0")}:{String(birthData.minute).padStart(2, "0")} ·{" "}
                      {birthData.latitude.toFixed(2)}, {birthData.longitude.toFixed(2)}
                    </p>
                  )}
                </div>
                {lagna && (
                  <div style={{ textAlign: "right" }}>
                    <span className="label">Lagna</span>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>
                      {lagna}
                    </div>
                  </div>
                )}
              </div>

              <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
            </div>

            <div>
              {activeTab === "chart" && <ChartView data={result.chart} />}
              {activeTab === "dasha" && birthData && (
                <DashaView data={result.dasha} birthData={birthData} />
              )}
              {activeTab === "predictions" && <PredictionsView data={result.predictions} />}
              {activeTab === "panchanga" && birthData && (
                <PanchangaView
                  birthData={birthData}
                  transitData={(result.transit as Record<string, unknown>)?.planets as Record<string, unknown> ?? null}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
