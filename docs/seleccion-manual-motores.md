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
2. El backend ya admite `--mcp-token-file` para utilizar DWSIM MCP HTTP en `127.0.0.1:5901` sobre Debian; el modo Windows con `--engine-root` sigue intacto. Validar esta integración desde la notebook antes de fusionar.
3. Configurar un gateway Python autenticado y un túnel saliente Cloudflare para la notebook; no publicar directamente DWSIM MCP.
4. En Cloudflare Worker **lemeit-sim**, configurar `DEBIAN_ENGINE_URL` con un endpoint HTTPS dedicado y `DEBIAN_ORIGIN_KEY` como secreto privado. El backend Debian debe comprobar esa credencial y un Host esperado.
5. Probar `GET /api/catalog` y una simulación real en ambos motores antes de fusionar la rama.
6. Incrementar versión del portal, changelog y Acerca de en una entrega posterior validada. No fusionar como versión final sin esas verificaciones.

**Importante:** la interfaz y el Worker no instalan ni encienden DWSIM en Debian. Hasta que se configure el segundo origen, seleccionar Debian mostrará que no está configurado. La instalación offline requiere servir `site/` y la API en la notebook; no se incorpora aquí.

## Prueba local de Debian (sin publicar)

Desde una copia de esta rama en Debian (Python 3.11+):

```bash
git switch feature/seleccion-motor-debian-online
# Este archivo no debe subirse a Git ni mostrarse en la terminal:
mkdir -p "$HOME/.config/lemeit-sim"
sudo sed -n 's/.*--token \\([^ "]*\\).*/\\1/p' /etc/dwsim-mcp/dwsim-mcp.conf \\
  | install -m 600 /dev/stdin "$HOME/.config/lemeit-sim/mcp-token"
python3 -m unittest test_server.ValidationTests test_server.RemoteMcpTests -v
python3 server.py --mcp-token-file "$HOME/.config/lemeit-sim/mcp-token" --port 5910
```

Abrir `http://127.0.0.1:5910`. La versión local del editor sigue seleccionando Windows por defecto; el gateway Debian local atenderá la opción Windows porque en modo local las solicitudes van directamente a la API y no pasan por el Worker. Esto **no** constituye una prueba del enrutamiento Cloudflare. La prueba online requiere configurar el segundo origen.

El token se guarda en un archivo del usuario con permisos 600; no publicarlo ni enviarlo por chat.
