# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A desktop application template using **Tauri v2** (Rust backend) + **Solid.js** (frontend) + **TypeScript** + **Tailwindcss v3**. The package manager is **Bun**.

## Commands

```bash
# Frontend dev server only (port 1420)
bun run dev

# Full desktop app in dev mode (frontend + Rust backend)
bun run tauri dev

# Build frontend for production
bun run build

# Build native desktop executable
bun run tauri build
```

There is no linter or test framework configured.

## Architecture

**Two-layer app:**

- `src/` — Solid.js + TypeScript frontend
- `src-tauri/` — Rust backend (Tauri)

**Frontend Architecture**
-  `src/components/ui` — Minimum reutilizable components, like custom buttons, inputs, cards
-  `src/components/forms` — Form components, used at least one time
-  `src/types` — All types definitions
-  `src/schemas` — Zod schemas
-  `src/pages` — All pages, one file each

Each component should be write in a separate file. 
All forms should be written using **ModularForms**, check `https://modularforms.dev` with **Zod** validations.

**Frontend entry:** `index.html` → `src/index.tsx` mounts `<App>` to `#root`

**Backend entry:** `src-tauri/src/main.rs` → `src-tauri/src/lib.rs` registers Tauri IPC commands and plugins

**IPC pattern:** Frontend calls Rust functions via `invoke()` from `@tauri-apps/api/core`:
```ts
import { invoke } from "@tauri-apps/api/core";
const result = await invoke("command_name", { arg: value });
```
Rust handlers are registered with `#[tauri::command]` and added to `.invoke_handler(tauri::generate_handler![...])` in `lib.rs`.

**Tauri config:** `src-tauri/tauri.conf.json` — app metadata, window dimensions, build commands, and CSP. Window permissions are in `src-tauri/capabilities/default.json`.

**Vite config:** Port is fixed at 1420 (required by Tauri's dev server integration).
