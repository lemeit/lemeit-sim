# Trabajar con un proyecto

Revisión del 28/11/2026 · Online 0.53.4 y Desktop 0.53.4-alpha.1. Los apartados históricos se complementan con el [manual de la wiki](https://wiki.lemeit.ar/sim/manual-de-uso/).

## Flujo recomendado actual

1. Ingresá con código de clase y elegí identidad individual de alumno si usás biblioteca de proyectos en nube.
2. Creá proyecto, abrí uno de la biblioteca de clase o cargá un archivo JSON. Los ejemplos se buscan en **Ejemplos**.
3. Agregá operaciones y corrientes desde los selectores por categorías o la paleta. Usá puertos visibles, arrastre y Supr. Para mover el lienzo, **Espacio + arrastre** o rueda central.
4. Completá modelo termodinámico, composiciones, alimentaciones y especificaciones. Revisá **Herramientas → Diagnóstico del proyecto**.
5. Elegí explícitamente Windows o Debian y pulsá **▶ Calcular**. Interpretá luces de estado y vigencia de resultados.
6. Abrí **Explorar proceso…** para estudiar ecuaciones, balances y valores de DWSIM ya calculados, sin relanzar la simulación.
7. Guardá el proyecto **en la nube**; opcionalmente descargá una **copia JSON**. Para presentar, exportá tablas CSV/Excel o **Reporte PDF · diagrama y balances** con rótulo, actividad y tablas.
8. Un valor cercano a cero en la energía neta de un intercambiador **no** implica transferencia térmica interna cero. Ver [interpretación energética](interpretacion-intercambiadores.md) (corrección integrada desde 0.47.5).

## Guardar y abrir en Desktop

**Archivo → Guardar copia de proyecto (.sim)…**, el disquete o **Ctrl + S** abren el selector de carpeta y nombre. La confirmación muestra la ruta escrita. Para abrir una copia `.sim` o un proyecto Online `.json`, usá **Archivo → Abrir proyecto…**. Los archivos incluyen la última corrida válida y el formato de Gráficas cuando el proyecto los tiene.

**Biblioteca local…** y **Recuperar borrador local** permiten retomar el trabajo en el mismo equipo. Consultá la [guía Desktop](../desktop/README.md) para ejecutar el prototipo y seleccionar el motor local.

## Dinámica y gráficas

Para la práctica de acumulación abrí Ejemplo 20, fijá Debian, seleccioná T-01 y abrí Dinámica del tanque · nivel y curvas. La [guía de gráficas](graficas-cientificas.md) describe los controles, la lectura de series y la exportación SVG/CSV. No confundir con Explorar proceso, que recorre resultados estacionarios.

## Organización visual reciente

Arrastrá las cabeceras para mover paneles flotantes y los bordes para ajustar tamaños. El separador horizontal ↕ dentro de cada lateral ajusta alturas de paneles apilados; doble clic lo centra. La barra mantiene los grupos en un orden fijo y pasa a otra fila si falta espacio. En Desktop, F1 abre el manual local. En Online, usá Ayuda → Manual de uso para ir a la wiki. El tema se selecciona en cabecera; los detalles +/− y el desplazamiento interno mantienen estable el explorador de proceso.

## Registro histórico de comandos y paneles previos

## Ingresar y reconocer la sesión

Abrir el simulador, elegir **Alumno** e ingresar el código de clase. No se necesita correo ni cuenta individual. El pie gris muestra clase, tiempo restante y **Salir**. La sesión dura hasta cuatro horas o hasta que venza/se desactive la clase, lo que ocurra antes. Guardar el proyecto antes de cerrar sesión o volver a ingresar.

**Herramientas → Estado de motores** es una consulta de disponibilidad; **Administración de clases** requiere rol de administrador. Los diálogos se cierran por botón, Escape o clic fuera. Para crear códigos, consultar [Administración de clases](administracion-clases.md).

## Crear el proyecto

1. Después de validar el acceso, ΣIM abre sin proyecto. La biblioteca queda inactiva.
2. Elegir Archivo → Nuevo proyecto. Definir nombre, componentes y un modelo de
   propiedades adecuado a las sustancias y condiciones del caso.
3. Crear el proyecto: el diagrama está vacío. Los componentes/modelo son metadatos,
   no un proceso construido automáticamente.
4. Agregar corrientes y equipos desde la biblioteca por clic o arrastrándolos.
5. Seleccionar una salida y luego una entrada compatible para conectarlas. Una
   corriente une equipos; la conexión crea también el vínculo correspondiente en DWSIM.
6. Seleccionar una alimentación y completar temperatura, presión absoluta, caudal
   y fracciones másicas. Las fracciones deben sumar uno.
7. Definir las especificaciones del equipo seleccionado. El modelo de reactor y
   su estequiometría son una elección separada del paquete de propiedades físicas.
8. Calcular y revisar corrientes y balances en el panel inferior. Los cambios de
   datos físicos invalidan resultados; mover un símbolo no cambia el cálculo.
9. En Online, usá **Guardar en nube** o descargá una **copia JSON** desde Archivo. **Recuperar último proyecto** recupera el borrador del navegador.

Los ejemplos se abren opcionalmente desde el menú Ejemplos. Si hay un proyecto
activo, la aplicación avisa antes de reemplazarlo. No son resultados experimentales.

La interfaz permanece disponible cuando el motor está desconectado. Se pueden
crear y guardar diagramas con el catálogo de nombres guardado; no se inventan
resultados ni se habilita Calcular hasta contar con el motor.

## Manejo del lienzo y paneles

Las corrientes de materia se representan con flechas; las de energía, con línea
discontinua. Sus extremos conservan los puertos para conectar equipos.
La rueda del mouse o el gesto de pinza del trackpad cambian el zoom alrededor del
puntero. Los botones + y − acercan y alejan; Ajustar recupera la vista del proceso.
Alt + arrastrar, o arrastrar con el botón central, desplaza el lienzo.
En pantallas de más de 760 px, arrastrar el borde interior de los paneles laterales
cambia su ancho. También se puede enfocar el separador con Tab y usar las flechas;
un doble clic restaura el ancho original.

## Conectar corrientes mediante sus extremos

Seleccioná la corriente para mostrar sus dos extremos. Arrastrá la punta a la entrada
de un equipo, o su inicio a la salida de un equipo. Los puertos aparecen al pasar
sobre el símbolo. Soltar en un espacio libre deja ese extremo desconectado.
Se rechazan puertos ocupados, materia/energía incompatibles y sentidos incorrectos.
Los clics de salida a entrada siguen disponibles como alternativa de teclado.
La corriente completa es una única línea seleccionable; no hay una flecha separada
para cada conexión. Los proyectos guardados antes de este cambio se conservan.

## Espacio de diseño ampliado y ventana independiente

- **Solo diagrama** oculta encabezado, biblioteca, propiedades y resultados.
  **Volver a paneles** o Escape recupera el entorno completo.
- **⛶** solicita pantalla completa al navegador.
- **Separar ↗** abre una ventana del mismo proyecto. Puede requerir habilitar ventanas
  emergentes. Las vistas abiertas se sincronizan en el mismo navegador mediante
  BroadcastChannel; no necesita otro servicio. No es una función multiusuario.
  Mantener abierta la vista principal mientras se abre o recarga la secundaria.
- **Agregar…** incorpora un único objeto desde la barra del propio diagrama.

Seleccioná un equipo y arrastrá el cuadrado de su esquina inferior derecha para
cambiar el tamaño. También se puede indicar un porcentaje (50–300 %) en Propiedades.
Se escala el símbolo con sus puertos: no se dimensiona físicamente el equipo ni
se cambian sus resultados termodinámicos.

Seleccioná una corriente y arrastrá el círculo central para desplazar su codo.
Al arrastrar un extremo cerca de un puerto compatible y libre, el puerto se resalta
y el extremo se ajusta a él. Los puertos ocupados siguen protegidos.

La ventana separada abre con **Equipos y corrientes** visible. El botón **Biblioteca**
permite ocultarla o recuperarla dentro de Solo diagrama. Conserva sus controles de
arrastre, alta de objetos y ancho ajustable.

## Menús y herramientas

Los menús abren de a uno. Con un menú abierto, pasar por otro cambia el desplegable;
el clic posterior mantiene abierto el que se acaba de seleccionar. Escape y un clic
fuera cierran. Flechas izquierda/derecha cambian de menú; arriba/abajo recorren
acciones. Ctrl+N, Ctrl+O y Ctrl+S actúan sobre el proyecto fuera de los diálogos.

- Archivo: nuevo, abrir, recuperar, guardar, cerrar y exportar resultados.
- Simulación: calcular, revisar conexiones/especificaciones, modelo y compuestos.
- Ver: diagrama, biblioteca, ventana separada, pantalla completa y balances.
- Ejemplos: acceso a los trece casos y a su guía de resolución.
- Herramientas: configuración, calculadora de unidades/composición, estado de ambos motores, diagnóstico del proyecto y administración de clases (solo admin).
- Ayuda: alcance, documentación y licencias.

Configuración permite variar los decimales de las tablas y ocultar las ayudas del
lienzo. Las preferencias son locales; no modifican el cálculo ni las exportaciones.

## Diagnóstico y estado

El monitor del motor seleccionado, accesible desde el pie, comprueba /api/catalog y /api/status cuando están disponibles, y registra fecha y latencia,
catálogo disponible y estado del último cálculo. No representa CPU/memoria,
no inicia servicios y no da acceso a registros privados del servidor.

Diagnóstico muestra una revisión básica, el mensaje original del último fallo y
sugerencias por tipo de mensaje. Las sugerencias no prueban la causa del error.
La actividad conserva hasta 30 entradas en memoria de esa vista; se pierde al
recargar y no es una auditoría persistente del servidor. Descargar diagnóstico
genera un archivo local con esos datos, sin incluir credenciales de conexión.

Herramientas → Estado de motores consulta Windows y Debian en paralelo, con actualización manual u opcional cada 30 segundos mientras el diálogo está abierto y visible. Es una vista de solo lectura, distinta de la administración privada de clases.

## Exportaciones y panel de resultados

El borde superior del panel permite cambiar su altura; también se puede enfocar
con Tab y usar arriba/abajo. Home o doble clic restablece un tamaño de trabajo.
× oculta el panel; Ver → Mostrar balances y resultados lo recupera.
↗ abre otra vista sincronizada con resultados del mismo workspace. Mantener abierta
la principal; no se recalcula por abrir la vista. Esta función no es multiusuario.

### Exportar resultados y diagramas

En **Herramientas → Configuración**, el ajuste de decimales controla la presentación de las tablas en pantalla. El diagnóstico de especificaciones y conexiones está en **Herramientas → Diagnóstico del proyecto**.

En **Archivo**, los resultados vigentes se exportan como corrientes o balances:

- **CSV para Excel (Argentina)** usa UTF-8 con BOM, punto y coma entre campos y
  coma decimal. **CSV internacional** usa UTF-8, coma entre campos, punto decimal
  y comillas en los campos que las requieren. Ambos conservan el valor numérico
  completo y omiten separadores de millares.
- **Excel (.xlsx)** incluye Corrientes, Balances, Componentes y Datos. Las celdas
  son numéricas. Se ajusta la visualización con formatos y anchos de columna.
  Excel trabaja con hasta 15 cifras significativas. El CSV conserva la
  representación completa del valor a la salida del simulador.
- Las cabeceras indican las unidades. Temperatura y presión absoluta se convierten
  de K a °C y de Pa a kPa. Densidad, caudal molar, entalpía y entropía conservan la
  escala y referencia del motor. El CSV carece de anchos de columna. Para controlar
  la presentación de temperaturas con muchos decimales al abrir el archivo, usá Excel (.xlsx).

Para el PFD, elegí **Exportar diagrama** en Archivo o **Exportar…** en la barra del
diagrama. Podés exportar todos los objetos o seleccionar primero los equipos y
corrientes que querés incluir. La geometría de las corrientes incluidas conserva
sus extremos y recorridos del proyecto. Las uniones conectadas quedan limpias y
se indican los puertos libres de los equipos. El área se calcula a partir del
contenido y de los rótulos, incluidos los objetos que están fuera de la vista.

- **SVG** conserva trazos y texto, con fondo blanco o transparente.
- **PNG** usa un fondo blanco o transparente y escala 1× a 4×. Si supera 16.384
  píxeles por lado o 32 millones de píxeles totales, elegí una escala menor o SVG/PDF.
- **PDF** conserva trazos vectoriales, texto y tipografía incrustada. Se ajusta en
  una página A4 o A3 con orientación vertical u horizontal y márgenes de 10, 15 o
  20 mm. Para diagramas muy extensos, A3 o una selección permite conservar rótulos
  más grandes. **Reducir solo si es necesario** mantiene como máximo la escala
  de 96 unidades del dibujo por pulgada.

La descarga se genera en el navegador en la vista web principal, la ventana
separada y la aplicación instalada. El dibujo comparte el port SVG de símbolos
DWSIM usado por el editor. El archivo de resultados contiene datos de simulación.

## Ventanas compactas y monitor de conexión

Las cabeceras internas usan 30 px y un cierre circular de 12 px dentro de un área
interactiva de 24 px. El pie reúne estado y licencias, con la marca al margen derecho.
Hacer clic en la conexión abre una consola de solo lectura: HTTP, latencia, fecha y
últimas 40 comprobaciones. Se actualiza cada 30 s mientras la vista principal está
visible; se puede desactivar y está desactivado por defecto en ventanas auxiliares.
HTTP 409 se muestra como ocupado, no desconectado. Una señal de más de 75 s se marca
sin actualizar. La luz pulsa suavemente con conexión reciente y respeta movimiento
reducido. No comprueba una simulación ni da acceso a una terminal.

## Orientación de corrientes y energía

El inspector permite elegir arriba, abajo, izquierda, derecha o automático para
un extremo libre. El recorrido respeta la dirección de entrada/salida de los puertos;
el puerto inferior de energía del calentador recibe una flecha hacia arriba y el
del enfriador la emite hacia abajo. Los codos se ajustan en el eje correspondiente.
Ajustar incluye los extremos reales de las corrientes y no solo su posición inicial.

En los equipos térmicos actuales, la energía representa calor sin transporte de
materia. Se especifica la temperatura de salida y el motor calcula la potencia.
Un intercambiador completo de dos fluidos, con cuatro puertos de materia, sigue
pendiente; no debe confundirse con el calentador/enfriador de un solo lado.
Referencia: https://dwsim.org/help/main/24-unit-operations.html

## Corrientes y propiedades · 0.2.0

Seleccionar una corriente abre Condiciones, Composición y Resultados. Solo las
alimentaciones admiten datos de entrada. Las demás corrientes se calculan desde
su equipo de origen. Los archivos anteriores conservan TP, kg/s y base másica.

La especificación flash fija dos propiedades independientes: TP (temperatura y
presión), PH (presión y entalpía), PS (presión y entropía), PV (presión y fracción
molar de vapor) o TV (temperatura y fracción molar de vapor). Cada modelo tiene
un dominio de aplicación; el motor puede rechazar estados sin solución. La
referencia de entalpía/entropía depende del modelo. PS con IAPWS-IF97 se bloquea
porque una prueba real devolvió un estado con entropía distinta de la pedida;
PS se verificó con NRTL. No se sustituyen modelos automáticamente.

Elegir una unidad convierte la presentación y mantiene el valor físico canónico
del proyecto. Puede especificarse caudal másico o molar. Al elegir una base nueva
de caudal debe completarse su valor. Las fracciones suman 1. Al cambiar de base
de composición en mezclas se vacían: hay que ingresarlas en la nueva base. En
base molar el servidor obtiene las masas molares de DWSIM y convierte a base
másica para el conector, sin usar tablas aproximadas propias.

Resultados muestra mezcla global y fases presentes, con composición másica y
molar, entalpía, entropía y densidad. Líquido total agrega las fases líquidas y
no debe sumarse otra vez a Líquido 1/2. El caudal volumétrico global se obtiene
como caudal másico/densidad. El conector original devuelve cero para algunas
propiedades ausentes: se omiten fases sin fracción y densidades no positivas.
Las unidades de resultados pueden cambiarse sin recalcular. Cambiar datos físicos
invalida resultados anteriores. No se implementan aquí dinámica ni fase forzada.

## Monitor de conexión y cálculos · 0.2.2

La consola distingue CONEXIÓN (GET del catálogo) y CÁLCULO (POST de simulación).
Los cálculos registran inicio y finalización o error, HTTP cuando existe respuesta
y duración total medida desde el navegador, que incluye comunicación y cálculo.
La disponibilidad del servicio y el último cálculo son estados independientes:
un error de datos no demuestra que el motor esté desconectado. Las comprobaciones
de catálogo no ejecutan corridas ni borran el estado del cálculo anterior.
Se conservan los últimos 40 eventos de esta vista; se pierden al recargar.

## Edición directa de corrientes · 0.3.0

No hay selector de dirección en Propiedades. La punta libre se orienta de acuerdo
con su posición respecto del otro extremo; el tramo conectado sigue la orientación
del puerto. Durante una desconexión, la vista previa ya trata ese extremo como libre.
Arrastrar el control intermedio horizontalmente desplaza el codo horizontal;
arrastrarlo verticalmente elige el eje vertical. Esto no modifica las conexiones.
Al mover un extremo se reinicia el codo manual para adaptar el recorrido a la
nueva disposición. Los proyectos antiguos conservan sus extremos; la orientación
manual antigua deja de forzar la dirección de la flecha.

## Instalar ΣIM · 0.4.0

Abrir sim.lemeit.ar en un navegador compatible. Usar el icono de instalación de
la barra de direcciones o la opción de instalar del menú del navegador. Si el
navegador emite beforeinstallprompt, también aparece Ayuda → Instalar ΣIM.
No se muestra un botón sin acción cuando el navegador no ofrece instalación.
La instalación crea un acceso con la sigma roja y abre una ventana independiente;
no instala el motor DWSIM ni permite calcular sin servidor. No requiere registro.
La PWA conserva únicamente la página explicativa offline y su estilo. Las API y
las solicitudes POST no se interceptan ni se guardan en esa caché. La interfaz
sigue usando la red para evitar archivos de versiones anteriores. El guardado
JSON y el almacenamiento local de proyectos conservan su funcionamiento habitual.

Referencia: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable


## Explorar ejemplos · 0.22.0

El acceso **Ejemplos** abre una biblioteca, sin una lista creciente en el menú principal. Buscá por número, equipo o tema, o filtrá por balances, energía, mezclas y fases, presión o reacciones. La búsqueda y el filtro se combinan.

El nombre del ejercicio también permite abrirlo con un clic o con Enter/Espacio. Cada ejercicio tiene dos acciones: **Abrir caso** carga el proyecto (con confirmación si hay otro abierto); **Resolución** consulta directamente el ejercicio en la guía integrada sin reemplazar el diagrama. **Ver guía completa** permite recorrer todas las resoluciones. Consultar una resolución no ejecuta DWSIM.


## Seleccionar y mover varios objetos

- Arrastrá sobre un espacio vacío del diagrama para dibujar un rectángulo. Quedan seleccionados los equipos y corrientes cuyo cuerpo o recorrido esté completamente dentro.
- **Shift+clic** agrega o quita un objeto. **Shift+rectángulo** suma los objetos encerrados a la selección actual.
- **Ctrl+A** (Cmd+A en macOS), con el foco en el diagrama, selecciona todos los equipos y corrientes. También está en **Ver → Seleccionar todo el diagrama**. En un campo de texto sigue seleccionando su texto.
- Arrastrá un objeto seleccionado para mover el conjunto o usá las flechas del teclado. Las conexiones se mantienen; el movimiento gráfico no invalida resultados.
- **Esc** o un clic en el fondo quita la selección. **Supr/Retroceso** elimina los objetos seleccionados y sus conexiones e invalida los resultados. El gesto de arrastrar fuera para eliminar sigue reservado al objeto individual.
- **Alt+arrastrar** o el botón central desplazan la vista en lugar de seleccionar.
