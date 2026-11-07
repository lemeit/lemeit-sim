# Comprobaciones del prototipo · 6 de noviembre de 2026

- 11 pruebas pasaron con DWSIM 10.2.15 real: mezcla adiabática de agua, calentador
  con corriente de energía, enfriador, divisor y mezcla agua/etanol con NRTL;
  seis casos de rechazo de datos y topologías inválidos.
- Mezcla de referencia: 2 kg/s a 50.0213867577 °C, residuo de masa nulo.
- node --check site/app.js: sin errores de sintaxis.
- HTTP: HTML, JS, CSS, catálogo y simulación devuelven 200; se comprobaron
  balance de agua por componente y rechazos de Origin ajeno (403), grafo vacío
  (422), acceso al fuente del intermediario (404) y proxy MCP inexistente (404).
- Navegador: cálculo desde el botón, edición de temperatura con invalidación,
  selección y eliminación de línea, reconexión mediante puertos con teclado,
  descarga de proceso y búsqueda de Ethanol en el catálogo.
- Revisión visual a 1440 px, a 390 px y en el panel lateral de Codex.
  En pantalla angosta el diagrama conserva tamaño legible y se desplaza
  horizontalmente; el inspector pasa debajo. No hubo desbordamiento de página.

No se probó acceso remoto, carga simultánea de una clase ni todos los pares
compuesto/modelo del catálogo. No se publicó ni se cambió Cloudflare.
No se ejecutaron Hugo/Quartz: sus fuentes no cambiaron.

## Preparación de publicación y ampliación

- 15 pruebas Python pasaron con el motor real, incluidas cuatro de procesos
  aislados: mezcla de agua, conversión, equilibrio y rechazo de reacción sin balancear.
- Cinco pruebas del Worker pasaron: interfaz independiente del motor, origen
  ajeno rechazado, sin proxy MCP, motor ausente y cuerpo mayor de 100 kB.
- Reactor de conversión H2/O2 → H2O, 50 % de conversión de H2, 500 °C:
  conservación de masa y potencia de reacción leída del motor.
- Equilibrio N2/H2/NH3 a 500 °C y 20000 kPa: cálculo convergente y masa conservada.
- Tutoriales oficiales revisados; hoja de ruta y catálogo diferencian funciones
  implementadas de operaciones pendientes. Prioridad: procesos básicos.
- El túnel de cálculo no se creó: requiere la autorización específica solicitada
  por la revisión automática. La interfaz puede publicarse antes de conectarlo.

## Entorno de proyectos

Verificado en navegador: inicio con 0 objetos, asistente de proyecto con Water e
IAPWS-IF97, creación de diagrama vacío y habilitación de la biblioteca, agregado
de una corriente y apertura explícita de un ejemplo mediante confirmación propia.
El inicio no recupera automáticamente ni el ejemplo ni el último proyecto.
El pie y los iconos claro/oscuro provienen del sitio TeX solicitado.

## Publicación conectada y comprobada

El usuario autorizó explícitamente el túnel y engine-sim.lemeit.ar. La conexión
usa el secreto de servidor ya configurado, sin incorporarlo al código ni al navegador.
Verificación pública: /api/catalog devolvió HTTP 200 con 1620 nombres válidos
(se excluyó la entrada vacía del catálogo del motor) y 18 modelos.
/api/simulate resolvió mezcla de agua y reactor de conversión, con residuo de masa
cero en ambos casos. La mezcla dio 50.0213867577 °C y 2 kg/s.

Se corrigió redirect:error, no admitido en Workers, por redirect:manual. No se siguen
redirecciones, para no reenviar la credencial a otro destino. Las seis pruebas del
Worker pasaron, incluida la opción de redirección y la ausencia de la clave de origen
en las respuestas. No se modificaron las protecciones de la zona Cloudflare.
El ajuste de conexión publicado se propone por rama/PR, sin fusionarlo automáticamente.

Siguen pendientes las pruebas de carga de una clase y el siguiente bloque de equipos.
La PC debe estar encendida para calcular; no se instaló inicio automático de Windows.
