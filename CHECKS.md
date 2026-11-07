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

## Interacción del editor: 6 de noviembre de 2026

Corrientes dibujadas como flechas SVG con área de selección transparente y puertos,
sin tarjetas de equipos. Zoom con rueda/pinza, botones, desplazamiento con Alt
o botón central y separadores accesibles en paneles laterales.
Verificación en la web publicada: tres corrientes del ejemplo sin rectángulos de
equipo; botón de zoom a 120 %, rueda a 219 %, Ajustar a 100 %; panel de propiedades
de 265 a 275 px con teclado y a 343 px arrastrando su borde. Sin errores de consola
en esa sesión. El gesto físico de pinza y el desplazamiento con Alt quedan pendientes
de comprobación manual. node --check site/app.js y las seis pruebas del Worker pasaron.
Se conserva CSP script-src self y se agrega no-transform para evitar inyección
automática de analíticas. La consola administrativa solo se planifica en la hoja de ruta.

## Corrientes integradas y símbolos PFD: 7 de noviembre de 2026

Cinco pruebas del editor verifican seguimiento al mover equipos, extremo libre,
reconexión, rechazo de puerto ocupado/sentido incorrecto y conexión del inicio de
una corriente. Pasaron junto a las seis pruebas del Worker y el build.

Comprobación en sim.lemeit.ar: el ejemplo tiene tres paths de corriente, cero
paths adicionales de conexión y cero rectángulos de tarjeta. Se reconectó Agua fría
desde Entrada 1 a Entrada 3 del mezclador arrastrando el extremo con el mouse.
La web confirmó Corriente conectada y DWSIM resolvió nuevamente el caso en 6 s.
Se corrigió durante la prueba el orden de dibujo que tapaba los extremos con los
puertos del equipo. El backend y sus ecuaciones no se modificaron.

## Editor cómodo y vista separada: 7 de noviembre de 2026

Pruebas: ocho del editor y seis del Worker pasaron; sintaxis JavaScript y build
correctos. Se incorporaron comprobaciones de puertos escalados, extremos explícitos
al mover corrientes y edición de codos sin cambiar objetos o topología.

Vista previa local 127.0.0.1:5914, sin cálculo: alta de una corriente produjo cinco
objetos (cuatro corrientes y un mezclador), con cero unidades térmicas imprevistas.
Se verificó tamaño al 150 % mediante formulario y 177.88 % mediante tirador; ajuste
manual del codo y reconexión al soltar a 8 px de un puerto compatible. El conteo se
mantuvo en cuatro objetos tras eliminar la corriente de prueba.

Dos vistas del mismo workspace sincronizaron altas, bajas, tamaño y conexiones.
Se abrió la URL de la ventana independiente en una segunda pestaña del navegador
de prueba: la presentación como ventana del sistema depende del navegador del usuario.
El modo Solo diagrama se verificó visualmente. La solicitud de pantalla completa
no se verificó en este navegador de prueba. No se midió una tasa de cuadros.

La publicación de esta revisión fue rechazada por aprobación automática: requiere
aprobación explícita para actualizar Cloudflare. No se volvió a intentar por otra vía.
Los cambios permanecen locales/en PR hasta esa aprobación.

Además se verificó el arrastre real desde la biblioteca al lienzo: creó una sola
corriente y ninguna unidad térmica adicional. Se cerró el menú de ejemplos al cargar.

## Extremos estables y biblioteca heredada

Se corrigió la copia de coordenadas DOMPoint: las propiedades x/y pueden ser
accesores del prototipo y desaparecer al usar object spread. svgPoint devuelve
ahora un objeto plano y la geometría copia x/y explícitamente. Se conservan ambos
extremos al desconectar; soltar sobre el extremo opuesto mantiene una longitud
mínima visible en lugar de colapsar el símbolo.

Pasaron 17 pruebas: las 14 anteriores y tres regresiones para coordenadas tipo
DOMPoint, extremo fijo tras mover el equipo y desconexión sobre el otro extremo.
En la vista previa local se desconectó la punta derecha: quedó un path válido y
377 px de ancho, con cuatro objetos. No se observó error de consola en esa sesión.
La ventana separada mostró la biblioteca al abrir; agregar una corriente desde
ella se reflejó en la principal (cinco objetos), y eliminarla volvió a cuatro.
No se ejecutó un cálculo nuevo: estos cambios corresponden al editor.

## SIMPROX y barra compacta: 7 de noviembre de 2026

Cabecera 42 px y barra única 34 px medidos en la vista previa local; cero project-bar
adicionales. El nombre del proyecto se integra a la barra, y modelo/compuestos al
menú Simulación. Se incorpora la opción A del PNG del usuario, con clipping SVG;
el wordmark aún no es un SVG independiente. Nuevo favicon vectorial del emblema.

Se verificaron carga de ejemplo, menú de modelo, diálogo de componentes, temas
claro/oscuro, acceso a las herramientas y vista separada con biblioteca. Menú móvil
comprobado dentro del ancho de la ventana tras corregir la posición de Simulación.
No se cambió el motor. Las 17 pruebas existentes y sintaxis JavaScript pasaron.
El build queda preparado, sin publicación ni fusión automáticas.

