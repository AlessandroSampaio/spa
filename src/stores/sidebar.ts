import { createRoot, createSignal, createEffect } from "solid-js";

const STORAGE_KEY = "sidebar-collapsed";

function getInitialCollapsed(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export const [sidebarCollapsed, setSidebarCollapsed] = createRoot(() => {
  const [collapsed, setCollapsed] = createSignal(getInitialCollapsed());

  createEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed()));
  });

  return [collapsed, setCollapsed] as const;
});

export function toggleSidebar() {
  setSidebarCollapsed((c) => !c);
}
