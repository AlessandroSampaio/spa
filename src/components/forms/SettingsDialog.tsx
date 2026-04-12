import { createForm, SubmitHandler, zodForm } from "@modular-forms/solid";
import {
  DbConnectionForm,
  dbConnectionSchema,
} from "../../schemas/dbConnection";
import { theme, toggleTheme } from "../../stores/theme";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";

const STORAGE_KEY = "db-connection";

function loadSaved(): Partial<DbConnectionForm> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function FieldWrapper(props: { label: string; error?: string; children: any }) {
  return (
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
        {props.label}
      </label>
      {props.children}
      {props.error && (
        <span class="text-xs text-red-500 dark:text-red-400">
          {props.error}
        </span>
      )}
    </div>
  );
}

export function SettingsDialog() {
  const saved = loadSaved();

  const [form, { Form, Field: FormField }] = createForm<DbConnectionForm>({
    validate: zodForm(dbConnectionSchema),
    initialValues: {
      host: saved.host ?? "",
      port: saved.port ?? "",
      database: saved.database ?? "",
    },
  });

  const handleSubmit: SubmitHandler<DbConnectionForm> = (values) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  };

  return (
    <Dialog
      title="Configurações"
      trigger={
        <button
          class="
            rounded-lg p-2 text-gray-500 transition-colors
            hover:bg-gray-100 hover:text-gray-700
            dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          "
          aria-label="Configurações"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      }
    >
      {/* Theme toggle */}
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-gray-100">
            Tema
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {theme() === "dark" ? "Modo escuro ativo" : "Modo claro ativo"}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          role="switch"
          aria-checked={theme() === "dark"}
          class="
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center
            rounded-full border-2 border-transparent transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
            dark:focus-visible:ring-primary-400 dark:focus-visible:ring-offset-background-dark
          "
          classList={{
            "bg-primary-500": theme() === "dark",
            "bg-gray-200": theme() === "light",
          }}
        >
          <span
            class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
            classList={{
              "translate-x-5": theme() === "dark",
              "translate-x-0": theme() === "light",
            }}
          />
        </button>
      </div>

      {/* Divider */}
      <div class="my-5 border-t border-gray-100 dark:border-white/10" />

      {/* DB connection form */}
      <p class="mb-4 text-sm font-medium text-gray-800 dark:text-gray-100">
        Conexão com banco de dados
      </p>

      <Form onSubmit={handleSubmit} class="flex flex-col gap-4">
        <FormField name="host">
          {(field, props) => (
            <FieldWrapper label="Host" error={field.error}>
              <Input
                {...props}
                type="text"
                placeholder="192.168.0.1"
                value={field.value ?? ""}
                variant={field.error ? "error" : "default"}
              />
            </FieldWrapper>
          )}
        </FormField>

        <FormField name="port">
          {(field, props) => (
            <FieldWrapper label="Porta" error={field.error}>
              <Input
                {...props}
                type="text"
                inputmode="numeric"
                maxlength="4"
                placeholder="3050"
                value={field.value ?? ""}
                variant={field.error ? "error" : "default"}
              />
            </FieldWrapper>
          )}
        </FormField>

        <FormField name="database">
          {(field, props) => (
            <FieldWrapper label="Database" error={field.error}>
              <Input
                {...props}
                type="text"
                placeholder="/var/data/banco.fdb"
                value={field.value ?? ""}
                variant={field.error ? "error" : "default"}
              />
            </FieldWrapper>
          )}
        </FormField>

        <button
          type="submit"
          disabled={form.submitting}
          class="
            mt-1 w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white
            transition-colors hover:bg-primary-600 active:bg-primary-700 dark:hover:bg-primary-400
            disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
            dark:focus-visible:ring-primary-400 dark:focus-visible:ring-offset-background-dark
          "
        >
          Salvar
        </button>
      </Form>
    </Dialog>
  );
}
