# Historial de versiones de ΣIM (antes SIMPROX)

La numeración del portal comienza en 0.1.0; las entregas anteriores no tenían versión explícita.
Cada entrega incrementa la versión: correcciones 0.1.x, nuevas capacidades 0.x.0;
1.0.0 quedará reservada para la primera versión estable para alumnos.
Actualizar este historial y la sección de versión en Ayuda → Acerca de en cada entrega.
La versión del portal es independiente de la versión del motor DWSIM.

## 0.44.0 — 2026-11-20

- El botón «Calcular» recupera el triángulo Play y conserva una luz pequeña y diferenciada para indicar cálculo en curso, resultado correcto, advertencia o error.
- Nuevo explorador didáctico «Explorar proceso…», disponible solo con resultados vigentes: recorre corrientes y equipos mediante Anterior/Siguiente, destacando el elemento en el diagrama y mostrando resultados de DWSIM reales.
- El recorrido sigue las dependencias de conexión cuando es posible; para reciclos advierte que no representa las iteraciones ni la secuencia interna de resolución del motor.
- Explorar no hace nuevas solicitudes de simulación y se cierra al invalidar, recalcular, cambiar o cerrar el proyecto; pruebas Chrome.

## 0.43.3 — 2026-11-20

- Se elimina definitivamente el botón fantasma junto a «Calcular» (resto obsoleto de «Rótulo»).
- La barra del simulador muestra una pequeña luz de estado: pulsación durante el cálculo, verde al completarse, rojo ante error y advertencia cuando el proceso requiere recalcularse. El pie del diagrama refleja los mismos estados.
- La cuota por sesión de alumno pasa de 4 a 12 cálculos/minuto para permitir ejercicios iterativos sin quitar la protección contra abuso; administración conserva su tratamiento anterior.
- Pruebas de regresión para la cuota y el indicador de cálculo en navegador.

## 0.43.2 — 2026-11-20

- Edición de anotaciones directamente sobre el diagrama: doble clic abre editor superpuesto, Ctrl+Enter guarda, Esc descarta, Supr elimina la nota seleccionada.
- Herramienta «Texto» en la barra del diagrama: hacer clic en la lámina inserta una anotación en esa posición, con edición inmediata.
- El arrastre de las notas se realiza sin redibujar el SVG en cada paso; cambios de notas son no físicos y se guardan con el proyecto y en la nube.
- La pestaña «Anotaciones» se conserva como administrador de notas y se actualiza al abrirla; pruebas en Chrome.

## 0.43.1 — 2026-11-20

- El reporte PDF permite incluir enunciado, consignas y observaciones de «Editar proyecto → Actividad» con una casilla habilitada por defecto.
- El texto completo se integra a la lámina A4 cuando cabe sin reducir demasiado el diagrama; si es extenso se agrega un anexo de actividad paginado y sin truncamientos.
- La vista previa indica si la actividad entra en la lámina o se adjunta como anexo; la exportación SVG/PNG conserva su funcionamiento anterior.

## 0.43.0 — 2026-11-20

- Editor de proyecto integrado: **Actividad / Anotaciones / Datos del informe** en un solo diálogo con pestañas, guardado conjunto, cancelación y acceso al generador de PDF.
- Nuevo menú **Proyecto** y botón «Editar proyecto…» en la barra. Se eliminan los dos accesos visibles separados de rótulo y ejercicio sin modificar la estructura de datos guardada.
- Pulido visual de diálogos: botones compactos, márgenes y barra de acciones comunes, formularios en columnas, foco discreto y mejor distribución del espacio.
- Los cambios de anotaciones en la ficha se preparan como borrador hasta guardar; cancelar no altera metadatos del proceso.

## 0.42.3 — 2026-11-20

- Compacta tipografía y alturas de las tablas en reportes de una sola hoja para dar mayor superficie al diagrama del proceso.
- Medición del ancho real del texto en celdas y abreviación de cabeceras y descripciones: ninguna etiqueta debe exceder los márgenes de impresión.
- Valores residuales numéricos cercanos a cero se indican como ≈ 0 en la lámina, conservando datos íntegros en CSV y Excel.
- Reserva un mínimo del 46 % del espacio de contenidos para el diagrama; prueba visual de regresión con cuatro tablas en A4 horizontal.

## 0.42.2 — 2026-11-20

- Biblioteca nube: «Cambiar alumno…» mantiene activa la clase, permite ingresar con otro alias o crear una identidad nueva y conserva los proyectos separados.
- Para evitar mezclar alumnos se cierra el proyecto abierto, se desvincula la identidad de la sesión y se limpia el último borrador del navegador.
- API segura para liberar la identidad individual sin borrar alumnos ni proyectos D1; pruebas de cambio y recuperación de trabajos.
- El rótulo de reportes y diagramas muestra automáticamente el modelo termodinámico configurado para el proceso.

## 0.42.1 — 2026-11-20

