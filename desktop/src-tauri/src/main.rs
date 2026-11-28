#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{io::{BufRead, BufReader}, path::PathBuf, process::{Child, Command, Stdio}, sync::{mpsc, Arc, Mutex}, time::Duration};
use std::{io::Write, path::Path};
use tauri::{Manager, State, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

struct Gateway(Child);
impl Drop for Gateway {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

const GATEWAY_URL: &str = "http://127.0.0.1:5920/";

struct Startup {
    phase: &'static str,
    error: Option<&'static str>,
    gateway: Option<Gateway>,
    closing: bool,
}

type StartupState = Arc<Mutex<Startup>>;

fn gateway_command() -> Result<Command, &'static str> {
    let binary = std::env::current_exe().map_err(|_| "No se pudo ubicar ΣIM Desktop.")?;
    let root = if cfg!(target_os = "linux")
        && binary.parent() == Some(Path::new("/usr/lib/sim-desktop"))
    {
        PathBuf::from("/usr/share/sim-desktop")
    } else {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
    };
    let server = root.join("server.py");
    if !server.is_file() || !root.join("site/index.html").is_file() {
        return Err("Faltan archivos de ΣIM Desktop. Revisá la instalación.");
    }

    let python = std::env::var_os("SIM_DESKTOP_PYTHON")
        .unwrap_or_else(|| if cfg!(windows) { "python".into() } else { "python3".into() });
    let mut command = Command::new(python);
    command.current_dir(&root).arg("-B").arg(server)
        .args(["--desktop", "--port", "5920"]);
    if cfg!(windows) {
        let runtime = std::env::var_os("SIM_DESKTOP_ENGINE_ROOT")
            .map(PathBuf::from)
            .ok_or("Configurá SIM_DESKTOP_ENGINE_ROOT con la carpeta del motor DWSIM.")?;
        if !runtime.join("local-token.txt").is_file() || !runtime.join("server/dwsim-mcp.exe").is_file() {
            return Err("Revisá que la carpeta del motor incluya local-token.txt y server/dwsim-mcp.exe.");
        }
        command.arg("--engine-root").arg(runtime);
    } else {
        let token = std::env::var_os("SIM_DESKTOP_MCP_TOKEN_FILE")
            .map(PathBuf::from)
            .filter(|path| std::fs::File::open(path).is_ok())
            .ok_or("Configurá SIM_DESKTOP_MCP_TOKEN_FILE con el archivo de token del motor DWSIM MCP local.")?;
        command.arg("--mcp-token-file").arg(token);
    }
    Ok(command)
}

fn prepare_gateway(startup: &StartupState) -> Result<(), &'static str> {
    let mut command = gateway_command()?;
    let stdout = {
        let mut state = startup.lock().unwrap();
        if state.closing {
            return Ok(());
        }
        let mut gateway = Gateway(command.stdout(Stdio::piped()).stderr(Stdio::inherit())
            .spawn().map_err(|_| "No se pudo iniciar el servicio local. Revisá la instalación de Python.")?);
        let stdout = gateway.0.stdout.take().ok_or("El servicio local no informó su estado.")?;
        state.gateway = Some(gateway);
        stdout
    };

    let (send, receive) = mpsc::channel();
    std::thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let phase = match line.trim() {
                "ΣIM Desktop: engine" => "engine",
                "ΣIM Desktop: catalog" => "catalog",
                "Simulador local: http://127.0.0.1:5920" => "ready",
                _ => continue,
            };
            let _ = send.send(phase);
        }
    });

    let deadline = std::time::Instant::now() + Duration::from_secs(90);
    loop {
        let phase = receive.recv_timeout(deadline.saturating_duration_since(std::time::Instant::now()));
        let mut state = startup.lock().unwrap();
        if state.closing {
            return Ok(());
        }
        match phase {
            Ok("ready") => {
                verify_gateway(&mut state)?;
                state.phase = "ready";
                return Ok(());
            }
            Ok(phase) => state.phase = phase,
            Err(mpsc::RecvTimeoutError::Timeout) => return Err("El arranque superó 90 segundos. Revisá DWSIM y volvé a intentar."),
            Err(mpsc::RecvTimeoutError::Disconnected) => {
                return Err(if state.phase == "service" {
                    "El servicio local se cerró. Revisá si hay otra instancia de ΣIM Desktop abierta."
                } else if cfg!(windows) {
                    "DWSIM no pudo cargar su catálogo. Revisá los archivos del motor y volvé a intentar."
                } else {
                    "DWSIM no pudo cargar su catálogo. Verificá que el servicio MCP local esté activo y que el token coincida."
                });
            }
        }
    }
}

fn verify_gateway(state: &mut Startup) -> Result<(), &'static str> {
    if let Some(gateway) = state.gateway.as_mut() {
        if matches!(gateway.0.try_wait(), Ok(None)) {
            return Ok(());
        }
    }
    Err("El servicio local se cerró. Volvé a iniciar la carga.")
}

fn launch_startup(startup: StartupState) {
    std::thread::spawn(move || {
        if let Err(error) = prepare_gateway(&startup) {
            let mut state = startup.lock().unwrap();
            state.gateway.take();
            state.error = Some(error);
        }
    });
}

#[tauri::command]
fn startup_status(startup: State<'_, StartupState>) -> (&'static str, Option<&'static str>, &'static str) {
    let mut state = startup.lock().unwrap();
    if state.phase == "ready" && state.error.is_none() {
        state.error = verify_gateway(&mut state).err();
    }
    (state.phase, state.error, env!("CARGO_PKG_VERSION"))
}

#[tauri::command]
fn retry_startup(startup: State<'_, StartupState>) {
    let mut state = startup.lock().unwrap();
    if state.error.take().is_some() {
        state.gateway.take();
        state.phase = "service";
        launch_startup(Arc::clone(startup.inner()));
    }
}

#[tauri::command]
fn open_editor(window: WebviewWindow, startup: State<'_, StartupState>) -> Result<(), String> {
    {
        let mut state = startup.lock().unwrap();
        if state.phase != "ready" {
            return Err("El editor todavía se está preparando.".into());
        }
        verify_gateway(&mut state)?;
    }
    let mut url: tauri::Url = GATEWAY_URL.parse().expect("URL local válida");
    if std::env::args_os().nth(1).is_some() {
        url.set_fragment(Some("abrir-proyecto"));
    }
    window.navigate(url)
        .map_err(|_| "No se pudo abrir el editor. Volvé a intentar.".into())
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
        .invoke_handler(tauri::generate_handler![
            save_project_copy, open_project, save_pdf, startup_status, retry_startup, open_editor
        ])
        .plugin(tauri_plugin_opener::Builder::new().open_js_links_on_click(false).build())
        .setup(|app| {
            let startup = Arc::new(Mutex::new(Startup {
                phase: "service",
                error: None,
                gateway: None,
                closing: false,
            }));
            app.manage(Arc::clone(&startup));
            launch_startup(startup);
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("No se pudo iniciar ΣIM Desktop");
    app.run(|handle, event| {
        if let tauri::RunEvent::Exit = event {
            if let Some(state) = handle.try_state::<StartupState>() {
                if let Ok(mut guard) = state.lock() {
                    guard.closing = true;
                    guard.gateway.take();
                }
            }
        }
    });
}
