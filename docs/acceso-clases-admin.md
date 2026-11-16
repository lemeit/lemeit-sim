# Acceso por código de clase y administración de ΣIM

## Objetivo

Los alumnos ingresan con un código temporal y **sin correo ni cuenta individual**. La sesión
se entrega en una cookie `HttpOnly; Secure; SameSite=Strict`, válida hasta cuatro horas,
o hasta la caducidad/desactivación del código. El administrador usa una credencial
distinta, almacenada solo como **secret** de Cloudflare, con sesión de hasta ocho horas.

Los cálculos **no son públicos**: el Worker valida la sesión antes de enviar solicitudes
a Windows o Debian; sin configuración de autenticación, responde 503 y **no calcula**.
Hay un límite de 4 solicitudes por minuto y sesión de alumno. Los gateways siguen
aceptando únicamente las claves de origen de Cloudflare; nunca exponer los puertos.

## Recursos Cloudflare y configuración

La base dedicada `lemeit-sim-auth` está identificada en `wrangler.jsonc` como
`SIM_AUTH_DB`. Las migraciones están versionadas en `migrations/`.

Hay que configurar **dos secretos antes de cualquier publicación**:
```powershell
cd C:\GitHub\lemeit-sim
npx wrangler secret put SIM_SESSION_SECRET
npx wrangler secret put SIM_ADMIN_PASSWORD
```
El primero debe ser aleatorio y tener **al menos 32 caracteres**; usar un generador
criptográfico seguro, no una palabra memorizable. El segundo debe ser una contraseña
única de **al menos 20 caracteres**. **Nunca guardar ni pegar valores en GitHub, chats
o archivos del repositorio**. Usar un administrador de contraseñas.
Cloudflare admite estos secretos como bindings; no deben agregarse a `vars`.

`SIM_AUTH_DB` debe contener tablas `classes`, `sessions`, `login_attempts`
y `calculation_usage`. Antes de desplegar, verificar manualmente la base y su
binding en el ambiente correcto; una base remota distinta no se migra sola.

## Accesos

- `/acceso.html`: pantalla pública con código de clase o credencial administrativa.
- `/admin.html`: **requiere rol admin**; crea códigos de 12 caracteres, nombre de clase
  y plazo de 2 a 720 horas; permite desactivarlos. Los nuevos códigos activos quedan visibles y copiables en el listado privado.
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`: autenticación.
- `/api/auth/create-class`, `/api/auth/disable-class`, `/api/auth/list-classes`:
  acciones administrativas con sesión activa.
- `/api/catalog`, `/api/status`, `/api/simulate`: requieren sesión válida.
  Los recursos estáticos privados también quedan restringidos. Alumnos no acceden
  al panel ni a su código JavaScript.

Los intentos de acceso fallidos se limitan por IP y rol (5 en 15 minutos);
se recomienda agregar protección WAF/rate limiting en Cloudflare para abuso
distribuido. Los códigos de clase son credenciales compartidas: entregarlos solo
a la clase, rotarlos, revocarlos cuando termine el curso y reducir duración.
No sustituyen identidades individuales ni generan trazabilidad personal.

## Administración de equipos

El panel muestra estado y guía de recuperación. **No hay botones remotos
de inicio, detención o reinicio**. Los procesos locales deben supervisarse desde
Windows y Debian con cuentas autorizadas. Un servicio caído puede reiniciarse
remotamente solo si existe un supervisor independiente, autentificado y limitado
a comandos autorizados. Una máquina apagada o sin energía **no puede encenderse
mediante su propio túnel Cloudflare**.

Windows utiliza un acceso directo al iniciar sesión; Debian tiene `systemd`.
Para encendido tras volver la luz, investigar en el BIOS/UEFI opciones de
`Restore on AC Power Loss` o similares, y su compatibilidad con el equipo.
Para encendido remoto sin presencia física se requeriría una infraestructura
adicional (Wake-on-LAN con agente de la red encendido, equipo de gestión remota,
o dispositivo de energía correctamente instalado).

## Pruebas y publicación

1. Ejecutar `npm test` y `npm run build:verified`.
2. Verificar 503 sin secretos; 401 sin sesión al configurar secretos; 403 de alumno
   al intentar acceder a admin; rechazo por cuota y 429 de intentos excesivos.
3. Probar en staging con base separada antes de desplegar al dominio público.
4. Configurar secretos y base remota; verificar ambas máquinas separadamente.
5. Publicar con `npm run deploy` solo después de pruebas end-to-end exitosas.

## Identidad y tiempo restante

El pie del editor identifica al alumno y su clase; el administrador ve «Administrador · Sesión administrativa» sin contador, tanto en editor como en panel privado. Solo para alumnos, la franja muestra el tiempo restante efectivo: el menor entre el plazo de clase y el vencimiento de la sesión (máximo 4 horas para alumnos, 8 para administradores). Si la clase dura más que la sesión, informa la fecha de cierre de clase y permite volver a ingresar para renovar acceso. El contador se sincroniza con la hora del servidor y revalida cada minuto y al volver a la pestaña. Al vencer o desactivarse, avisa sin descartar el proyecto; los cálculos siguen sujetos a autorización en servidor.

## Separación de accesos e interfaz

«Estado de motores» en el editor es un monitor de consulta sin administración de clases ni controles remotos. «Administración de clases» solo aparece para el administrador y su página exige rol admin en servidor; acceder con una sesión de alumno redirige al ingreso administrativo. Las APIs administrativas responden 403 al alumnado. Elegir Administrador en la pantalla de ingreso no concede permisos: es obligatorio validar la contraseña.

La pantalla de ingreso indica si ya hay una sesión abierta. «Salir» cierra la sesión actual antes de cambiar de acceso. En el panel privado, las clases se crean y consultan antes del bloque separado de motores. Los diálogos admiten cierre por botón, Escape y clic fuera.

## Consulta de códigos activos

Desde 0.17.0 se conserva el HMAC para validar el ingreso y una copia cifrada con AES-GCM para permitir consulta posterior exclusivamente al administrador. La clave se deriva con contexto propio de `SIM_SESSION_SECRET`; el cifrado queda ligado al ID de clase. Nunca se guarda el código en claro en la base. El listado entrega el código solo si la clase está activa y no venció; no envía el cifrado ni el HMAC al navegador.

Aplicar `0003_recoverable_class_codes.sql` antes de publicar. Los códigos anteriores quedan sin copia cifrada y no se pueden recuperar: siguen funcionando, pero para volver a compartir un código desconocido hay que crear un acceso nuevo. Cambiar `SIM_SESSION_SECRET` también impide descifrar códigos guardados con la clave anterior; no rotarla sin planificar renovación de códigos.
