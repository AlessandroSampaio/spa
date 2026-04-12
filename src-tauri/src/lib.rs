mod db;
mod schema;
mod products;

use std::sync::{Arc, OnceLock};
use tokio::sync::Mutex;

use tauri::Manager;

use db::{build_pool, ConnectionConfig, DbPool};
use products::{ProductsApi, ProductsImpl};

type DbState = Arc<Mutex<Option<DbPool>>>;
type AppHandleState = Arc<OnceLock<tauri::AppHandle>>;

#[taurpc::ipc_type]
struct DbConnectionArgs {
    host: String,
    port: String,
    database: String,
    username: String,
    password: String,
}

#[taurpc::procedures(export_to = "../src/bindings.ts")]
trait Api {
    async fn hello_world() -> String;

    async fn connect_db(args: DbConnectionArgs) -> Result<(), String>;

    async fn disconnect_db();

    async fn is_connected() -> bool;

    async fn save_connection_config(args: DbConnectionArgs) -> Result<(), String>;

    async fn load_connection_config() -> Result<Option<DbConnectionArgs>, String>;
}

#[derive(Clone)]
struct ApiImpl {
    db: DbState,
    app_handle: AppHandleState,
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
        let app = self.app_handle.get().ok_or("AppHandle não disponível")?;
        let config_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
        let path = config_dir.join("connection.json");
        let json = serde_json::to_string_pretty(&args).map_err(|e| e.to_string())?;
        std::fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    async fn load_connection_config(self) -> Result<Option<DbConnectionArgs>, String> {
        let app = self.app_handle.get().ok_or("AppHandle não disponível")?;
        let path = app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?
            .join("connection.json");
        if !path.exists() {
            return Ok(None);
        }
        let json = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let config: DbConnectionArgs = serde_json::from_str(&json).map_err(|e| e.to_string())?;
        Ok(Some(config))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state: DbState = Arc::new(Mutex::new(None));
    let app_handle: AppHandleState = Arc::new(OnceLock::new());

    let handle_for_setup = app_handle.clone();

    // TauRPC's Router::merge() requires a Tokio runtime context.
    let handler = tauri::async_runtime::block_on(async {
        taurpc::Router::new()
            .merge(ApiImpl { db: db_state.clone(), app_handle: app_handle.clone() }.into_handler())
            .merge(ProductsImpl { db: db_state.clone() }.into_handler())
            .into_handler()
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            // Set the AppHandle once Tauri has fully initialised it.
            // By the time any procedure is called, this will already be set.
            let _ = handle_for_setup.set(app.handle().clone());
            Ok(())
        })
        .invoke_handler(handler)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
