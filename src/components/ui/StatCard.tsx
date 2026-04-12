import { JSX, Show } from "solid-js";
import { Card } from "./Card";

type Accent = "blue" | "green" | "purple" | "amber";

const accentClasses: Record<Accent, { icon: string; text: string }> = {
  blue:   { icon: "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400", text: "text-primary-600 dark:text-primary-400" },
  green:  { icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", text: "text-emerald-600 dark:text-emerald-400" },
  purple: { icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",     text: "text-violet-600 dark:text-violet-400" },
  amber:  { icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",         text: "text-amber-600 dark:text-amber-400" },
};

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: JSX.Element;
  accent?: Accent;
}

export function StatCard(props: StatCardProps) {
  const accent = () => props.accent ?? "blue";
  const classes = () => accentClasses[accent()];

  return (
    <Card class="flex flex-col gap-3 p-4">
      <div class="flex items-start justify-between">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
          {props.label}
        </span>
        <Show when={props.icon}>
          <span class={`flex h-8 w-8 items-center justify-center rounded-lg ${classes().icon}`}>
            {props.icon}
          </span>
        </Show>
      </div>

      <div>
        <p class={`text-2xl font-semibold tracking-tight ${classes().text}`}>
          {props.value}
        </p>
        <Show when={props.sublabel}>
          <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{props.sublabel}</p>
        </Show>
      </div>
    </Card>
  );
}
