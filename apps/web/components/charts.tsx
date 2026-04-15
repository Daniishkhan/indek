"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ValueFormat = "number" | "currency" | "currency-compact";

function formatValue(value: number, format: ValueFormat = "number"): string {
  if (format === "currency") {
    return `AED ${value.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
  }
  if (format === "currency-compact") {
    if (value >= 1000) {
      return `AED ${(value / 1000).toFixed(1)}k`;
    }
    return `AED ${Math.round(value)}`;
  }
  return value.toLocaleString("en-AE", { maximumFractionDigits: 0 });
}

type TooltipFormatter = (value: unknown, name?: unknown) => [string, string];

function makeTooltipFormatter(
  label: string,
  format: ValueFormat = "number",
): TooltipFormatter {
  return (value) => {
    const numeric = typeof value === "number" ? value : Number(value ?? 0);
    return [formatValue(numeric, format), label];
  };
}

function makeAxisFormatter(format: ValueFormat = "number") {
  return (value: number | string) => {
    const numeric = typeof value === "number" ? value : Number(value ?? 0);
    return formatValue(numeric, format);
  };
}

const CHART_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export function Sparkline({
  data,
  color = CHART_COLORS[0],
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <div className="sparkline-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 2, bottom: 2, left: 0, right: 0 }}
        >
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaTrendChart({
  data,
  dataKey,
  label,
  color = CHART_COLORS[0],
  height = 260,
  valueFormat = "number",
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  label: string;
  color?: string;
  height?: number;
  valueFormat?: ValueFormat;
}) {
  return (
    <div style={{ width: "100%", height, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={44}
            tickFormatter={makeAxisFormatter(valueFormat)}
          />
          <Tooltip
            formatter={makeTooltipFormatter(label, valueFormat) as never}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarCategoryChart({
  data,
  dataKey,
  labelKey = "label",
  color = CHART_COLORS[0],
  height = 260,
  horizontal = false,
  valueFormat = "number",
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  labelKey?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  valueFormat?: ValueFormat;
}) {
  return (
    <div style={{ width: "100%", height, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 16, left: horizontal ? 0 : -12, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="0"
            vertical={horizontal}
            horizontal={!horizontal}
          />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={makeAxisFormatter(valueFormat)}
              />
              <YAxis
                type="category"
                dataKey={labelKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#334155" }}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={labelKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                width={40}
                tickFormatter={makeAxisFormatter(valueFormat)}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: "rgba(79, 70, 229, 0.06)" }}
            formatter={makeTooltipFormatter("", valueFormat) as never}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  height = 220,
  valueFormat = "number",
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  valueFormat?: ValueFormat;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div
      style={{
        width: "100%",
        height,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={
                    entry.color ?? CHART_COLORS[index % CHART_COLORS.length]
                  }
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={makeTooltipFormatter("", valueFormat) as never}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul
        style={{
          display: "grid",
          gap: 10,
          padding: 0,
          margin: 0,
          listStyle: "none",
        }}
      >
        {data.map((entry, index) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <li
              key={entry.label}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 10,
                alignItems: "center",
                fontSize: "0.85rem",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background:
                    entry.color ?? CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
              <span style={{ color: "var(--muted-strong)" }}>
                {entry.label}
              </span>
              <span
                style={{
                  color: "var(--muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {entry.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ProgressRing({
  value,
  total,
  label = "Delivered",
  size = 140,
  stroke = 12,
  color = CHART_COLORS[0],
}: {
  value: number;
  total: number;
  label?: string;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.min(1, value / safeTotal);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--surface-sunken)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring-center">
        <span>
          <span className="value">
            {value}
            <span
              style={{
                color: "var(--muted)",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              /{total}
            </span>
          </span>
          <span className="label">{label}</span>
        </span>
      </div>
    </div>
  );
}

export const chartColors = CHART_COLORS;
