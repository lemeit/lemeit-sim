# Selección manual de motor · Windows / Debian (online)

Esta rama incorpora un selector explícito de motor junto a **Calcular**. No hay balanceo, detección de respaldo ni conmutación automática.

## Compatibilidad

- **PC remota · Windows**: opción predeterminada; usa los secretos y el endpoint existentes `ENGINE_URL` y `ORIGIN_KEY`.
- **Notebook · Debian (online)**: usa `DEBIAN_ENGINE_URL` y `DEBIAN_ORIGIN_KEY` cuando estén configurados en el Worker.
- El navegador envía exclusivamente la cabecera `X-SIM-Engine: windows|debian`, nunca URL ni credenciales.
- `GET /api/catalog` prueba el motor seleccionado. Antes de `POST /api/simulate` se repite la comprobación.
- Si falla la comprobación o el cálculo, se muestra el error sin intentar otro motor.
- Cambiar de motor no modifica el JSON del proyecto. Los resultados anteriores se invalidan al cambiar de motor.

## Configuración pendiente del operador

1. Instalar DWSIM MCP Linux compatible en la notebook y validar los ejemplos en modo local.
2. Adaptar `server.py` al lanzador Linux; el código actual usa `server/dwsim-mcp.exe` y tiene detalles exclusivos de Windows.
3. Configurar un gateway Python autenticado y un túnel saliente Cloudflare para la notebook; no publicar directamente DWSIM MCP.
4. En Cloudflare Worker **lemeit-sim**, configurar `DEBIAN_ENGINE_URL` con un endpoint HTTPS dedicado y `DEBIAN_ORIGIN_KEY` como secreto privado. El backend Debian debe comprobar esa credencial y un Host esperado.
5. Probar `GET /api/catalog` y una simulación real en ambos motores antes de fusionar la rama.
6. Incrementar versión del portal, changelog y Acerca de en una entrega posterior validada. No fusionar como versión final sin esas verificaciones.

**Importante:** la interfaz y el Worker no instalan ni encienden DWSIM en Debian. Hasta que se configure el segundo origen, seleccionar Debian mostrará que no está configurado. La instalación offline requiere servir `site/` y la API en la notebook; no se incorpora aquí.
