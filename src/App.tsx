import "./stores/theme";
import { createSignal, onMount, Show } from "solid-js";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { check } from "@tauri-apps/plugin-updater";
import { ProductSearch } from "./components/ui/ProductSearch";
import { LineFilterSelect } from "./components/ui/LineFilterSelect";
import { SettingsDialog } from "./components/forms/SettingsDialog";
import { Dashboard } from "./pages/Dashboard";
import { taurpc } from "./stores/taurpc";

type UpdateState = "idle" | "downloading" | "ready";

function App() {
  const [updateVersion, setUpdateVersion] = createSignal<string | null>(null);
  const [updateState, setUpdateState] = createSignal<UpdateState>("idle");

  onMount(async () => {
    // Update window title with app version.
    const version = await getVersion();
    await getCurrentWindow().setTitle(`SPA - Analise de Produtos v${version}`);

    // Auto-connect on startup using the last persisted configuration.
    // Failures are silently ignored — the user can manually connect via Settings.
    try {
      const saved = await (taurpc as any).load_connection_config();
      if (saved) {
        await taurpc.connect_db(saved);
      }
    } catch {
      // No saved config or DB unreachable — app works in disconnected mode.
    }

    // Check for updates silently in the background.
    try {
      const update = await check();
      if (update?.available) {
        setUpdateVersion(update.version);
      }
    } catch {
      // Update check failed — silently ignored (no internet, server down, etc).
    }
  });

  const handleInstallUpdate = async () => {
    const update = await check();
    if (!update?.available) return;
    setUpdateState("downloading");
    await update.downloadAndInstall();
    setUpdateState("ready");
  };

  return (
    <div class="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Show when={updateVersion()}>
        {(version) => (
          <div class="flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
            <span class="text-xs text-amber-700 dark:text-amber-400">
              Nova versão disponível: <strong>v{version()}</strong>
            </span>
            <Show
              when={updateState() !== "ready"}
              fallback={
                <span class="text-xs font-medium text-green-600 dark:text-green-400">
                  Atualização instalada. Reinicie o aplicativo para aplicar.
                </span>
              }
            >
              <button
                onClick={handleInstallUpdate}
                disabled={updateState() === "downloading"}
                class="rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                {updateState() === "downloading" ? "Baixando…" : "Instalar agora"}
              </button>
            </Show>
          </div>
        )}
      </Show>

      <main class="flex-1 overflow-y-auto">
        <div class="flex items-center gap-2 p-4 pb-2">
          <ProductSearch />
          <LineFilterSelect />
          <SettingsDialog />
        </div>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
