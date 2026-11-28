#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{io::{BufRead, BufReader}, path::PathBuf, process::{Child, Command, Stdio}, sync::{mpsc, Mutex}, time::Duration};
use tauri::Manager;

struct Gateway(Child);
impl Drop for Gateway {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn start_gateway() -> Result<Gateway, Box<dyn std::error::Error>> {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    let python = std::env::var_os("SIM_DESKTOP_PYTHON")
        .unwrap_or_else(|| if cfg!(windows) { "python".into() } else { "python3".into() });
    let mut command = Command::new(python);
    command.current_dir(&root).arg(root.join("server.py"))
        .args(["--desktop", "--port", "5920"]);
    if cfg!(windows) {
        let runtime = std::env::var_os("SIM_DESKTOP_ENGINE_ROOT")
            .ok_or("Definí SIM_DESKTOP_ENGINE_ROOT con la carpeta runtime de DWSIM")?;
        if !PathBuf::from(&runtime).join("local-token.txt").is_file() {
            return Err("No se encontró local-token.txt en el runtime de DWSIM".into());
        }
        command.arg("--engine-root").arg(runtime);
    } else {
        let token = std::env::var_os("SIM_DESKTOP_MCP_TOKEN_FILE")
            .ok_or("Definí SIM_DESKTOP_MCP_TOKEN_FILE con la ruta del token local MCP de Debian")?;
        command.arg("--mcp-token-file").arg(token);
    }
    let mut gateway = Gateway(command.stdout(Stdio::piped()).stderr(Stdio::inherit()).spawn()?);
    let stdout = gateway.0.stdout.take().ok_or("Sin salida del gateway")?;
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            eprintln!("{line}");
            if line.trim() == "Simulador local: http://127.0.0.1:5920" {
                let _ = tx.send(());
            }
        }
    });
    rx.recv_timeout(Duration::from_secs(90))?;
    if gateway.0.try_wait()?.is_some() {
        return Err("El gateway terminó antes de abrir la ventana".into());
    }
    Ok(gateway)
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::Builder::new().open_js_links_on_click(false).build())
        .setup(|app| {
            let gateway = start_gateway()?;
            app.manage(Mutex::new(Some(gateway)));
            let window = app.get_webview_window("main").ok_or("Ventana principal no encontrada")?;
            window.navigate("http://127.0.0.1:5920/".parse()?)?;
            window.set_title("ΣIM Desktop · desarrollo")?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("No se pudo iniciar ΣIM Desktop");
    app.run(|handle, event| {
        if let tauri::RunEvent::Exit = event {
            if let Some(state) = handle.try_state::<Mutex<Option<Gateway>>>() {
                if let Ok(mut guard) = state.lock() {
                    guard.take();
                }
            }
        }
    });
}
