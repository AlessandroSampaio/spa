import {
  Axis,
  AxisGrid,
  AxisLabel,
  AxisLine,
  AxisCursor,
  AxisTooltip,
  Bar,
  Chart,
} from "solid-charts";

import { CostDataPoint } from "../../types/product";
import { Card } from "./Card";

interface SalesHistoryChartProps {
  data: CostDataPoint[];
}

const PRIMARY = "#3d6ab5";

const fmtInt = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.round(v));

export function SalesHistoryChart(props: SalesHistoryChartProps) {
  return (
    <Card class="flex flex-col p-4">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
          Vendas por Mês — últimos 6 meses
        </span>
        <span class="text-xs text-gray-400 dark:text-gray-500">un/mês</span>
      </div>

      <div class="h-36 text-[9px] text-gray-500 dark:text-gray-400">
        <Chart data={props.data} barConfig={{ bandGap: "20%", barGap: "10%" }}>
          <Axis axis="y" position="left" tickCount={4}>
            <AxisLabel format={fmtInt} />
            <AxisGrid class="stroke-gray-200 dark:stroke-white/10" />
          </Axis>
          <Axis dataKey="month" axis="x" position="bottom">
            <AxisLabel />
            <AxisLine class="stroke-gray-200 dark:stroke-white/10" />
            <AxisCursor
              stroke-dasharray="4,4"
              stroke-width={1}
              class="stroke-gray-400 dark:stroke-gray-500 transition-opacity"
            />
            <AxisTooltip class="rounded-md text-xs overflow-hidden shadow-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800">
              {(p) => (
                <>
                  <div class="border-b border-gray-100 px-2 py-1 font-medium text-gray-700 dark:border-white/10 dark:text-gray-200">
                    {(p.data as CostDataPoint).month}
                  </div>
                  <div class="flex items-center gap-2 px-2 py-1">
                    <span class="text-gray-400 dark:text-gray-500">Vendas</span>
                    <span class="ml-auto font-medium text-gray-700 dark:text-gray-200">
                      {fmtInt((p.data as CostDataPoint).value)} un
                    </span>
                  </div>
                </>
              )}
            </AxisTooltip>
          </Axis>
          <Bar
            dataKey="value"
            fill={PRIMARY}
            fill-opacity={0.85}
            rx={3}
          />
        </Chart>
      </div>
    </Card>
  );
}
