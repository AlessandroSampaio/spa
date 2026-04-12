import { JSX } from "solid-js";

interface HeaderProps {
  title: string;
  actions?: JSX.Element;
}

export function Header(props: HeaderProps) {
  return (
    <header class="flex h-14 w-full items-center justify-between border-b border-gray-200 bg-background-light px-4 dark:border-white/10 dark:bg-background-dark">
      <span class="text-sm font-semibold tracking-wide text-gray-800 dark:text-gray-100">
        {props.title}
      </span>
      {props.actions && <div class="flex items-center gap-1">{props.actions}</div>}
    </header>
  );
}
