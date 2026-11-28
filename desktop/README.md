# ΣiM Desktop — prototipo de desarrollo

Base científica y frontend compartido: ΣiM 0.52.0 (rama de desarrollo). Motor: DWSIM MCP 10.2.15. Licencia GPL-3.0-or-later. Rama `feat/desktop-foundation`, [PR #167](https://github.com/lemeit/lemeit-sim/pull/167).

**Estado al 26/11/2026:** alpha.1 funcional en Debian x86_64, revisión de interfaz alpha.2 en curso. La numeración del ejecutable Cargo sigue siendo 0.52.0-alpha.1. No es todavía una distribución autónoma ni existe un instalador publicado.

## Arquitectura actual

Tauri 2 / Rust abre la interfaz compartida desde el gateway Python propio en 127.0.0.1:5920. En esta etapa de desarrollo el gateway utiliza el DWSIM MCP existente de Debian (127.0.0.1:5901), compartido con el servicio Online; no arranca ni detiene ese MCP. El gateway Online permanece en 5910. El modo explícito `--desktop` evita las consultas de sesión, biblioteca cloud y registro del service worker. La capa visual Desktop se encuentra en `site/desktop-shell.js` y `site/desktop-theme.css`. No se modifica la lógica científica por duplicado.

## Estado funcional y evidencia

| Función | Estado |
| --- | --- |
| Compilación Tauri y ventana nativa Debian | Comprobado por el desarrollador en su equipo |
| Inicio del gateway y carga del editor completo | Comprobado |
| Cálculo estacionario, Ejemplo 01 | Comprobado: 1,22 s en captura, 2 kg/s entrada y salida, residuo 0 kg/s |
| Recirculaciones simples | Dos corridas correctas (1,132 y 1,005 s en respuesta HTTP); topología no admitida rechazada con HTTP 422 |
| Ejemplo 20 dinámico | Integración finalizada en 6,832 s; validación numérica completa de puntos Desktop pendiente |
| Acceso sin clase | Comprobado por uso del editor |
| Menús, iconos y tema Desktop | Primera revisión visible en capturas; segunda revisión (d1d283a) implementada, pendiente de comprobación específica |
| Guardar JSON | Botón conectado a exportación existente; guardado nativo y Guardar como pendientes |
| Identificación del motor | Corrección Debian y ausencia de conmutación remota implementadas; diagnóstico inicial aún registraba windows erróneamente |
| Cierre del gateway | Código de limpieza implementado; verificación de procesos pendientes |
| Exploración paso a paso dinámica | Pendiente común Online/Desktop, postergada |
| Instalación autónoma y prueba offline | Pendiente |

El registro de diagnóstico del 26/11 contiene también un cálculo estacionario con IAPWS-IF97 (1,270 s) y otro con Peng-Robinson (1,678 s). Son tiempos observados, no benchmarks. El adaptador dinámico solo admite el circuito de agua con tanque y dos válvulas. La recirculación solo admite el lazo simple sin reacción.

## Ejecutar el prototipo en Debian 12

Requisitos: Git, Python existente, DWSIM MCP local operativo, Rust/Cargo, herramientas de compilación y WebKitGTK 4.1. El usuario final no deberá instalarlos manualmente en la futura distribución.

En el repositorio existente, utilizar un worktree separado:
```bash
cd ~/lemeit-sim
git fetch origin
git worktree add --detach ~/lemeit-sim-desktop origin/feat/desktop-foundation
cd ~/lemeit-sim-desktop
bash desktop/scripts/check-debian.sh
```

Si faltan dependencias Tauri:
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file pkg-config libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```
Instalar Rust desde [rustup.rs](https://rustup.rs/) si no está disponible. No detener los servicios Online.

Para actualizar y ejecutar, con la ventana anterior cerrada:
```bash
cd ~/lemeit-sim-desktop
git fetch origin
git switch --detach origin/feat/desktop-foundation
export SIM_DESKTOP_MCP_TOKEN_FILE="$(systemctl show lemeit-sim.service -p ExecStart --value | sed -n 's/.*--mcp-token-file[ =]\([^ ;}]*\).*/\1/p')"
test -n "$SIM_DESKTOP_MCP_TOKEN_FILE" && test -r "$SIM_DESKTOP_MCP_TOKEN_FILE" && (
  cd desktop/src-tauri
  CARGO_BUILD_JOBS=2 cargo run
)
```
Solo se necesita la ruta del token, nunca publicar su contenido. Si no se encuentra, revisar la configuración del servicio. El puerto 5920 debe estar libre. Evitar simulaciones simultáneas Online/Desktop mientras compartan MCP. No requiere Node.js en este prototipo.

## Ejecutar el prototipo en Windows x64

Requiere Python, Rust MSVC x64, Visual Studio C++ Build Tools, Windows SDK y WebView2. Con el worktree Desktop actualizado:

```powershell
cd C:\GitHub\lemeit-sim-desktop
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop\run-desktop.ps1
```

El script detecta MSVC y SDK instalados y usa por defecto el runtime existente en C:\GitHub\lemeit-sim\.local\runtime; admite parámetros -EngineRoot, -Python, -MsvcRoot y -SdkVersion. No cambia variables permanentes ni detiene Online. Windows usa procesos DWSIM aislados por trabajo. La primera apertura y el catálogo se comprobaron el 27/11; las pruebas de cálculo y el nuevo script aún requieren validación en Windows.

## Primera distribución y actualizaciones

El objetivo es instalar una vez con un instalador de Windows (.exe o .msi) o un paquete .deb y abrir ΣiM desde el menú de aplicaciones. El script PowerShell corresponde al prototipo. Git solo se necesita para traer cambios al worktree de desarrollo.

ΣiM Online se actualiza en el servidor al desplegar una versión. Desktop lleva su propia versión para funcionar sin Internet. Para que la aplicación avise de nuevas versiones y las instale, falta configurar y probar las actualizaciones firmadas de Tauri. En Debian, las actualizaciones del .deb se pueden distribuir con APT si se publica un repositorio o instalando un paquete nuevo. El actualizador integrado de Tauri para Linux usa AppImage.

## Próximos hitos y criterios para liberar

- Guardado y apertura con diálogos nativos. Desktop ya avisa al cerrar con cambios pendientes y permite guardarlos en la biblioteca local.
- Motor MCP independiente, aislamiento del gateway local, puertos sin conflictos, navegación y permisos restringidos, credenciales propias.
- Empaquetado de Python (evaluar PyInstaller), DWSIM y recursos locales con sus licencias y dependencias. Construcciones reproducibles Windows x64 y Debian amd64; evaluar AppImage.
- Pruebas en sistemas limpios desconectados: estacionario, recirculaciones soportadas, Ejemplo 20 (121 muestras, 600 s, nivel final ≈0,333 m, descarga ≈10 kg/s), gráficas, archivos, exportaciones y cierre de procesos. CI compartido Online sin regresiones.
- Al liberar: GitHub Releases con instaladores, SHA-256, requisitos, licencia, fuentes correspondientes, notas de versión, manual local y enlace de descarga en README principal. No publicar como autónomo antes de pasar las pruebas.

## Documentación

[Formato .sim y distribución](DISTRIBUTION.md) · [Historial Desktop](CHANGELOG.md) · [Hoja de ruta general](../docs/roadmap.md) · [Ejemplo 20](../docs/ejemplo-20-tanque-dinamico-dwsim.md) · [README principal](../README.md).

## Seguridad

No reutilizar credenciales de producción en los paquetes. Restringir origen, host, capacidades IPC y rutas de archivos; no conceder ejecución arbitraria desde JS. Resolver puertos sin matar procesos ajenos; autenticar la instancia propia antes de habilitar cálculo. Evaluar aislamiento de otras aplicaciones locales y navegación externa. No afirmar que el instalador funciona offline hasta probarlo desconectado.

## Interfaz compartida 0.51.10

El PFD y la distribución de grupos de herramientas comparten la implementación de Online. F1 abre el manual incluido. Los enlaces externos permitidos se abren con Tauri Opener. La biblioteca local guarda proyectos en el perfil de ΣiM Desktop de este equipo. El menú Archivo permite guardar una copia JSON.
