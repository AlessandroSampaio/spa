import "./stores/theme";
import { onMount } from "solid-js";
import { Select } from "@kobalte/core";
import { Header } from "./components/ui/Header";
import { ProductSearch } from "./components/ui/ProductSearch";
import { SettingsDialog } from "./components/forms/SettingsDialog";
import { Dashboard } from "./pages/Dashboard";
import { taurpc } from "./stores/taurpc";
import {
  proforlinFilter,
  setProforlinFilter,
  type ProforlinFilter,
} from "./stores/proforlinFilter";

// ── Fora-de-linha filter ──────────────────────────────────────────────────────

type FilterOption = { value: ProforlinFilter; label: string };

const FILTER_OPTIONS: FilterOption[] = [
  { value: "N", label: "Em linha" },
  { value: "S", label: "Fora de Linha" },
  { value: "ambos", label: "Ambos" },
];

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function LineFilterSelect() {
  const selected = () =>
    FILTER_OPTIONS.find((o) => o.value === proforlinFilter())!;

  return (
    <Select.Root<FilterOption>
      options={FILTER_OPTIONS}
      optionValue="value"
      optionTextValue="label"
      value={selected()}
      onChange={(opt) => opt && setProforlinFilter(opt.value)}
      itemComponent={(props) => (
        <Select.Item
          item={props.item}
          class="
            flex cursor-pointer items-center px-3 py-2 text-sm
            text-gray-700 outline-none transition-colors
            hover:bg-gray-50
            data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700
            dark:text-gray-300 dark:hover:bg-white/5
            dark:data-[highlighted]:bg-primary-900/20 dark:data-[highlighted]:text-primary-300
          "
        >
          <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
        </Select.Item>
      )}
    >
      <Select.Trigger
        class="
          flex h-[38px] w-[200px] shrink-0 items-center gap-1.5 rounded-md
          border border-gray-200 bg-white px-3 text-sm
          text-gray-700 outline-none transition-colors
          hover:border-gray-300
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
          dark:border-white/10 dark:bg-surface-dark dark:text-gray-300
          dark:hover:border-white/20
          dark:focus:border-primary-400 dark:focus:ring-primary-400/20
        "
      >
        <Select.Value<FilterOption> class="flex-1 text-left">
          {(state) => state.selectedOption().label}
        </Select.Value>
        <Select.Icon class="ml-auto text-gray-400 dark:text-gray-500">
          <ChevronIcon />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          class="
            z-50 min-w-[160px] overflow-hidden rounded-md
            border border-gray-200 bg-white shadow-lg
            dark:border-white/10 dark:bg-surface-dark
          "
        >
          <Select.Listbox class="py-1" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}


function App() {
  // Auto-connect on startup using the last persisted configuration.
  // Failures are silently ignored — the user can manually connect via Settings.
  onMount(async () => {
    try {
      const saved = await (taurpc as any).load_connection_config();
      if (saved) {
        await taurpc.connect_db(saved);
      }
    } catch {
      // No saved config or DB unreachable — app works in disconnected mode.
    }
  });

  return (
    <div class="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header title="SPA - Analise de Produtos" actions={<SettingsDialog />} />
      <main class="flex-1 overflow-y-auto">
        <div class="flex items-center gap-2 p-4 pb-2">
          <ProductSearch />
          <LineFilterSelect />
        </div>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
