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

## Preparación de despliegue automático · 0.2.1

Wrangler 4.158.0 fijado con package-lock.json. npm run build:verified pasó 32 pruebas
JS y generó el Worker. Nueve pruebas de validación Python aprobadas. Dry-run real de
Wrangler correcto: 2491 KiB sin comprimir, 1416 KiB gzip. No se realizó despliegue ni
se conectó Workers Builds. El flujo GitHub Actions está preparado, pendiente de su
primera ejecución remota al subir el PR. ORIGIN_KEY no se leyó ni copió; las rutas
siguen administradas por Cloudflare. Fecha de compatibilidad preservada.

## Aclaraciones del monitor · 0.2.2

35 pruebas JS aprobadas. Nuevas pruebas ejercitan calculate: inicio/finalización,
error HTTP 400 con mensaje escapado, duración y conservación del estado online;
otra comprueba que un GET de catálogo no borre un cálculo completado. Build con
comprobación de versión correcto. No cambia el motor ni el backend.

## ΣIM y edición directa · 0.3.0

37 pruebas JS aprobadas. Las pruebas nuevas verifican orientación automática con
un valor orientation heredado, vista previa de desconexión y cambio de eje del
codo sin alterar topología. Continúan pasando las pruebas de puertos de energía,
reconexión, extremos visibles y conservación de tamaño al desconectar.
En navegador sobre vista estática 5918 (sin motor): se cargó un ejemplo, se
comprobó ausencia del selector y se arrastró la punta hacia arriba. El path terminó
con un segmento V ascendente. Luego se desplazó el codo horizontalmente, manteniendo
la punta vertical. Logo SVG visible en la cabecera. No se ejecutaron cálculos del
motor porque esta entrega solo modifica representación gráfica y marca.

## PWA e iconos · 0.4.0

41 pruebas JS aprobadas y 9 pruebas Python de validación correctas. Se verifican
manifest, dimensiones PNG 192/512, propósito maskable, exclusión de API/POST del
service worker y respuesta de navegación sin red hacia la página explicativa.
Build y dry-run de Wrangler correctos (1465 KiB gzip). PNG cuadrados opacos con
fondo carbón; ICO con resoluciones 16, 32, 48, 64, 128 y 256. El icono 192 se revisó
visualmente. No se afirma instalación efectiva en el navegador del usuario: debe
comprobarse en Chrome/Edge compatibles una vez desplegado sobre HTTPS.

## Ejemplos básicos · 0.5.0

Se ejecutaron cinco casos con el motor MCP de ΣIM y con la API Automation3 de las
bibliotecas instaladas de DWSIM Open Source 10.2.15.0. Procesos separados por caso,
archivos nativos exportados de las mismas entradas. Una segunda corrida con las
propiedades y caudales de salida borrados también pasó las cinco comparaciones.
Diferencia numérica observada: 0 en los valores serializados de temperatura,
presión, caudal, entalpía, densidad y composición global de todas las corrientes.
También se comparó la potencia térmica por balance de entalpía, tolerancia 1e-4 kW.
Los residuos reales quedan en docs/validation/examples-0.5.0.json.

En la interfaz de escritorio se abrió y recalculó mix.dwxml (Solve complete) y
HeaterWater.dwxml (The flowsheet was calculated successfully; 167.21 kW visibles).
La apertura reemplazó la vista actual de DWSIM; no se sobrescribieron archivos
existentes del usuario. La segunda carga demoró; no se forzó el cierre del proceso.
Los otros tres casos se comprobaron por API, no por la interfaz gráfica.

41 pruebas JS aprobadas; nuevas pruebas Python validan fixtures, coherencia de
entradas JSON/DWXML y rechazo de diferencias en el comparador. Los dos programas
comparten DWSIM: no se presenta como validación experimental independiente.

## Revisión documental · 12 de noviembre de 2026

README reorganizado con logo sin título duplicado y badges de identidad. Se
incorporan los ocho ejemplos, el estado publicado 0.7.0 y la arquitectura de dos
motores. Guías de operación, selección manual y despliegue corregidas para
eliminar instrucciones pendientes o antiguas. Se distinguen instalación
configurada, servicio disponible y pruebas realmente realizadas. No se modifica
el portal, su versión, los motores, los túneles ni sus credenciales.

## Arranque Windows · 0.7.1 · 12 de noviembre de 2026

- Acceso de Inicio instalado para el usuario actual, sin elevar privilegios ni guardar contraseñas.
- Se ejecutó el lanzador con PowerShell de Windows; terminó con código 0 y catálogo local HTTP 200.
- Se ejecutó nuevamente usando destino y argumentos del acceso instalado: mismos PID de gateway/túnel, sin duplicados.
- Deshabilitación y reinstalación comprobadas; el inicio automático quedó habilitado.
- Portal público: Windows seleccionado, servicio disponible HTTP 200. Debian no se tocó.
- 55 pruebas JS y build correctos; Acerca de 0.7.1 comprobado tras recargar la vista local.
- No se reinició ni cerró la sesión del usuario: la prueba definitiva del evento de inicio de sesión queda para su próximo ingreso.

