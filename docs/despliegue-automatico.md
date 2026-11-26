# Despliegue automático de ΣIM

## Estado actual · revisión 16/11/2026

Workers Builds ya está conectado al repositorio y publica al actualizar `main`.
No hace falta volver a conectar ni crear otro Worker o proyecto Pages.
La tabla siguiente documenta la configuración existente.

## Configuración en el panel

Workers & Pages → lemeit-sim → Settings → Builds → Connect.

| Campo | Valor |
| --- | --- |
| Repositorio | lemeit/lemeit-sim |
| Rama de producción | main |
| Directorio raíz | / (raíz del repositorio) |
| Comando de compilación | npm run build:verified |
| Comando de despliegue | npm run deploy |
| Compilaciones de otras ramas / previews | Desactivadas por ahora |

Usar npm con el package-lock.json del proyecto. Workers Builds instala las
dependencias antes del comando de compilación. Si el panel solicita versión de
Node, usar 24 (también probada en GitHub Actions). Wrangler está fijado en
package.json; no usar una versión global ni sustituirlo por un asistente que
reescriba la configuración.

Cloudflare puede pedir instalar o autorizar su integración de GitHub: seleccionar
solo este repositorio. Usar la credencial de despliegue administrada por Workers
Builds que ofrezca el panel. No copiar la clave del motor a GitHub ni al build.

## Variables y dominio existentes

wrangler.jsonc apunta a lemeit-sim en la cuenta existente y conserva la fecha de
compatibilidad 2026-11-06. `ENGINE_URL` y `DEBIAN_ENGINE_URL` están declaradas en la configuración pública.
keep_vars preserva las variables adicionales del panel. `ORIGIN_KEY` y `DEBIAN_ORIGIN_KEY` permanecen como
secretos de ejecución en Settings → Variables & Secrets: los despliegues normales
de Wrangler conservan los secretos existentes. No agregar su valor a ningún archivo.

No se declaran rutas nuevas y workers_dev=false mantiene los dominios administrados
desde el panel; sim.lemeit.ar sigue asociado al mismo Worker. No se modifica DNS,
Tunnel ni el puerto MCP. No se crean servicios pagos mediante esta configuración.

## Acceso por clases y migraciones D1

`SIM_AUTH_DB` vincula la base `lemeit-sim-auth`. Antes de publicar código que necesite columnas nuevas, aplicar las migraciones versionadas al ambiente correcto:

```powershell
npx wrangler d1 migrations list lemeit-sim-auth --remote
npx wrangler d1 migrations apply lemeit-sim-auth --remote
```

Las migraciones 0001–0003 están aplicadas en la base de producción al 16/11/2026. Incluyen clases, sesiones, intentos, cuotas y copia cifrada de nuevos códigos. No reemplazan las clases ni permiten recuperar códigos antiguos guardados solo como HMAC.

Además de las claves de origen, el Worker requiere `SIM_SESSION_SECRET` (aleatoria, mínimo 32 caracteres) y `SIM_ADMIN_PASSWORD` (mínimo 20). Se almacenan como Secrets, no en `vars`, Git ni archivos de build. Cambiar `SIM_SESSION_SECRET` invalida sesiones y códigos existentes, e impide descifrar su copia anterior: planificar la renovación.

`workers_dev=false` y `preview_urls=false` conservan desactivadas esas URLs alternativas. Las versiones no sustituyen ni migran automáticamente una base D1 diferente. Ver [acceso y seguridad](acceso-clases-admin.md).

## Flujo cotidiano

1. Preparar una rama, incrementar la versión y actualizar Acerca de, README e historial.
2. Abrir PR. GitHub Actions ejecuta pruebas, validación de versión, build y dry-run.
3. Revisar los checks y fusionar en main. Si se quiere impedir fusiones con checks
   fallidos, configurar aparte una regla de rama que exija el job verificar.
4. Workers Builds ejecuta pruebas JS y build; solo publica si ambos pasan.
5. En Builds comprobar Success y el commit desplegado. Recargar sim.lemeit.ar y
   revisar Ayuda → Acerca de. El portal documentado es 0.17.2; comparar siempre con la versión del commit desplegado.
6. Si hay un fallo, abrir el registro del build; no volver a copiar secretos.

GitHub Actions valida y no despliega. Workers Builds es el publicador habitual al fusionar en `main`; los PR no publican en producción. Hubo publicaciones manuales autorizadas con Wrangler durante la puesta en marcha. Evitar publicar manualmente mientras otro build de `main` sigue activo: comprobar el despliegue que finalmente sirve el dominio.

## Backends Windows y Debian

La web se publica automáticamente; server.py y DWSIM siguen en la PC. Si una entrega
modifica server.py, actualizar el repositorio local y reiniciar el servicio:

```powershell
cd C:\GitHub\lemeit-sim
.\stop-online.ps1
# Actualizar a la rama/commit aprobado con el árbol de trabajo limpio.
.\start-online.ps1
```