- Unifica diagrama y tablas seleccionadas en **una sola hoja PDF** A4/A3/Oficio; orientación automática por proporción del diagrama y reservas para rótulo inferior derecho.
- La vista previa muestra también las tablas dentro de la hoja, no páginas adicionales; si hay demasiadas para un diseño legible, advierte al usuario que reduzca la selección o amplíe el papel.
- El PDF deja de generar páginas sucesivas de balances en reportes simples.

## 0.42.0 — 2026-11-20

- Archivo reorganizado en Proyecto, Mis proyectos en nube, Exportar y presentar y Copias en esta computadora; distingue guardar nube de descargar JSON.
- Acceso directo Reporte PDF · diagrama y balances, con tablas seleccionables de equipos, corrientes, balances y componentes.
- Lámina PDF A4, A3 u Oficio (216 × 330 mm), márgenes y orientación configurables, rótulo compacto abajo a la derecha y vista previa antes de descargar.
- Rótulo de imágenes SVG/PNG también compacto; controles del editor de rótulo ajustados; iconos de nube neutros salvo foco y hover.

## 0.41.0 — 2026-11-20

- Accesos rápidos a biblioteca y guardado en la nube junto al botón de guardar del editor; identidad del alumno o clase visible en la barra.
- Rótulo técnico editable con alumno, ID, clase, grupo, materia, institución, docente, número de lámina y revisión, guardado como metadato no físico del proyecto.
- Las exportaciones SVG, PNG y PDF permiten incluir el rótulo con título y enunciado existentes; el PDF ofrece añadir una hoja con balances cuando existen resultados vigentes.
- Validación de metadatos del rótulo y prueba real con Chrome de exportaciones.

## 0.40.1 — 2026-11-20

- Se retira información técnica innecesaria del diálogo de proyectos de estudiantes.
- Al identificar un alumno correctamente, el diálogo se cierra y muestra confirmación en el simulador; los fallos aparecen junto al formulario y la espera tiene tiempo máximo.
- Archivo ofrece «Guardar proyecto en nube» directamente; si hace falta, solicita la identidad primero.
- Se rediseñan los controles de cierre de las ventanas con mayor tamaño, contraste y foco visible, respetando la identidad visual de ΣIM.
- Se ajusta el selector del formulario de identidad para evitar bordes y recuadros recortados.

## 0.40.0 — 2026-11-20

- Primera biblioteca persistente de proyectos por alumno y clase en Cloudflare D1: guardado explícito, reapertura desde cualquier navegador y actualizaciones automáticas con control de revisión.
- Identidad individual por alias y clave personal; cada alumno accede exclusivamente a sus proyectos. Administración puede consultar proyectos por clase sin editarlos.
- Renovación de códigos de clase conservando el identificador de clase, los alumnos y los proyectos asociados.
- Migración 0004_student_projects.sql requerida antes de publicar la versión 0.40.0.

## 0.39.0 — 2026-11-19

- Unificación del título del proyecto y ejercicio: el editor didáctico reutiliza el nombre del proyecto y no crea otro título.
- Biblioteca de proyectos locales con lista, apertura, borrado, guardado y copia independiente; no es almacenamiento en la nube.
- Se conserva «Recuperar último proyecto» y la exportación/importación JSON para trasladar proyectos entre dispositivos.

## 0.38.1 — 2026-11-19

- Ajuste del ancho del botón «Ejercicio y notas…» en la barra superior: ya no se recorta el texto.

## 0.38.0 — 2026-11-19

- Editor de ejercicios: título, enunciado, consignas y observaciones editables y persistidos en el JSON del proceso.
- Anotaciones sobre el diagrama arrastrables y editables; separadas de los nodos físicos, conservan el estado de cálculo.
- Importación de proyectos con campos didácticos y anotaciones validadas; los casos anteriores siguen siendo compatibles.

## 0.37.0 — 2026-11-19

- Nuevos ejemplos 18 (70/30) y 19 (50/50) de recirculación estacionaria simple de agua: archivos JSON editables, casos del navegador y resolución en la guía.
- Inspirados en el tutorial oficial de DWSIM, pero limitados a Mixer–Splitter: no se presenta el circuito completo con Heater y Recycle nativo como calculable sin validar.
- Resultados de referencia de materia exclusivamente analíticos, con ejecución en los gateways pendiente; sin cambios de solver ni publicación de capacidades nuevas.

## 0.36.2 — 2026-11-18

- Corregidos los controles del diálogo Herramientas → Diagnóstico: etiqueta Eventos sin cortes de palabra, selector alineado y botones que se acomodan en pantallas pequeñas.
- La consola y la zona de acciones respetan el ancho disponible sin alterar registros ni cálculos del motor.

## 0.36.1 — 2026-11-18

