# Historial de ΣIM Desktop

El historial de Desktop es independiente del [historial del portal](../docs/CHANGELOG.md). Las entradas alpha son hitos de desarrollo, no distribuciones publicadas.

## 0.53.5-alpha.3 — 2026-11-28

- Apertura nativa de proyectos .sim y .json. El paquete Debian registra .sim para abrirlo desde el explorador con ΣIM cerrado.
- Menú Archivo con Abrir, Guardar y Exportar PDF. El aviso muestra la ruta del PDF una vez guardado.

## 0.53.4-alpha.2 — 2026-11-28

- Compilación de un paquete piloto Debian 12 amd64 para el motor MCP existente y preparación de índices APT firmados.

## 0.53.4-alpha.1 — 2026-11-28

- Orden fijo de herramientas en Online y Desktop, con Calcular antes de Diagrama y ajuste automático al ancho.

## 0.53.3-alpha.1 · 28/11/2026

- Guardar copia abre el selector del sistema y confirma la ubicación del archivo .sim al terminar.
- La ayuda local explica la copia portable, la biblioteca y la recuperación del borrador.


## alpha.2 — en desarrollo · 26–27/11/2026

- Debian: el usuario comprobó los doce puntos de validación funcional (PFD, conexiones, barras y persistencia, temas, F1, Wiki, ejemplos 01/20 y cierre); también recuperó un proyecto de biblioteca. Observó una ventana de resultados al inicio que no se reprodujo después de reiniciar y el color rojo tras dinámica. Se modifica la apertura de resultados flotantes sin proyecto y el estado visual del PFD dinámico. Correcciones pendientes de nueva prueba.
- Primera exportación .sim (JSON de proyecto v1), importación .sim/.json y diseño de distribución en DISTRIBUTION.md. Diálogos nativos, asociaciones, paquetes y firmas pendientes.

- Base 0.51.13. Confirma el cierre del proyecto o de la ventana cuando hay cambios sin guardar, incluida la última corrida.

- Base 0.51.12. Evita que las consultas de catálogo y capacidades de Windows compitan con el cálculo local.

- Integra los tiradores discretos y el ajuste de ancho de grupos acoplados y flotantes de la base 0.51.11.

- Integra la interfaz compartida 0.51.10 y adapta los textos de la biblioteca local para Desktop. Se verificaron Acerca de, la biblioteca y F1 en una sesión aislada que solo permitió conexiones al gateway local del puerto 5920.

- Ayuda Desktop: manual breve local (F1), atajos, catálogo integrado, acceso a ejemplos y guía de resoluciones existente. Wiki, DWSIM, GitHub y lemeit mediante Opener Tauri con permisos limitados a enlaces HTTPS del proyecto. Pie Información renombrado Licencias. En Windows, F1 mostró el manual incluido y Opener abrió la wiki en Chrome mientras el editor siguió en su ventana. La verificación en Debian sigue pendiente.

- Primera compilación y apertura de la ventana principal en Windows confirmadas por captura, con catálogo HTTP 200. Rust 1.100, MSVC 14.29 y Windows SDK 10.0.26100.0. Cálculos Windows Desktop pendientes de validación específica.
- Corrige contraste de iconos y foco en cabeceras oscuras bajo tema claro; conserva la familia tipográfica existente.
- Genera iconos PNG e ICO nativos a partir de la geometría y colores del favicon oficial (Σ roja estilizada sobre fondo oscuro), sin dependencias externas.
- Diagnóstico distingue conexión local disponible y plataforma; conserva estados internos de conectividad.
- Añade desktop/run-desktop.ps1 para localizar MSVC x64 y SDK, configurar Python y runtime DWSIM y lanzar Cargo sin modificar el entorno permanente.
- Estas últimas mejoras requieren recompilación y comprobación visual y funcional; no constituyen una release.

- Unifica tipografía de menús y desplegables de la barra Desktop a 12 px y ajusta altura y foco del selector de régimen; comprobación visual pendiente.

- Corrige contraste de menús activos, foco visual de búsqueda y desbordamiento horizontal de herramientas. Ajuste automático de filas sin barra de desplazamiento.
- Corrige selectores del acoplamiento CAD (data-sim-cad-mode) para distinguir ventanas flotantes oscuras de paneles acoplados neutros; unifica proporciones y hover de los controles de cierre. Cambios pendientes de comprobación visual.

- Barra de título propia visible y comprobada mediante captura en Debian; controles individuales aún pendientes de prueba documentada.
- Unificación visual de diálogos internos y paneles flotantes con cabecera oscura compacta, cierre plano y contraste consistente. Paneles acoplados con fondo neutro. Se conservan eventos y comportamiento modal existentes; revisión visual pendiente.

- Barra de título propia de 30 px con logotipo, nombre del proyecto y controles Tauri de minimizar, maximizar/restaurar, cerrar, arrastrar y redimensionar. Conserva decoraciones del sistema si la API no está disponible o rechaza la activación.
- Permisos de ventana limitados a la ventana principal y al origen local 127.0.0.1:5920; sin permisos de archivos ni ejecución de comandos. Menús claros/oscuros separados del título y toolbar horizontal desplazable.
- Implementación pendiente de compilación y prueba real de controles, redimensionamiento, navegación y cierre en Debian. No constituye aún una release.

- Capa visual exclusiva, iconos Nuevo/Abrir/Guardar, menú Archivo local, retirada de controles cloud, ajuste de densidad, fondo claro y ficha Acerca de.
- Primera revisión visual comprobada mediante capturas; refinamiento d1d283a pendiente de comprobación específica.
- Selección local Debian y corrección inicial de identificación; verificar diagnósticos y ausencia de conmutación.
- Guardar sigue conectado a la exportación JSON existente. Diálogos nativos y control de cambios pendientes.
- Sin cambio aún en la versión Cargo; no hay instalador publicado.

## 0.1.0-alpha.1 — 26/11/2026

- Estructura Tauri 2, icono RGBA de respaldo, gateway Python local iniciado desde Rust, modo --desktop y carga del frontend compartido.
- Desactivadas consultas cloud de identidad y proyectos y registro PWA en Desktop.
- Compilación y ejecución comprobadas en Debian 12 x86_64.
- Ejemplo 01 correcto (captura: 1,22 s, residuo másico 0 kg/s); dos recirculaciones simples correctas; rechazo HTTP 422 de topología no soportada; integración dinámica Ejemplo 20 completada en 6,832 s.
- DWSIM MCP aún compartido con el servicio Online. Validación numérica completa del tanque Desktop, cierre de procesos, pruebas offline y empaquetado pendientes.
- Explorador dinámico pendiente común a ambas modalidades, postergado.

## Publicación futura

Cada release incluirá versión del ejecutable y base científica, plataformas comprobadas, cambios, limitaciones, instaladores, SHA-256 y enlaces de documentación. No se atribuirá a Desktop una prueba de Online sin indicarlo.
