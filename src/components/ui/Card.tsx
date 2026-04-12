import { ParentProps } from "solid-js";

interface CardProps extends ParentProps {
  class?: string;
}

export function Card(props: CardProps) {
  return (
    <div
      class={`rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-surface-dark ${props.class ?? ""}`}
    >
      {props.children}
    </div>
  );
}
