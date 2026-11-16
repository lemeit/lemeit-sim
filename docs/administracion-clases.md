# Administrar clases y accesos

Guía del portal 0.17.2 · revisión 16/11/2026.

## Entrar como administrador

1. Abrir [la pantalla de ingreso](https://sim.lemeit.ar/acceso.html?role=admin).
2. Elegir **Administrador** e ingresar la contraseña privada configurada para el portal.
3. El panel abre **Clases y accesos**. Desde el editor también se llega por **Herramientas → Administración de clases**.

Si el formulario indica que ya hay una sesión abierta, muestra a qué rol o clase pertenece. Para cambiar de acceso se puede cerrar esa sesión. Elegir Administrador no habilita permisos sin validar la contraseña. Una sesión de alumno que intenta abrir el panel privado vuelve al ingreso administrativo.

## Crear una clase

1. Escribir el nombre que verá el alumnado, por ejemplo «Termodinámica · Grupo A».
2. Elegir la vigencia: 2, 4, 8 o 24 horas, o 7 días.
3. Pulsar **Crear código**. La vigencia empieza al crearlo, no al ingresar el primer alumno.
4. Compartir el enlace del simulador y el código de 12 caracteres. No compartir la contraseña administrativa ni las claves de Cloudflare.

El código es compartido por la clase: no crea cuentas personales ni identifica individualmente a cada alumno.

## Consultar y copiar códigos

El listado muestra nombre de clase, código de acceso, estado y vencimiento. Los nuevos códigos activos se pueden copiar nuevamente con **Copiar**, incluso después de recargar. Solo el administrador puede consultarlos.

Los códigos creados antes de 0.17.0 siguen funcionando, pero no tienen una copia recuperable. El listado muestra **Anterior · no recuperable**. Si no se conservó el código, crear un acceso nuevo y compartirlo; no se modifica ni desactiva el anterior automáticamente.

Una clase vencida o desactivada no muestra un código reutilizable. **Desactivar** invalida también las sesiones vinculadas; el portal pide confirmación antes de hacerlo.

## Tiempo de acceso y salida

El pie del editor muestra el nombre de clase y el acceso restante del alumno. La sesión dura como máximo cuatro horas y nunca supera el vencimiento de la clase. Si la clase continúa vigente, se puede volver a ingresar con su código para renovar la sesión. Al finalizar el acceso, el editor avisa sin cerrar el proyecto; guardar el archivo antes de volver a ingresar.

El administrador ve **Administrador · Sesión administrativa**, sin contador. Su sesión tiene un vencimiento interno de ocho horas. **Salir**, en el pie, cierra la sesión; guardar antes los cambios del proyecto.

## Motores y servicios

**Herramientas → Estado de motores** abre un diálogo de solo lectura de Windows y Debian, también disponible al alumnado. No es el panel de clases. El estado del motor seleccionado se consulta además desde el pie del editor.

El panel privado incluye un bloque separado de motores y ayuda de recuperación local. No ofrece encendido, detención ni reinicio remotos. Una computadora apagada no responde por su propio túnel.

Los diálogos se cierran con su botón, Escape o clic fuera. Consultar estados no ejecuta una simulación ni garantiza el éxito del siguiente cálculo.

[Volver al índice](README.md) · [Configuración técnica y seguridad](acceso-clases-admin.md).
