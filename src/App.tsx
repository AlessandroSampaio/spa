import "./stores/theme";
import { onMount } from "solid-js";
import { ProductSearch } from "./components/ui/ProductSearch";
import { LineFilterSelect } from "./components/ui/LineFilterSelect";
import { SettingsDialog } from "./components/forms/SettingsDialog";
import { Dashboard } from "./pages/Dashboard";
import { taurpc } from "./stores/taurpc";

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