- Corregida la etiqueta de motor fijado: al elegir Windows o Debian refleja inmediatamente el destino seleccionado, incluso si el gateway está desconectado.
- El diagnóstico de compatibilidad identifica la operación o función ausente, en vez del mensaje genérico «Gateway sin las operaciones requeridas».
- No modifica el enrutamiento del POST de cálculo ni realiza cambios de motor en modo fijo; solo frontend.

## 0.36.0 — 2026-11-18

- Selección automática de Windows o Debian por disponibilidad y capacidades; modo manual reservado al administrador.
- Un POST de simulación ya enviado no se retransmite automáticamente: el alternativo queda preparado para el siguiente cálculo.
- Consola de diagnóstico de la 0.35.1 conservada íntegramente; sin cambios en gateways DWSIM.

## 0.35.1 — 2026-11-18

- Herramientas → Diagnóstico se convierte en consola técnica con eventos estructurados, filtro de advertencias/errores, tiempos, motor, versión y HTTP.
- Se diferencian explícitamente la comprobación de conexión, validación de capacidades, solicitud POST, respuesta del backend y fallo previo al envío; sin inventar pasos internos de DWSIM.
- Reporte JSON descargable o copiable con metadatos limitados y sin cuerpos de solicitud, credenciales ni rutas privadas. Registro limitado a 100 eventos locales; se pierde al recargar.
- Solo afecta al frontend: no modifica la selección manual de motores, ecuaciones, gateways ni los resultados de simulación.

## 0.35.0 — 2026-11-18

- Nuevo Ejemplo 17, recirculación estacionaria de agua sin reacción con mezclador y divisor (60 % producto / 40 % retorno).
- Algoritmo limitado de corte virtual, iteraciones acotadas y tolerancias de convergencia. La API anuncia `simple_material_recycle`; los gateways anteriores bloquean el cálculo en la interfaz.
- El rótulo del lienzo distingue diagramas con/sin recirculación. Reactores de conversión y equilibrio existentes permanecen sin cambios; CSTR/PFR y lazos con reacción quedan pendientes.
- La fórmula analítica es referencia didáctica; la validación física con motores Windows y Debian debe realizarse después de actualizar ambos backends.

## 0.34.1 — 2026-11-18

- El pie del diagrama muestra una sola vez el estado del cálculo, a la derecha y con el color correspondiente.
- El estado auxiliar izquierdo se oculta sin cambiar el comportamiento interno ni los cálculos DWSIM.

## 0.34.0 — 2026-11-18

- El pie del diagrama reemplaza la advertencia permanente por tres estados dinámicos: **Sin resultados**, **Resultados vigentes** y **Recalcular**; durante una resolución muestra **Calculando…**.
- Los cambios físicos posteriores a un cálculo correcto invalidan los resultados; cambios exclusivamente visuales (mover equipos, codos, zoom, cuadrícula) no lo hacen.
- Abrir o crear otro proyecto restaura **Sin resultados**. Cambiar el motor después de calcular exige volver a ejecutar el cálculo en el motor elegido.
- Se sincroniza la vigencia de resultados en la ventana separada, sin modificar resultados DWSIM ni formatos de exportación.

## 0.33.0 — 2026-11-18

- Estado de motores y Administración comparan lado a lado las operaciones que anuncian los gateways Windows y Debian (`supported_equipment`).
- El monitor muestra explícitamente «Disponible», «No admite» o «Sin datos», conserva versiones y evita interpretar fallos de red como ausencia de una operación.
- Se advierte si un gateway anuncia una versión anterior al portal; no se cambia de motor automáticamente.
- Nuevo procedimiento para actualizar cada backend de forma controlada y verificar el contrato `/api/status` antes de ejecutar ejemplos.

## 0.32.0 — 2026-11-18

- El lienzo permite mostrar una cuadrícula y, por separado, ajustar equipos, extremos libres y codos a pasos de 20 unidades.
- Shift durante el arrastre restringe el movimiento al eje horizontal o vertical. El selector conserva su comportamiento anterior.
- Se priorizan recorridos ortogonales sin retrocesos ni segmentos diminutos y se conserva el ajuste manual de codos.
- Diagnóstico y actividad incorpora un botón compacto para copiar el texto visible al portapapeles, con aviso de éxito o error.
- Configuración visual guardada únicamente en el navegador; el diagrama exportado no contiene cuadrícula. Sin cambios en motores DWSIM ni resultados físicos.

## 0.31.0 — 2026-11-18

- Exportar resultados como opción principal: todos los datos por defecto. Excel conserva pestañas Corrientes, Balances, Componentes y Datos; CSV completo usa una única tabla rectangular con sección, registro, objeto, campo (incluye unidad) y valor.
- Exportaciones parciales de corrientes o balances disponibles dentro del diálogo CSV, con elección decimal conservada.
- Se elimina el segundo rótulo de tipo bajo todos los equipos del diagrama; nombres únicos visibles y tipo disponible en Propiedades.
- Pruebas de integridad de tabla unificada y descarga completa desde navegador.

