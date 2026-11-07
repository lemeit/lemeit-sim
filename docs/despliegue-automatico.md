# Despliegue automático de SIMPROX

## Cuándo conectar Cloudflare

Primero fusionar el PR que incorpora package.json, package-lock.json y wrangler.jsonc.
Después conectar el repositorio al Worker existente. No crear otro Worker ni un
proyecto Pages. La conexión inicial puede disparar el primer despliegue de main.

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
compatibilidad 2026-11-06. ENGINE_URL está declarada en la configuración pública.
keep_vars preserva las variables adicionales del panel. ORIGIN_KEY permanece como
secreto de ejecución en Settings → Variables & Secrets: los despliegues normales
de Wrangler conservan los secretos existentes. No agregar su valor a ningún archivo.

No se declaran rutas nuevas y workers_dev=false mantiene los dominios administrados
desde el panel; sim.lemeit.ar sigue asociado al mismo Worker. No se modifica DNS,
Tunnel ni el puerto MCP. No se crean servicios pagos mediante esta configuración.

## Flujo cotidiano

1. Preparar una rama, incrementar la versión y actualizar Acerca de, README e historial.
2. Abrir PR. GitHub Actions ejecuta pruebas, validación de versión, build y dry-run.
3. Revisar los checks y fusionar en main. Si se quiere impedir fusiones con checks
   fallidos, configurar aparte una regla de rama que exija el job verificar.
4. Workers Builds ejecuta pruebas JS y build; solo publica si ambos pasan.
5. En Builds comprobar Success y el commit desplegado. Recargar sim.lemeit.ar y
   revisar Ayuda → Acerca de. El primer despliegue de esta configuración debe mostrar 0.2.1.
6. Si hay un fallo, abrir el registro del build; no volver a copiar secretos.

GitHub Actions no despliega: solo hay un publicador (Cloudflare), evitando dos
procesos que sobrescriban la misma versión. Los PR no publican en producción.

## Backend de la PC

La web se publica automáticamente; server.py y DWSIM siguen en la PC. Si una entrega
modifica server.py, actualizar el repositorio local y reiniciar el servicio:

```powershell
cd C:\GitHub\lemeit-sim
.\stop-online.ps1
# Actualizar a la rama/commit aprobado con el árbol de trabajo limpio.
.\start-online.ps1
```

La 0.2.0 cambió server.py: para el primer despliegue automático hay que tener esa
actualización en el gateway. Una API pública con catálogo disponible no prueba que
el gateway ya cargó el backend nuevo. Al actualizar, verificar también un cálculo.
El binario DWSIM y las claves no cambian en esta entrega. No se automatiza inicio
al encender Windows ni ejecución remota de comandos en la PC.

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
