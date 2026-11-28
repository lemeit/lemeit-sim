<img src="site/assets/sim-logo.svg" alt="ΣiM · Simulación de procesos" width="360">

[![Portal 0.53.2](https://img.shields.io/badge/portal-0.53.1-CF263B?style=flat-square&labelColor=101215&color=CF263B)](https://sim.lemeit.ar)
[![Motor DWSIM 10.2.15](https://img.shields.io/badge/motor-DWSIM%2010.2.15-F4F3EE?style=flat-square&labelColor=101215)](https://dwsim.org/)
[![Windows y Debian](https://img.shields.io/badge/motores-Windows%20%2F%20Debian-F4F3EE?style=flat-square&labelColor=101215)](docs/seleccion-manual-motores.md)
[![Licencia GPL](https://img.shields.io/badge/licencia-GPL--3.0--or--later-CF263B?style=flat-square&labelColor=101215)](LICENSE)

[![Documentación de proyectos](https://img.shields.io/badge/docs-wiki.lemeit.ar-F4F3EE?style=flat-square&labelColor=101215)](https://wiki.lemeit.ar/sim/)

Simulador de procesos con interfaz web en español y motor DWSIM, desarrollado con fines pedagógicos y sin finalidad comercial.
Marca: ΣiM · Simulación de procesos. El repositorio conserva el nombre lemeit-sim.
Sitio: https://sim.lemeit.ar · Identidad propia ΣiM, inspirada en tecnología retro: negro, blanco y rojo.

Es un piloto, no una réplica completa del editor de DWSIM.
[Catálogo de objetos](https://sim.lemeit.ar/catalogo.html) · [Hoja de ruta](docs/roadmap.md).

## Modalidades de ΣiM

| | ΣiM Online | ΣiM Desktop |
| --- | --- | --- |
| Acceso | [sim.lemeit.ar](https://sim.lemeit.ar) | Aplicación nativa Tauri 2, en desarrollo |
| Cálculo | Gateway y DWSIM MCP | Gateway local y DWSIM MCP local |
| Proyectos | Nube y copias JSON | Copias JSON y biblioteca local |
| Estado | Portal 0.53.1 | Prototipo funcional en Debian; 0.53.2-alpha.1 |

Desktop comparte el código científico y el formato de proyectos de Online, pero dispone de una capa visual específica. No hay todavía instaladores autónomos publicados. El prototipo requiere Python y un servicio DWSIM MCP existente; la independencia completa y las pruebas sin Internet siguen pendientes.

[Desarrollo de Desktop](desktop/README.md) · [Historial de Desktop](desktop/CHANGELOG.md) · [PR #167](https://github.com/lemeit/lemeit-sim/pull/167).

## Ejemplo 20 · Tanque dinámico con dos válvulas

Simulación temporal real mediante el adaptador DWSIM del circuito de agua a 25 °C. Abrir el Ejemplo 20, seleccionar el régimen dinámico y pulsar Calcular; Gráficas presenta la evolución del nivel.

| Magnitud | Referencia comprobada en Online |
| --- | --- |
| Duración | 600 s |
| Paso temporal | 5 s |
| Muestras | 121 |
| Alimentación | 10 kg/s |
| Nivel final | ≈ 0,333 m |
| Descarga final | ≈ 10 kg/s |

La integración también finalizó correctamente en el prototipo Desktop Debian (6,832 s según diagnóstico del 26/11/2026). El registro confirma la finalización, no contiene las 121 muestras ni permite comprobar nuevamente el cierre numérico. Se trata de una comprobación numérica, no experimental. El adaptador no integra cualquier topología dinámica; el explorador paso a paso dinámico permanece pendiente en ambas modalidades.

[Guía del Ejemplo 20](docs/ejemplo-20-tanque-dinamico-dwsim.md) · [Gráficas científicas](docs/graficas-cientificas.md).

## Ejercicios 18 y 19 · Recirculación

Adaptaciones didácticas del [tutorial oficial de DWSIM](https://dwsim.org/tutorials/en/intermediate/04-recycle-loops.html): lazo Mixer–Splitter con 70/30 y 50/50; balances de masa analíticos y archivos ΣiM disponibles en la guía. No incluyen el Heater a 350 K ni el bloque lógico Recycle nativo (todavía en pruebas), y requieren gateway con `simple_material_recycle`. Sin validación física completada en ambos motores.

## Versión Desktop en desarrollo · 0.53.2

En el PFD, arrastrá el cuerpo de un equipo o el recorrido de una corriente. Los puertos conservan su función de conexión. En la barra de herramientas, arrastrá el tirador sobre otro grupo para reordenarlo o hacia el área de trabajo para desacoplarlo. Arrastrá el borde derecho de un grupo para ajustar su ancho tanto en la barra como en el área de trabajo. La distribución se guarda localmente y se puede restablecer desde Ver. Con el tirador enfocado, Alt + ←/→ reordena, Alt + ↓ desacopla y Alt + ↑ vuelve a acoplar.


## Versión en desarrollo · 0.53.2

En el PFD, arrastrá el cuerpo de un equipo o el recorrido de una corriente. Los puertos conservan su función de conexión. En la barra de herramientas, arrastrá el tirador sobre otro grupo para reordenarlo o hacia el área de trabajo para desacoplarlo. Arrastrá el borde derecho de un grupo para ajustar su ancho tanto en la barra como en el área de trabajo. La distribución se guarda localmente y se puede restablecer desde Ver. Con el tirador enfocado, Alt + ←/→ reordena, Alt + ↓ desacopla y Alt + ↑ vuelve a acoplar.

## Versión publicada · 0.53.1

**Revalidación Debian (26/11):** Ejemplo 20 y Gráficas vuelven a funcionar tras actualizar el gateway desde 0.47.5. Un estado HTTP 200 no garantiza soporte dinámico; consultar `/api/dynamics/capabilities` y [recuperación](docs/operacion-local.md).

- Régimen estacionario o dinámico guardado por proyecto. Ejemplo 20 abre en Dinámico: pulsar Calcular integra DWSIM y abre Gráficas con tiempo y nivel.
- Desde **Ver → Gráficas** podés configurar un subtítulo y ajustar color, representación y grosor por curva. En **Administración → Operación y recuperación** podés copiar comandos o descargar el manual HTML.
- Gráficas flotantes y acoplables, dos curvas con eje derecho automático si las unidades difieren, escalas independientes, paleta fija y leyenda según representación. SVG, PNG, JPG y CSV; referencias del proyecto configurables.
- Ejemplo 20 comprobado en ambos motores: 121 muestras durante 600 s, paso 5 s, nivel final ≈0,333 m y descarga ≈10 kg/s. Consistencia numérica, no validación experimental.
- El adaptador dinámico admite solamente el circuito de agua a 25 °C con tanque y dos válvulas; no integra cualquier PFD. Sin reemplazo silencioso por modelo didáctico.
- Portal y gateway tienen versiones independientes. Consultar Ayuda → Acerca de y el monitor administrativo. La publicación efectiva se verifica por separado.

Como alumno, usá **Guardar en nube** en la barra y retomá el trabajo desde **Mis proyectos en la nube**. Después del primer guardado, los cambios se guardan automáticamente. El proyecto conserva el diagrama, el formato de Gráficas y la última corrida válida. Podés abrir sus resultados directamente y exportar datos, tablas e imágenes para un informe. Desde Administración podés consultar la biblioteca por clase y descargar una copia JSON del proyecto abierto.

[Manual de uso](https://wiki.lemeit.ar/sim/manual-de-uso/) · [Guía de gráficas](docs/graficas-cientificas.md) · [Ejemplo 20](docs/ejemplo-20-tanque-dinamico-dwsim.md) · [Manual de recuperación](docs/operacion-local.md) · [Organización y mantenimiento](docs/mantenimiento.md).

## Versión y estado (historial anterior)

**0.32.0 — Cuadrícula y edición de corrientes**. Mostrar cuadrícula y ajustar posiciones a pasos de 20 unidades de manera independiente; Shift restringe el movimiento horizontal o vertical. El trazado penaliza retrocesos y segmentos diminutos, y Diagnóstico y actividad incorpora un botón para copiar el texto. No afecta motores ni exportaciones.

**0.31.0 — Resultados completos y rótulos únicos**. Exportar resultados reúne corrientes, balances, componentes y datos: Excel por pestañas o CSV como tabla única (sección, registro, objeto, campo, valor). Exportaciones parciales disponibles en el diálogo. Cada equipo muestra un solo rótulo; el tipo permanece en Propiedades.

**0.28.5 — Recorridos exteriores y llamadas compactas**. El recorrido evalúa alternativas ortogonales fuera de los equipos, respetando codos manuales válidos. Las llamadas reducen su línea horizontal y la separación inicial. No modifica conexiones ni cálculos.

**0.28.1 — Llamadas solo para valores**. Los nombres y tipos son rótulos simples. Las llamadas instrumentales se reservan para temperatura, presión y caudal; no se dibujan cuando no hay valores para mostrar.

**0.28.0 — Llamadas en el diagrama**. Nombres, tipos y valores se agrupan en referencias instrumentales con línea fina quebrada y flecha abierta hacia su corriente o equipo. Acompañan el movimiento y el cambio de tamaño; Ajustar diagrama incluye los textos.

**0.27.1 — Corrientes más claras**. Energía con línea de trazos en el listado y el diagrama DWSIM, también al seleccionar. El ajuste del recorrido usa un pequeño cuadrado visible solo en la corriente seleccionada; se conservan conexiones y arrastre.

**0.27.0 — Símbolos de DWSIM en el PFD.** Las columnas, el CSTR, los reactores tubular y de polimerización y la válvula de seguridad se pueden dibujar y conectar. Sus cálculos todavía no están disponibles en ΣiM.

**0.26.2 — Identificación técnica de los motores**. Estado de motores muestra Windows 11 Home Single Language 25H2 y GNU/Linux Debian (versión pendiente de confirmar), con características declaradas del equipo principal. Estos datos descriptivos no indican disponibilidad ni se obtienen mediante detección remota. El selector conserva Motor principal y Motor alternativo; las guías siguen centradas en el uso del simulador.

**0.22.1 — Selección por contorno**, integrado. El rectángulo no tiene relleno y mantiene visible el diagrama durante la selección.

**0.22.0 — Explorador de ejemplos**, integrado. El acceso Ejemplos abre una biblioteca con búsqueda y filtros temáticos; cada caso permite abrir el proyecto o consultar directamente su resolución. Conserva los trece ejercicios, la guía completa y la confirmación antes de reemplazar el proyecto. Incluye selección múltiple por rectángulo, Ctrl+A y Shift+clic, con movimiento conjunto que conserva conexiones.

**0.21.4 — Tipografía uniforme en el inspector**, 16/11/2026. Ajuste visual de los desplegables, sin alterar las condiciones del proceso.

**0.21.3 — Biblioteca y Supr**, 16/11/2026. Drag-and-drop por puntero compatible con Firefox, foco explícito del diagrama para eliminar objetos y conexiones con Supr/Retroceso.

**0.21.2 — Arrastre y eliminación en el diagrama**, 16/11/2026. Soltar objetos de la biblioteca para agregarlos; arrastrar una selección fuera del lienzo para retirarla con sus conexiones; Supr y Retroceso respetando campos editables.

**0.21.1 — Controles de acoplamiento compactos**, 16/11/2026. Cabeceras reducidas, agarre discreto y selector de ubicación reducido a un icono con las mismas opciones.

**0.21.0 — Paneles estilo CAD**, 16/11/2026. Ventanas movibles con franja de agarre, vista previa y acople a los cuatro bordes, redimensionamiento, posiciones recordadas y mejor separación de números de panel.

**0.20.1 — Paneles flotantes: arrastre y tamaño**, 16/11/2026. Movimiento libre por cabecera y redimensionamiento desde los bordes y esquinas; limpieza del menú Ver.

**0.20.0 — Paneles flexibles y manual en la wiki**, 16/11/2026. Biblioteca, propiedades y resultados pueden flotar y regresar a su sitio; biblioteca y propiedades cambian de lado. La ayuda operativa canónica está en https://wiki.lemeit.ar/sim/manual-de-uso/.

**0.19.1 — Actividad guiada integrada**, 16/11/2026. El Ejemplo 13 se abre como único caso del menú y permite iniciar la actividad desde el inspector del intercambiador.

**0.19.0 — Ejemplo 13 guiado**, 16/11/2026. El menú Ejemplos ofrece una actividad para predecir las temperaturas del intercambiador, calcular con el motor seleccionado y comparar las predicciones con resultados vigentes y balances. No calcula de forma autónoma ni modifica DWSIM.

**0.18.0 — Ayuda contextual desde el inspector**, 16/11/2026. Los equipos y corrientes enlazan al capítulo correspondiente de la wiki de ΣiM sin transmitir datos del proyecto. El menú Ayuda lleva al índice de 16 capítulos. No altera el cálculo DWSIM ni los motores.

**0.17.5 — Revisión previa de especificaciones**, 16/11/2026. El diagnóstico del proyecto indica parámetros de operaciones ausentes o fuera de rango antes de solicitar un cálculo. No modifica las ecuaciones, los motores ni el contrato del gateway. [Grados de libertad y especificaciones en la wiki](https://wiki.lemeit.ar/sim/grados-libertad-especificaciones/).

**0.17.3 — Ingreso desde enlaces directos**, 16/11/2026. Abrir una página protegida sin sesión muestra el ingreso con un aviso amigable y vuelve a esa página después de validar el acceso. Se mantienen permisos y respuestas de API; sin cambios en cálculos ni motores.

La versión del portal es independiente de **DWSIM 10.2.15**. La versión efectivamente cargada se consulta en **Ayuda → Acerca de**. Los cambios anteriores están en el [historial completo](docs/CHANGELOG.md).

## Ingreso y administración

- **Alumnos:** abrir [ΣiM](https://sim.lemeit.ar/acceso.html), elegir Alumno e ingresar el código de clase de 12 caracteres. No se necesita correo ni cuenta individual.
- **Administrador:** elegir Administrador e ingresar la contraseña privada. El panel permite crear clases, consultar/copiar sus códigos activos y desactivar accesos.
- El pie muestra rol, nombre de clase, tiempo restante del alumnado y **Salir**. El administrador no muestra contador. La sesión de alumno dura hasta 4 horas o hasta el vencimiento/desactivación de la clase, lo que ocurra primero; la administrativa dura hasta 8 horas.
- Los códigos creados desde 0.17.0 quedan disponibles para el administrador mientras estén activos. Los anteriores siguen funcionando, pero no pueden recuperarse si no se conservaron.
- **Herramientas → Estado de motores** es un monitor de consulta. **Administración de clases** es un acceso privado protegido en servidor. No hay inicio, parada ni reinicio remoto de motores.
- Para cambiar de rol, cerrar la sesión actual. Elegir una opción en el formulario no concede permisos sin validar su credencial.

[Guía para administrar clases](docs/administracion-clases.md) · [Acceso y seguridad](docs/acceso-clases-admin.md) · [Índice de documentación](docs/README.md).

## Biblioteca de ejemplos · referencias iniciales 01–13

Desde Ejemplos se abre cada caso con sus condiciones y una consigna breve. Son
modelos calculados, no mediciones experimentales. La [guía](docs/ejemplos-validados.md)
permite descargar el JSON de ΣiM y el DWXML equivalente para DWSIM.

| Caso | Qué permite estudiar | Referencia calculada |
| --- | --- | --- |
| Mezcla de agua | Conservación de masa y entalpía; 1 kg/s a 20 °C + 1 kg/s a 80 °C | 2 kg/s a 50.021387 °C |
| Calentamiento | Calor requerido para 1 kg/s de 20 a 60 °C | +167.209679 kW |
| Enfriamiento | Calor retirado de 1 kg/s de 80 a 30 °C | −209.157884 kW |
| División | Distribución 70/30 de 1 kg/s | 0.7 y 0.3 kg/s |
| Agua–etanol · NRTL | Balance por componente, mezcla no ideal y fases | 2 kg/s a 51.671926 °C; 55/45 % másico |
| 06 · Balance multicomponente · NRTL | Dos mezcladores, divisor y sistema matricial 2×2 | S1: 2 kg/s; P1: 1,2 kg/s; P2: 1,3 kg/s |
| 07 · Reactor de conversión | Formación de agua con conversión del 50 % | Agua: 0,500007399250 kg/kg; Q: −6836,902074 kW |
| 08 · Reactor de equilibrio | Síntesis de amoníaco | Amoníaco: 0,311687291752 kg/kg; Q: −999,736216 kW |
| 09 · Red térmica ternaria | Mezcla, reparto 65/35, calentamiento, enfriamiento y recombinación | 2 kg/s a 51,158773 °C; Q neto +150,936145 kW |
| 10 · Amoníaco con bypass | Equilibrio químico, acondicionamiento térmico y dilución | NH₃: 0,339948981 kg/s; P1: 69,240653 °C |
| 11 · Separador flash | Equilibrio vapor–líquido agua–etanol con NRTL | Referencia Debian y residuos documentados en [el informe](docs/flash-0.10.0.md) |
| 12 · Bomba y válvula | Presión de descarga, eficiencia y estrangulamiento de agua | 101,325 → 500 → 200 kPa; comprobación Debian |
| 13 · Intercambiador de calor | Dos corrientes de agua sin mezcla | 40 kW; referencia contrastada Windows–Debian en 0.14.0 |


Los casos 01–05 se recalcularon con el motor de ΣiM y la API oficial del DWSIM
Open Source 10.2.15.0 instalado. Coincidieron las propiedades comprobadas dentro
de las tolerancias documentadas; el [informe](docs/validation/examples-0.5.0.json)
conserva los valores sin redondear. Mezclado de agua y calentamiento se ejecutaron
también en la interfaz de escritorio. No se afirma validación experimental ni
comparación con un modelo físico independiente: ambas rutas usan DWSIM.

Los casos 06–08 se calcularon con Windows el 12/11/2026, sin comparación separada
con la API de escritorio. El 06 coincide con los balances analíticos; los reactores
se documentan con sus resultados reales. Ver [alcance e informe](docs/validacion-windows-0.7.0.md).

Para repetir la comparación de 01–05, ver [procedimiento y requisitos](docs/ejemplos-validados.md#repetir-la-comparación).

## Flujo de trabajo

Después de validar el acceso, la aplicación abre sin proyecto activo y sin cargar una simulación de ejemplo.
Archivo → Nuevo proyecto solicita nombre, componentes y modelo de propiedades;
crea un diagrama vacío. Después se agregan corrientes y equipos desde la biblioteca,
se conectan sus puertos y se especifican sus condiciones en el inspector.
Archivo → Abrir proyecto importa JSON. La copia del último proyecto se recupera
solo por una acción explícita, no al entrar. Los ejercicios están en el menú
Ejemplos; nunca se abren por defecto. Ver [guía de trabajo](docs/workflow.md).

Si el motor no responde, un catálogo de nombres/modelos tomado de DWSIM permite
preparar archivos sin calcular. No contiene propiedades físicas ni resultados.

## Selección automática de motores

ΣiM elige antes de cada cálculo un gateway disponible y compatible con las operaciones del diagrama. Los administradores pueden fijar Windows o Debian. Nunca se reenvía automáticamente un POST incierto: si se pierde el gateway después del envío, se prepara el alternativo para el próximo intento.

## Disponible

Corrientes de materia y energía; mezclador, divisor de dos salidas, calentador y
enfriador; separador flash, bomba, válvula e intercambiador de dos corrientes;
reactores de conversión y equilibrio con una reacción por reactor y
salidas de vapor y líquido. Régimen estacionario: lazos de recirculación limitados al caso elemental de agua sin reacción, mezclador y divisor; otras recirculaciones continúan restringidas.
Selección de modelos físicos separada del modelo de reacción química.

El catálogo consulta compuestos reales de DWSIM 10.2.15. Los modelos disponibles
incluyen IAPWS-IF97 (solo agua pura), NRTL, UNIQUAC, UNIFAC, Peng–Robinson, SRK y
otros modelos de la edición abierta. La disponibilidad no garantiza que un modelo
sea adecuado para cualquier compuesto, mezcla o condición.

Los casos de ejemplo son simulaciones de modelos, no mediciones experimentales.
Los balances por especie de un reactor muestran consumo o generación: no se exige
que una especie se conserve cuando participa en una reacción. La potencia del
reactor se lee de DeltaQ del motor e incluye el calor de reacción.

### Corrientes y propiedades · 0.2.0

- Inspector con Condiciones, Composición y Resultados; entradas solo en alimentaciones.
- Especificaciones TP, PH, PS, PV y TV. PS con IAPWS-IF97 está bloqueado por una
  discrepancia verificada del motor; PS se validó con NRTL.
- Sistemas SI/ingeniería/anglosajón y unidades particulares, caudal másico o molar,
  composición másica/molar y formato fracción/porcentaje. Las bases se convierten con masas molares de DWSIM.
  Las masas molares proceden de la base real de DWSIM.
- Resultados globales y por fase: fracción de vapor, entalpía, entropía, densidad y
  composiciones másicas/molares. Caudal volumétrico global derivado de masa/densidad.
- Proyectos anteriores compatibles: TP, kg/s y base másica por defecto.

### Identidad visual · 0.3.0

La opción elegida es **02 · Retro técnico**: letras angulares e inclinadas, estética
tecnológica de los 80 inspirada en Robotech y consolas. Σ roja e IM en blanco cálido
sobre carbón. La bajada se presenta pequeña, espaciada y en mayúsculas.

| Elemento | Archivo o color |
| --- | --- |
| Marca de cabecera sin bajada | [sim-wordmark.svg](site/assets/sim-wordmark.svg) |
| Logo independiente | [sim-logo.svg](site/assets/sim-logo.svg) |
| Favicon sigma | [favicon.svg](site/assets/favicon.svg) |
| Carbón | `#101215` |
| Blanco cálido | `#F4F3EE` |
| Rojo | `#CF263B` |

El SVG es una reconstrucción vectorial de la referencia aprobada. El nombre y la
bajada están convertidos en curvas: no dependen de fuentes instaladas ni contienen
un PNG incrustado. Ver [guía de identidad](docs/brand-sim.md).
Las claves y los identificadores técnicos del tema anterior se conservan para
mantener compatibilidad; la marca visible es ΣiM.

### Edición directa de corrientes · 0.3.0

La orientación se resuelve en el lienzo, sin un selector de dirección en Propiedades.

| Acción | Comportamiento |
| --- | --- |
| Arrastrar un extremo libre | La flecha se orienta según la posición de sus extremos. |
| Acercarlo a un puerto compatible libre | El extremo se ajusta al puerto y respeta su orientación. |
| Desconectar un extremo arrastrándolo | La vista previa toma la nueva dirección durante el movimiento. |
| Arrastrar el control intermedio horizontal o verticalmente | Desplaza el codo en el eje elegido, sin cambiar las conexiones. |
| Mover nuevamente un extremo | Reinicia el codo manual anterior para adaptar el recorrido. |
| Abrir un proyecto antiguo | Conserva los extremos; la dirección manual heredada deja de forzar la flecha. |

Se mantienen el recorrido ortogonal, la protección de puertos ocupados y la
compatibilidad materia/energía. Los símbolos de equipos permiten ajustar su tamaño
gráfico; no equivale a dimensionar físicamente un equipo.

### Paneles, resultados y archivos

- Paneles laterales y balances ajustables; diagrama y resultados separables en ventanas
  sincronizadas del mismo navegador. Mantener abierta la ventana principal.
- Balances de materia y energía, exportación CSV y Excel, diagnóstico con mensaje
  original del motor y sugerencias orientativas.
- Ventanas minimalistas, modo claro/oscuro, guardado JSON y recuperación local.
- Mover símbolos o codos y cambiar unidades de presentación conserva los resultados;
  cambiar condiciones físicas o conexiones exige volver a calcular.

### Monitor de conexión y cálculos · desde 0.2.2

El monitor separa dos tipos de eventos:

| Evento | Qué informa |
| --- | --- |
| **CONEXIÓN** · `GET /api/catalog` | Disponibilidad del servicio, HTTP, latencia y catálogo. No ejecuta una corrida. |
| **CÁLCULO** · `POST /api/simulate` | Inicio, finalización o error, HTTP cuando hay respuesta y duración de la solicitud completa. |

Una comprobación del catálogo no borra el estado del último cálculo. Una simulación
rechazada por datos inválidos tampoco implica que el servicio esté desconectado.
El último cálculo indica En curso, Completado o Fallido. La duración incluye
comunicación y cálculo; no es una medición exclusiva del solver.

El seguimiento consulta cada 30 segundos mientras la vista está activa. Se conservan
los últimos 40 eventos de esa vista y se pierden al recargar. No muestra CPU,
procesos, terminal ni registros privados de la PC. El diagnóstico ofrece el error
original y sugerencias orientativas, que no prueban su causa.

## Instalar como aplicación · 0.4.0

En Chrome y Edge compatibles, ΣiM puede ofrecer instalación desde el icono de la
barra de direcciones o el menú del navegador. Ayuda → Instalar ΣiM aparece cuando
el navegador habilita esa opción; si ya está instalada o el navegador no la ofrece,
el botón permanece oculto. La presentación depende del navegador y del dispositivo.

La instalación abre la web en una ventana propia y usa la sigma roja sobre carbón
como icono. Incluye manifest, iconos PNG 192/512, variante maskable, icono Apple,
favicon SVG y respaldos PNG/ICO. No instala DWSIM en el equipo del alumno.

Se necesita conexión para abrir la interfaz y calcular. El service worker solo
conserva una página explicativa sin conexión y su estilo; no guarda API, resultados
ni versiones antiguas de los archivos de la aplicación. El guardado de proyectos
JSON y la recuperación local del navegador siguen disponibles al recuperar conexión.
La instalación definitiva debe comprobarse en un navegador compatible sobre el
sitio HTTPS publicado; el navegador integrado de Codex puede no ofrecerla.

## Dos motores de cálculo · selección automática o fijada

El portal tiene dos destinos configurados. Se eligen en **Motor**, en el footer:

| Motor | Destino del Worker | Integración | Disponibilidad |
| --- | --- | --- | --- |
| Windows · predeterminado | `https://engine-sim.lemeit.ar` | Gateway Python y proceso DWSIM aislado por cálculo | PC, gateway y túnel encendidos |
| Debian · notebook | `https://sim-debian.lemeit.ar` | Gateway Python y DWSIM MCP HTTP local autenticado | Notebook, MCP, gateway y túnel encendidos |

En modo fijado no hay conmutación automática. En modo Automático se comprueba disponibilidad y compatibilidad antes de calcular; no se reenvía una solicitud de cálculo incierta a otro motor. El navegador indica el destino con
`X-SIM-Engine: windows|debian`; las URL y credenciales se resuelven en el Worker.
Windows usa `ENGINE_URL` y el secreto `ORIGIN_KEY`; Debian usa `DEBIAN_ENGINE_URL`
y su propio secreto `DEBIAN_ORIGIN_KEY`. Ninguna clave se entrega al navegador.

La configuración del segundo destino ya está incorporada. Eso no significa que
la notebook esté encendida ni que ambos motores estén disponibles permanentemente.
En la sesión de validación del 12/11/2026 Debian estaba apagada: las pruebas de los
casos 06–08 se realizaron exclusivamente en Windows. El historial 0.6.0 registra
una prueba local previa de mezcla de agua en Debian; no equivale a validar todos
los ejemplos online en ambos motores.

[Configuración y operación de ambos motores](docs/seleccion-manual-motores.md).
La instalación PWA no instala ninguno de estos motores en la PC del alumno.

## Ejecución local en Windows

Requisitos: Python 3.11+, Node 22+ (recomendado 24 para desarrollo y despliegue), y una
distribución de DWSIM MCP 10.2.15 para Windows x64. La carpeta del motor contiene
server/dwsim-mcp.exe y sus dependencias. No se incluyen binarios del motor.
No requiere paquetes Python de terceros ni la aplicación de escritorio.
Ubicación predeterminada del motor: `.local/runtime`, dentro del repositorio local.
Incluye DWSIM, configuración privada y registros, excluidos de Git.
Puede usarse otra ubicación mediante `-EngineRoot "C:\ruta\al\motor"`.

```text
lemeit-sim/
├── site/                 Interfaz y logo vectorial
├── deploy/               Worker, build y verificaciones
├── server.py             Intermediario con DWSIM
├── start-local.ps1       Vista local en 5910
├── start-online.ps1      Gateway en 5911 y túnel
├── stop-online.ps1       Detiene gateway y túnel
└── .local/runtime/       Motor, configuración y registros privados; fuera de Git
```

```powershell
.\start-local.ps1
```

Abrir http://localhost:5910. Ctrl+C detiene la aplicación. Cada cálculo inicia su
propio proceso DWSIM por stdio y lo termina al finalizar. No necesita que el MCP
HTTP en 5901 esté iniciado. Los cálculos se serializan y tienen 45 s de límite total.

## Arquitectura de publicación

- Cloudflare Worker sirve la interfaz estática y mantiene disponible el editor.
- El Worker solo admite /api/catalog y /api/simulate, limita cuerpos a 100 kB y
  valida la sesión y el rol antes de reenviar solicitudes; autentica al origen mediante un secreto de servidor que nunca llega al navegador.
- Cada motor tiene un destino y un túnel independientes; el gateway Windows escucha en 127.0.0.1:5911.
- El origen requiere Host interno y secreto para las solicitudes del túnel;
  el motor MCP no se publica. La publicación del túnel requiere autorización explícita.
- El servidor limita conexiones; Windows crea un proceso DWSIM por cálculo y Debian usa MCP HTTP local. Aplica un
  límite global del piloto de 12 cálculos/minuto y 120/hora, sin activar planes pagos.
- Si el equipo del motor seleccionado está apagado o sin conexión, el editor sigue accesible; el cálculo
  devuelve una explicación de indisponibilidad. No se prometen disponibilidad 24/7
  ni capacidad para una clase completa hasta realizar pruebas de carga.

Las condiciones se envían al servidor para calcular. No se guardan ejercicios en
la nube: Archivo → Mis proyectos · nube guarda cada proyecto en Cloudflare D1 con
una identidad individual por clase (alias y clave personal). Una vez guardado,
los cambios posteriores se sincronizan automáticamente mientras la sesión está
activa. Desde otro navegador se recuperan con el mismo código de clase y las
credenciales individuales. El administrador puede consultar trabajos por clase.
Guardar/abrir JSON permanece como respaldo, y la biblioteca local del navegador
sigue disponible por separado. Borrar los datos del navegador no elimina los
proyectos de D1. Renovar el código de clase conserva la identidad de la clase,
los alumnos y los proyectos.

## Encender y detener el cálculo online en Windows

Para Debian, consultar su [guía específica](docs/seleccion-manual-motores.md).
Los scripts PowerShell siguientes administran únicamente Windows.

La conexión publicada usa credenciales privadas ya configuradas en la PC del
operador. No están en GitHub ni se descargan al navegador. Desde la carpeta local:

```powershell
.\start-online.ps1
.\stop-online.ps1
```

El arranque automático es opcional y se habilita para el usuario actual:

```powershell
.\enable-autostart.ps1
# Desactivar para futuros inicios de sesión, sin apagar el servicio actual:
.\disable-autostart.ps1
```

Usa un acceso directo en Inicio del usuario y PowerShell de Windows sin ventana.
Se ejecuta **al iniciar sesión**, no antes de entrar a Windows. Espera 15 segundos,
reutiliza servicios existentes y comprueba la API local con reintentos limitados.
El lanzador privado y `startup.log` quedan en `.local/runtime`. No guarda
contraseñas ni cambia la política de ejecución. Si movés el repositorio, volvé a
habilitarlo para actualizar las rutas. `stop-online.ps1` apaga ahora pero no
cancela el inicio del próximo ingreso; para eso usar `disable-autostart.ps1`.
El instalador se ejecuta una vez en cada PC Windows; el despliegue web no lo activa.
 Apagar el servicio no elimina el editor de Cloudflare.
Los archivos origin-key.txt y tunnel-token.txt no deben publicarse ni compartirse.

## Desarrollar y comprobar

```powershell
npm ci
npm run build:verified
python -m unittest tests.python.gateway.test_server.ValidationTests tests.python.gateway.test_stream_properties.StreamValidation -v
npm run deploy:check
```

Para pruebas aisladas reales en PowerShell:

```powershell
$env:DWSIM_HOME = (Resolve-Path .local/runtime).Path
python -m unittest tests.python.gateway.test_stream_properties tests.python.gateway.test_server.IsolatedIntegrationTests -v
```

Las pruebas históricas EngineIntegrationTests requieren además el MCP HTTP 5901;
las pruebas aisladas anteriores no lo necesitan.
.build/ y los archivos de credenciales no se versionan. El Worker publicado se
prepara desde los archivos de site/. Workers Builds ya está conectado al repositorio:
cada actualización de main inicia pruebas, compilación y publicación del Worker.
GitHub Actions comprueba los PR; no realiza un segundo despliegue.
Si el portal conserva una versión anterior, revisar el estado y los registros del
build en Cloudflare. La primera conexión del repositorio no ejecutó un build por
sí sola: ese primer despliegue se inició manualmente y terminó correctamente.

El despliegue web no actualiza server.py en la PC. Si cambia el backend, hay que
actualizar la copia local aprobada y reiniciar el servicio online. La publicación del frontend tampoco actualiza la copia del backend en Debian;
ambas instalaciones se administran por separado.
Ver [guía de despliegue](docs/despliegue-automatico.md).

## Próximos pasos

Pendientes: separador por componente, columnas, recirculaciones generales y convergencia de lazos complejos; adaptación y validación de CSTR/PFR cinéticos, análisis económico y pruebas de carga para una clase. La existencia de una operación en DWSIM no significa que ya esté adaptada al editor.

El acceso por clases, el panel privado, flash, bomba, válvula, compresor adiabático, expansor, tanque e intercambiador ya están implementados. El inicio o reinicio remoto de servicios requiere un supervisor local independiente y sigue pendiente. La disponibilidad depende de las computadoras, gateways y túneles.

Ver [alcance actual y prioridades](docs/roadmap.md) y [catálogo](site/catalogo.html).

## Licencias

Integración y símbolos DWSIM: GPL-3.0-or-later; ver LICENSE y
[atribuciones](site/licenses/NOTICE.md). Componentes lemeit-design: MIT.
El pie de dos colores y el control de tema se adaptaron del sitio tex.lemeit.ar.
No se incorporan componentes exclusivos de Patreon. Esta integración no es una
edición oficial de DWSIM.

## Documentación y verificación

- [Índice de documentación](docs/README.md): recorridos para alumnos, administración y operación técnica.
- [Guía de trabajo](docs/workflow.md), [administración de clases](docs/administracion-clases.md) y [acceso y seguridad](docs/acceso-clases-admin.md).
- [Operación local](docs/operacion-local.md), [selección Windows/Debian](docs/seleccion-manual-motores.md) y [publicación](docs/despliegue-automatico.md).
- [Historial](docs/CHANGELOG.md), [comprobaciones realizadas](CHECKS.md), [ejemplos validados](docs/ejemplos-validados.md) e informes por versión.
- [Wiki en español](https://wiki.lemeit.ar/sim/) y [English documentation](https://wiki.lemeit.ar/en/sim/).

Las comprobaciones de acceso y de interfaz no equivalen a una nueva validación de DWSIM. Los informes de casos reales conservan fecha, motor y tolerancias; no se afirma validación experimental ni prueba de carga simultánea del alumnado.

## Accesos del proyecto

- [ΣiM](https://sim.lemeit.ar/): aplicación y versión visible en Ayuda → Acerca de.
- [Ejemplos](https://sim.lemeit.ar/ejemplos.html) y [catálogo](https://sim.lemeit.ar/catalogo.html).
- [Ficha en Profe Lamaita](https://profe.lemeit.ar/projects/sim/).
- [Wiki de proyectos](https://wiki.lemeit.ar/sim/).
- [Portal Lemeit](https://lemeit.ar/#sim).

La aplicación conserva su identidad propia negro/blanco/rojo. La portada y las fichas aplican el diseño del portal que las contiene. ΣiM no es Bestiario · Seres Térmicos, cuyo recorrido está en Profe Lamaita y cuya documentación vive en `lemeit/simus`. Las fichas externas son presentaciones del proyecto; el estado operativo y las guías vigentes se mantienen en este repositorio y la wiki.

## Herramientas de unidades · 0.9.0

En Herramientas → Configuración se elige el sistema de presentación. Los campos
conservan la posibilidad de seleccionar unidades particulares. La presión del
proceso es siempre absoluta; psi en una corriente significa psia.
Herramientas → Calculadora funciona sin consultar el motor: usa un catálogo
estático exportado de DWSIM para masas molares. Convierte dimensiones SI y
anglosajonas, distingue temperatura de diferencia de temperatura, y permite
fracciones másicas/molares, caudales y presiones parciales. La concentración por
p/(RT) solo se muestra si se solicita una estimación de gas ideal.
CSV/Excel mantienen las unidades canónicas que declaran sus cabeceras.

### Rótulo técnico y reporte PDF

La barra junto a Guardar ofrece iconos de nube para abrir la biblioteca y guardar; muestra el alias del alumno y su clase. «Rótulo…» permite completar alumno, ID, materia, grupo, institución, docente, lámina y revisión; el título y enunciado se toman del proyecto. En Exportar diagrama se puede incluir el rótulo en SVG, PNG o PDF, y agregar una hoja de balances al PDF después de calcular. Editar estos datos no invalida el resultado físico.

### Archivo y presentación de láminas (0.47.4)

Archivo distingue Proyecto, Mis proyectos (nube), Exportar y presentar, y Copias en esta computadora. «Guardar en la nube» conserva el proyecto del alumno; «Descargar copia del proyecto (.json)» genera un respaldo local. «Reporte PDF · diagrama y balances» abre directamente el formulario de lámina, con tamaño A4, A3 u Oficio, márgenes, orientación, vista previa, rótulo opcional compacto en la esquina inferior derecha y tablas opcionales de equipos, corrientes, balances y componentes. Los resultados numéricos requieren un cálculo vigente; la tabla de equipos puede exportarse sin calcular.

### Una sola lámina de reporte (0.47.4)

El reporte PDF distribuye diagrama, tablas seleccionadas y rótulo dentro de una única hoja A4, A3 u Oficio. La orientación automática analiza la proporción del diagrama, o se puede forzar horizontal/vertical. La vista previa muestra el resultado completo. Si demasiadas tablas impedirían una presentación legible, la exportación pide reducir la selección en lugar de generar hojas adicionales o cortar datos.

### Cambiar de alumno (0.47.4)

Desde Archivo → Abrir biblioteca en la nube, «Cambiar alumno…» libera la identidad de alumno sin cerrar el acceso a la clase. Luego se puede iniciar sesión con otro alias o registrar una identidad nueva. Antes de cambiar, guardar el proyecto actual: el cambio cierra el proyecto abierto y elimina el borrador del navegador para evitar mezclar trabajos entre usuarios. Los proyectos ya guardados en D1 se conservan.

### Ajustes de legibilidad en reportes A4 (0.47.4)

Los reportes priorizan el espacio del diagrama y reducen los altos de tablas. Las celdas miden su texto para no invadir márgenes; números prácticamente cero se muestran con ≈ 0 por legibilidad, sin modificar los valores almacenados en los resultados ni exportados en Excel o CSV. Si un reporte es demasiado grande, ΣiM ofrece reducir tablas o elegir un papel mayor.

### Ficha integral del proyecto (0.47.4)

La barra de ΣiM ofrece «Editar proyecto…» y el menú Proyecto da acceso a «Editar ficha y actividad…» o «Preparar reporte PDF…». En la ficha se integran tres pestañas: Actividad (enunciado, consignas, observaciones), Anotaciones del diagrama y Datos del informe (autor, ID, clase, institución y rótulo). Un solo «Guardar cambios» persiste estos metadatos no físicos junto con el proyecto; «Cancelar» descarta los cambios pendientes. «Preparar reporte PDF…» guarda esos datos y abre el mismo generador de reportes que se utiliza en Archivo. No modifica el motor ni la estructura de proyectos cloud.

### Enunciado, consignas y observaciones en el reporte (0.47.4)

Al preparar un Reporte PDF, la opción «Incluir actividad: enunciado, consignas y observaciones» aparece activada por defecto. ΣiM toma el contenido guardado en Editar proyecto → Actividad e incluye esas tres secciones en la propia lámina si pueden leerse claramente. Si son demasiado extensas, mantiene el diagrama y las tablas en la primera hoja y agrega el texto íntegro en un anexo paginado. La vista previa informa cuándo habrá anexos. No se alteran los resultados físicos ni los datos guardados en la nube.

### Edición de anotaciones sobre el diagrama (0.47.4)

Con un proyecto abierto, elegí «Texto» en la barra y hacé clic en una posición del diagrama para insertar una anotación. Doble clic sobre una nota existente permite modificarla directamente. Ctrl+Enter confirma, Esc cancela, arrastrar mueve, Supr elimina la nota seleccionada. Editar proyecto → Anotaciones sigue permitiendo administrar todos los textos en conjunto. Estos cambios no alteran las condiciones físicas ni invalidan los resultados.

### Estado y cuota de simulaciones (0.47.4)

El botón Calcular presenta una luz de estado: neutra antes del primer cálculo, animada mientras DWSIM resuelve, verde cuando el cálculo terminó bien, roja si hubo error y de advertencia si los resultados quedaron desactualizados. Los resultados vigentes siguen indicándose al pie del diagrama. Para las clases se permiten hasta 12 solicitudes de cálculo por minuto por sesión (antes 4), manteniendo la limitación de seguridad del servidor.

### Explorar resultados paso a paso (0.47.4)

El botón Calcular vuelve a mostrar el símbolo triangular ▶, y una luz separada expresa el estado del cálculo. Una vez que DWSIM devuelve resultados vigentes, «Explorar proceso…» permite recorrer corrientes y equipos conectados mediante Anterior/Siguiente; el editor destaca cada elemento y muestra valores reales de las corrientes y balances. El recorrido es didáctico y no ejecuta unidades individualmente ni genera nuevas solicitudes de cálculo; en procesos con reciclo se informa expresamente que las iteraciones internas del motor no se representan. Ante cambios físicos o recálculo el explorador se cierra.

### Puntos de conexión

Los puertos de los equipos quedan marcados. Los puertos libres se dibujan con un borde más fuerte y los ocupados se atenúan. En el separador flash se rotulan Alimentación, Vapor y Líquido.

### Desplazar el lienzo

Mantené presionada la barra espaciadora y arrastrá con clic para mover la vista con el trackpad. Con mouse también podés arrastrar con la rueda presionada o con Alt y el botón izquierdo. «Ajustar» encuadra el diagrama.

### Ecuaciones y balances en el explorador

Usá «Anterior» y «Siguiente» en la parte superior del explorador para cambiar de etapa. En cada equipo, «Ecuaciones y balances» interpreta el resultado vigente de DWSIM. Muestra entradas, salidas y diferencias por componente, distingue el consumo o generación por reacción y explica las tolerancias de cierre. Los datos faltantes se indican de forma explícita.

### Barra de herramientas y paneles

La barra agrupa Archivo, Proyecto, Diagrama, Simulación y Vista. Las opciones completas están en los menús; Texto se inserta desde Diagrama y los datos del rótulo se editan desde Proyecto. La distribución inicial muestra balances y corrientes a la derecha. Abajo figuran el modelo, la duración del último cálculo disponible y su estado. En Ver podés mostrar, ocultar, separar o restablecer paneles.

El panel de resultados ofrece dos vistas, Balances y Corrientes. Abrí una corriente para consultar sus propiedades. Los controles de posición, flotación, ventana separada y cierre están juntos en el encabezado del panel.

El tanque identifica Equipos y la flecha de materia identifica Corrientes. Los selectores de la barra y la paleta lateral comparten símbolos y categorías. Las flechas de cada grupo abren su menú completo. Herramientas, Ayuda y Ejemplos también se pueden abrir desde la barra.

## Recuperación rápida

Administración → Operación y recuperación contiene comandos de Windows/Debian y una copia HTML para consulta local. Gateway Windows online 5911; Debian 5910. Consultar `/api/status` y `/api/dynamics/capabilities`. Ver [manual completo](docs/operacion-local.md). No detener durante cálculos ni borrar `.local/runtime`.
