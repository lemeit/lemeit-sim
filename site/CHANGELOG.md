# Historial de versiones de ΣIM (antes SIMPROX)

La numeración del portal comienza en 0.1.0; las entregas anteriores no tenían versión explícita.
Cada entrega incrementa la versión: correcciones 0.1.x, nuevas capacidades 0.x.0;
1.0.0 quedará reservada para la primera versión estable para alumnos.
Actualizar este historial y la sección de versión en Ayuda → Acerca de en cada entrega.
La versión del portal es independiente de la versión del motor DWSIM.

## 0.13.0 — 2026-11-15

- Monitor del gateway de cálculo: versión del servidor fijada al arranque de Python, fecha/hora de inicio, tiempo activo, estado ocupado/disponible y operaciones compatibles.
- Endpoint `GET /api/status` implementado con el mismo control de acceso del gateway y proxy Cloudflare limitado al motor seleccionado. No expone claves, rutas ni PID; tampoco permite ejecutar órdenes remotas.
- Compatibilidad: si un gateway anterior no implementa el endpoint, el monitor indica «Versión no confirmada», sin deshabilitar los cálculos existentes.
- Pruebas automatizadas Python de estado y Node del proxy, con prevención de failover. La verificación de producción requiere actualizar y reiniciar `lemeit-sim.service`; no se afirma su funcionamiento en producción hasta esa comprobación.
- Catálogo, roadmap y Ayuda → Acerca de actualizados.

## 0.12.0 — 2026-11-15

- Nuevo `HeatExchanger` con dos alimentaciones y dos productos materiales (lados caliente y frío), editor visual e inspector de potencia transferida, Ejemplo 13.
- DWSIM MCP 10.2.15 (Debian): agua caliente 80,000000 → 70,456556 °C y agua fría 20,000000 → 29,565765 °C, caudales 1 kg/s por lado y presiones 300 kPa absolutos.
- Calor cedido por lado caliente 40,00000037 kW, absorbido por lado frío 40,00000004 kW, diferencia 0,00000033 kW. Se verificaron nueve condiciones físicas y seis pruebas unitarias. Sin comparación experimental ni validación Windows.
- Primera modalidad por `HeatDuty` (kW) y `CalculationMode=CalcBothTemp` aceptada por el adaptador MCP real. No se habilita diseño por área/UA, pérdidas térmicas o caída de presión.
- Catálogo, roadmap y guía didáctica actualizados. Para servir el nuevo equipo en el sitio, el gateway Debian debe reiniciarse con `server.py` actualizado; no basta con publicar el Worker.

## 0.11.0 — 2026-11-14

- Bomba y válvula agregadas al editor con símbolos, configuración y ejemplo 12; el gateway usa tipos MCP `Pump` y `Valve`.
- Corrige las unidades de presión prescrita en el adaptador DWSIM MCP 10.2.15: 500 kPa se envían como 5 bar y 200 kPa como 2 bar. Prueba de regresión para evitar repetir el error.
- Ejemplo 12, agua a 25 °C, 1 kg/s, IAPWS-IF97: siete controles de la ejecución real en Debian aprobados; ambas operaciones calculadas, bomba eleva la presión a 500 kPa y válvula la reduce a 200 kPa, con conservación de caudal y entalpía aproximadamente constante en la válvula.
- Catálogo y roadmap sincronizados. La validación en Windows sigue pendiente. Los valores detallados de energía/potencia no se publican hasta revisar el informe completo generado por DWSIM.

## 0.10.0 — 2026-11-14

- Separador flash adiabático vapor–líquido con tipo MCP `Vessel`, 1 entrada y 2 salidas, disponible en biblioteca e inspector y como Ejemplo 11 (agua–etanol, NRTL).
- Ejecución real en Debian DWSIM MCP 10.2.15: vapor 0,638235345 kg/s (etanol 0,660959414 fracción másica), líquido 0,361757524 kg/s (etanol 0,216002777). Calor calentador 1055,824177 kW.
- Cierre real en equipo: residuo masa 7,1311×10⁻⁶ kg/s y máximo residual componente 1,1711×10⁻⁵ kg/s. Se mantiene evidencia y tolerancia de aceptación del caso de 2×10⁻⁵ kg/s, sin presentarlo como conservación exacta.
- Requiere actualización del gateway Debian, no solo del Worker. Windows pendiente de validar; se mantiene selección manual sin conmutación automática.

## 0.9.2 — 2026-11-14

- Regresión real Windows–Debian de los diez ejemplos 01–10: 10/10 aprobados en Debian DWSIM MCP 10.2.15, HTTP 200, tolerancias explícitas, informe recibido el 14/11.
- Verificador reproducible para el gateway Debian local y pruebas unitarias; controles adicionales de conservación de átomos H/O y N/H en reactores 07, 08 y 10.
- Informe resumido de referencia y huella SHA-256 del JSON completo, preservando distinción entre evidencia de ejecución y pruebas automatizadas.
- Sin cambios en ecuaciones del motor, interfaz de cálculo, túneles, credenciales ni selección manual de Windows/Debian.

## 0.9.1 — 2026-11-12

