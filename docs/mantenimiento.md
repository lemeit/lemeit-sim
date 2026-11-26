# Consolidación de ΣIM

## Estructura y pruebas

- `tests/js/{editor,simulation,content,worker}/` contiene las pruebas Node por área. `npm test` ejecuta todas y `node --test tests/js/simulation/*.mjs` permite limitar la ejecución.
- `tests/browser/` contiene la suite Playwright. Ejecutá `npm run test:exports-browser` con Chromium de Playwright o con `PLAYWRIGHT_CHANNEL=chrome` y Chrome instalado. En PowerShell configurá `$env:PLAYWRIGHT_CHANNEL = 'chrome'`.
- `tests/python/{gateway,simulation,validation}/` contiene las pruebas Python. Desde la raíz, ejecutá `python -m unittest discover -s tests/python -t . -p "*_cases.py"` (en Debian, `python3`).
- `tests/fixtures/` contiene la respuesta de referencia del Ejemplo 06 compartida por las pruebas de exportación Node y Playwright.

Los archivos anteriores de la raíz y de `deploy/` delegan a las pruebas reubicadas. Siguen funcionando `python -m unittest discover`, `python -m unittest test_server.ValidationTests`, `python test_server.py`, `node --test deploy/test-*.mjs` y `node --test deploy/browser-exports.mjs`. Ejecutá una sola ruta por suite para evitar repetir pruebas.

## Dependencias y puntos de entrada

| Área | Requisitos y rutas |
| --- | --- |
| Node | Node ≥22 con `node:test` y `node:sqlite`; CI usa Node 24. `npm ci` instala las versiones fijadas de Playwright y Wrangler desde `package-lock.json`. |
| Pruebas de interfaz y Worker | Usan recursos de `site/`, ejemplos JSON y migraciones de `migrations/`. Playwright utiliza un servidor local y respuestas de prueba. |
| Pruebas Python | Biblioteca estándar; CI usa Python 3.12. Importan `server.py`, `recycle.py`, `dynamic_tank_mcp.py` y utilidades de `tools/`. Los casos con DWSIM real requieren un runtime compatible y `DWSIM_HOME`. |
| Motores | Windows usa los scripts PowerShell en raíz y `.local/runtime`. Debian usa el gateway Python, MCP HTTP local y su túnel. Consultá [Operación y recuperación](operacion-local.md). |
| Despliegue | `deploy/build.mjs` empaqueta `site/` y los módulos de `deploy/` en `.build/worker.mjs`. `wrangler.jsonc` conserva el punto de entrada. `npm run deploy:check` prepara el despliegue sin publicar. |

El flujo de CI usa los comandos npm y conserva sus invocaciones Python compatibles. `tools/` aloja las sondas y validaciones manuales. `.local/runtime` queda privado y fuera de Git.

## Administración prevista

Agente local independiente del gateway, iniciado por sistema operativo. Solo acciones enumeradas (estado, inicio, parada, reinicio, registros filtrados); autenticación administrativa, autorización por motor, auditoría, bloqueo durante cálculos, sin shell arbitraria ni acceso a secretos. Si equipo, agente o red están apagados, el portal no puede arrancarlos. Actualización requiere comprobación de árbol limpio y versión. En Windows el gateway crea procesos MCP aislados; Debian usa MCP HTTP local. No exponer puertos MCP a Internet.

## Offline

Existe arranque local Windows (ver operación-local.md). Validar interfaz con red desactivada: fuentes/recursos locales, acceso local, editor, ejemplos, cálculo y exportación, guardado de JSON. Nube, sesiones remotas y túnel no disponibles. La administración local debe funcionar independientemente del portal. No afirmar compatibilidad offline completa hasta probarla.