## Ventanas · 0.7.2 · 12 de noviembre de 2026

- Las ocho ventanas separan cabecera y contenido desplazable; apertura/cierre de Acerca de, Diagnóstico y Nuevo proyecto comprobados en navegador.
- Acerca de 0.7.2 revisado tras recargar. Al desplazar con PageDown, el contenido avanzó 139 px mientras la cabecera mantuvo su posición; el cierre quedó por encima del área desplazable.
- Revisión visual en modo claro y oscuro. Diagnóstico usa botones propios y texto con la familia de la interfaz; listas de Acerca de unificadas a 12 px.
- 55 pruebas JS, compilación, validación de versión e historial y dry-run correctos.
- Sin cambios en motor, ecuaciones, túneles o inicio automático Windows.

## Controles y menús · 0.7.3 · 12 de noviembre de 2026

- Se revisaron los seis menús (Archivo, Simulación, Ver, Ejemplos, Herramientas y Ayuda) en claro y oscuro: abiertos, dentro de la pantalla y con acciones accesibles.
- Editar compuestos abre su ventana y se distingue como botón con borde/fondo. Se corrigieron etiquetas, notas y foco del menú Simulación.
- Los controles numéricos del inspector dinámico se regeneran sin duplicados. Tamaño gráfico: 100 → 110; límite superior 300 respetado; decremento funcional.
- Temperatura decimal: 20,5 → 21,5 → 20,5, conservando selector de unidades y sin desbordamiento horizontal.
- Configuración: límites 0/8 respetados; flecha de teclado 0 → 1; valor restaurado a 3. Nombres accesibles conservados y sin errores en consola.
- Acerca de 0.7.3 revisado tras recargar; capturas de claro y oscuro. No se modificaron motores ni ecuaciones.

## Ejercicios integrados · 0.8.0 · 12 de noviembre de 2026

- Casos 09 y 10, 15 objetos y 15 conexiones cada uno, ejecutados con IsolatedEngine del runtime Windows. No se utilizó Debian.
- Informe docs/validation/examples-0.8.0-windows.json y verificador tools/validate_integrated_examples.py: materia por especie y cierre energético del 09; masa total, átomos N/H y producción de NH3 del 10. Las tolerancias y límites quedan en el informe.
- Ambos casos completaron el cálculo desde la interfaz local (3,59 s y 3,64 s en esa vista); caso 10 final recalculado con bypass separado gráficamente.
- Menú e índice de guía 01–10; todos los ejercicios tienen resoluciones numeradas. Conteos de pasos: 4,4,4,4,4,6,4,4,8,10. Enlaces locales y anclas comprobados.
- Vista ajustada al abrir ejemplos; Acerca de 0.8.0 revisado tras recargar. Capturas de guía y diagrama del caso 10.
- 60 pruebas JS, build:verified y deploy:check correctos. Sin validación experimental ni comparación separada con Automation3 para los casos nuevos; no se prueban cargas de clase.

## ΣIM 0.9.0 · 12 de noviembre de 2026

- 68 pruebas JavaScript: conversiones SI/anglosajonas, temperatura absoluta y diferencias, presión manométrica explícita, fracciones másicas/molares, caudales y regresiones del portal.
- Compilación verificada y preparación de despliegue sin publicación.
- Exportación real de masas molares de DWSIM Windows: 1601 valores válidos de 1620 compuestos; 19 no disponibles identificados sin estimarlos.
- Navegador: 32 °F = 273.15 K; 0 psig con atmósfera de 101325 Pa = 101325 Pa absolutos. Cambio de base y formato porcentual conservan la composición.
- Ejemplo 05 calculado con el motor Windows: completado en 3.91 s, salida de 2 kg/s. Cambio de sistema de unidades conserva resultados físicos.
- Presiones parciales de la fase vapor comprobadas: 35877.95852 + 65447.04148 = 101325 Pa. La calculadora de gas ideal identifica su hipótesis y no sustituye el equilibrio de fases.
- Guía integrada: búsqueda, ejercicios 09/10, navegación anterior/siguiente y regreso al simulador conservando proyecto y resultados. Pestañas de calculadora accesibles con teclado.
- Ayuda → Acerca de revisado después de recargar: versión 0.9.0.
- CSTR/PFR: auditoría y etapas documentadas; no se habilitaron reacciones cinéticas ni perfiles. Sin cambios en motor Windows, Debian, túneles ni selección manual de motor.
