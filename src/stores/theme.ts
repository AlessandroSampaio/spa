import { createRoot, createSignal, createEffect } from "solid-js";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const [theme, setTheme] = createRoot(() => {
  const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

  createEffect(() => {
    document.documentElement.classList.toggle("dark", theme() === "dark");
    localStorage.setItem(STORAGE_KEY, theme());
  });

  return [theme, setTheme] as const;
});

export function toggleTheme() {
  setTheme((t) => (t === "dark" ? "light" : "dark"));
}
