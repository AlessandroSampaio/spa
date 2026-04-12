mod db;

use std::sync::Arc;
use tokio::sync::Mutex;

use db::{build_pool, ConnectionConfig, DbPool};

type DbState = Arc<Mutex<Option<DbPool>>>;

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
}

#[derive(Clone)]
struct ApiImpl {
    db: DbState,
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
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state: DbState = Arc::new(Mutex::new(None));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(taurpc::create_ipc_handler(
            ApiImpl { db: db_state }.into_handler(),
        ))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
