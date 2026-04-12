---
name: new-component
description: Scaffold a new UI or form component following the project's Solid.js + Kobalte + CVA + Tailwind patterns
disable-model-invocation: true
---

Create a new component for this Tauri + Solid.js project.

## Usage

`/new-component <ComponentName> [--type ui|form] [--variants <v1,v2,...>]`

- `--type ui` (default): goes in `src/components/ui/`
- `--type form`: goes in `src/components/forms/`
- `--variants`: comma-separated CVA variant names (only for ui components)

## Rules

### UI components (`src/components/ui/`)

Follow the exact pattern of `src/components/ui/Input.tsx`:

1. Import `cva` and `VariantProps` from `class-variance-authority`
2. Import needed Solid.js primitives: `ComponentProps`, `splitProps`, `Show`, `createMemo`, etc.
3. Define a `*Variants` const using `cva()` with:
   - Base classes as a template literal (first arg)
   - `variants` object (second arg)
   - `defaultVariants` always set
4. Export the variant type: `export type XVariant = NonNullable<VariantProps<typeof xVariants>["variant"]>`
5. Export a Props interface extending `Omit<ComponentProps<"element">, "class">` + `VariantProps<typeof xVariants>` + `class?: string`
6. Use `splitProps` to separate local props from native element props
7. Always pair Tailwind classes with dark mode variants: `text-gray-800 dark:text-gray-100`, `bg-white dark:bg-surface-dark`, `border-gray-200 dark:border-white/10`
8. Use `focus-visible:ring-2 focus-visible:ring-primary-500/20` for focus states (never `focus:` alone)

### Form components (`src/components/forms/`)

Follow the exact pattern of `src/components/forms/SettingsDialog.tsx`:

1. Import from `@modular-forms/solid`: `createForm`, `SubmitHandler`, `zodForm`
2. Define the Zod schema in `src/schemas/<name>.ts` and import the type + schema
3. Use `createForm<FormType>({ validate: zodForm(schema), initialValues: {...} })`
4. Wrap each field with a local `FieldWrapper` component (label + error display)
5. Use `<FormField name="...">` with render prop pattern: `{(field, props) => (...)}`
6. Wire `variant={field.error ? "error" : "default"}` on `<Input>` components
7. Submit button: `disabled={form.submitting}` with `disabled:opacity-50 disabled:cursor-not-allowed`

## Dark mode Tailwind cheatsheet

| Element | Light | Dark |
|---|---|---|
| Text primary | `text-gray-800` | `dark:text-gray-100` |
| Text muted | `text-gray-500` | `dark:text-gray-400` |
| Background | `bg-white` | `dark:bg-surface-dark` |
| Border | `border-gray-200` | `dark:border-white/10` |
| Hover border | `hover:border-gray-300` | `dark:hover:border-white/20` |
| Focus ring | `focus-visible:ring-primary-500/20` | `dark:focus-visible:ring-primary-400/20` |

## Example: minimal UI component

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { ComponentProps, splitProps } from "solid-js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100",
        primary: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        danger:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeProps
  extends Omit<ComponentProps<"span">, "class">,
    VariantProps<typeof badgeVariants> {
  class?: string;
}

export function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ["variant", "class"]);
  return (
    <span {...rest} class={badgeVariants({ variant: local.variant, class: local.class })} />
  );
}
```

After generating the component file, remind the user to import and use it.
