"use client";

import { useMemo, useState } from "react";

export type ChartPoint = {
  id: number;
  performedAt: string;
  weight: number;
  noOfSets: number;
  noOfReps: number;
};

const WIDTH = 640;
const HEIGHT = 240;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 44 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function WeightProgressChart({
  data,
  unit,
}: {
  data: ChartPoint[];
  unit: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const chart = useMemo(() => {
    const times = data.map((d) => new Date(d.performedAt).getTime());
    const weights = data.map((d) => d.weight);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight || Math.max(maxWeight * 0.1, 5);
    const yMin = Math.max(0, minWeight - weightRange * 0.2);
    const yMax = maxWeight + weightRange * 0.2;
    const timeRange = maxTime - minTime || 1;

    const x = (t: number) =>
      MARGIN.left + ((t - minTime) / timeRange) * PLOT_WIDTH;
    const y = (w: number) =>
      MARGIN.top + PLOT_HEIGHT - ((w - yMin) / (yMax - yMin)) * PLOT_HEIGHT;

    const points = data.map((d, i) => ({
      ...d,
      x: data.length === 1 ? MARGIN.left + PLOT_WIDTH / 2 : x(times[i]),
      y: y(d.weight),
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaPath =
      points.length > 1
        ? `${linePath} L ${points[points.length - 1].x} ${MARGIN.top + PLOT_HEIGHT} L ${points[0].x} ${MARGIN.top + PLOT_HEIGHT} Z`
        : "";

    const prIndex = weights.indexOf(maxWeight);

    const gridLines = Array.from({ length: 4 }, (_, i) => {
      const value = yMin + ((yMax - yMin) * i) / 3;
      return { value, y: y(value) };
    });

    return { points, linePath, areaPath, prIndex, gridLines };
  }, [data]);

  if (data.length === 0) return null;

  const active = hovered !== null ? chart.points[hovered] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Weight over time for this exercise, in ${unit}`}
      >
        {chart.gridLines.map((line) => (
          <g key={line.value}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={line.y}
              y2={line.y}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={line.y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {Math.round(line.value)}
            </text>
          </g>
        ))}

        {chart.areaPath && (
          <path d={chart.areaPath} fill="var(--primary)" fillOpacity={0.1} />
        )}

        <path
          d={chart.linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.points.map((p, i) => (
          <g key={p.id}>
            {i === chart.prIndex && (
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                PR
              </text>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={i === chart.points.length - 1 || i === chart.prIndex ? 5 : 4}
              fill="var(--primary)"
              stroke="var(--card)"
              strokeWidth={2}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={12}
              fill="transparent"
              tabIndex={0}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              className="cursor-pointer outline-none"
            />
          </g>
        ))}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {chart.points.length > 0 &&
          (() => {
            const last = chart.points[chart.points.length - 1];
            return (
              <text
                x={last.x}
                y={last.y - (chart.prIndex === chart.points.length - 1 ? 24 : 12)}
                textAnchor="end"
                className="fill-foreground text-[11px] font-medium"
              >
                {last.weight} {unit}
              </text>
            );
          })()}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(active.x / WIDTH) * 100}%`,
            transform:
              active.x > WIDTH * 0.75
                ? "translateX(-100%)"
                : "translateX(-8px)",
          }}
        >
          <p className="font-semibold text-popover-foreground">
            {active.weight} {unit}
          </p>
          <p className="text-muted-foreground">
            {active.noOfSets} × {active.noOfReps} ·{" "}
            {dateFormatter.format(new Date(active.performedAt))}
          </p>
        </div>
      )}
    </div>
  );
}
