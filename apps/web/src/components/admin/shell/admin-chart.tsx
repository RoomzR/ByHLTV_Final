"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type ChartPoint = {
  label: string;
  [key: string]: string | number;
};

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
};

export function AdminChart({
  data,
  valueKey = "value",
  labelKey = "label",
  className,
}: {
  data: Array<Record<string, string | number>>;
  valueKey?: string;
  labelKey?: string;
  className?: string;
}) {
  return (
    <AdminBarChart
      data={data as ChartPoint[]}
      series={[{ key: valueKey, label: valueKey, color: "var(--hltv-green)" }]}
      labelKey={labelKey}
      className={className}
    />
  );
}

export function AdminBarChart({
  data,
  series,
  labelKey = "label",
  className,
  height = 220,
}: {
  data: ChartPoint[];
  series: ChartSeries[];
  labelKey?: string;
  className?: string;
  height?: number;
}) {
  const max = Math.max(
    1,
    ...data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0))),
  );
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className={cn("py-12 text-center text-sm text-zinc-600", className)}>—</p>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="mb-3 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: height - 28 }}>
              {series.map((s) => {
                const v = Number(d[s.key] ?? 0);
                const h = Math.max(v > 0 ? 6 : 2, Math.round((v / max) * (height - 36)));
                return (
                  <div
                    key={s.key}
                    className="min-w-[3px] flex-1 rounded-t transition-opacity group-hover:opacity-100"
                    style={{ height: h, background: s.color, opacity: hover === null || hover === i ? 0.9 : 0.35 }}
                    title={`${d[labelKey]} · ${s.label}: ${v}`}
                  />
                );
              })}
            </div>
            <span className="w-full truncate text-center text-[9px] text-zinc-600">
              {formatAxisLabel(String(d[labelKey] ?? ""))}
            </span>
            {hover === i ? (
              <div className="pointer-events-none absolute bottom-[calc(100%-8px)] z-10 whitespace-nowrap rounded-lg border border-[#2a2a2a] bg-[#111] px-2 py-1.5 text-[10px] text-zinc-200 shadow-lg">
                <div className="mb-1 font-semibold text-zinc-100">{String(d[labelKey])}</div>
                {series.map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}: {Number(d[s.key] ?? 0).toLocaleString()}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminLineChart({
  data,
  series,
  labelKey = "label",
  className,
  height = 240,
  area = true,
}: {
  data: ChartPoint[];
  series: ChartSeries[];
  labelKey?: string;
  className?: string;
  height?: number;
  area?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const width = 720;

  const max = Math.max(
    1,
    ...data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0))),
  );

  const paths = useMemo(() => {
    if (data.length === 0) return [];
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const xAt = (i: number) =>
      pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const yAt = (v: number) => pad.top + innerH - (v / max) * innerH;

    return series.map((s) => {
      const points = data.map((d, i) => ({
        x: xAt(i),
        y: yAt(Number(d[s.key] ?? 0)),
        value: Number(d[s.key] ?? 0),
      }));
      const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      const areaPath =
        points.length > 0
          ? `${line} L${points[points.length - 1]!.x},${pad.top + innerH} L${points[0]!.x},${pad.top + innerH} Z`
          : "";
      return { ...s, points, line, areaPath };
    });
  }, [data, series, max, height]);

  if (data.length === 0) {
    return <p className={cn("py-12 text-center text-sm text-zinc-600", className)}>—</p>;
  }

  const gridYs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={cn("relative", className)}>
      <div className="mb-3 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img">
        {gridYs.map((g) => {
          const y = pad.top + (height - pad.top - pad.bottom) * (1 - g);
          const val = Math.round(max * g);
          return (
            <g key={g}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#2a2a2a"
                strokeDasharray="4 4"
              />
              <text x={pad.left - 8} y={y + 3} textAnchor="end" className="fill-zinc-600" fontSize="10">
                {val}
              </text>
            </g>
          );
        })}

        {paths.map((p) => (
          <g key={p.key}>
            {area ? <path d={p.areaPath} fill={p.color} opacity={0.12} /> : null}
            <path d={p.line} fill="none" stroke={p.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {p.points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={hover === i ? 4.5 : 3}
                fill="#0b0b0b"
                stroke={p.color}
                strokeWidth={2}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />
            ))}
          </g>
        ))}

        {data.map((d, i) => {
          const x =
            pad.left +
            (data.length === 1
              ? (width - pad.left - pad.right) / 2
              : (i / (data.length - 1)) * (width - pad.left - pad.right));
          const show =
            data.length <= 10 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 7) === 0;
          if (!show) return null;
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-zinc-600"
              fontSize="10"
            >
              {formatAxisLabel(String(d[labelKey] ?? ""))}
            </text>
          );
        })}

        {hover !== null && data[hover] ? (
          <g>
            <line
              x1={
                pad.left +
                (data.length === 1
                  ? (width - pad.left - pad.right) / 2
                  : (hover / (data.length - 1)) * (width - pad.left - pad.right))
              }
              x2={
                pad.left +
                (data.length === 1
                  ? (width - pad.left - pad.right) / 2
                  : (hover / (data.length - 1)) * (width - pad.left - pad.right))
              }
              y1={pad.top}
              y2={height - pad.bottom}
              stroke="#3f3f46"
              strokeDasharray="3 3"
            />
          </g>
        ) : null}
      </svg>

      {hover !== null && data[hover] ? (
        <div className="pointer-events-none absolute left-1/2 top-10 z-10 -translate-x-1/2 rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-[11px] text-zinc-200 shadow-xl">
          <div className="mb-1 font-semibold">{String(data[hover]![labelKey])}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}: {Number(data[hover]![s.key] ?? 0).toLocaleString()}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminDonutChart({
  segments,
  className,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  className?: string;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center", className)}>
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#1f1f1f" strokeWidth="16" />
          {segments.map((seg) => {
            const len = (seg.value / total) * c;
            const el = (
              <circle
                key={seg.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue !== undefined ? (
            <div className="font-mono text-lg font-bold text-white">{centerValue}</div>
          ) : null}
          {centerLabel ? <div className="text-[10px] uppercase tracking-wider text-zinc-500">{centerLabel}</div> : null}
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 truncate text-zinc-300">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: seg.color }} />
              {seg.label}
            </span>
            <span className="shrink-0 font-mono text-xs text-zinc-500">
              {seg.value.toLocaleString()} · {((seg.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
        {segments.length === 0 ? <li className="text-zinc-600">—</li> : null}
      </ul>
    </div>
  );
}

function formatAxisLabel(label: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label.slice(5);
  return label.length > 8 ? `${label.slice(0, 7)}…` : label;
}