- Ayuda centrada en la guía de uso y la tutoriales de DWSIM en inglés; planificación y adaptación quedan en la documentación del repositorio.
- Guía de ejercicios accesible desde Ejemplos, sin duplicación en el menú Ayuda.
- Campos de la calculadora con etiquetas separadas y foco interior, sin recuadros que invadan el texto adyacente.

## 0.9.0 — 2026-11-12

- Guía 01–10 navegable: índice lateral, búsqueda, ejercicios plegables, anterior/siguiente y regreso al mismo proyecto mediante guía integrada, sin abandonar el simulador.
- Presets SI, ingeniería y anglosajón en entradas y resultados; las condiciones canónicas no se reinterpretan. CSV/Excel conservan sus unidades explícitas.
- Calculadora de unidades, presión absoluta/manométrica con referencia explícita, fracciones másicas/molares, caudales y presiones parciales. Concentración ideal opcional y distinguida de DWSIM.
- Catálogo de masas molares exportado del runtime real; cambio de base de composición/caudal y formato porcentaje en corrientes.
- Ayuda con adaptación por etapas: auditoría de cinética iniciada; CSTR/PFR, perfiles y transitorios todavía no habilitados. Sin cambios en motores, túneles o ecuaciones termodinámicas.

## 0.8.0 — 2026-11-12

- Ejemplo 09: red térmica NRTL agua–etanol–acetona con mezcla, división 65/35, calentamiento, enfriamiento y recombinación.
- Ejemplo 10: amoníaco PR con bypass 20 %, precalentamiento, reactor de equilibrio y enfriamiento.
- Menú y guía numerados 01–10; resoluciones paso a paso para los diez ejercicios, con actividades y descargas para ambos casos integrados.
- Informe Windows y verificador reproducible: cierres de materia/energía del 09 y conservación de átomos del 10. Sin prueba Debian ni validación experimental.
- Ajuste de vista al abrir ejemplos; sin cambios en motor o ecuaciones.

## 0.7.3 — 2026-11-12

- Controles propios de incremento/decremento en todos los campos numéricos, también en el inspector dinámico, conservando edición nativa y límites/pasos.
- Botón Editar compuestos con borde y fondo; etiquetas, notas, foco y opciones deshabilitadas coherentes en menús.
- Sin cambios en el motor, modelos, túneles o inicio automático.

## 0.7.2 — 2026-11-12

- Cabeceras fijas en las ocho ventanas; solo el contenido se desplaza y la barra queda debajo del cierre.
- Tamaños de texto, listas y botones coherentes; los mensajes de diagnóstico usan la tipografía de la interfaz.
- Contenedor desplazable accesible con teclado y margen reservado para su barra.
- Sin cambios en cálculos, motores, túneles o arranque automático.

## 0.7.1 — 2026-11-12

- Inicio automático Windows opcional al iniciar sesión: enable-autostart.ps1 y disable-autostart.ps1, sin contraseñas ni cambios de política de ejecución.
- Lanzador privado con espera inicial, reintentos limitados, registro startup.log y reutilización de gateway y túnel existentes.
- README, guías y Acerca de actualizados. No cambia Debian, los modelos de cálculo ni la selección manual de motor.

## 0.7.0 — 2026-11-12

- Ejemplo 06: balance ternario agua–etanol–acetona con cuatro alimentaciones, dos mezcladores y un divisor, más problema inverso resuelto por sistema matricial 2×2.
- Menú Ejemplos consolidado y numerado del 01 al 08, con casos 07 y 08 de reactor de conversión y reactor de equilibrio previamente disponibles.
- Guía ampliada: enunciados, configuraciones, archivos JSON, tablas de referencia analítica y actividades de comprobación de reactores.
- Casos 06–08 ejecutados con el motor Windows: cierre de masa total y por componente del 06, temperaturas y resultados de reactores registrados en docs/validation/examples-0.7.0-windows.json. Sin comparación independiente con la API de escritorio para estos tres casos.
- README y Acerca de sincronizados con 0.7.0. Sin cambios en motores, túneles ni selección manual; Debian no se probó.

## 0.6.0 — 2026-11-11

- Selección manual del motor de cálculo desde el editor: PC remota Windows (predeterminado) o notebook Debian online.
- Comprobación de disponibilidad del motor elegido antes de calcular, sin conmutación automática ni transferencia de credenciales al navegador.
- Worker con destinos y secretos independientes para cada motor; se conserva el funcionamiento previo de Windows.
- Backend Linux compatible con DWSIM MCP 10.2.15 mediante HTTP local autenticado, sin exponer el puerto MCP a Internet.
- Prueba local en Debian: mezcla de agua con 2 kg/s y temperatura de salida 50,02138676 °C, consistente con el ejemplo de referencia.
- Se documentan instalación, restricciones de memoria, túnel privado y pruebas de la integración. La disponibilidad online de Debian depende de que la notebook y el túnel permanezcan encendidos.

## 0.5.0 — 2026-11-08

