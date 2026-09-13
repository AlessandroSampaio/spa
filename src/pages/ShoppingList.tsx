import { createForm, reset, SubmitHandler, zodForm } from "@modular-forms/solid";
import { save } from "@tauri-apps/plugin-dialog";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Show,
  onMount,
} from "solid-js";
import type { ShoppingListItemDetail } from "../bindings";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { IntervalSelect } from "../components/ui/IntervalSelect";
import { ProductSearch } from "../components/ui/ProductSearch";
import {
  ShoppingListForm,
  shoppingListSchema,
} from "../schemas/shoppingList";
import type { Interval } from "../stores/interval";
import { taurpc } from "../stores/taurpc";

// ── Icons ────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconDownload = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconEdit = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtNumber = (v: number, decimals = 1) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: decimals }).format(v);

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Fornecedor com o menor preço de compra conhecido para o item (ignora
// ofertas sem preço registrado em ITEM_ENTRADA).
const getCheapestOffer = (item: ShoppingListItemDetail) =>
  item.supplier_offers
    .filter((o) => o.last_unit_cost != null)
    .reduce<ShoppingListItemDetail["supplier_offers"][number] | undefined>(
      (best, o) =>
        !best || o.last_unit_cost! < best.last_unit_cost! ? o : best,
      undefined,
    );

// Nomes de fornecedores distintos entre os itens, em ordem alfabética —
// estável independente da ordem/composição dos itens na lista, usada para
// gerar as colunas dinâmicas de comparação no export em Excel.
const getDistinctSupplierNames = (items: ShoppingListItemDetail[]) => {
  const names = new Set<string>();
  for (const item of items) {
    for (const offer of item.supplier_offers) {
      const name = offer.supplier_name?.trim();
      if (name) names.add(name);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, "pt-BR"));
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ShoppingList() {
  const [selectedListId, setSelectedListId] = createSignal<number | null>(
    null,
  );
  const [listInterval, setListInterval] = createSignal<Interval>("SixMonths");

  // ── Global purchase parameter (dias de cobertura de estoque) ────────────────
  const [targetStockDays, setTargetStockDays] = createSignal(30);
  const [paramsLoaded, setParamsLoaded] = createSignal(false);

  onMount(async () => {
    const params = await taurpc.shopping_lists.get_purchase_parameters();
    if (params) setTargetStockDays(params.target_stock_days);
    setParamsLoaded(true);
  });

  createEffect(() => {
    if (!paramsLoaded()) return;
    taurpc.shopping_lists.save_purchase_parameters({
      target_stock_days: targetStockDays(),
    });
  });

  // ── Lists ─────────────────────────────────────────────────────────────────
  const [lists, { refetch: refetchLists }] = createResource(() =>
    taurpc.shopping_lists.get_lists(),
  );

  // ── Create list ───────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = createSignal(false);
  const [createForm_, { Form: CreateForm, Field: CreateField }] =
    createForm<ShoppingListForm>({
      validate: zodForm(shoppingListSchema),
      initialValues: { name: "" },
    });

  const handleCreate: SubmitHandler<ShoppingListForm> = async (values) => {
    const created = await taurpc.shopping_lists.create_list(values.name);
    reset(createForm_);
    setCreateOpen(false);
    await refetchLists();
    setSelectedListId(created.id);
  };

  // ── Rename list (inline) ─────────────────────────────────────────────────
  const [renamingId, setRenamingId] = createSignal<number | null>(null);
  const [renameValue, setRenameValue] = createSignal("");

  const startRename = (id: number, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const commitRename = async () => {
    const id = renamingId();
    if (id == null) return;
    const value = renameValue().trim();
    setRenamingId(null);
    if (!value) return;
    await taurpc.shopping_lists.rename_list(id, value);
    await refetchLists();
  };

  // ── Delete list ───────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta lista e todos os seus itens?")) return;
    await taurpc.shopping_lists.delete_list(id);
    if (selectedListId() === id) setSelectedListId(null);
    await refetchLists();
  };

  // ── List items ────────────────────────────────────────────────────────────
  const [listItems, { refetch: refetchItems }] = createResource(
    () => {
      const id = selectedListId();
      if (id == null) return null;
      return { id, iv: listInterval() };
    },
    ({ id, iv }) =>
      taurpc.shopping_lists.get_list_items(id, iv, targetStockDays()),
  );

  // Sugestão de compra recalculada no cliente para refletir mudanças no
  // parâmetro de dias de cobertura sem precisar refazer a consulta ao Firebird.
  const suggestionFor = (item: ShoppingListItemDetail) => {
    const daily = item.avg_daily_sales ?? 0;
    const stock = item.stock_balance ?? 0;
    return Math.max(0, Math.ceil(daily * targetStockDays() - stock));
  };

  const handleAddProduct = async (product: { procod: string }) => {
    const id = selectedListId();
    if (id == null) return;
    await taurpc.shopping_lists.add_item(id, product.procod);
    await refetchItems();
    await refetchLists();
  };

  const handleRemoveItem = async (itemId: number) => {
    await taurpc.shopping_lists.remove_item(itemId);
    await refetchItems();
    await refetchLists();
  };

  const selectedList = createMemo(() =>
    lists()?.find((l) => l.id === selectedListId()),
  );

  // ── Export ────────────────────────────────────────────────────────────────
  const [exportError, setExportError] = createSignal("");

  const EXPORT_HEADERS = [
    "Código",
    "Descrição",
    "Preço de Custo",
    "Preço de Venda",
    "Saldo",
    "Última Compra",
    "Venda Média Diária",
    "Sugestão de Compra",
  ];

  // Colunas adicionadas apenas para a exportação em Excel, no final da
  // planilha, para preenchimento manual pelo usuário.
  const TRAILING_XLSX_HEADERS = ["COMPARATIVO", "COMPARATIV"];

  const fmtGeneratedAt = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `Relatorio gerado em ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} as ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const handleExportPdf = async () => {
    const list = selectedList();
    const items = listItems() ?? [];
    if (!list || items.length === 0) return;

    setExportError("");
    try {
      const path = await save({
        defaultPath: `${list.name}.pdf`,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!path) return;

      // Loaded on demand — jsPDF/autoTable are only needed when exporting.
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text(list.name, 14, 15);

      autoTable(doc, {
        startY: 20,
        head: [EXPORT_HEADERS],
        body: items.map((item) => [
          item.product_code.trim(),
          item.description?.trim() ?? "—",
          item.cost_price != null ? fmtCurrency(item.cost_price) : "—",
          item.sale_price != null ? fmtCurrency(item.sale_price) : "—",
          item.stock_balance != null
            ? `${fmtNumber(item.stock_balance, 0)} un`
            : "—",
          fmtDate(item.last_purchase_date),
          item.avg_daily_sales != null
            ? `${fmtNumber(item.avg_daily_sales)} un/dia`
            : "—",
          `${fmtNumber(suggestionFor(item), 0)} un`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      const bytes = new Uint8Array(doc.output("arraybuffer"));
      await taurpc.shopping_lists.export_file(path, Array.from(bytes));
    } catch (err) {
      setExportError(String(err));
    }
  };

  const handleExportXlsx = async () => {
    const list = selectedList();
    const items = listItems() ?? [];
    if (!list || items.length === 0) return;

    setExportError("");
    try {
      const path = await save({
        defaultPath: `${list.name}.xlsx`,
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
      });
      if (!path) return;

      // Loaded on demand — exceljs is only needed when exporting.
      const ExcelJS = (await import("exceljs")).default;

      // Colunas de comparação por fornecedor, geradas dinamicamente a partir
      // dos fornecedores reais associados aos itens da lista (via
      // PRODUTO_FORNECEDOR) — substitui a antiga lista fixa de nomes.
      const supplierNames = getDistinctSupplierNames(items);
      const supplierHeaders = supplierNames.flatMap((name) => [
        `${name} - Preço`,
        `${name} - Data`,
      ]);
      const allHeaders = [
        ...EXPORT_HEADERS,
        ...supplierHeaders,
        ...TRAILING_XLSX_HEADERS,
      ];

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Lista de compra");

      sheet.columns = [
        { width: 16 }, // Código
        { width: 42 }, // Descrição
        { width: 14 }, // Preço de Custo
        { width: 14 }, // Preço de Venda
        { width: 10 }, // Saldo
        { width: 14 }, // Última Compra
        { width: 18 }, // Venda Média Diária
        { width: 16 }, // Sugestão de Compra
        ...supplierNames.flatMap(() => [{ width: 14 }, { width: 12 }]),
        ...TRAILING_XLSX_HEADERS.map(() => ({ width: 14 })),
      ];

      // Linha 1 — banner com data/hora de geração, mesclado em todas as colunas.
      const bannerRow = sheet.addRow([fmtGeneratedAt()]);
      sheet.mergeCells(1, 1, 1, allHeaders.length);
      bannerRow.height = 20;
      bannerRow.getCell(1).font = { italic: true, bold: true, size: 11 };
      bannerRow.getCell(1).alignment = { vertical: "middle" };

      // Linha 2 — cabeçalho em destaque.
      const headerRow = sheet.addRow(allHeaders);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF3B82F6" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      for (const item of items) {
        const offersByName = new Map(
          item.supplier_offers.map((o) => [o.supplier_name?.trim() ?? "", o]),
        );
        const supplierCells = supplierNames.flatMap((name) => {
          const offer = offersByName.get(name);
          return [offer?.last_unit_cost ?? "", offer?.last_purchase_date ?? ""];
        });

        sheet.addRow([
          item.product_code.trim(),
          item.description?.trim() ?? "",
          item.cost_price ?? "",
          item.sale_price ?? "",
          item.stock_balance ?? "",
          item.last_purchase_date ?? "",
          item.avg_daily_sales ?? "",
          suggestionFor(item),
          ...supplierCells,
          ...TRAILING_XLSX_HEADERS.map(() => ""),
        ]);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      await taurpc.shopping_lists.export_file(
        path,
        Array.from(new Uint8Array(buffer)),
      );
    } catch (err) {
      setExportError(String(err));
    }
  };

  return (
    <div class="flex gap-4 p-4">
      {/* ── Lists panel ───────────────────────────────────────────────────── */}
      <Card class="flex w-64 shrink-0 flex-col overflow-hidden max-h-[calc(100vh-2rem)]">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/10">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Listas de compra
          </p>
          <Dialog
            open={createOpen()}
            onOpenChange={setCreateOpen}
            title="Nova lista de compra"
            trigger={
              <button
                class="flex items-center gap-1 rounded-md bg-primary-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-600"
                aria-label="Nova lista"
              >
                <IconPlus />
              </button>
            }
          >
            <CreateForm onSubmit={handleCreate} class="flex flex-col gap-4">
              <CreateField name="name">
                {(field, props) => (
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Nome da lista
                    </label>
                    <Input
                      {...props}
                      type="text"
                      placeholder="Ex: Reposição semanal"
                      value={field.value ?? ""}
                      variant={field.error ? "error" : "default"}
                    />
                    {field.error && (
                      <span class="text-xs text-red-500 dark:text-red-400">
                        {field.error}
                      </span>
                    )}
                  </div>
                )}
              </CreateField>
              <button
                type="submit"
                disabled={createForm_.submitting}
                class="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Criar lista
              </button>
            </CreateForm>
          </Dialog>
        </div>

        <Show when={lists() && lists()!.length === 0}>
          <p class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
            Nenhuma lista criada ainda.
          </p>
        </Show>

        <ul class="flex flex-col overflow-y-auto">
          <For each={lists() ?? []}>
            {(list) => (
              <li
                class="group flex cursor-pointer flex-col gap-0.5 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                classList={{
                  "bg-primary-50 dark:bg-primary-900/20":
                    list.id === selectedListId(),
                }}
                onClick={() => setSelectedListId(list.id)}
              >
                <Show
                  when={renamingId() === list.id}
                  fallback={
                    <div class="flex items-center justify-between gap-2">
                      <span class="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                        {list.name}
                      </span>
                      <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          class="rounded p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          title="Renomear"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(list.id, list.name);
                          }}
                        >
                          <IconEdit />
                        </button>
                        <button
                          class="rounded p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                          title="Excluir"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(list.id);
                          }}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  }
                >
                  <Input
                    autofocus
                    value={renameValue()}
                    onInput={(e) =>
                      setRenameValue((e.currentTarget as HTMLInputElement).value)
                    }
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={commitRename}
                    class="!py-1 text-sm"
                  />
                </Show>
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  {list.item_count} item{list.item_count !== 1 ? "s" : ""}
                </span>
              </li>
            )}
          </For>
        </ul>
      </Card>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <Show
          when={selectedList()}
          fallback={
            <Card class="flex items-center px-5 py-4">
              <span class="text-sm text-gray-400 dark:text-gray-500">
                Selecione ou crie uma lista de compra
              </span>
            </Card>
          }
        >
          {(list) => (
            <>
              {/* Toolbar */}
              <Card class="flex flex-wrap items-center gap-3 px-5 py-4">
                <span class="text-base font-semibold text-gray-800 dark:text-gray-100">
                  {list().name}
                </span>

                <div class="ml-auto flex items-center gap-2">
                  <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Dias de cobertura
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={targetStockDays()}
                    onInput={(e) => {
                      const v = parseInt(
                        (e.currentTarget as HTMLInputElement).value,
                        10,
                      );
                      if (!isNaN(v) && v > 0) setTargetStockDays(v);
                    }}
                    class="w-20"
                  />
                  <IntervalSelect
                    value={listInterval()}
                    onChange={setListInterval}
                  />
                </div>

                <div class="w-72 shrink-0">
                  <ProductSearch
                    placeholder="Adicionar produto à lista..."
                    onSelect={handleAddProduct}
                  />
                </div>

                <div class="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={handleExportPdf}
                    disabled={!listItems() || listItems()!.length === 0}
                    class="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <IconDownload />
                    PDF
                  </button>
                  <button
                    onClick={handleExportXlsx}
                    disabled={!listItems() || listItems()!.length === 0}
                    class="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <IconDownload />
                    XLSX
                  </button>
                </div>
              </Card>

              <Show when={exportError()}>
                <p class="-mt-2 px-1 text-xs text-red-500 dark:text-red-400">
                  Falha ao exportar: {exportError()}
                </p>
              </Show>

              {/* Items table */}
              <Card class="flex-1 overflow-hidden">
                <Show
                  when={listItems() && listItems()!.length > 0}
                  fallback={
                    <p class="px-5 py-4 text-xs text-gray-400 dark:text-gray-500">
                      {listItems.loading
                        ? "Carregando…"
                        : "Esta lista ainda não possui itens."}
                    </p>
                  }
                >
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                      <thead>
                        <tr class="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-white/10 dark:text-gray-500">
                          <th class="px-5 py-3">Código</th>
                          <th class="px-5 py-3">Descrição</th>
                          <th class="px-5 py-3 text-right">Preço de Custo</th>
                          <th class="px-5 py-3 text-right">Preço de Venda</th>
                          <th class="px-5 py-3 text-right">Saldo</th>
                          <th class="px-5 py-3 text-right">Última Compra</th>
                          <th class="px-5 py-3 text-right">Venda Média Diária</th>
                          <th class="px-5 py-3 text-right">Sugestão de Compra</th>
                          <th class="px-5 py-3">Melhor Fornecedor</th>
                          <th class="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        <For each={listItems() ?? []}>
                          {(item) => (
                            <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5">
                              <td class="px-5 py-3 font-mono text-xs font-bold tracking-wider text-primary-500 dark:text-primary-400">
                                {item.product_code.trim()}
                              </td>
                              <td class="px-5 py-3 text-gray-700 dark:text-gray-300">
                                {item.description?.trim() ?? "—"}
                              </td>
                              <td class="px-5 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                                {item.cost_price != null
                                  ? fmtCurrency(item.cost_price)
                                  : "—"}
                              </td>
                              <td class="px-5 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                                {item.sale_price != null
                                  ? fmtCurrency(item.sale_price)
                                  : "—"}
                              </td>
                              <td class="px-5 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                                {item.stock_balance != null
                                  ? `${fmtNumber(item.stock_balance, 0)} un`
                                  : "—"}
                              </td>
                              <td class="px-5 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                                {fmtDate(item.last_purchase_date)}
                              </td>
                              <td class="px-5 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                                {item.avg_daily_sales != null
                                  ? `${fmtNumber(item.avg_daily_sales)} un/dia`
                                  : "—"}
                              </td>
                              <td class="px-5 py-3 text-right tabular-nums font-medium text-amber-600 dark:text-amber-400">
                                {fmtNumber(suggestionFor(item), 0)} un
                              </td>
                              <td class="px-5 py-3 text-gray-700 dark:text-gray-300">
                                {(() => {
                                  const offer = getCheapestOffer(item);
                                  return offer
                                    ? `${offer.supplier_name?.trim() ?? offer.supplier_code} — ${fmtCurrency(offer.last_unit_cost!)}`
                                    : "—";
                                })()}
                              </td>
                              <td class="px-5 py-3 text-right">
                                <button
                                  class="rounded p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                                  title="Remover da lista"
                                  onClick={() => handleRemoveItem(item.item_id)}
                                >
                                  <IconTrash />
                                </button>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>
              </Card>
            </>
          )}
        </Show>
      </div>
    </div>
  );
}
