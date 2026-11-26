# ΣIM Desktop — etapa inicial

Base revisada: main, portal 0.51.9 (26/11/2026). No constituye una distribución instalable ni una validación nueva del motor.

## Decisiones

- Un único frontend en site/ y gateway server.py compartido.
- Tauri 2 abre una ventana con la interfaz servida por el gateway local, manteniendo API y recursos del mismo origen. No exponer el servidor a la red.
- Modo Desktop explícito, determinado por el lanzamiento local, nunca por un parámetro de URL que permita omitir autenticación online.
- Prototipo con Python y DWSIM existentes antes del empaquetado. Evaluar PyInstaller one-directory y redistribución de DWSIM por plataforma.
- Sin Cloudflare, D1, sesiones de clase ni motores remotos durante funcionamiento autónomo.
- No cambiar el contrato científico ni simular resultados cuando el motor no está disponible.

## Auditoría inicial

| Componente | Hallazgo y acción |
| --- | --- |
| server.py | Ya enlaza 127.0.0.1; admite argumentos de puerto y motor. Añadir modo explícito, recursos empaquetados y negociación segura de puerto. |
| site/app.js | Usa /api/status, /api/catalog, /api/simulate y SimCloudProjects incluso sin guardar. Separar servicios por modalidad. |
| site/cloud-projects.js | Usa /api/auth/me y servicios de proyectos D1; no iniciar llamadas en Desktop. Mantener contrato de métodos o adaptar consumidores. |
| site/session-banner.js | Consulta sesión al inicio y periódicamente; excluir en modo local. |
| site/engine-routing.js | Solo enumera Windows y Debian; adaptar selección para un motor propio. |
| site/engines-monitor.js | Consulta motores identificados mediante cabecera; presentar estado local real. |
| site/pwa.js | Registra service worker; deshabilitar en Desktop para evitar recursos obsoletos. |
| site/index.html | Menús cloud, administración, sesión y enlaces externos; adaptar sin duplicar frontend. |
| docs/roadmap.md | Conserva referencias históricas; agregar etapa Desktop sin borrar trazabilidad. |

## Secuencia de PR

1. Fundación: auditoría y contrato de modo explícito; luego prueba automatizada de aislamiento cloud y compatibilidad online.
2. Prototipo Tauri: gestión de procesos propios, comprobación de disponibilidad, puerto local, cierre ordenado y archivos JSON mediante diálogos nativos.
3. Empaquetado: Windows x64 y Debian amd64, dependencias, licencias, hashes y construcción reproducible.
4. Validación offline: sistemas limpios sin Python/DWSIM, sin red; ejemplos estacionarios y Ejemplo 20 (121 muestras, 600 s, nivel final ~0.333 m, descarga ~10 kg/s), gráficas, reportes, archivos y cierre.
5. Publicación: releases verificadas, manual local, descargas y actualización documental.

## Seguridad y aceptación

No reutilizar credenciales de producción. Restringir origen, host, capacidades IPC y rutas de archivos; no conceder ejecución arbitraria desde JS. Resolver puertos sin matar procesos ajenos; autenticar la instancia propia antes de habilitar cálculo. Evaluar aislamiento de otras aplicaciones locales y navegación externa. No afirmar que el instalador funciona offline hasta probarlo desconectado. Mantener CI online sin regresiones. La dinámica actual solo cubre el adaptador específico de tanque con válvulas.

## Estado

Auditoría parcial de archivos y propuesta registradas. Código Tauri, cambios funcionales, compilaciones, pruebas y distribución pendientes. No se modifica main en esta etapa.