Una API con catálogo disponible no prueba que el gateway haya cargado el backend
nuevo: verificar también un cálculo. Debian tiene su propia instalación y túnel;
actualizar y reiniciar allí según su configuración existente, sin ejecutar los
scripts Windows para administrarlo. El despliegue del Worker conserva los dos
destinos y sus secretos; no enciende equipos ni instala DWSIM.
Ver [selección manual y operación](seleccion-manual-motores.md).


## Compatibilidad de gateways Windows y Debian (0.33.0)

**No confundir** la versión del repositorio con el proceso que continúa sirviendo la API. El portal se publica por Cloudflare Workers Builds desde `main`; los gateways locales no se reinician con un `git pull`. El monitor de **Herramientas → Estado de motores** y la sección homónima en Administración consultan cada `/api/status` con el encabezado `X-SIM-Engine` del motor correspondiente. Un fallo de consulta se muestra como «Sin datos», nunca como «No admite».

### Antes de actualizar

1. Guardar los proyectos abiertos y verificar que no haya un cálculo en curso. Comprobar en GitHub que la versión deseada pasó CI y que Workers Builds terminó con éxito.
2. En cada equipo, revisar cambios locales (`git status --short`), rama y versión; no sobrescribir archivos modificados ni secretos locales.
3. Mantener la selección del motor **manual**; nunca activar failover implícito. Actualizar un gateway por vez para poder comprobarlo y conservar el otro como alternativa.

### Debian (gateway ΣIM, puerto 5910)

```bash
cd ~/lemeit-sim
git status --short
git pull --ff-only origin main
python3 -m unittest tests.python.gateway.test_server.ValidationTests tests.python.gateway.test_stream_properties.StreamValidation -v
systemctl show lemeit-sim.service -p WorkingDirectory -p ExecStart --no-pager
sudo systemctl restart lemeit-sim.service
systemctl is-active lemeit-sim.service
curl --fail --silent --show-error http://127.0.0.1:5910/api/status | python3 -c '
import json,sys
data=json.load(sys.stdin)
print("Gateway:",data.get("gateway_version"))
print("Expansor:", "Expander" in data.get("supported_equipment", []))
print("Operaciones:", ", ".join(data.get("supported_equipment", [])))
'
```

Esperar una versión igual a `package.json` cuando el servicio ejecute ese árbol; verificar las operaciones requeridas. **No reiniciar** `dwsim-mcp.service` ni `cloudflared.service` si funcionan. Si falla, consultar `sudo journalctl -u lemeit-sim.service -n 60 --no-pager` sin divulgar tokens.

### Windows (gateway ΣIM)

En PowerShell, en el equipo Windows, comprobar primero que no haya cálculos en curso ni cambios locales:

```powershell
cd C:\GitHub\lemeit-sim
git status --short
git pull --ff-only origin main
python -m unittest tests.python.gateway.test_server.ValidationTests tests.python.gateway.test_stream_properties.StreamValidation -v
.\stop-online.ps1
.\start-online.ps1
```

Comprobar el endpoint local `/api/status` según el puerto configurado en `start-online.ps1` (no asumir que es igual al de Debian). Evitar imprimir claves o argumentos con tokens. **No reiniciar la PC**, DWSIM MCP ni túneles si no es necesario.

### Validación cruzada

1. En el portal desplegado, abrir **Herramientas → Estado de motores** y pulsar **Actualizar estado**. Deben figurar ambos servicios y la tabla de operaciones. Si hay «Sin datos», no concluir que una operación es incompatible.
2. Comprobar que la versión real del gateway coincide con la versión esperada y que el equipo requerido figura como «Admite». Una versión diferente **no demuestra** por sí sola incompatibilidad; la lista de operaciones sí permite identificar las ausentes.
3. Probar un ejemplo de cada operación modificada (por ejemplo, Ejemplo 16 para `Expander`) **en cada motor**, y comparar balances y resultados dentro de tolerancias.
4. Si aparece «No admite», actualizar el gateway correspondiente. Si la operación aparece como admitida pero falla, revisar el log de diagnóstico; capacidad anunciada no equivale a ejecución correcta.
5. Si los endpoints locales son correctos pero el portal no, revisar el gateway público, los túneles y el Worker; no copiar secretos a tickets ni GitHub.

El monitor nunca instala, reinicia ni modifica servicios; las actualizaciones son acciones explícitas del administrador.

## Verificación local sin publicar

```powershell
npm ci
npm run build:verified
python -m unittest tests.python.gateway.test_server.ValidationTests tests.python.gateway.test_stream_properties.StreamValidation -v
npm run deploy:check
```

## Referencias oficiales

- [Conectar un Worker existente](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Comandos y configuración del build](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Conservar variables, secretos y rutas](https://developers.cloudflare.com/workers/wrangler/configuration/)
