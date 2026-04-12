import { createMemo, For } from "solid-js";
import { CostDataPoint } from "../../types/product";
import { Card } from "./Card";

interface SalesHistoryChartProps {
  data: CostDataPoint[];
}

const W = 480;
const H = 148;
const PAD = { top: 12, right: 16, bottom: 32, left: 44 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const PRIMARY = "#3d6ab5";
const BAR_RATIO = 0.55; // bar width as fraction of segment width

const AXIS_CLASS = "text-[9px] fill-gray-500 dark:fill-gray-300";

const fmtInt = (v: number) => new Intl.NumberFormat("pt-BR").format(Math.round(v));

export function SalesHistoryChart(props: SalesHistoryChartProps) {
  const n = () => props.data.length;

  const maxVal = createMemo(() => Math.max(...props.data.map((d) => d.value)) * 1.1);
  const segW = createMemo(() => PLOT_W / n());
  const barW = createMemo(() => segW() * BAR_RATIO);

  const toY = (v: number) => PAD.top + PLOT_H - (v / maxVal()) * PLOT_H;
  const barX = (i: number) => PAD.left + i * segW() + (segW() - barW()) / 2;
  const labelX = (i: number) => PAD.left + (i + 0.5) * segW();

  const yTicks = createMemo(() => {
    const step = maxVal() / 3;
    return [0, 1, 2, 3].map((i) => step * i);
  });

  return (
    <Card class="flex flex-col p-4">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
          Vendas por Mês — últimos 6 meses
        </span>
        <span class="text-xs text-gray-400 dark:text-gray-500">un/mês</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} class="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={PRIMARY} stop-opacity="0.9" />
            <stop offset="100%" stop-color={PRIMARY} stop-opacity="0.55" />
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
                {fmtInt(tick)}
              </text>
            </g>
          )}
        </For>

        {/* Bars + X labels */}
        <For each={props.data}>
          {(d, i) => (
            <g>
              <rect
                x={barX(i())}
                y={toY(d.value)}
                width={barW()}
                height={PAD.top + PLOT_H - toY(d.value)}
                fill="url(#bar-gradient)"
                rx="3"
              />
              <text x={labelX(i())} y={H - 6} text-anchor="middle" class={AXIS_CLASS}>
                {d.month}
              </text>
            </g>
          )}
        </For>
      </svg>
    </Card>
  );
}
