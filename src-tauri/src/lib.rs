mod db;
mod entries;
mod local_db;
mod local_schema;
mod products;
mod sales;
mod schema;
mod shopping_lists;
mod similar;
mod stock;
mod utils;

use std::sync::{Arc, OnceLock};
use tokio::sync::Mutex;

use diesel::prelude::*;
use tauri::Manager;

use db::{build_pool, ConnectionConfig, DbPool};
use entries::{EntriesApi, EntriesImpl};
use local_db::LocalDbPool;
use products::{ProductsApi, ProductsImpl};
use sales::{SalesApi, SalesImpl};
use shopping_lists::{ShoppingListsApi, ShoppingListsImpl};
use similar::{SimilarApi, SimilarImpl};
use stock::{StockApi, StockImpl};

type DbState = Arc<Mutex<Option<DbPool>>>;
type LocalDbState = Arc<OnceLock<LocalDbPool>>;

#[taurpc::ipc_type]
struct DbConnectionArgs {
    host: String,
    port: String,
    database: String,
    username: String,
    password: String,
}

#[taurpc::ipc_type]
struct AppPreferences {
    sort_field: String,
    sort_dir: String,
}

#[taurpc::procedures(export_to = "../src/bindings.ts")]
trait Api {
    async fn hello_world() -> String;

    async fn connect_db(args: DbConnectionArgs) -> Result<(), String>;

    async fn disconnect_db();

    async fn is_connected() -> bool;

    async fn save_connection_config(args: DbConnectionArgs) -> Result<(), String>;

    async fn load_connection_config() -> Result<Option<DbConnectionArgs>, String>;

    async fn save_preferences(prefs: AppPreferences) -> Result<(), String>;

    async fn load_preferences() -> Result<Option<AppPreferences>, String>;
}

#[derive(Clone)]
struct ApiImpl {
    db: DbState,
    local_db: LocalDbState,
}

#[taurpc::resolvers]
impl Api for ApiImpl {
    async fn hello_world(self) -> String {
        "Hello from Rust!".to_string()
    }

    async fn connect_db(self, args: DbConnectionArgs) -> Result<(), String> {
        let port: u16 = args
            .port
            .parse()
            .map_err(|_| format!("Porta inválida: {}", args.port))?;

        let config = ConnectionConfig {
            host: args.host,
            port,
            database: args.database,
            username: args.username,
            password: args.password,
        };

        let pool = build_pool(&config).map_err(|e| e.to_string())?;
        *self.db.lock().await = Some(pool);
        Ok(())
    }

    async fn disconnect_db(self) {
        *self.db.lock().await = None;
    }

    async fn is_connected(self) -> bool {
        self.db.lock().await.is_some()
    }

    async fn save_connection_config(self, args: DbConnectionArgs) -> Result<(), String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            use local_schema::connection_config::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            diesel::replace_into(connection_config)
                .values((
                    id.eq(1),
                    host.eq(args.host),
                    port.eq(args.port),
                    database.eq(args.database),
                    username.eq(args.username),
                    password.eq(args.password),
                ))
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn load_connection_config(self) -> Result<Option<DbConnectionArgs>, String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Option<DbConnectionArgs>, String> {
            use local_schema::connection_config::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            connection_config
                .select((host, port, database, username, password))
                .filter(id.eq(1))
                .first::<(String, String, String, String, String)>(&mut conn)
                .optional()
                .map(|row| {
                    row.map(|(h, p, d, u, pw)| DbConnectionArgs {
                        host: h,
                        port: p,
                        database: d,
                        username: u,
                        password: pw,
                    })
                })
                .map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn save_preferences(self, prefs: AppPreferences) -> Result<(), String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            use local_schema::preferences::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            diesel::replace_into(preferences)
                .values((
                    id.eq(1),
                    sort_field.eq(prefs.sort_field),
                    sort_dir.eq(prefs.sort_dir),
                ))
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn load_preferences(self) -> Result<Option<AppPreferences>, String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Option<AppPreferences>, String> {
            use local_schema::preferences::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            preferences
                .select((sort_field, sort_dir))
                .filter(id.eq(1))
                .first::<(String, String)>(&mut conn)
                .optional()
                .map(|row| {
                    row.map(|(field, dir)| AppPreferences {
                        sort_field: field,
                        sort_dir: dir,
                    })
                })
                .map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())?
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state: DbState = Arc::new(Mutex::new(None));
    let local_db_state: LocalDbState = Arc::new(OnceLock::new());

    let local_db_for_setup = local_db_state.clone();

    // TauRPC's Router::merge() requires a Tokio runtime context.
    let handler = tauri::async_runtime::block_on(async {
        taurpc::Router::new()
            .merge(
                ApiImpl {
                    db: db_state.clone(),
                    local_db: local_db_state.clone(),
                }
                .into_handler(),
            )
            .merge(
                ProductsImpl {
                    db: db_state.clone(),
                }
                .into_handler(),
            )
            .merge(
                SimilarImpl {
                    db: db_state.clone(),
                }
                .into_handler(),
            )
            .merge(
                SalesImpl {
                    db: db_state.clone(),
                }
                .into_handler(),
            )
            .merge(
                StockImpl {
                    db: db_state.clone(),
                }
                .into_handler(),
            )
            .merge(
                EntriesImpl {
                    db: db_state.clone(),
                }
                .into_handler(),
            )
            .merge(
                ShoppingListsImpl {
                    db: db_state.clone(),
                    local_db: local_db_state.clone(),
                }
                .into_handler(),
            )
            .into_handler()
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(move |app| {
            // Local SQLite DB lives in the app-data dir and is created (and
            // migrated) on first run. By the time any procedure is called,
            // this will already be set.
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("local.sqlite");
            let pool = local_db::build_local_pool(&db_path)?;
            let _ = local_db_for_setup.set(pool);
            Ok(())
        })
        .invoke_handler(handler)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
