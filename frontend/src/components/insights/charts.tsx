import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface Datum {
  key: string;
  label: string;
  value: number;
  /** tooltip text */
  detail: string;
}

function niceMax(max: number) {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => max / s <= 4) ?? pow * 10;
  return Math.ceil(max / step) * step;
}

/** Single-series column chart: 24px max columns, 4px rounded caps, hairline grid, hover tooltip. */
export const ColumnChart: React.FC<{ data: Datum[]; unit: string; title: string; height?: number }> = ({ data, unit, title, height = 180 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { l: 32, r: 8, t: 12, b: 26 };
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [0, max / 2, max];
  const band = (W - pad.l - pad.r) / Math.max(1, data.length);
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--ink) / 0.1)" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-faint text-[11px] tabular">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.l + band * i + band / 2;
          const h = y(0) - y(d.value);
          const r = Math.min(4, h, barW / 2);
          const x0 = cx - barW / 2;
          const top = y(d.value);
          const path =
            h <= 0
              ? ''
              : `M${x0},${y(0)} L${x0},${top + r} Q${x0},${top} ${x0 + r},${top} L${x0 + barW - r},${top} Q${x0 + barW},${top} ${x0 + barW},${top + r} L${x0 + barW},${y(0)}Z`;
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={d.detail}>
              {/* hit target wider than the mark */}
              <rect x={pad.l + band * i} y={pad.t} width={band} height={H - pad.t - pad.b} fill="transparent" />
              {hover === i && <rect x={pad.l + band * i + 2} y={pad.t} width={band - 4} height={H - pad.t - pad.b} rx={6} fill="rgb(var(--ink) / 0.05)" />}
              {path && (
                <motion.path
                  d={path}
                  fill="rgb(var(--honey))"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  style={{ transformOrigin: `${cx}px ${y(0)}px` }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 180, damping: 22 }}
                />
              )}
              {(i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
                <text x={cx} y={H - 8} textAnchor="middle" className="fill-ink-faint text-[11px]">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pane-solid pointer-events-none absolute z-10 -translate-x-1/2 !rounded-xl px-3 py-1.5 text-xs text-ink"
          style={{ left: `${((pad.l + band * hover + band / 2) / W) * 100}%`, top: 0 }}
        >
          <span className="font-semibold">
            {data[hover].value} {unit}
          </span>
          <span className="block text-ink-faint">{data[hover].detail}</span>
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.detail}</th>
              <td>
                {d.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

/** Horizontal bars for a short list of named amounts (single series). */
export const BarList: React.FC<{ data: { label: string; value: number }[]; unit: string; title: string }> = ({ data, unit, title }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3" aria-label={title}>
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink">{d.label}</span>
            <span className="tabular text-ink-soft">
              {d.value} {unit}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-ink/[0.07]">
            <motion.div
              className="h-full rounded-full bg-honey"
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 22 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};