## Menús, diagnóstico y resultados

Pasaron 20 pruebas (11 editor, 6 Worker, 3 exportación). XLSX contrastado con zipfile
(CRC) y XML parser: dos hojas de prueba, valores originales y ausencia de fórmulas.
Con un cálculo DWSIM real en la vista local 5915 se descargaron un XLSX con cuatro
hojas y un CSV con tres corrientes: Agua mezclada 2 kg/s, 50.021386757683786 °C.
La descarga mediante la herramienta del navegador tuvo una demora importante;
los archivos se verificaron en disco. No se atribuye esa demora al generador.

Estado: API disponible, 1620 compuestos y 18 modelos; latencia medida en esa consulta
15 ms. No es una métrica de rendimiento general. Se provocó caudal cero y se verificó
el error original, revisión específica y sugerencias. HTTP 400 fue esperado en esa
prueba, sin conservar resultados anteriores como vigentes.

Se redimensionó el panel de 160 a 180 px con teclado, se ocultó y recuperó desde Ver,
y se abrió la vista separada con los mismos resultados reales. Cambiar seis menús
con mouse dejó exactamente uno abierto en cada caso; navegación con flecha derecha
pasó Archivo → Simulación. Se corrigió la interacción entre hover y clic detectada
durante esa prueba. Configuración y exportaciones no modifican ecuaciones del motor.

Publicación y fusión quedan pendientes de aprobación del usuario.

También se verificó altura por arrastre de 200 a 245 px y configuración de tablas
a dos decimales (50,02 °C), restaurando luego tres decimales.

## Identidad propia y cierres de ventanas

Acerca de presenta SIMPROX como simulador de procesos y expresa su finalidad
pedagógica y sin finalidad comercial. Se preservan las licencias de componentes.
La interfaz deja de cargar Lemeit Design: usa simprox-theme.css, tokens --spx-*,
fuentes locales y preferencia simprox-theme. Se conservan atribuciones históricas.

Veinte pruebas y build correctos. Tokens utilizados contrastados contra sus
propias definiciones. En la vista previa 5915 se verificaron texto, cierre SVG
blanco sobre rojo en ambos temas, área de 32 px y cierre del diálogo Nuevo con
nombre vacío sin quedar bloqueado por validación. Sin errores de consola de esa
sesión. No se modificó ni volvió a ejecutar el cálculo del motor en este ajuste.

## Ventanas, monitor, orientación y operación online

28 pruebas JS correctas (15 editor, 6 Worker, 3 exportación, 4 monitor). Se comprobaron
corrientes verticales sin segmentos finales de longitud cero, entrada inferior al
calentador, salida inferior del enfriador y orientación sin alterar topología.
Monitor: 409 ocupado accesible, 503 desconectado, catálogo con latencia y señal antigua.

Vista estática local 5914, sin iniciar un nuevo motor: se abrió un proyecto de
calentamiento con corriente de energía y se verificó el path M460 390 V200.
Cabecera medida 30 px y cierre interactivo 24 px. Consola mostró HTTP 404 correcto
de la vista estática, latencia real y ausencia de un servicio de cálculo en esa URL.
No se simuló un estado online artificial ni se midió carga de una clase.

Se detectaron dos gateways 5911 desde copias distintas del código y un túnel en la
PC. Se detuvo únicamente la vista de prueba 5915 iniciada por el agente. No se
apagó el gateway público por iniciativa del agente. stop-online -WhatIf identificó
los dos gateways y su túnel sin detenerlos. Sintaxis de los tres scripts verificada.
El nuevo arranque busca servicios por EngineRoot/puerto para evitar duplicados y
el apagado ya no depende únicamente de un PID registrado por la última copia.

La autenticación queda como propuesta documentada: no se activó registro ni login.

## Corrientes y propiedades 0.2.0

- 30 pruebas JS aprobadas: editor, Worker, exportaciones, monitor y conversiones de unidades.
- Validación Python: entradas activas según flash, bases, fracciones y bloqueo PS/IAPWS.
- Integración real aislada: TP→PH y TP→PS (NRTL), equivalencia PV/TV a 25 % molar de vapor,
  y mezcla Water/Ethanol con composición molar y caudal molar comparada con la base másica.
- Regresión real de mezcla de agua, reactor de conversión, equilibrio químico y rechazo
  de reacción sin balance de elementos.
- Se detectó que IAPWS/PS devuelve 373.1243 K frente a 323.15 K de referencia con la misma
  entropía solicitada. Se bloquea esa combinación y se verifica que PH/PS conserven
  la propiedad especificada antes de aceptar resultados del motor.
- Prueba de navegador en 5916: conversión 1 kg/s a 3600 kg/h, entrada PH de 209.4 kJ/kg,
  resultado de alimentación 49.9969 °C y mezcla adiabática con corriente a 80 °C.
  Proyecto recuperado desde almacenamiento local y recalculado.
- El servidor de pruebas usa procesos DWSIM aislados; no requiere iniciar MCP 5901.
