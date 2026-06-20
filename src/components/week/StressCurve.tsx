"use client";

import { useState } from "react";
import { loadColor } from "@/lib/format";

export type CurvePoint = {
  key: string;
  label: string;
  score: number;
  count: number;
};

export default function StressCurve({ points }: { points: CurvePoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const W = 320;
  const H = 150;
  const padX = 18;
  const padY = 20;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const n = points.length;
  const x = (i: number) => padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const y = (s: number) => padY + innerH - (innerH * s) / 100;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${x(n - 1).toFixed(1)} ${(padY + innerH).toFixed(1)} ` +
    `L ${x(0).toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

  const sel = active != null ? points[active] : null;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-ink">Your stress curve</h2>
        <span className="text-xs text-mist">daily load · 0–100</span>
      </div>
      <p className="mb-3 text-sm text-mist">
        {sel
          ? `${sel.label}: ${sel.score}/100 · ${sel.count} ${
              sel.count === 1 ? "event" : "events"
            }`
          : "Tap a point to see the day."}
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Weekly stress curve"
      >
        <defs>
          <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3fc7c0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3fc7c0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="curveLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22a7a0" />
            <stop offset="100%" stopColor="#2f87a6" />
          </linearGradient>
        </defs>

        {[25, 50, 75].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={W - padX}
            y1={y(g)}
            y2={y(g)}
            stroke="#cfe6ee"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}

        <path d={areaPath} fill="url(#curveFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#curveLine)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <g key={p.key} onClick={() => setActive(i)} className="cursor-pointer">
            <circle cx={x(i)} cy={y(p.score)} r="14" fill="transparent" />
            <circle
              cx={x(i)}
              cy={y(p.score)}
              r={active === i ? 6 : 4.5}
              fill="#fff"
              stroke={loadColor(p.score)}
              strokeWidth="3"
            />
            <text
              x={x(i)}
              y={H - 4}
              textAnchor="middle"
              className="fill-mist text-[9px] font-semibold"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