## 0.30.1 — 2026-11-18

- Las llamadas de valores sustituyen la punta abierta por un círculo hueco pequeño, anclado al cuerpo de la flecha de corriente.
- El terminal sigue al anclaje durante el movimiento. Conserva recorrido adaptativo, nombres simples, exportaciones y conexiones.

## 0.30.0 — 2026-11-18

- Exportar resultados abre un diálogo previo con formato, datos y separador decimal coma/punto para CSV; recuerda la elección. Excel conserva números y explica que su visualización depende de Excel. Se retiran denominaciones regionales del menú.
- Diálogos de datos e imágenes con ancho acotado, encabezado y pie alineados, contenido desplazable y disposición adaptable.
- Las puntas de las llamadas de valores se anclan al borde del cuerpo de la flecha de su corriente, usando el mismo tramo, escala y orientación del símbolo SVG.
- El anclaje se recalcula durante el movimiento y el cambio de recorrido. Mantiene nombres simples, llamadas compactas y conexiones.
- Regresión de alimentación y corriente vertical. Conserva las exportaciones de 0.29.0.

## 0.29.1 — 2026-11-18

- Las puntas de las llamadas de valores se anclan al borde del cuerpo de la flecha de su corriente, usando el mismo tramo, escala y orientación del símbolo SVG.
- El anclaje se recalcula durante el movimiento y el cambio de recorrido. Mantiene nombres simples, llamadas compactas y conexiones.
- Regresión de alimentación y corriente vertical. Conserva las exportaciones de 0.29.0.

## 0.29.0 — 2026-11-18

- CSV para Excel con configuración argentina y CSV internacional para corrientes y balances. Conserva la precisión del motor.
- Libro Excel con valores numéricos, formatos decimales y anchos de columna adecuados.
- Exportación del diagrama completo o la selección a SVG, PNG y PDF vectorial. El PNG permite elegir escala y fondo. El PDF permite elegir papel, orientación, margen y ajuste.

- El diagnóstico del proyecto queda en Herramientas. Configuración aclara el alcance de los decimales en pantalla.

## 0.28.5 — 2026-11-18

- Corrientes: busca alternativas ortogonales por fuera de los equipos cuando el codo guardado cruza un cuerpo. Conserva el codo manual válido y las normales de entrada/salida.
- Regresión del caso divisor arriba y mezclador debajo con codo guardado al lado opuesto; todos los tramos quedan fuera de ambos cuerpos.
- Llamadas compactas: línea horizontal 145 en lugar de 240, quiebre inicial 18 en lugar de 28 y distancia preferida 20 en lugar de 32. Mantiene alternativas más separadas si hay obstáculos.

## 0.28.4 — 2026-11-18

- Puertos de mezclador, divisor, compresor, expansor y bomba ajustados a las caras de conexión, evitando esquinas extremas. Conserva índices y topología de proyectos.
- Los controles circulares de uniones conectadas se muestran al seleccionar, enfocar o pasar el puntero; el dibujo normal conserva una unión limpia.
- Llamadas de valores: la elección considera el sentido del tramo además del espacio y los obstáculos. Se comprueba el cambio de orientación al invertir un tramo vertical.

## 0.28.3 — 2026-11-18

- Llamadas de valores adaptativas: evalúan ambos lados y tres alturas arriba/abajo, penalizando bordes visibles y solapamientos con equipos y tramos de corrientes.
- La flecha abierta rota hacia su anclaje real y el recorrido se recalcula durante la edición. Nombres sin llamadas; no modifica datos ni conexiones.
- Pruebas de ambos bordes, obstáculos y seguimiento geométrico. Se conserva la navegación interna de 0.28.2.

## 0.28.2 — 2026-11-18

- Las licencias y el historial se abren en el editor y permiten volver con el botón, Escape o el historial del navegador.
- Administración aparece en la cabecera solo con una sesión administradora y abre el portal en otra ventana para conservar el proyecto y sus resultados.

## 0.28.1 — 2026-11-18

- Los nombres de corrientes, nombres y tipos de equipos vuelven a rótulos simples sin flechas.
- Las llamadas se dibujan únicamente cuando hay valores: temperatura, presión y caudal. Se mantiene el seguimiento del objeto y sus conexiones.

## 0.28.0 — 2026-11-18

- Todas las referencias del diagrama (nombre, tipo y valores) se agrupan en llamadas instrumentales: línea fina quebrada, flecha abierta y texto alineado.
- Las llamadas siguen al objeto al mover, redimensionar o acomodar el recorrido. Ajustar diagrama incluye sus límites; no se agregan conexiones ni campos a los proyectos.
- Se conservan los trazos de energía y los controles discretos de edición.

## 0.27.1 — 2026-11-18

