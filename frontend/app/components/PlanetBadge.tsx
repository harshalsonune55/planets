const PLANET_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Sun:     { bg: "rgba(251,191,36,0.1)",  text: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  Moon:    { bg: "rgba(226,232,240,0.08)", text: "#cbd5e1", border: "rgba(226,232,240,0.2)" },
  Mars:    { bg: "rgba(239,68,68,0.1)",   text: "#f87171", border: "rgba(239,68,68,0.25)" },
  Mercury: { bg: "rgba(52,211,153,0.1)",  text: "#34d399", border: "rgba(52,211,153,0.25)" },
  Jupiter: { bg: "rgba(249,115,22,0.1)",  text: "#fb923c", border: "rgba(249,115,22,0.25)" },
  Venus:   { bg: "rgba(236,72,153,0.1)",  text: "#f472b6", border: "rgba(236,72,153,0.25)" },
  Saturn:  { bg: "rgba(100,116,139,0.12)",text: "#94a3b8", border: "rgba(100,116,139,0.3)" },
  Rahu:    { bg: "rgba(139,92,246,0.1)",  text: "#a78bfa", border: "rgba(139,92,246,0.25)" },
  Ketu:    { bg: "rgba(120,113,108,0.1)", text: "#a8a29e", border: "rgba(120,113,108,0.25)" },
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿",
  Jupiter: "♃", Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋",
};

type Props = { name: string; size?: "sm" | "md" };

export default function PlanetBadge({ name, size = "md" }: Props) {
  const colors = PLANET_COLORS[name] ?? { bg: "rgba(255,255,255,0.05)", text: "#aaa", border: "rgba(255,255,255,0.1)" };
  const glyph = PLANET_GLYPHS[name] ?? "★";
  return (
    <span
      className="planet-pill"
      style={{
        background: colors.bg,
        color: colors.text,
        borderColor: colors.border,
        fontSize: size === "sm" ? 11 : 12,
        padding: size === "sm" ? "2px 7px" : "4px 10px",
      }}
    >
      <span style={{ fontSize: size === "sm" ? 12 : 14 }}>{glyph}</span>
      {name}
    </span>
  );
}

export { PLANET_COLORS, PLANET_GLYPHS };
