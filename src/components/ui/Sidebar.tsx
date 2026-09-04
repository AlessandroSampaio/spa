import { For, JSX, Show } from "solid-js";
import { A } from "@solidjs/router";
import { sidebarCollapsed, toggleSidebar } from "../../stores/sidebar";
import { SettingsDialog } from "../forms/SettingsDialog";

interface NavItem {
  href: string;
  label: string;
  icon: () => JSX.Element;
}

const IconProduct = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconShoppingCart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
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

const IconChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    classList={{ "rotate-180": sidebarCollapsed() }}
    class="transition-transform duration-200"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Análise de Produto", icon: IconProduct },
  { href: "/lista-de-compra", label: "Lista de compra", icon: IconShoppingCart },
];

export function Sidebar() {
  return (
    <aside
      class="flex h-full shrink-0 flex-col border-r border-gray-200 bg-background-light transition-[width] duration-200 dark:border-white/10 dark:bg-background-dark"
      classList={{ "w-56": !sidebarCollapsed(), "w-16": sidebarCollapsed() }}
    >
      <div class="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-4 dark:border-white/10">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-xs font-bold text-white">
          S
        </span>
        <Show when={!sidebarCollapsed()}>
          <span class="text-sm font-semibold tracking-wide text-gray-800 dark:text-gray-100">
            SPA
          </span>
        </Show>
      </div>

      <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        <For each={NAV_ITEMS}>
          {(item) => (
            <A
              href={item.href}
              end
              title={sidebarCollapsed() ? item.label : undefined}
              class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              classList={{ "justify-center px-0": sidebarCollapsed() }}
              activeClass="!bg-primary-50 !text-primary-600 dark:!bg-primary-900/30 dark:!text-primary-400"
            >
              <item.icon />
              <Show when={!sidebarCollapsed()}>{item.label}</Show>
            </A>
          )}
        </For>
      </nav>

      <div class="flex flex-col gap-0.5 border-t border-gray-200 p-2 dark:border-white/10">
        <div classList={{ flex: true, "justify-center": sidebarCollapsed() }}>
          <SettingsDialog />
        </div>
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed() ? "Expandir menu" : "Recolher menu"}
          aria-label={sidebarCollapsed() ? "Expandir menu" : "Recolher menu"}
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
          classList={{ "justify-center px-0": sidebarCollapsed() }}
        >
          <IconChevronLeft />
          <Show when={!sidebarCollapsed()}>
            <span class="text-xs font-medium">Recolher</span>
          </Show>
        </button>
      </div>
    </aside>
  );
}
