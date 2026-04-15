import {
  batch,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
import type { SimilarProduct } from "../bindings";
import { Card } from "../components/ui/Card";
import { EntriesHistoryChart } from "../components/ui/EntriesHistoryChart";
import { SalesHistoryChart } from "../components/ui/SalesHistoryChart";
import { StatCard } from "../components/ui/StatCard";
import { proforlinFilter } from "../stores/proforlinFilter";
import { interval, INTERVAL_LABELS } from "../stores/interval";
import { selectedProduct, setSelectedProduct } from "../stores/selectedProduct";
import { taurpc } from "../stores/taurpc";

// ── Icons ────────────────────────────────────────────────────────────────────

const IconSales = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const IconBox = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);
const IconCalendar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconCart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const IconSortAsc = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 8l4-4 4 4" />
    <path d="M7 4v16" />
    <path d="M11 12h10" />
    <path d="M11 16h7" />
    <path d="M11 20h4" />
  </svg>
);
const IconSortDesc = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 16l4 4 4-4" />
    <path d="M7 20V4" />
    <path d="M11 12h10" />
    <path d="M11 8h7" />
    <path d="M11 4h4" />
  </svg>
);

// ── Empty state ───────────────────────────────────────────────────────────────

function NoData(props: { label: string; class?: string }) {
  return (
    <Card class={`flex flex-col gap-3 p-4 ${props.class ?? ""}`}>
      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
        {props.label}
      </span>
      <p class="text-xs text-gray-400 dark:text-gray-500">
        Sem dados disponíveis.
      </p>
    </Card>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

const fmtNumber = (v: number, decimals = 1) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: decimals }).format(v);

// ── Component ─────────────────────────────────────────────────────────────────

// Approximate days per interval (used for daily-rate estimates).
function intervalDays(iv: string): number {
  switch (iv) {
    case "OneWeek": return 7;
    case "TwoWeeks": return 14;
    case "OneMonth": return 30;
    case "TwoMonths": return 60;
    case "ThreeMonths": return 91;
    case "SixMonths": return 182;
    default: return 182;
  }
}

