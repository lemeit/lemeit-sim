# Historial de ΣIM Desktop

El historial de Desktop es independiente del [historial del portal](../docs/CHANGELOG.md). Las entradas alpha son hitos de desarrollo, no distribuciones publicadas.

## alpha.2 — en desarrollo · 26/11/2026

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
