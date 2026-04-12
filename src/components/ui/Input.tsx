import { cva, type VariantProps } from "class-variance-authority";
import { ComponentProps, JSX, Show, splitProps } from "solid-js";

const inputVariants = cva(
  `w-full rounded-md border px-3 py-2 text-sm outline-none
   transition-colors placeholder-gray-400 dark:placeholder-gray-600
   disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: `
          border-gray-200 bg-white text-gray-800
          hover:border-gray-300
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
          dark:border-white/10 dark:bg-surface-dark dark:text-gray-100
          dark:hover:border-white/20
          dark:focus:border-primary-400 dark:focus:ring-primary-400/20
        `,
        ghost: `
          border-transparent bg-gray-100 text-gray-800
          hover:bg-gray-200
          focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20
          dark:bg-white/5 dark:text-gray-100
          dark:hover:bg-white/10
          dark:focus:border-primary-400 dark:focus:bg-surface-dark dark:focus:ring-primary-400/20
        `,
        error: `
          border-red-400 bg-white text-gray-800
          hover:border-red-500
          focus:border-red-500 focus:ring-2 focus:ring-red-500/20
          dark:border-red-500/70 dark:bg-surface-dark dark:text-gray-100
          dark:hover:border-red-400
          dark:focus:border-red-400 dark:focus:ring-red-400/20
        `,
        success: `
          border-green-400 bg-white text-gray-800
          hover:border-green-500
          focus:border-green-500 focus:ring-2 focus:ring-green-500/20
          dark:border-green-500/70 dark:bg-surface-dark dark:text-gray-100
          dark:focus:border-green-400 dark:focus:ring-green-400/20
        `,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type InputVariant = NonNullable<VariantProps<typeof inputVariants>["variant"]>;
export type IconPosition = "left" | "right";

export interface InputProps
  extends Omit<ComponentProps<"input">, "class">,
    VariantProps<typeof inputVariants> {
  class?: string;
  icon?: JSX.Element;
  iconPosition?: IconPosition;
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    "variant",
    "class",
    "icon",
    "iconPosition",
  ]);

  const position = () => local.iconPosition ?? "right";

  const baseInputClass = () =>
    inputVariants({
      variant: local.variant,
      class: [
        local.icon ? "" : local.class,
        local.icon && position() === "right" ? "pr-9" : "",
        local.icon && position() === "left" ? "pl-9" : "",
      ]
        .filter(Boolean)
        .join(" "),
    });

  return (
    <Show
      when={local.icon}
      fallback={<input {...rest} class={baseInputClass()} />}
    >
      <div class={`relative w-full ${local.class ?? ""}`}>
        <input {...rest} class={baseInputClass()} />
        <span
          class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          classList={{
            "right-3": position() === "right",
            "left-3": position() === "left",
          }}
        >
          {local.icon}
        </span>
      </div>
    </Show>
  );
}
