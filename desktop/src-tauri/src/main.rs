#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{io::{BufRead, BufReader}, path::PathBuf, process::{Child, Command, Stdio}, sync::{mpsc, Mutex}, time::Duration};
use std::{io::Write, path::Path};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

struct Gateway(Child);
impl Drop for Gateway {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

fn start_gateway() -> Result<Gateway, Box<dyn std::error::Error>> {
    let root = if cfg!(target_os = "linux")
        && std::env::current_exe()?.parent() == Some(Path::new("/usr/lib/sim-desktop"))
    {
        PathBuf::from("/usr/share/sim-desktop")
    } else {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
    };
    let python = std::env::var_os("SIM_DESKTOP_PYTHON")
        .unwrap_or_else(|| if cfg!(windows) { "python".into() } else { "python3".into() });
    let mut command = Command::new(python);
    command.current_dir(&root).arg("-B").arg(root.join("server.py"))
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

const PROJECT_LIMIT: u64 = 2_000_000;

struct StartupProject(Mutex<Option<PathBuf>>);

#[tauri::command]
async fn open_project(
    window: tauri::WebviewWindow,
    startup: tauri::State<'_, StartupProject>,
    from_launch: bool,
) -> Result<Option<String>, String> {
    let path = if from_launch {
        startup.0.lock().map_err(|error| error.to_string())?.take()
    } else {
        window.dialog().file().set_parent(&window)
            .set_title("Abrir proyecto")
            .add_filter("Proyectos ΣIM", &["sim", "json"])
            .blocking_pick_file()
            .map(|selection| selection.into_path())
            .transpose().map_err(|error| error.to_string())?
    };
    let Some(path) = path else { return Ok(None); };
    if !["sim", "json"].iter().any(|extension| has_extension(&path, extension)) {
        return Err("Elegí un archivo .sim o .json.".into());
    }
    let file = std::fs::File::open(path).map_err(|error| error.to_string())?;
    if !file.metadata().map_err(|error| error.to_string())?.is_file() {
        return Err("Elegí un archivo de proyecto.".into());
    }
    let mut contents = String::new();
    use std::io::Read;
    file.take(PROJECT_LIMIT + 1).read_to_string(&mut contents).map_err(|error| error.to_string())?;
    if contents.len() as u64 > PROJECT_LIMIT {
        return Err("El archivo supera los 2 MB.".into());
    }
    Ok(Some(contents))
}

fn has_extension(path: &Path, extension: &str) -> bool {
    path.extension().and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case(extension))
}

#[tauri::command]
async fn save_project_copy(
    window: tauri::WebviewWindow,
    filename: String,
    contents: String,
) -> Result<Option<String>, String> {
    if contents.len() as u64 > PROJECT_LIMIT {
        return Err("El proyecto supera los 2 MB admitidos para volver a abrirlo.".into());
    }
    save_file(window, filename, contents.as_bytes(), "sim", "Proyecto ΣIM", "Guardar proyecto")
}

#[tauri::command]
async fn save_pdf(
    window: tauri::WebviewWindow,
    filename: String,
    contents: Vec<u8>,
) -> Result<Option<String>, String> {
    save_file(window, filename, &contents, "pdf", "Documento PDF", "Guardar PDF")
}

fn save_file(
    window: tauri::WebviewWindow,
    filename: String,
    contents: &[u8],
    extension: &str,
    label: &str,
    title: &str,
) -> Result<Option<String>, String> {
    let suggested = Path::new(&filename);
    if suggested.file_name().and_then(|name| name.to_str()) != Some(filename.as_str())
        || !has_extension(suggested, extension)
    {
        return Err(format!("El nombre sugerido debe terminar en .{extension}."));
    }

    let Some(selection) = window
        .dialog()
        .file()
        .set_parent(&window)
        .set_title(title)
        .set_file_name(filename)
        .add_filter(label, &[extension])
        .blocking_save_file()
    else {
        return Ok(None);
    };

    let path = selection.into_path().map_err(|error| error.to_string())?;
    if !has_extension(&path, extension) {
        return Err(format!("Elegí un nombre de archivo que termine en .{extension}."));
    }
    let directory = path.parent().ok_or("La carpeta seleccionada no es válida.")?;
    // Write beside the destination so a failed export cannot truncate an existing copy.
    let mut file = tempfile::NamedTempFile::new_in(directory).map_err(|error| error.to_string())?;
    file.write_all(contents).map_err(|error| error.to_string())?;
    file.as_file().sync_all().map_err(|error| error.to_string())?;
    file.persist(&path).map_err(|error| error.error.to_string())?;
    Ok(Some(path.display().to_string()))
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(StartupProject(Mutex::new(std::env::args_os().nth(1).map(PathBuf::from))))
        .invoke_handler(tauri::generate_handler![save_project_copy, open_project, save_pdf])
        .plugin(tauri_plugin_opener::Builder::new().open_js_links_on_click(false).build())
        .setup(|app| {
            let gateway = start_gateway()?;
            app.manage(Mutex::new(Some(gateway)));
            let window = app.get_webview_window("main").ok_or("Ventana principal no encontrada")?;
            let url = if std::env::args_os().nth(1).is_some() {
                "http://127.0.0.1:5920/#abrir-proyecto"
            } else {
                "http://127.0.0.1:5920/"
            };
            window.navigate(url.parse()?)?;
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