- Corrientes de energía distinguidas por trazos en el listado DWSIM y en el diagrama, también al seleccionar.
- Se sustituye el círculo blanco central por un pequeño cuadrado de ajuste del recorrido, solo al seleccionar. Conserva arrastre y puertos de conexión.

## 0.27.0 — 2026-11-18

- El PFD y la biblioteca usan el modo de dibujo predeterminado de DWSIM; se retiró el selector visual.
- Columnas, CSTR, reactor tubular, polimerización y válvula de seguridad disponibles para diagramar. Los cálculos de estos equipos quedan pendientes.
- Los proyectos versión 1 conservan las conexiones y su numeración; sus puertos se dibujan en las posiciones correspondientes a los símbolos nuevos.

## 0.26.2 — 2026-11-17

- Estado técnico de motores identifica Windows 11 Home Single Language 25H2, compilación 26200.9974, CPU, memoria y gráficos declarados del equipo principal.
- El alternativo se identifica como GNU/Linux Debian, con versión pendiente de confirmar. La ficha descriptiva no modifica el estado observado ni las comprobaciones de conexión.
- Se mantienen las denominaciones neutrales en el selector y las guías. No se publican identificadores de dispositivo ni de producto.

## 0.26.1 — 2026-11-17

- Guías de usuario y mensajes de ejemplos sin referencias a Windows/Debian ni registros internos de pruebas. Se conservan datos numéricos, procedimientos y límites físicos.
- Selector, monitor e historial muestran Motor principal y Motor alternativo. Los identificadores windows/debian, destinos y credenciales no cambian; su correspondencia se documenta en README y documentación técnica.

## 0.26.0 — 2026-11-17

- Expansor adiabático de gas: presión de descarga, eficiencia isentrópica y corriente de energía de salida opcional. Símbolos en ambas paletas, inspector, validación y ejemplo 16 con guía.
- Tres eficiencias reales Windows verificadas: 60/80/90 %. Caso base nitrógeno, 300 → 100 kPa, 80 %: −39,464231 °C y 66,617946 kW producidos. Trabajo negativo hacia el gas en balances y exportaciones.
- Se valida fase vapor de entrada, presión descendente, presión especificada y potencia nativa contra descenso de entalpía. Requiere gateway actualizado; Debian pendiente, sin cambio automático de motor.

## 0.25.0 — 2026-11-17

- Energía: flecha recta de trazos verdes en biblioteca y vista previa, coherente con la corriente del lienzo.
- Tanque líquido independiente: volumen útil, pérdida de presión y tiempo de residencia nativo de DWSIM. Una entrada y salida; símbolos en ambas paletas, inspector, validación y ejemplo 15 con guía.
- Agua a 25 °C, 300 → 290 kPa y 1 kg/s, volumen 5 m³: residencia 4985,687325 s y salida 25,002215 °C. Tres casos reales Windows y 24 controles físicos; sin dinámica de nivel ni separación de fases.
- El cálculo comprueba Tank en el gateway elegido. Windows actualizado; Debian pendiente de actualizar y validar, sin conmutación automática.

## 0.24.0 — 2026-11-17

- Compresor adiabático de gas con presión de descarga, eficiencia isentrópica y corriente de energía opcional. Símbolos propios en ΣIM y DWSIM, inspector, validaciones y ejemplo 14 con guía.
- Caso real Windows: nitrógeno a 25 °C, 100 → 300 kPa, 1 kg/s, eficiencia 75 %: 170,880686 °C y 152,233190 kW. Tres eficiencias verificadas; informe y sonda reproducible en docs/validation y tools.
- Balances distinguen trabajo de eje de calor, conservando la clave histórica de exportación. Se rechazan alimentación no vapor, expansión y presión no respetada por el motor.
- Cálculo comprueba Compressor en el gateway seleccionado. Debian requiere actualización y validación propia; no se realiza cambio automático de motor.

## 0.23.3 — 2026-11-17

- Biblioteca: flecha recta para materia y flecha en zigzag verde para energía, en ambas paletas y en la vista previa de arrastre.
- La distinción usa forma y color. Sin cambios en la representación de corrientes del lienzo ni en puertos, proyectos o cálculos.

## 0.23.2 — 2026-11-17

- Biblioteca y selector de símbolos compactos, sin marco adicional.
- Selección por intersección parcial de equipos y tramos reales de corrientes, sin exigir encerrarlos por completo ni seleccionar el espacio vacío entre codos.
- Arrastre del conjunto desde cualquier objeto seleccionado, incluidos puertos y controles, conservando conexiones y distancias. Shift sigue sumando o quitando objetos.

## 0.23.1 — 2026-11-17

- Selector de diseño dentro de Equipos y corrientes; siluetas DWSIM más diferenciadas y acento azul compatible con ambos temas.

- Movimiento individual y de extremos sin límites artificiales del origen; colocación libre desde la biblioteca.
- Proyectos admiten coordenadas negativas finitas; Ajustar incluye todos los lados del diagrama.
- Se conservan las conexiones y condiciones físicas al mover equipos y corrientes.

