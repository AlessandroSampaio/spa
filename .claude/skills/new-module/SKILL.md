---
name: new-module
description: Scaffold a new TauRPC + Diesel module for src-tauri following the folder architecture (mod.rs, models.rs, service.rs) and wire it into lib.rs
disable-model-invocation: true
---

Cria um novo módulo backend em `src-tauri/src/<module_name>/` seguindo a arquitetura do projeto.

## Uso

`/new-module <module_name>`

Exemplo: `/new-module products`

---

## Estrutura de arquivos a gerar

```
src-tauri/src/<module_name>/
├── mod.rs       — re-exporta os submódulos e a superfície pública
├── models.rs    — structs Diesel (DB-only) e structs TauRPC IPC
└── service.rs   — trait de procedures TauRPC + resolvers + acesso ao DbState
```

Após gerar os arquivos, conectar o módulo em `src-tauri/src/lib.rs`.

---

## Contexto do projeto (NÃO alterar)

### Tipos de pool — `src-tauri/src/db.rs`
```rust
pub type DbPool = r2d2::Pool<DieselConnectionManager>;  // r2d2_firebird::DieselConnectionManager
```

### Estado global — `src-tauri/src/lib.rs`
```rust
type DbState = Arc<Mutex<Option<DbPool>>>;   // tokio::sync::Mutex

#[derive(Clone)]
struct ApiImpl { db: DbState }
```

O `DbState` é o único estado compartilhado. Todo `*Impl` de módulo **deve** receber um campo `db: DbState` e ser construído passando `db_state.clone()`.

---

## Template: `models.rs`

Dois tipos de structs, nunca misturar:

| Tipo | Anotação | Quando usar |
|---|---|---|
| IPC struct | `#[taurpc::ipc_type]` | Cruza a fronteira TauRPC (input/output de procedures) |
| DB-only struct | `#[derive(Queryable, Selectable, Insertable)]` | Usada internamente pelo Diesel, nunca enviada ao frontend |

```rust
// src-tauri/src/<module_name>/models.rs

use diesel::prelude::*;

// ── IPC types ────────────────────────────────────────────────────────────────
// #[taurpc::ipc_type] deriva automaticamente: Serialize, Deserialize, Clone, specta::Type

#[taurpc::ipc_type]
pub struct <Entity> {
    pub id: i32,
    pub name: String,
    // adicionar campos aqui
}

#[taurpc::ipc_type]
pub struct Create<Entity>Args {
    pub name: String,
    // adicionar campos aqui
}

// ── DB-only types ─────────────────────────────────────────────────────────────
// Omitir esta seção se ainda não há schema.rs (migrations não executadas)

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::<table_name>)]
#[diesel(check_for_backend(rsfbclient_diesel::Fb))]
pub struct <Entity>Row {
    pub id: i32,
    pub name: String,
}

#[derive(Insertable)]
#[diesel(table_name = crate::schema::<table_name>)]
pub struct New<Entity>Row<'a> {
    pub name: &'a str,
}
```

---

## Template: `service.rs`

```rust
// src-tauri/src/<module_name>/service.rs

use std::sync::Arc;
use tokio::sync::Mutex;

use crate::db::DbPool;
use super::models::{<Entity>, Create<Entity>Args};

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "<module_name>")]
pub trait <ModuleName>Api {
    async fn get_all() -> Result<Vec<<Entity>>, String>;
    async fn create(args: Create<Entity>Args) -> Result<<Entity>, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct <ModuleName>Impl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl <ModuleName>Api for <ModuleName>Impl {
    async fn get_all(self) -> Result<Vec<<Entity>>, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        // Diesel r2d2::Pool::get() é bloqueante — usar spawn_blocking para queries pesadas
        tokio::task::spawn_blocking(move || {
            let mut conn = pool.get().map_err(|e| e.to_string())?;
            // use crate::schema::<table_name>::dsl::*;
            // <table_name>::table.load::<EntityRow>(&mut conn)
            //     .map(|rows| rows.into_iter().map(|r| <Entity> { id: r.id, name: r.name }).collect())
            //     .map_err(|e| e.to_string())
            Ok(vec![])
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn create(self, args: Create<Entity>Args) -> Result<<Entity>, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || {
            let mut conn = pool.get().map_err(|e| e.to_string())?;
            // let new_row = New<Entity>Row { name: &args.name };
            // diesel::insert_into(crate::schema::<table_name>::table)
            //     .values(&new_row)
            //     .execute(&mut conn)
            //     .map_err(|e| e.to_string())?;
            // ...retornar a entidade criada
            Err("Not implemented".to_string())
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
```

**Regras obrigatórias para `service.rs`:**
- `path = "<module_name>"` **sempre** presente no `#[taurpc::procedures]` — cria o namespace no frontend (`taurpc.<module_name>.get_all()`)
- `export_to` **nunca** em traits de módulo — só o trait raiz `Api` em `lib.rs` tem `export_to`
- Pool sempre clonado antes do `spawn_blocking` (o `Pool` é `Clone` e thread-safe internamente)
- Checar que o pool é `Some` antes de usar; retornar `Err("Sem conexão com o banco de dados")` se não

---

## Template: `mod.rs`

```rust
// src-tauri/src/<module_name>/mod.rs

pub mod models;
pub mod service;

pub use service::{<ModuleName>Api, <ModuleName>Impl};
```

---

## Conectar em `lib.rs`

### 1. Declarar o módulo no topo
```rust
mod <module_name>;
use <module_name>::<ModuleName>Impl;
```

### 2. Trocar `create_ipc_handler` por `Router` (apenas na primeira vez)

Antes (apenas `ApiImpl`):
```rust
.invoke_handler(taurpc::create_ipc_handler(ApiImpl { db: db_state }.into_handler()))
```

Depois (com Router):
```rust
use taurpc::Router;

// dentro de run(), após criar db_state:
let router = Router::new()
    .merge(ApiImpl { db: db_state.clone() }.into_handler())
    .merge(<ModuleName>Impl { db: db_state.clone() }.into_handler());

tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(router.into_handler())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

### 3. Módulos subsequentes
Para cada novo módulo, apenas adicionar `.merge(...)` ao router existente:
```rust
let router = Router::new()
    .merge(ApiImpl { db: db_state.clone() }.into_handler())
    .merge(ProductsImpl { db: db_state.clone() }.into_handler())
    .merge(<NovoModulo>Impl { db: db_state.clone() }.into_handler()); // ← adicionar aqui
```

---

## Uso no frontend

Após `bun run tauri dev` regenerar `src/bindings.ts`:

```ts
import { createTauRPCProxy } from "./bindings";
const taurpc = createTauRPCProxy();

// namespace vem do  path = "<module_name>"
const items = await taurpc.<module_name>.get_all();
const novo  = await taurpc.<module_name>.create({ name: "foo" });
```

---

## Checklist antes de finalizar

- [ ] `mod.rs` re-exporta `<ModuleName>Api` e `<ModuleName>Impl`
- [ ] Structs IPC usam `#[taurpc::ipc_type]`
- [ ] Structs DB-only usam `#[derive(Queryable/Insertable)]`
- [ ] `service.rs` tem `path = "<module_name>"` no trait
- [ ] `lib.rs` declara `mod <module_name>` e usa `Router::new().merge(...)`
- [ ] `export_to` permanece **somente** no trait raiz `Api` em `lib.rs`
- [ ] Queries Diesel estão dentro de `spawn_blocking`
