use std::path::PathBuf;

fn main() {
    // CARGO_MANIFEST_DIR is the absolute path to src-tauri/ (where Cargo.toml lives).
    // Always use absolute paths for rustc-link-search — the MSVC linker resolves
    // relative LIBPATH entries from its own working directory, not from src-tauri/.
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let resources = PathBuf::from(manifest_dir).join("resources");

    // Validate that fbclient.lib (MSVC import library) is present.
    // The DLL alone is not sufficient for link time — the linker needs the .lib.
    let lib_path = resources.join("fbclient.lib");
    if !lib_path.exists() {
        panic!(
            "\n\n\
            [build error] fbclient.lib not found at src-tauri/resources/fbclient.lib\n\
            The MSVC linker requires the import library (.lib), not just the DLL.\n\
            Copy fbclient.lib from your Firebird installation:\n\
              - Firebird 3.x/4.x/5.x: <Firebird install>\\lib\\fbclient.lib\n\
            Then place it alongside fbclient.dll in src-tauri/resources/.\n"
        );
    }

    // Tell the linker to search src-tauri/resources/ for fbclient.lib.
    println!("cargo:rustc-link-search=native={}", resources.display());

    // During dev, copy fbclient.dll next to the compiled executable so the
    // OS loader can find it at runtime without it being in the system PATH.
    let out_dir = std::env::var("OUT_DIR").unwrap();
    // OUT_DIR is  …/target/debug/build/<pkg>/out  — walk up 3 levels to reach
    // …/target/debug/  where the final .exe lives.
    let exe_dir = PathBuf::from(&out_dir)
        .ancestors()
        .nth(3)
        .unwrap()
        .to_path_buf();

    let dll_src = resources.join("fbclient.dll");
    let dll_dst = exe_dir.join("fbclient.dll");

    if dll_src.exists() && !dll_dst.exists() {
        std::fs::copy(&dll_src, &dll_dst).unwrap_or_else(|e| {
            eprintln!("[build warning] could not copy fbclient.dll to target dir: {e}");
            0
        });
    }

    println!("cargo:rerun-if-changed=resources/fbclient.dll");
    println!("cargo:rerun-if-changed=resources/fbclient.lib");

    tauri_build::build()
}
