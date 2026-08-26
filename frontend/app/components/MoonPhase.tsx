/**
 * The Moon drawn at its actual phase.
 *
 * `elongation` is the Moon's angular distance from the Sun: 0° is new, 180°
 * is full. The lit region is a half-disc closed off by the terminator, an
 * ellipse whose width is |cos(elongation)| — flat at the quarters, a full
 * circle at new and full moon.
 */

import { useId } from "react";

type Props = { elongation: number; size?: number };

export default function MoonPhase({ elongation, size = 88 }: Props) {
  // Several moons can share a page, so the gradient and clip ids must be unique.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const litId = `moonLit-${uid}`;
  const glowId = `moonGlow-${uid}`;
  const clipId = `moonClip-${uid}`;
  const angle = ((elongation % 360) + 360) % 360;
  const rad = (angle * Math.PI) / 180;
  const waxing = angle < 180;
  const r = 50;
  const rx = Math.abs(Math.cos(rad)) * r;

  // Trace the lit half, then close it along the terminator. Which way each
  // arc bows depends on the side that is lit and whether we are past quarter.
  const litHalfSweep = waxing ? 1 : 0;
  const terminatorSweep = waxing ? (Math.cos(rad) > 0 ? 0 : 1) : Math.cos(rad) > 0 ? 1 : 0;
  const litPath = [
    `M 0 ${-r}`,
    `A ${r} ${r} 0 0 ${litHalfSweep} 0 ${r}`,
    `A ${rx.toFixed(3)} ${r} 0 0 ${terminatorSweep} 0 ${-r}`,
    "Z",
  ].join(" ");

  const illumination = Math.round(((1 - Math.cos(rad)) / 2) * 100);
  const label = `${waxing ? "Waxing" : "Waning"} moon, ${illumination}% illuminated`;

  return (
    <svg
      viewBox="-56 -56 112 112"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <radialGradient id={litId} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="62%" stopColor="#e6e6fa" />
          <stop offset="100%" stopColor="#b9b9d8" />
        </radialGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="rgba(226,226,255,0.30)" />
          <stop offset="100%" stopColor="rgba(226,226,255,0)" />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={litPath} />
        </clipPath>
      </defs>

      {/* The glow scales with how much of the disc is lit */}
      <circle cx="0" cy="0" r="56" fill={`url(#${glowId})`} opacity={0.25 + (illumination / 100) * 0.75} />
      {/* Earthshine — the unlit disc stays faintly visible */}
      <circle cx="0" cy="0" r={r} fill="#171728" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      <path d={litPath} fill={`url(#${litId})`} />
      {/* Maria, clipped to the lit side so they only show where the Moon is */}
      <g fill="rgba(126,126,170,0.20)" clipPath={`url(#${clipId})`}>
        <ellipse cx="-14" cy="-17" rx="13" ry="10" />
        <ellipse cx="15" cy="8" rx="9" ry="11" />
        <circle cx="-5" cy="23" r="5.5" />
        <circle cx="25" cy="-21" r="4" />
        <circle cx="2" cy="-3" r="7" />
      </g>
    </svg>
  );
}
