import { For } from "solid-js";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { CostHistoryChart } from "../components/ui/CostHistoryChart";
import { SalesHistoryChart } from "../components/ui/SalesHistoryChart";
import { TransactionCard } from "../components/ui/TransactionCard";
import { ProductDashboard } from "../types/product";

// ── Icons ────────────────────────────────────────────────────────────────────

const IconSales = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const IconBox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconCart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockProduct: ProductDashboard = {
  code: "001234",
  name: "Arroz Branco 5kg",
  avgSalesLast6Months: 8450.0,
  costHistory: [
    { month: "Nov", value: 18.5 },
    { month: "Dez", value: 19.2 },
    { month: "Jan", value: 18.9 },
    { month: "Fev", value: 20.1 },
    { month: "Mar", value: 19.8 },
    { month: "Abr", value: 21.0 },
  ],
  salesHistory: [
    { month: "Nov", value: 312 },
    { month: "Dez", value: 415 },
    { month: "Jan", value: 289 },
    { month: "Fev", value: 356 },
    { month: "Mar", value: 401 },
    { month: "Abr", value: 370 },
  ],
  currentStock: 145,
  avgDailySales: 12.3,
  purchaseSuggestion: 250,
  lastPurchase: { date: "15/03/2026", price: 21.0, quantity: 300 },
  lastSale: { date: "11/04/2026", price: 28.9, quantity: 2 },
  similares: [
    { code: "001235", name: "Arroz Branco 2kg" },
    { code: "001236", name: "Arroz Integral 5kg" },
    { code: "001237", name: "Arroz Parboilizado 5kg" },
    { code: "001238", name: "Arroz Arbóreo 1kg" },
    { code: "001239", name: "Arroz Negro 1kg" },
    { code: "001240", name: "Arroz Jasmine 5kg" },
  ],
};

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtNumber = (v: number, decimals = 1) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: decimals }).format(v);

// ── Component ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const p = mockProduct;

  return (
    <div class="flex gap-4 p-4">
      {/* ── Similares panel ───────────────────────────────────────────────── */}
      <Card class="flex w-56 shrink-0 flex-col">
        <p class="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:border-white/10 dark:text-gray-500">
          Similares
        </p>
        <ul class="flex flex-col overflow-y-auto">
          <For each={p.similares}>
            {(similar) => (
              <li class="group flex cursor-pointer flex-col gap-0.5 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5">
                <span class="text-xs font-bold tracking-wider text-primary-500 dark:text-primary-400">
                  {similar.code}
                </span>
                <span class="text-xs text-gray-700 dark:text-gray-300">
                  {similar.name}
                </span>
              </li>
            )}
          </For>
        </ul>
      </Card>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div class="flex min-w-0 flex-1 flex-col gap-4">
      {/* Product title */}
      <Card class="flex items-center gap-3 px-5 py-4">
        <span class="rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-bold tracking-widest text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {p.code}
        </span>
        <span class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {p.name}
        </span>
      </Card>

      {/* Stat cards */}
      <div class="grid grid-cols-4 gap-4">
        <StatCard
          label="Venda Média (6 meses)"
          value={fmtCurrency(p.avgSalesLast6Months)}
          sublabel="receita média mensal"
          icon={<IconSales />}
          accent="blue"
        />
        <StatCard
          label="Saldo de Estoque"
          value={`${fmtNumber(p.currentStock, 0)} un`}
          sublabel="unidades disponíveis"
          icon={<IconBox />}
          accent="green"
        />
        <StatCard
          label="Venda Média Diária"
          value={`${fmtNumber(p.avgDailySales)} un/dia`}
          sublabel="últimos 30 dias"
          icon={<IconCalendar />}
          accent="purple"
        />
        <StatCard
          label="Sugestão de Compra"
          value={`${fmtNumber(p.purchaseSuggestion, 0)} un`}
          sublabel="baseado no giro atual"
          icon={<IconCart />}
          accent="amber"
        />
      </div>

      {/* Charts + transactions */}
      <div class="grid grid-cols-4 gap-4">
        <div class="col-span-2">
          <CostHistoryChart data={p.costHistory} />
        </div>
        <TransactionCard type="purchase" data={p.lastPurchase} />
        <TransactionCard type="sale" data={p.lastSale} />
      </div>

      {/* Sales history — full width */}
      <SalesHistoryChart data={p.salesHistory} />
      </div>
    </div>
  );
}
