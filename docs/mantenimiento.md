# Consolidación de ΣIM

## Estructura propuesta (no migrada)

site/ interfaz; backend/ gateway y adaptadores; engines/ gestión de motores; tests/ Python, JavaScript, navegador y fixtures; tools/ utilidades; deploy/ Cloudflare; docs/ documentación. .local/runtime queda privado y fuera de Git. Antes de mover archivos inventariar referencias y rutas, actualizar scripts, systemd, CI y documentación en el mismo cambio; verificar pruebas completas y arranque Windows/Debian. No eliminar pruebas por limpieza visual.

## Administración prevista

Agente local independiente del gateway, iniciado por sistema operativo. Solo acciones enumeradas (estado, inicio, parada, reinicio, registros filtrados); autenticación administrativa, autorización por motor, auditoría, bloqueo durante cálculos, sin shell arbitraria ni acceso a secretos. Si equipo, agente o red están apagados, el portal no puede arrancarlos. Actualización requiere comprobación de árbol limpio y versión. En Windows el gateway crea procesos MCP aislados; Debian usa MCP HTTP local. No exponer puertos MCP a Internet.

## Offline

Existe arranque local Windows (ver operación-local.md). Validar interfaz con red desactivada: fuentes/recursos locales, acceso local, editor, ejemplos, cálculo y exportación, guardado de JSON. Nube, sesiones remotas y túnel no disponibles. La administración local debe funcionar independientemente del portal. No afirmar compatibilidad offline completa hasta probarla.