- Cinco ejemplos básicos en el menú: mezcla de agua, calentamiento, enfriamiento, división y mezcla agua–etanol con NRTL.
- Guía pedagógica con entradas, resultados de referencia y archivos JSON/DWXML descargables.
- Comparación reproducible de propiedades globales de todas las corrientes y potencia térmica contra la API oficial del DWSIM 10.2.15.0 instalado, mediante procesos aislados.
- Mezcla de agua y calentamiento también abiertos y recalculados en la interfaz de escritorio. No es una validación experimental ni una construcción independiente de los archivos en el editor nativo.
- Informe numérico con tolerancias y diferencias, scripts para repetir la comparación.

## 0.4.2 — 2026-11-08

- Marca de cabecera reducida a 86 × 24 px, con descripción legible al lado. Barra de 42 px conservada.

## 0.4.1 — 2026-11-07

- Cabecera del simulador y catálogo con marca ΣIM sin bajada, ampliada dentro de la misma barra.
- Nuevo sim-wordmark.svg con el mismo trazado de letras; logo completo conservado en Acerca de y documentación.

## 0.4.0 — 2026-11-07

- Manifest PWA de ΣIM: nombre, iconos, inicio y ventana standalone.
- Icono cuadrado con sigma roja sobre carbón; variantes SVG, PNG 16/32/180/192/512, ICO multiresolución y PNG adaptable a máscaras del sistema.
- Ayuda ofrece Instalar ΣIM cuando el navegador emite la invitación de instalación.
- Service worker para una página explicativa sin conexión. Interfaz por red, sin caché de API ni resultados; solo se guarda la página offline y su estilo.
- Tipos MIME de manifest e ICO en el Worker y servidor local. El motor sigue siendo remoto y requiere conexión.

## 0.3.0 — 2026-11-07

- SIMPROX pasa a llamarse ΣIM · Simulación de procesos. Dominio y repositorio sin cambios.
- Logo vectorial independiente según la opción 02 Retro técnico: Σ roja, IM blanco cálido, letras y bajada convertidas en curvas. Favicon sigma.
- Paleta carbón #101215, blanco cálido #F4F3EE y rojo #CF263B.
- Se elimina Dirección del extremo libre del inspector. La dirección sigue la posición de los extremos arrastrados; los puertos conectados conservan su normal.
- El control del codo admite arrastre horizontal o vertical. Mover un extremo reinicia el recorrido manual anterior y elimina la orientación heredada.
- La vista previa de desconexión orienta el extremo libre durante el arrastre, no recién al soltarlo.

## 0.2.2 — 2026-11-07

- Monitor: las consultas del catálogo se describen como comprobaciones de disponibilidad.
- Consola con eventos CONEXIÓN y CÁLCULO; inicio, finalización/error, HTTP y duración completa de la solicitud.
- Estado del último cálculo en curso, completado o fallido, separado de la última comprobación de conexión.
- Diagnóstico incorpora el inicio y la duración del cálculo. Registro limitado a esta vista y a la sesión actual.

## 0.2.1 — 2026-11-07

- Configuración reproducible de Wrangler para publicar el Worker existente desde Workers Builds al actualizar main; pendiente de conectar GitHub en Cloudflare.
- GitHub Actions verifica PR y main: pruebas, versión, validación del servidor y preparación de despliegue sin publicar.
- Se preservan las variables del panel y el secreto ORIGIN_KEY existente; no se incorporan claves al repositorio.
- Se incorpora la actualización del README y el control de versión que quedaron fuera de la fusión anterior.
- No modifica el motor ni automatiza la actualización de server.py en la PC.

## 0.2.0 — 2026-11-07

- Inspector de corrientes con Condiciones, Composición y Resultados.
- TP, PH, PS, PV y TV; solo se envían las propiedades independientes activas.
- Unidades de temperatura, presión, caudal, entalpía, entropía y fracción de vapor.
- Caudal másico o molar, composición másica o molar. Las masas molares provienen del XML de DWSIM.
- Resultados globales y por fase: entalpía, entropía, densidad y fracciones másicas/molares.
- Caudal volumétrico global derivado de caudal másico/densidad calculados por DWSIM.
- Compatibilidad de proyectos anteriores: TP, kg/s y composición másica por defecto.
- PS/IAPWS-IF97 bloqueado: prueba de ida y vuelta detectó falta de conservación de la entropía solicitada. PS validado con NRTL.
- Cambiar la base de composición vacía los valores de mezclas para evitar reinterpretarlos sin conversión.

## 0.1.1 — 2026-11-07

- Ventanas minimalistas con identidad SIMPROX, sin control circular tipo Mac.
- Títulos alineados a la izquierda y cierre a la derecha.
- Mismo cierre discreto en el panel de resultados.

## 0.1.0 — 2026-11-07

- Versión y cambios visibles en Acerca de.
- Scripts de inicio y detención usan .local/runtime dentro del repositorio por defecto.
- Motor, configuración privada y registros excluidos de Git.
- Cruz de cierre centrada en ventanas y panel de resultados.

Base existente: editor de diagramas, corrientes de materia y energía, equipos básicos,
modelos termodinámicos, cálculo con DWSIM, balances, exportación CSV/Excel y monitor de conexión.
