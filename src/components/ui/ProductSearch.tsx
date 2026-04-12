import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { Product } from "../../bindings";
import { setSelectedProduct } from "../../stores/selectedProduct";
import { taurpc } from "../../stores/taurpc";

// ── Icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    class="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ── Formatter ─────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v
  );

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductSearch() {
  let containerRef!: HTMLDivElement;
  let listRef!: HTMLUListElement;

  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<Product[]>([]);
  const [isOpen, setIsOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal(-1);

  let debounceId: ReturnType<typeof setTimeout>;

  // ── Search ─────────────────────────────────────────────────────────────────

  const doSearch = async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await taurpc.products.get_all({
        search: text,
        limit: 10,
        offset: 0,
      });
      setResults(data);
      setIsOpen(data.length > 0);
      setActiveIndex(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Selection ──────────────────────────────────────────────────────────────

  const selectItem = (item: Product) => {
    setSelectedProduct(item);
    setQuery((item.prodes ?? item.procod).trim());
    setIsOpen(false);
    setResults([]);
    setActiveIndex(-1);
  };

  // ── Scroll helper ──────────────────────────────────────────────────────────

  const scrollToIndex = (idx: number) => {
    if (idx < 0) return;
    (listRef?.children[idx] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
    });
  };

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleInput = (e: InputEvent) => {
    const text = (e.currentTarget as HTMLInputElement).value;
    setQuery(text);
    clearTimeout(debounceId);
    debounceId = setTimeout(() => doSearch(text), 300);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const len = results().length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen() && len > 0) {
        setIsOpen(true);
        return;
      }
      const next = Math.min(activeIndex() + 1, len - 1);
      setActiveIndex(next);
      scrollToIndex(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(activeIndex() - 1, -1);
      setActiveIndex(prev);
      scrollToIndex(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!isOpen() || len === 0) return;
      const idx = activeIndex() === -1 ? 0 : activeIndex();
      const item = results()[idx];
      if (item) selectItem(item);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (results().length > 0) setIsOpen(true);
  };

  // ── Click outside ──────────────────────────────────────────────────────────

  const handleClickOutside = (e: MouseEvent) => {
    if (!containerRef?.contains(e.target as Node)) setIsOpen(false);
  };

  onMount(() => document.addEventListener("mousedown", handleClickOutside));
  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    clearTimeout(debounceId);
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} class="relative w-full">
      {/* Input */}
      <div class="relative">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <SearchIcon />
        </span>

        <input
          type="search"
          value={query()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Pesquisar produto..."
          autocomplete="off"
          class="
            w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-8
            text-sm outline-none placeholder-gray-400 transition-colors
            hover:border-gray-300
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
            dark:border-white/10 dark:bg-surface-dark dark:text-gray-100
            dark:placeholder-gray-600 dark:hover:border-white/20
            dark:focus:border-primary-400 dark:focus:ring-primary-400/20
          "
        />

        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <Show when={loading()}>
            <SpinnerIcon />
          </Show>
        </span>
      </div>

      {/* Dropdown */}
      <Show when={isOpen() && results().length > 0}>
        <div
          class="
            absolute left-0 right-0 top-full z-50 mt-1
            overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg
            dark:border-white/10 dark:bg-surface-dark
          "
        >
          <ul ref={listRef} class="max-h-64 overflow-y-auto py-1">
            <For each={results()}>
              {(item, i) => (
                <li
                  onMouseDown={(e) => {
                    // preventDefault keeps input focused until selectItem runs
                    e.preventDefault();
                    selectItem(item);
                  }}
                  class="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                  classList={{
                    "bg-primary-50 dark:bg-primary-900/20":
                      i() === activeIndex(),
                    "hover:bg-gray-50 dark:hover:bg-white/5":
                      i() !== activeIndex(),
                  }}
                >
                  {/* Code badge */}
                  <span class="shrink-0 rounded bg-primary-100 px-1.5 py-0.5 font-mono text-xs font-bold tracking-wider text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    {item.procod.trim()}
                  </span>

                  {/* Name */}
                  <span class="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
                    {item.prodes?.trim() ?? "—"}
                  </span>

                  {/* Sale price */}
                  <span class="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
                    {fmtCurrency(item.proprcvdavar)}
                  </span>
                </li>
              )}
            </For>
          </ul>

          <div class="border-t border-gray-100 px-3 py-1.5 dark:border-white/10">
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {results().length} resultado
              {results().length !== 1 ? "s" : ""}
              {" — "}↑↓ navegar · Enter selecionar · Esc fechar
            </span>
          </div>
        </div>
      </Show>
    </div>
  );
}
