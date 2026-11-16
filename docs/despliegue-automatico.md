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

## Verificación local sin publicar

```powershell
npm ci
npm run build:verified
python -m unittest test_server.ValidationTests test_stream_properties.StreamValidation -v
npm run deploy:check
```

## Referencias oficiales

- [Conectar un Worker existente](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Comandos y configuración del build](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Conservar variables, secretos y rutas](https://developers.cloudflare.com/workers/wrangler/configuration/)
