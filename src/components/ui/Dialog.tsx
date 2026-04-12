import { Dialog as KDialog } from "@kobalte/core";
import { JSX, Show, splitProps } from "solid-js";

export interface DialogProps {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state (uncontrolled). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that triggers the dialog (rendered as-is, wrapped in Dialog.Trigger). */
  trigger?: JSX.Element;
  title?: string;
  description?: string;
  /** Main body content. */
  children: JSX.Element;
  /** Optional footer, typically action buttons. */
  footer?: JSX.Element;
}

export function Dialog(props: DialogProps) {
  const [local, rootProps] = splitProps(props, [
    "trigger",
    "title",
    "description",
    "children",
    "footer",
  ]);

  return (
    <KDialog {...rootProps}>
      <Show when={local.trigger}>
        <KDialog.Trigger as="div">{local.trigger}</KDialog.Trigger>
      </Show>

      <KDialog.Portal>
        {/* Overlay */}
        <KDialog.Overlay
          class="
            fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
            data-[expanded]:animate-overlay-in
            data-[closed]:animate-overlay-out
          "
        />

        {/* Content panel */}
        <KDialog.Content
          class="
            fixed left-1/2 top-1/2 z-50 w-full max-w-md
            -translate-x-1/2 -translate-y-1/2
            rounded-xl border border-gray-200 bg-white shadow-2xl
            dark:border-white/10 dark:bg-background-dark
            data-[expanded]:animate-dialog-in
            data-[closed]:animate-dialog-out
          "
        >
          {/* Header */}
          <Show when={local.title || local.description}>
            <div class="border-b border-gray-100 px-6 py-5 dark:border-white/10">
              <Show when={local.title}>
                <KDialog.Title class="text-base font-semibold text-gray-900 dark:text-white">
                  {local.title}
                </KDialog.Title>
              </Show>
              <Show when={local.description}>
                <KDialog.Description class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {local.description}
                </KDialog.Description>
              </Show>
            </div>
          </Show>

          {/* Body */}
          <div class="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
            {local.children}
          </div>

          {/* Footer */}
          <Show when={local.footer}>
            <div class="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-white/10">
              {local.footer}
            </div>
          </Show>

          {/* Close button */}
          <KDialog.CloseButton
            class="
              absolute right-4 top-4 rounded-md p-1
              text-gray-400 transition-colors
              hover:bg-gray-100 hover:text-gray-600
              dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            "
            aria-label="Fechar"
          >
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </KDialog.CloseButton>
        </KDialog.Content>
      </KDialog.Portal>
    </KDialog>
  );
}
