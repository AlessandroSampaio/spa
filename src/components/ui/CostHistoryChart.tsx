import { createMemo, For } from "solid-js";
import { CostDataPoint } from "../../types/product";
import { Card } from "./Card";

interface CostHistoryChartProps {
  data: CostDataPoint[];
}

const W = 480;
const H = 148;
const PAD = { top: 12, right: 16, bottom: 32, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const PRIMARY = "#3d6ab5";

// Axis label classes: gray-500 on light, gray-300 on dark for better contrast
const AXIS_CLASS = "text-[9px] fill-gray-500 dark:fill-gray-300";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

export function CostHistoryChart(props: CostHistoryChartProps) {
  const n = () => props.data.length;

  const minVal = createMemo(() => Math.min(...props.data.map((d) => d.value)) * 0.94);
  const maxVal = createMemo(() => Math.max(...props.data.map((d) => d.value)) * 1.06);

  const toX = (i: number) => PAD.left + (i / (n() - 1)) * PLOT_W;
  const toY = (v: number) =>
    PAD.top + PLOT_H - ((v - minVal()) / (maxVal() - minVal())) * PLOT_H;

  const pts = createMemo(() =>
    props.data.map((d, i) => ({ x: toX(i), y: toY(d.value), ...d }))
  );

  const linePath = createMemo(() =>
    pts()
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ")
  );

  const areaPath = createMemo(() => {
    const last = pts()[pts().length - 1];
    const first = pts()[0];
    const base = (PAD.top + PLOT_H).toFixed(1);
    return `${linePath()} L${last.x.toFixed(1)},${base} L${first.x.toFixed(1)},${base} Z`;
  });

  const yTicks = createMemo(() => {
    const step = (maxVal() - minVal()) / 3;
    return [0, 1, 2, 3].map((i) => minVal() + step * i);
  });

  return (
    <Card class="flex flex-col p-4">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
          Histórico de Custo — últimos 6 meses
        </span>
        <span class="text-xs text-gray-400 dark:text-gray-500">R$/un</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} class="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="cost-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={PRIMARY} stop-opacity="0.18" />
            <stop offset="100%" stop-color={PRIMARY} stop-opacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        <For each={yTicks()}>
          {(tick) => (
            <g>
              <line
                x1={PAD.left} y1={toY(tick)}
                x2={W - PAD.right} y2={toY(tick)}
                stroke="currentColor" stroke-opacity="0.07" stroke-width="1"
              />
              <text
                x={PAD.left - 6} y={toY(tick)}
                text-anchor="end" dominant-baseline="middle"
                class={AXIS_CLASS}
              >
                {fmt(tick)}
              </text>
            </g>
          )}
        </For>

        {/* Area + Line */}
        <path d={areaPath()} fill="url(#cost-area)" />
        <path d={linePath()} fill="none" stroke={PRIMARY} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

        {/* Dots + X labels */}
        <For each={pts()}>
          {(p) => (
            <g>
              <circle
                cx={p.x} cy={p.y} r="3.5"
                class="fill-white dark:fill-[#1f2937]"
                stroke={PRIMARY} stroke-width="2"
              />
              <text x={p.x} y={H - 6} text-anchor="middle" class={AXIS_CLASS}>
                {p.month}
              </text>
            </g>
          )}
        </For>
      </svg>
    </Card>
  );
}
