import "./stores/theme";
import { Header } from "./components/ui/Header";
import { Input } from "./components/ui/Input";
import { SettingsDialog } from "./components/forms/SettingsDialog";

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

function App() {
  return (
    <div class="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header title="SPA - Analise de Produtos" actions={<SettingsDialog />} />
      <main class="flex-1 p-4">
        <Input
          type="search"
          placeholder="Pesquisar..."
          icon={<SearchIcon />}
          class="w-full"
        />
      </main>
    </div>
  );
}

export default App;