export function Dashboard() {
  // ── Sales resource ────────────────────────────────────────────────────────
  const [sales] = createResource(
    () => {
      const procod = selectedProduct()?.procod ?? null;
      if (!procod) return null;
      return { procod, interval: interval() };
    },
    ({ procod, interval }) =>
      taurpc.sales.get_summary_by_product(procod, interval),
  );

  const periodMonths = createMemo(() => {
    switch (interval()) {
      case "OneWeek": return 1 / 4;
      case "TwoWeeks": return 1 / 2;
      case "OneMonth": return 1;
      case "TwoMonths": return 2;
      case "ThreeMonths": return 3;
      case "SixMonths": return 6;
    }
  });

  const avgMonthlyRevenue = createMemo(() =>
    sales()?.total_sales != null
      ? sales()!.total_sales / periodMonths()
      : null,
  );

  const avgDailySalesQty = createMemo(() =>
    sales()?.quantity_sold != null
      ? sales()!.quantity_sold / intervalDays(interval())
      : null,
  );

  const salesChartData = createMemo(
    () =>
      sales()?.monthly_sales.map((d) => ({
        month: d.month,
        value: d.quantity,
      })) ?? [],
  );

  // ── Stock resource ────────────────────────────────────────────────────────
  const [stock] = createResource(
    () => selectedProduct()?.procod ?? null,
    (procod) => taurpc.stock.get_by_product(procod),
  );

  // ── Entries resource ──────────────────────────────────────────────────────
  const [entries] = createResource(
    () => {
      const procod = selectedProduct()?.procod ?? null;
      if (!procod) return null;
      return { procod, interval: interval() };
    },
    ({ procod, interval }) =>
      taurpc.entries.get_summary_by_product(procod, interval),
  );

  const avgMonthlyPurchaseValue = createMemo(() =>
    entries()?.total_value != null
      ? entries()!.total_value / periodMonths()
      : null,
  );

  const entriesChartData = createMemo(
    () =>
      entries()?.monthly_entries.map((d) => ({
        month: d.month,
        value: d.quantity,
      })) ?? [],
  );

  // Dias de estoque restante baseado no giro diário.
  const daysOfStock = createMemo(() => {
    const qty = stock()?.quantity;
    const daily = avgDailySalesQty();
    if (qty == null || daily == null || daily === 0) return null;
    return Math.floor(qty / daily);
  });

  // Sugestão de compra: quantidade para cobrir 30 dias, descontando estoque atual.
  const purchaseSuggestion = createMemo(() => {
    const daily = avgDailySalesQty();
    const qty = stock()?.quantity;
    if (daily == null || qty == null) return null;
    return Math.max(0, Math.ceil(daily * 30 - qty));
  });

  // ── Similar resource ──────────────────────────────────────────────────────
  const [similarProcod, setSimilarProcod] = createSignal<string | null>(null);

  const [similar] = createResource(
    () => {
      const procod = similarProcod();
      if (!procod) return null;
      return { procod, outOfLine: proforlinFilter() === "S" };
    },
    ({ procod, outOfLine }) =>
      taurpc.similar.get_by_product(procod, true, outOfLine),
  );

  // ── Similar sort ─────────────────────────────────────────────────────────
  type SortField = "code" | "name" | "stock";
  type SortDir = "asc" | "desc";

  const [sortField, setSortField] = createSignal<SortField>("code");
  const [sortDir, setSortDir] = createSignal<SortDir>("asc");

  // Carrega preferências salvas na inicialização.
  const [prefsLoaded, setPrefsLoaded] = createSignal(false);

  onMount(async () => {
    const prefs = await taurpc.load_preferences();
    if (prefs) {
      batch(() => {
        setSortField(prefs.sort_field as SortField);
        setSortDir(prefs.sort_dir as SortDir);
      });
    }
    setPrefsLoaded(true);
  });

  // Persiste automaticamente quando o usuário muda o sort (aguarda o carregamento inicial).
  createEffect(() => {
    if (!prefsLoaded()) return;
    taurpc.save_preferences({ sort_field: sortField(), sort_dir: sortDir() });
  });

  const sortedProducts = createMemo<SimilarProduct[]>(() => {
    const group = similar();
    if (!group) return [];
    return [...group.products].sort((a, b) => {
      let cmp = 0;
      if (sortField() === "code") {
        cmp = a.procod.trim().localeCompare(b.procod.trim(), "pt-BR");
      } else if (sortField() === "name") {
        cmp = (a.prodes ?? "")
          .trim()
          .localeCompare((b.prodes ?? "").trim(), "pt-BR");
      } else {
        cmp = (a.stock?.quantity ?? 0) - (b.stock?.quantity ?? 0);
      }
      return sortDir() === "asc" ? cmp : -cmp;
    });
  });

  // Só dispara novo fetch quando o produto selecionado NÃO pertence ao grupo atual.
  // Clicar num similar não atualiza similarProcod pois ele já está na lista.
  createEffect(() => {
    const product = selectedProduct();
    if (!product) {
      setSimilarProcod(null);
      return;
    }
    const currentGroup = similar();
    const isInCurrentGroup = currentGroup?.products.some(
      (s) => s.procod === product.procod,
    );
    if (!isInCurrentGroup) {
      setSimilarProcod(product.procod);
    }
  });

  return (
    <div class="flex gap-4 p-4">
      {/* ── Similares panel ───────────────────────────────────────────────── */}
      <Card class="flex w-56 shrink-0 flex-col overflow-hidden max-h-[calc(100vh-9rem)]">
        <p class="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:border-white/10 dark:text-gray-500">
          Similares
        </p>

        <Show when={!selectedProduct()}>
          <p class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
            Selecione um produto para ver similares.
          </p>
        </Show>

        <Show when={selectedProduct() && similar.loading}>
          <p class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
            Carregando…
          </p>
        </Show>

        <Show
          when={selectedProduct() && !similar.loading && similar() === null}
        >
          <p class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
            Produto não possui similares associados.
          </p>
        </Show>

        <Show when={similar()}>
          {/* Sort toolbar */}
          <div class="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5 dark:border-white/10">
            <div class="flex flex-1 gap-0.5 rounded-md bg-gray-100 p-0.5 dark:bg-white/5">
              {(["code", "name", "stock"] as const).map((field) => (
                <button
                  class={`flex-1 rounded px-1 py-0.5 text-[10px] font-medium transition-colors ${
                    sortField() === field
                      ? "bg-white text-primary-600 shadow-sm dark:bg-surface-dark dark:text-primary-400"
                      : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setSortField(field)}
                >
                  {field === "code" ? "Cód" : field === "name" ? "Nome" : "Est"}
                </button>
              ))}
            </div>
            <button
              class="rounded p-1 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title={sortDir() === "asc" ? "Crescente" : "Decrescente"}
            >
              <Show when={sortDir() === "asc"} fallback={<IconSortDesc />}>
                <IconSortAsc />
              </Show>
            </button>
          </div>

          {/* Product list */}
          <ul class="flex flex-col overflow-y-auto">
            <For each={sortedProducts()}>
              {(item) => (
                <li
                  class="group flex cursor-pointer flex-col gap-0.5 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                  onClick={() =>
                    setSelectedProduct({
                      procod: item.procod,
                      prodes: item.prodes,
                      proprccst: item.proprccst,
                      proprcvdavar: item.proprcvdavar,
                    })
                  }
                >
                  <span class="text-xs font-bold tracking-wider text-primary-500 dark:text-primary-400">
                    {item.procod.trim()}
                  </span>
                  <span class="text-xs text-gray-700 dark:text-gray-300">
                    {item.prodes?.trim() ?? "—"}
                  </span>
                  <span
                    class={`mt-1 text-xs font-medium ${
                      (item.stock?.quantity ?? 0) > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    Estoque:{" "}
                    {item.stock != null
                      ? `${fmtNumber(item.stock.quantity, 0)} un`
                      : "—"}
                  </span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Card>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        {/* Product title — driven by search selection */}
        <Card class="flex items-center gap-3 px-5 py-4">
          <Show
            when={selectedProduct()}
            fallback={
              <span class="text-sm text-gray-400 dark:text-gray-500">
                Pesquise e selecione um produto na barra acima
              </span>
            }
          >
            {(product) => (
              <>
                <span class="rounded-lg bg-primary-100 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  {product().procod.trim()}
                </span>
                <span class="text-base font-semibold text-gray-800 dark:text-gray-100">
                  {product().prodes?.trim() ?? "—"}
                </span>
                <span class="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  Custo{" "}
                  <span class="font-medium text-gray-600 dark:text-gray-300">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product().proprccst)}
                  </span>
                  {" · "}
                  Venda{" "}
                  <span class="font-medium text-gray-600 dark:text-gray-300">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product().proprcvdavar)}
                  </span>
                </span>
              </>
            )}
          </Show>
        </Card>

        {/* Stat cards — vendas + estoque */}
        <div class="grid grid-cols-4 gap-4">
          <StatCard
            label={`Venda Média (${INTERVAL_LABELS[interval()]})`}
            value={
              avgMonthlyRevenue() != null
                ? fmtCurrency(avgMonthlyRevenue()!)
                : "—"
            }
            sublabel="receita média mensal"
            icon={<IconSales />}
            accent="blue"
          />
          <StatCard
            label="Venda Média Diária"
            value={
              avgDailySalesQty() != null
                ? `${fmtNumber(avgDailySalesQty()!)} un/dia`
                : "—"
            }
            sublabel={`últimos ${INTERVAL_LABELS[interval()]}`}
            icon={<IconCalendar />}
            accent="purple"
          />
          <StatCard
            label="Saldo de Estoque"
            value={
              stock()?.quantity != null
                ? `${fmtNumber(stock()!.quantity, 0)} un`
                : "—"
            }
            sublabel="unidades disponíveis"
            icon={<IconBox />}
            accent="green"
          />
          <StatCard
            label="Dias de Estoque"
            value={daysOfStock() != null ? `${daysOfStock()} dias` : "—"}
            sublabel="cobertura com giro atual"
            icon={<IconCalendar />}
            accent="green"
          />
        </div>

        {/* Stat cards — compras + sugestão */}
        <div class="grid grid-cols-4 gap-4">
          <StatCard
            label={`Total Comprado (${INTERVAL_LABELS[interval()]})`}
            value={
              entries()?.total_value != null
                ? fmtCurrency(entries()!.total_value)
                : "—"
            }
            sublabel="valor total de entradas"
            icon={<IconCart />}
            accent="amber"
          />
          <StatCard
            label={`Qtd Comprada (${INTERVAL_LABELS[interval()]})`}
            value={
              entries()?.quantity_purchased != null
                ? `${fmtNumber(entries()!.quantity_purchased, 0)} un`
                : "—"
            }
            sublabel="unidades recebidas"
            icon={<IconBox />}
            accent="purple"
          />
          <StatCard
            label="Compra Média Mensal"
            value={
              avgMonthlyPurchaseValue() != null
                ? fmtCurrency(avgMonthlyPurchaseValue()!)
                : "—"
            }
            sublabel="gasto médio em compras"
            icon={<IconSales />}
            accent="blue"
          />
          <StatCard
            label="Sugestão de Compra"
            value={
              purchaseSuggestion() != null
                ? `${fmtNumber(purchaseSuggestion()!, 0)} un`
                : "—"
            }
            sublabel="cobertura de 30 dias"
            icon={<IconCart />}
            accent="amber"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          {/* Entries history — 50% width */}
          <Show
            when={entriesChartData().length > 0}
            fallback={<NoData label={`Compras por Mês — últimos ${INTERVAL_LABELS[interval()]}`} />}
          >
            <EntriesHistoryChart data={entriesChartData()} label={`Compras por Mês — últimos ${INTERVAL_LABELS[interval()]}`} />
          </Show>

          {/* Sales history — 50% width */}
          <Show
            when={salesChartData().length > 0}
            fallback={<NoData label={`Vendas por Mês — últimos ${INTERVAL_LABELS[interval()]}`} />}
          >
            <SalesHistoryChart data={salesChartData()} label={`Vendas por Mês — últimos ${INTERVAL_LABELS[interval()]}`} />
          </Show>
        </div>
      </div>
    </div>
  );
}