## 0.23.0 — 2026-11-17

- En desarrollo, sin publicar: segunda paleta DWSIM con diez SVG originales, manteniendo ΣIM y sus símbolos originales.
- Gestor global con selector accesible, persistencia local y sincronización entre ventanas. No modifica archivos de proyecto, puertos, conexiones ni resultados.
- Tanque independiente reservado para un alcance posterior por acuerdo con el usuario: el catálogo actual contiene separador flash.
- Ver alcance, licencias y regresión en docs/PALETA-DWSIM.md.

## 0.22.2 — 2026-11-17

- El nombre de cada ejercicio es un botón accesible que abre su caso, reutilizando la carga y confirmación existentes. Resolución conserva su acción independiente.

## 0.22.1 — 2026-11-17

- Rectángulo de selección sin relleno: solo contorno discontinuo para conservar visible el diagrama durante el gesto. Sin cambios en selección, movimiento ni cálculo.

## 0.22.0 — 2026-11-17

- Selección múltiple por rectángulo desde el fondo del diagrama, Ctrl+A / Cmd+A o Ver → Seleccionar todo. Shift+clic suma o quita objetos; Shift+rectángulo amplía la selección. Movimiento colectivo con ratón o flechas, sin cambiar las conexiones ni las condiciones; Esc o clic en el fondo deselecciona.

- Reemplaza el menú largo de Ejemplos por un explorador con búsqueda por número, equipo o tema y filtros de balances, energía, mezclas/fases, presión y reacciones.
- Cada ejercicio ofrece abrir el caso o consultar su resolución directamente; la guía completa queda accesible en el mismo explorador.
- Conserva los trece proyectos, confirmación de reemplazo y actividad guiada del Ejemplo 13. Sin cambios en cálculos ni motores.

## 0.21.4 — 2026-11-16

- Tipografía y escala de los select del inspector unificadas con el resto de ΣIM (11 px, fuente institucional); incluye base y expresión de fracciones, unidades y opciones nativas.
- Sin cambios en modelos, cálculos, valores seleccionados ni lógica del editor.

## 0.21.3 — 2026-11-16

- Corrección del arrastre desde Equipos y corrientes: seguimiento por puntero (ratón/lápiz) hasta el lienzo, con vista previa visible. No depende del drag-and-drop HTML5 de botones, que fallaba en Firefox.
- El clic sobre un objeto de la biblioteca continúa agregándolo como antes; el gesto de arrastrar no crea duplicados.
- Al seleccionar o incorporar un objeto, se devuelve el foco al SVG del diagrama para que Supr y Retroceso eliminen la selección. El SVG es enfocable con teclado.
- Se mantienen las protecciones de edición de campos y diálogos, y la eliminación arrastrando fuera del área de diseño.
- Pruebas del punto de entrega, foco, atajos y limpieza de la implementación anterior. Sin cambios en DWSIM ni en la interfaz de los motores.

## 0.21.2 — 2026-11-16

- Se refuerza el arrastre nativo de equipos y corrientes desde la biblioteca al lienzo, con indicación visual del destino.
- Se retira el signo + de cada elemento de la biblioteca, para evitar que parezca una opción desplegable.
- Arrastrar un objeto del diagrama fuera del área de diseño (con margen de seguridad de 24 px) y soltarlo elimina ese objeto y todas sus conexiones. Una indicación aparece antes de soltar.
- Supr y Retroceso eliminan el objeto o la conexión seleccionada, sin interferir con la edición de texto, controles ni diálogos.
- Los movimientos de objetos dentro del lienzo conservan las conexiones. La eliminación invalida los resultados anteriores, como corresponde.
- Pruebas geométricas, de teclado y de integración del diagrama. Sin cambios de gateway, motor ni contrato de simulación.

## 0.21.1 — 2026-11-16

- Controles de acoplamiento minimalistas: reemplaza el selector grande por un icono compacto de tres puntos que conserva las cinco posiciones y restaurar.
- Franja de agarre más fina, botones discretos, espaciado entre títulos, números y acciones.
- Indicador de acoplamiento y control de redimensionamiento menos intrusivos.
- Sin cambios en la lógica de arrastre, acoplamiento, motores o proyectos.

## 0.21.0 — 2026-11-16

- Nuevo administrador de paneles estilo CAD: arrastrar desde una franja visible y acoplar a izquierda, derecha, arriba o abajo con vista previa.
- Selector de posición por panel, doble clic para separar/acoplar y opción de restaurar la distribución estándar.
- Redimensionamiento flotante desde una esquina y de paneles acoplados con separadores; posiciones y tamaños se conservan en el navegador.
- Cabeceras con separación clara entre título, número de orden (01/02) y controles; el diagrama sigue ocupando el área central.
- Persistencia independiente del JSON y los cálculos DWSIM. No se cambian gateways, motores, conexiones ni permisos.

