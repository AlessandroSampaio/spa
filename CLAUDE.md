# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A desktop application template using **Tauri v2** (Rust backend) + **Solid.js** (frontend) + **TypeScript** + **Tailwindcss v3** + **Kobalte Core**. The package manager is **Bun**.

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

**IPC pattern:** This project uses **TauRPC** for fully-typed IPC between Rust and TypeScript. Do NOT use raw `invoke()` or `#[tauri::command]`.

**Rust side** — declare procedures in a trait, implement resolvers, register with `taurpc::create_ipc_handler`:
```rust
// src-tauri/src/lib.rs

#[taurpc::procedures(export_to = "../src/bindings.ts")]
trait Api {
    async fn my_command(arg: String) -> String;
}

#[derive(Clone)]
struct ApiImpl;

#[taurpc::resolvers]
impl Api for ApiImpl {
    async fn my_command(self, arg: String) -> String {
        format!("got: {arg}")
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(taurpc::create_ipc_handler(ApiImpl.into_handler()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Use `#[taurpc::ipc_type]` on any struct passed as input/output (derives Serialize, Deserialize, Clone, specta::Type automatically).

**TypeScript side** — import the proxy from the auto-generated `src/bindings.ts` (generated on `bun run tauri dev`):
```ts
import { createTauRPCProxy } from "./bindings";

const taurpc = createTauRPCProxy();
const result = await taurpc.my_command("hello");
```

`src/bindings.ts` is auto-generated — never edit it manually. If the LSP doesn't pick up new types, restart TypeScript.

**Routing** — for larger APIs use `Router` with `path`-namespaced traits:
```rust
let router = Router::new()
    .merge(ApiImpl.into_handler())
    .merge(OtherImpl.into_handler());
// frontend: await taurpc.other.my_method()
```

**Database (Firebird via Diesel):** The Rust backend uses `diesel = "=2.0.0"` (exact pin required) + `rsfbclient-diesel` + `r2d2_firebird` for Firebird connectivity.

- `src-tauri/src/db.rs` — `ConnectionConfig`, `DbPool` type alias, `build_pool()`
- Connection pool held in `Arc<Mutex<Option<DbPool>>>` inside `ApiImpl`
- TauRPC procedures: `connect_db(args)`, `disconnect_db()`, `is_connected()`
- Firebird URL format: `firebird://user:pass@host:port/path.fdb` (absolute paths: `//abs/path.fdb`)
- Feature `"pure_rust"` is active — uses a pure-Rust Firebird wire protocol, no native `fbclient.dll`/`libfbclient.so` required. Change to `"linking"` only if you need the native client and have it installed.
- DB structs crossing the IPC boundary: `#[taurpc::ipc_type]`. Internal-only DB structs: `#[derive(Queryable, Insertable)]`.

**Tauri config:** `src-tauri/tauri.conf.json` — app metadata, window dimensions, build commands, and CSP. Window permissions are in `src-tauri/capabilities/default.json`.

**Vite config:** Port is fixed at 1420 (required by Tauri's dev server integration).
