#[taurpc::procedures(export_to = "../src/bindings.ts")]
trait Api {
    async fn hello_world() -> String;
}

#[derive(Clone)]
struct ApiImpl;

#[taurpc::resolvers]
impl Api for ApiImpl {
    async fn hello_world(self) -> String {
        "Hello from Rust!".to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(taurpc::create_ipc_handler(ApiImpl.into_handler()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
