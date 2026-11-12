# Motores Windows y Debian · configuración y operación

## Estado documentado al 12/11/2026

El segundo motor Debian está incorporado y configurado como destino alternativo
según la continuidad del proyecto. Windows sigue predeterminado. El selector está
en el **footer**, no junto al botón Calcular. No hay balanceo ni respaldo automático.
Que un destino esté configurado no confirma que su servicio esté encendido.

| Selección | Variable de destino | Secreto del Worker | Integración local |
| --- | --- | --- | --- |
| Windows | `ENGINE_URL=https://engine-sim.lemeit.ar` | `ORIGIN_KEY` | `--engine-root`, proceso aislado por trabajo |
| Debian | `DEBIAN_ENGINE_URL=https://sim-debian.lemeit.ar` | `DEBIAN_ORIGIN_KEY` | `--mcp-token-file`, MCP HTTP autenticado |

Las URL están en `wrangler.jsonc`. Los valores de los secretos no están en Git.
El Worker solo acepta `windows` o `debian` en `X-SIM-Engine`. Antes de calcular se
comprueba el catálogo del destino seleccionado. Un fallo no envía datos al otro
motor. Cambiar de motor invalida los resultados vigentes sin modificar el JSON.

## Windows

Desde PowerShell:

```powershell
cd C:\GitHub\lemeit-sim
.\start-online.ps1
# Para detener gateway y túnel:
.\stop-online.ps1
```

Runtime predeterminado: `.local/runtime`, excluido de Git. El gateway usa
`127.0.0.1:5911`; no requiere MCP HTTP 5901 ni abrir la aplicación DWSIM de escritorio.
Desde 0.7.1 se ofrece inicio automático Windows opcional con `enable-autostart.ps1`
y `disable-autostart.ps1`; se ejecuta al entrar a la sesión del usuario. Ver
[operación local](operacion-local.md).
Para una vista local independiente: `.\start-local.ps1`, puerto 5910, Ctrl+C para salir.

## Debian

La notebook utiliza tres piezas: DWSIM MCP escuchando solo en
`127.0.0.1:5901/mcp`, gateway Python y su propio Cloudflare Tunnel. Deben estar
activas las tres para calcular desde el portal. Los scripts PowerShell de Windows
no arrancan ni detienen la notebook.

El gateway admite `--mcp-token-file` para leer un archivo privado con el token MCP,
y `--mcp-url` restringido a `http://127.0.0.1:5901/mcp`. Ejemplo de comprobación
local, usando un archivo de token previamente configurado:

```bash
python3 -m unittest test_server.ValidationTests test_server.RemoteMcpTests -v
python3 server.py --mcp-token-file "$HOME/.config/lemeit-sim/mcp-token" --port 5910
```

La ruta del token es un ejemplo: usar la de la instalación real. Protegerlo con
permisos de lectura limitados; nunca mostrar su contenido ni subirlo a Git.
No se necesita volver a extraer ni regenerar credenciales para comprobar conexión.

En modo local se abre `http://127.0.0.1:5910`. El selector puede decir Windows
porque la API local atiende directamente el backend iniciado: esto no prueba el
enrutamiento entre dos destinos en Cloudflare. La selección remota se comprueba
en `https://sim.lemeit.ar`.

Para publicación, el gateway se ejecuta además con `--public-origin` y
`--origin-key-file`. Este archivo contiene la clave del origen Debian, distinta
del token MCP; su valor debe coincidir con `DEBIAN_ORIGIN_KEY` del Worker.
El túnel debe apuntar al puerto local del gateway y enviar Host
`sim-engine.internal`; el gateway exige ese Host y `X-Origin-Key` válido.
No exponer el puerto MCP directamente a Internet.

El repositorio no contiene scripts de arranque/apagado Debian ni identifica las
unidades systemd de esa instalación. No se documentan nombres de servicios ni
arranque automático no verificados. Para administrarlos deben consultarse las
unidades existentes en la notebook; esta actualización no las modifica.

## Qué se comprobó

El historial 0.6.0 registra una prueba local Debian de mezcla de agua: 2 kg/s y
50,02138676 °C. El 12/11/2026 la notebook estaba apagada y los ejemplos 06–08
se ejecutaron exclusivamente en Windows. Ver [informe](validacion-windows-0.7.0.md).
No se afirma disponibilidad actual de Debian ni validación cruzada completa.

El monitor distingue disponibilidad del catálogo y ejecución de cálculos. Un
catálogo HTTP 200 no prueba una corrida. Al seleccionar Debian con la notebook
apagada debe mostrarse indisponibilidad, sin usar Windows como reemplazo.
