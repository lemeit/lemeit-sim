# Propuesta de acceso: referencia histórica

La propuesta ya está implementada y publicada. Esta página conserva la dirección anterior para no romper enlaces; para el funcionamiento actual usar:

- [Administración de clases](administracion-clases.md): ingreso, creación/copia/desactivación de códigos y tiempos.
- [Acceso y seguridad](acceso-clases-admin.md): roles, sesiones, cuotas, secretos y almacenamiento cifrado.

## Decisiones adoptadas

Ingreso por código temporal de clase sin correo ni cuentas individuales; administración separada con contraseña; validación en servidor antes de llegar a los motores; vencimiento, desactivación, límite de intentos y cuota por sesión.

Un código compartido puede reenviarse y no identifica a una persona. El secreto de origen protege el gateway y no reemplaza la autenticación de alumnos. La comprobación de Origin tampoco equivale a autenticar una sesión.

La administración remota de procesos y el encendido de computadoras siguen fuera del alcance actual; requieren infraestructura independiente.