## 0.20.1 — 2026-11-16

- Arrastre corregido para los paneles flotantes, incluso por encima del SVG del editor.
- Ocho bordes y esquinas de redimensionamiento con límites de pantalla y persistencia local.
- Limpieza del menú Ver, sin instrucciones sueltas.

## 0.20.0 — 2026-11-16

- Ventanas de trabajo flexibles en escritorio: intercambiar biblioteca y propiedades, flotarlas y acoplarlas, moverlas por cabecera y restaurar la distribución predeterminada.
- Balances y resultados también pueden flotar dentro de la página; se mantiene la opción anterior de separar diagrama o resultados en ventanas sincronizadas.
- La distribución se guarda solamente en el navegador; nunca modifica el proyecto o la simulación.
- Ayuda → Manual de uso abre ahora la documentación canónica de la wiki; ayuda.html redirige al manual para conservar enlaces antiguos.
- Pruebas de disposición, controles y referencias. Sin cambios en gateway ni en motores DWSIM.

## 0.19.1 — 2026-11-16

- La actividad guiada pasa a estar integrada en el Ejemplo 13, sin una entrada adicional en el menú Ejemplos.
- Al abrir el Ejemplo 13 se selecciona el intercambiador y se muestra en Propiedades el botón «Iniciar actividad guiada».
- Se conservan las predicciones, la comparación con DWSIM y el capítulo de la wiki; no cambian el motor, la API ni el diagrama.

## 0.19.0 — 2026-11-16

- Actividad guiada opcional para el Ejemplo 13: reconocer entradas y especificación, formular dos predicciones, ejecutar el cálculo manualmente y comparar temperaturas de salidas y residuos de masa.
- La comparación lee únicamente resultados vigentes devueltos por DWSIM; los valores de referencia históricos están identificados por separado y no se presentan como nuevos cálculos.
- Se accede desde el menú Ejemplos, sin cambiar automáticamente de motor, modificar el gateway ni ejecutar cálculos desde el tutor.
- Pruebas de reconocimiento de puertos, ausencia de resultados, valores del motor y ausencia de scripts inline.

## 0.18.0 — 2026-11-16

- Ayuda contextual en el inspector de los 12 tipos de objetos: enlace directo al capítulo correspondiente de la wiki de ΣIM.
- Acceso al índice de 16 capítulos desde el menú Ayuda, en una pestaña nueva. No envía condiciones ni datos del proyecto a la wiki.
- Pruebas unitarias del mapa de enlaces, de los tipos admitidos y del orden de carga del módulo.
- Sin cambios de cálculo, conexiones, gateway ni motores. Las actividades guiadas paso a paso quedan para una entrega posterior.

## 0.17.5 — 2026-11-16

- La revisión previa del proyecto muestra parámetros de equipo obligatorios faltantes, no numéricos o fuera de rango: bombas, válvulas, intercambiador, divisor, calentador, enfriador y reactores.
- No realiza análisis algebraico completo de grados de libertad ni sustituye al validador del gateway, los cálculos del motor o comprobaciones físicas.
- Se vincula con el capítulo propio de grados de libertad y especificaciones de la wiki; sin cambios de API ni de motores.

## 0.17.4 — 2026-11-16

- Administración: seguimiento de cambios de disponibilidad, ocupación y estado no confirmado de Windows y Debian; historial limitado a 20 eventos en memoria de la pestaña.
- Se informa desde cuándo se observa el estado, fallos consecutivos y advertencia si la versión del gateway precede a la del portal.
- No se controlan servicios ni se exponen credenciales; no hay cambios en el cálculo DWSIM ni en sus API.

## 0.17.3 — 2026-11-16

- Enlaces directos a ejemplos, ayuda, catálogo y adaptación sin sesión redirigen al ingreso con aviso claro y retorno a la página elegida. Destinos limitados a páginas conocidas del mismo portal; no se admiten redirecciones externas ni retorno al panel administrativo con rol de alumno.
- APIs y scripts conservan sus respuestas JSON y controles de autorización.

## 0.17.2 — 2026-11-16

- Consolida README e índice de documentación; agrega guía cotidiana de administración y actualiza acceso/seguridad, flujo de trabajo, despliegue, roadmap y comprobaciones. Separa propuestas históricas del estado publicado.
- Actualiza ayuda y catálogo del portal, nombres del menú, plazos de sesión, copia de códigos activos y alcance del monitor de consulta. Sin cambios en motores ni cálculos.
- Sincroniza la documentación de ΣIM en la wiki, en español e inglés, con las capacidades y límites actuales.

## 0.17.1 — 2026-11-16

- Unifica tipografía del pie en la fuente de interfaz; la identificación de sesión hereda el mismo color y fuente que sus controles vecinos. Conserva colores semánticos de conexión y la identidad de marca.
- Acerca de usa una misma fuente, tamaño base y color para párrafos y listas. Sustituye la lista histórica acumulada por cuatro puntos de la entrega; el historial completo permanece enlazado.

