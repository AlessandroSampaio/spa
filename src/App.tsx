import "./stores/theme"; // initializes theme effect on load
import { SettingsDialog } from "./components/forms/SettingsDialog";

function App() {
  return (
    <div class="w-full h-screen bg-background-light dark:bg-background-dark">
      <SettingsDialog />
    </div>
  );
}

export default App;
