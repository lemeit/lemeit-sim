# Acceso por clase y seguridad

Estado vigente: portal 0.17.2 · revisión 16/11/2026. Para el uso cotidiano del panel, ver [Administración de clases](administracion-clases.md).

## Roles y sesiones

| Acceso | Credencial | Permisos | Duración de sesión |
| --- | --- | --- | --- |
| Alumno | Código compartido de clase, 12 caracteres | Editor, ejemplos, catálogo, cálculo y monitor de consulta | Hasta 4 h, sin superar el vencimiento o desactivación de la clase |
| Administrador | Contraseña independiente | Editor y panel privado para crear, consultar y desactivar clases | Hasta 8 h; no muestra contador en pantalla |

No hay correo ni cuentas personales del alumnado. La vigencia de clase empieza al crear el código. La interfaz ofrece 2, 4, 8 y 24 horas, o 7 días; la API administrativa admite horas enteras entre 1 y 720. Son plazos de clase, no una extensión automática de cada sesión individual.

La cookie de sesión es `HttpOnly; Secure; SameSite=Strict`, con un identificador aleatorio. El Worker valida sesión, rol, vencimiento y estado de clase antes de reenviar solicitudes a los motores. El pie muestra identidad y, solo para alumnos, cuenta regresiva sincronizada con el servidor. Al vencer, avisa sin descartar el proyecto.

## Rutas y límites

- Enlaces directos a páginas protegidas sin sesión redirigen al ingreso con un aviso y vuelven a la página solicitada tras autenticarse; los destinos están limitados a páginas conocidas del portal. Las APIs y los scripts no redirigen.
- `/acceso.html`: ingreso público; muestra si ya hay una sesión abierta. Cambiar una opción del formulario no cambia el rol sin validar su credencial.
- `/admin.html`: panel privado. Sin sesión administrativa, redirige al ingreso con Administrador seleccionado. Los scripts privados y las APIs no se habilitan por ocultar o mostrar enlaces.
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`: inicio, salida y estado de la sesión actual.
- `/api/auth/create-class`, `/api/auth/list-classes`, `/api/auth/disable-class`: requieren rol admin; el alumnado recibe 403.
- `/api/catalog`, `/api/status`, `/api/simulate`: requieren sesión válida. Sin sesión, la API devuelve 401; si falta configuración válida, falla cerrada con 503.
- Cálculos: hasta 4 por minuto y sesión de alumno. Intentos fallidos: 5 por 15 minutos, por IP y tipo de ingreso. No equivale a una prueba de carga concurrente ni a una protección total contra abuso distribuido.

**Herramientas → Estado de motores** es solo consulta y está disponible para usuarios autenticados. **Administración de clases** queda reservada a admin. No hay controles remotos de inicio, parada ni reinicio.

## Recursos y secretos

Worker `lemeit-sim`, dominio `sim.lemeit.ar`, base D1 `lemeit-sim-auth` vinculada como `SIM_AUTH_DB` en `wrangler.jsonc`.

| Nombre | Tipo y finalidad |
| --- | --- |
| `SIM_SESSION_SECRET` | Secret aleatorio de al menos 32 caracteres: firma de sesiones/códigos y derivación de clave de cifrado |
| `SIM_ADMIN_PASSWORD` | Secret con contraseña administrativa única de al menos 20 caracteres |
| `ORIGIN_KEY` / `DEBIAN_ORIGIN_KEY` | Secrets de comunicación con los gateways; no son contraseñas de alumnos |
| `ENGINE_URL` / `DEBIAN_ENGINE_URL` | Direcciones públicas de los gateways en configuración |

Configurar secretos directamente en Cloudflare o mediante la herramienta oficial, sin pegarlos en chats, GitHub, comandos con valores visibles ni archivos versionados. Guardarlos en un gestor de contraseñas. La carga mediante `wrangler secret put` publica inmediatamente una nueva versión del Worker; para preparar una versión sin desplegar, usar el flujo de secretos versionados de Cloudflare. Los despliegues normales conservan los secretos existentes.

La configuración rechaza claves demasiado cortas. El diagnóstico registra solo los nombres de requisitos incumplidos, nunca valores ni longitudes de credenciales.

## Códigos consultables y migraciones

La base contiene `classes`, `sessions`, `login_attempts` y `calculation_usage`. Las migraciones versionadas son:

1. `0001_class_access.sql`: clases, sesiones e intentos.
2. `0002_calculation_quotas.sql`: cuota por sesión.
3. `0003_recoverable_class_codes.sql`: columna nullable `code_encrypted`.

Desde 0.17.0 se conserva el HMAC para validar el ingreso y una copia cifrada AES-GCM para permitir consulta posterior exclusivamente al administrador. La clave se deriva con contexto propio de `SIM_SESSION_SECRET`; el cifrado queda ligado al ID de clase. El listado devuelve el código solo si la clase sigue activa y vigente; no envía el cifrado ni el HMAC al navegador.

Los códigos anteriores no tienen copia cifrada y no pueden recuperarse, pero siguen siendo válidos hasta su vencimiento/desactivación. No se regeneran ni se invalidan clases al migrar. Si no se conservó un código anterior, crear un acceso nuevo. Una rotación de `SIM_SESSION_SECRET` invalida sesiones/códigos firmados con la clave anterior e impide descifrar su copia: planificar la renovación antes de cambiarlo.

Los códigos son credenciales compartidas: se pueden reenviar, no identifican individualmente a alumnos y se comparten solo con la clase correspondiente.

## Publicación y comprobaciones

La aplicación ya está publicada; las propuestas anteriores no son requisitos pendientes de activación. Las entregas de acceso se publicaron por autorización del titular, con comprobaciones automáticas y recorridos locales con base en memoria. No se afirma un ensayo de carga ni una prueba integral independiente de todos los escenarios en producción.

Para próximas entregas: compilar y ejecutar comprobaciones relevantes; aplicar migraciones a la base y ambiente correctos antes del código que las necesita; revisar el despliegue efectivo y la versión de Ayuda → Acerca de. Usar un entorno aislado para ensayos que puedan alterar accesos reales. Ver [publicación y mantenimiento](despliegue-automatico.md).

La web no enciende computadoras ni reinicia DWSIM. Recuperación y supervisión se realizan en cada equipo: [operación local](operacion-local.md) y [selección de motores](seleccion-manual-motores.md).