## 0.17.0 — 2026-11-16

- Integra rol, nombre de clase, contador del alumnado y salida en el pie existente del editor y del panel privado. Elimina la franja adicional sobre el área de trabajo y conserva identificación del administrador sin contador.
- Los nuevos códigos activos quedan visibles y copiables en el listado privado. Se guardan cifrados con AES-GCM, además del HMAC de validación, y solo se descifran para el administrador mientras la clase siga activa y vigente. Los anteriores, guardados únicamente como HMAC, se identifican como no recuperables.
- Migración aditiva `0003_recoverable_class_codes.sql`; no cambia códigos existentes ni invalida sus sesiones.

## 0.16.0 — 2026-11-16

- Reorganiza ingreso y panel privado: selección clara de alumno/administrador, sesión existente visible, salida explícita y administración centrada en clases. Código recién creado en un bloque propio con copia y ocultación; listado con estado y vencimiento.
- Distingue «Estado de motores» (consulta) de «Administración de clases» (privado). El servidor redirige al ingreso administrativo al solicitar el panel sin el rol requerido y mantiene 403 en APIs y archivos administrativos.
- Corrige las tarjetas de motores con altura natural y diálogo adaptable, sin heredar los límites de los resultados del editor. Registro y ayuda de recuperación plegables.
- Todos los diálogos se cierran al hacer clic en el fondo, sin cerrar al pulsar dentro ni al arrastrar desde el contenido.
- Franja de sesión compacta, nombre de clase con truncado accesible y salida explícita. Contador exclusivo del alumnado; administrador identificado sin cuenta regresiva. Conserva vencimientos y permisos internos.

## 0.15.0 — 2026-11-16

- Franja debajo del menú con rol, nombre de clase y cuenta regresiva. El panel de administración muestra «Administrador · Sesión administrativa».
- El servidor entrega nombre y vencimientos solo de la sesión vigente, sin códigos ni identificadores privados. El contador usa la hora del servidor y el menor vencimiento entre clase y sesión; si la clase dura más, informa su fecha de cierre.
- Revalida al volver a la pestaña y cada minuto para detectar desactivaciones. Al terminar el acceso, avisa y ofrece volver a ingresar sin cerrar ni borrar el proyecto.
- Se mantienen límites de sesión (4 horas de alumno, 8 de administrador), plazos de clase y controles de rol en servidor.

## 0.14.3 — 2026-11-16

- Simplifica el texto de ingreso: «Ingresá un código de clase para utilizar el simulador» y «El acceso es temporal».
- Registra únicamente los nombres de configuración ausente o insuficiente, sin valores ni longitudes de secretos. Conserva mínimos de 32 caracteres para sesión y 20 para contraseña administrativa y el cierre ante configuración inválida.

## 0.14.2 — 2026-11-16

- Respeta el atributo `hidden` en el formulario de ingreso: cada rol muestra solo su campo de credencial. Corrección visual; se conservan los controles de rol en servidor.

## 0.14.1 — 2026-11-16

- Herramientas → Motores y servicios abre un diálogo integrado de solo lectura, sin navegación ni acciones administrativas.
- Conserva comprobación manual, seguimiento de Windows y Debian cada 30 segundos solo con el diálogo abierto y la página visible, e historial de hasta 20 eventos.
- Integra acceso por códigos de clase sin correo, sesiones protegidas, cuota de cálculos y panel privado de creación/desactivación de clases. Mantiene los controles de rol en servidor; no habilita reinicios ni administración de clases al alumnado.

## 0.14.0 — 2026-11-16

- Panel de diagnóstico de solo lectura para Windows y Debian (`/admin.html`): disponibilidad, versión efectiva del gateway, hora de inicio, uptime y equipos reconocidos, con actualización manual o automática de 30 segundos e historial limitado a la sesión. Sin botones de encendido o apagado ni secretos.
- Guía de recuperación local con scripts de Windows y `systemctl` en Debian. Un motor apagado se informa como no confirmado; no hay conmutación automática ni control remoto de procesos.
- Prueba reproducible `tools/validate-hx13-windows.ps1` ejecutada contra el gateway Windows: **19 controles OK**. El Ejemplo 13 reproduce la referencia Debian con las cifras comunicadas: entrada/salida caliente 80,000000 / 70,456556 °C; entrada/salida fría 20,000000 / 29,565765 °C; 300 kPa y 1 kg/s por lado.
- Transferencia de calor: 40,00000037 kW cedidos, 40,00000004 kW recibidos y 0,00000033 kW de residuo energético. Validación cruzada de este caso, no de todo el dominio del intercambiador.
- Pruebas de estructura y seguridad del panel. Queda pendiente verificar el panel publicado; no se habilita administración remota de servicios.

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
