<img src="site/assets/sim-logo.svg" alt="ΣIM · Simulación de procesos" width="360">

[![Portal 0.9.1](https://img.shields.io/badge/portal-0.9.1-CF263B?style=flat-square&labelColor=101215&color=CF263B)](https://sim.lemeit.ar)
[![Motor DWSIM 10.2.15](https://img.shields.io/badge/motor-DWSIM%2010.2.15-F4F3EE?style=flat-square&labelColor=101215)](https://dwsim.org/)
[![Windows y Debian](https://img.shields.io/badge/motores-Windows%20%2F%20Debian-F4F3EE?style=flat-square&labelColor=101215)](docs/seleccion-manual-motores.md)
[![Licencia GPL](https://img.shields.io/badge/licencia-GPL--3.0--or--later-CF263B?style=flat-square&labelColor=101215)](LICENSE)

[![Documentación de proyectos](https://img.shields.io/badge/docs-wiki.lemeit.ar-F4F3EE?style=flat-square&labelColor=101215)](https://wiki.lemeit.ar/sim/)

Simulador de procesos con interfaz web en español y motor DWSIM, desarrollado con fines pedagógicos y sin finalidad comercial.
Marca: ΣIM · Simulación de procesos. El repositorio conserva el nombre lemeit-sim.
Sitio: https://sim.lemeit.ar · Identidad propia ΣIM, inspirada en tecnología retro: negro, blanco y rojo.

Es un piloto, no una réplica completa del editor de DWSIM.
[Catálogo de objetos](https://sim.lemeit.ar/catalogo.html) · [Hoja de ruta](docs/roadmap.md).

## Versión y estado

**0.9.1 — Ayuda y legibilidad de campos**, en desarrollo; versión pública anterior 0.9.0.

Ayuda reúne la guía de uso y la tutoriales de DWSIM (en inglés). La guía de ejercicios está en Ejemplos. El foco de los campos de la calculadora se mantiene dentro de sus bordes, separado de las etiquetas.
Guía 01–10 con índice, búsqueda, ejercicios plegables, anterior/siguiente y regreso
al simulador. Presets SI, ingeniería y anglosajón; calculadora de magnitudes,
fracciones, caudales y presiones parciales con masas molares reales de DWSIM.
[Herramientas y criterios](docs/unidades-y-calculadora.md) ·
[Adaptación por etapas](site/adaptacion.html).
CSTR/PFR cinéticos y perfiles aún requieren adaptar y validar su acceso; el portal
actual conserva conversión y equilibrio. No se modificaron los motores ni sus túneles.
[Guía de casos y comparación](docs/ejemplos-validados.md) · [Guía web](site/ejemplos.html).
La versión que recibe el navegador depende del último despliegue exitoso de
Cloudflare: comprobarla en **Ayuda → Acerca de**. Fusionar y publicar son pasos
separados, aunque Workers Builds automatiza el segundo.

Nombre exacto: **ΣIM**, sigma griega mayúscula seguida de **I** y **M** latinas.
Bajada: **Simulación de procesos**. Reemplaza a SIMPROX; el dominio y el repositorio
mantienen sus direcciones.

La versión del portal es independiente del motor DWSIM 10.2.15.
Ayuda → Acerca de muestra la versión y los cambios de la entrega cargada.

[Historial de versiones](docs/CHANGELOG.md) · [Guía de uso](docs/workflow.md) ·
[Verificaciones realizadas](CHECKS.md) · [Operación local](docs/operacion-local.md).

## Biblioteca de diez ejemplos

Desde Ejemplos se abre cada caso con sus condiciones y una consigna breve. Son
modelos calculados, no mediciones experimentales. La [guía](docs/ejemplos-validados.md)
permite descargar el JSON de ΣIM y el DWXML equivalente para DWSIM.

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

Los casos 01–05 se recalcularon con el motor de ΣIM y la API oficial del DWSIM
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

La aplicación abre sin proyecto activo y sin cargar una simulación de ejemplo.
Archivo → Nuevo proyecto solicita nombre, componentes y modelo de propiedades;
crea un diagrama vacío. Después se agregan corrientes y equipos desde la biblioteca,
se conectan sus puertos y se especifican sus condiciones en el inspector.
Archivo → Abrir proyecto importa JSON. La copia del último proyecto se recupera
solo por una acción explícita, no al entrar. Los ejercicios están en el menú
Ejemplos; nunca se abren por defecto. Ver [guía de trabajo](docs/workflow.md).

Si el motor no responde, un catálogo de nombres/modelos tomado de DWSIM permite
preparar archivos sin calcular. No contiene propiedades físicas ni resultados.

## Disponible

Corrientes de materia y energía; mezclador, divisor de dos salidas, calentador y
enfriador; reactores de conversión y equilibrio con una reacción por reactor y
salidas de vapor y líquido. Régimen estacionario, sin recirculaciones.
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
mantener compatibilidad; la marca visible es ΣIM.

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

En Chrome y Edge compatibles, ΣIM puede ofrecer instalación desde el icono de la
barra de direcciones o el menú del navegador. Ayuda → Instalar ΣIM aparece cuando
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

## Dos motores de cálculo · selección manual

El portal tiene dos destinos configurados. Se eligen en **Motor**, en el footer:

| Motor | Destino del Worker | Integración | Disponibilidad |
| --- | --- | --- | --- |
| Windows · predeterminado | `https://engine-sim.lemeit.ar` | Gateway Python y proceso DWSIM aislado por cálculo | PC, gateway y túnel encendidos |
| Debian · notebook | `https://sim-debian.lemeit.ar` | Gateway Python y DWSIM MCP HTTP local autenticado | Notebook, MCP, gateway y túnel encendidos |

No hay conmutación automática: si el elegido falla, la aplicación muestra el error
sin enviar el proyecto al otro motor. El navegador indica el destino con
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
  autentica al origen mediante un secreto de servidor, que nunca llega al navegador.
- Cada motor tiene un destino y un túnel independientes; el gateway Windows escucha en 127.0.0.1:5911.
- El origen requiere Host interno y secreto para las solicitudes del túnel;
  el motor MCP no se publica. La publicación del túnel requiere autorización explícita.
- El servidor limita conexiones; Windows crea un proceso DWSIM por cálculo y Debian usa MCP HTTP local. Aplica un
  límite global del piloto de 12 cálculos/minuto y 120/hora, sin activar planes pagos.
- Si el equipo del motor seleccionado está apagado o sin conexión, el editor sigue accesible; el cálculo
  devuelve una explicación de indisponibilidad. No se prometen disponibilidad 24/7
  ni capacidad para una clase completa hasta realizar pruebas de carga.

Las condiciones se envían al servidor para calcular. No se guardan ejercicios en
la nube: Guardar descarga JSON; Abrir restaura el proceso. Existe guardado local
automático en el navegador; borrar datos del sitio lo elimina.

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
python -m unittest test_server.ValidationTests test_stream_properties.StreamValidation -v
npm run deploy:check
```

Para pruebas aisladas reales en PowerShell:

```powershell
$env:DWSIM_HOME = (Resolve-Path .local/runtime).Path
python -m unittest test_stream_properties test_server.IsolatedIntegrationTests -v
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

Pendientes: bombas, válvulas, separadores e intercambiador con dos fluidos.
El calentador/enfriador actual representa un fluido con intercambio de calor.
También quedan pendientes recirculaciones, análisis económico, 3D y pruebas de carga
para una clase. No hay registro de usuarios ni acceso por código de clase implementado.
La [propuesta de acceso](docs/acceso-propuesto.md) documenta esa etapa futura.

Prioridad elegida: bombas, válvulas, intercambiadores y separadores. Se usarán los
tutoriales oficiales de DWSIM como referencias para casos de validación y guías
propias, con trazabilidad. Ver [plan y fuentes](docs/roadmap.md).

## Licencias

Integración y símbolos DWSIM: GPL-3.0-or-later; ver LICENSE y
[atribuciones](site/licenses/NOTICE.md). Componentes lemeit-design: MIT.
El pie de dos colores y el control de tema se adaptaron del sitio tex.lemeit.ar.
No se incorporan componentes exclusivos de Patreon. Esta integración no es una
edición oficial de DWSIM.

## Documentación y verificación

La entrega 0.9.0 se comprueba con pruebas JS de regresión y de referencia física,
compilación y preparación del despliegue. Se revisan en navegador la guía,
calculadora, presets, cambio de base y conservación de resultados. El catálogo
estático contiene 1601 masas molares reales y registra 19 no disponibles.
Los casos anteriores mantienen sus informes: [0.7.0](docs/validacion-windows-0.7.0.md)
y [0.8.0](docs/ejemplos-integrados.md). Ver [CHECKS](CHECKS.md) para las pruebas
exactamente ejecutadas. No se afirma validación experimental ni prueba cinética.

[Guía de trabajo](docs/workflow.md) · [Historial completo](docs/CHANGELOG.md) ·
[Identidad y logo](docs/brand-sim.md) · [Despliegue automático](docs/despliegue-automatico.md).

[Servicios y arranque/apagado](docs/operacion-local.md) · [Propuesta de acceso sin correo para alumnos](docs/acceso-propuesto.md).

[Selección Windows / Debian](docs/seleccion-manual-motores.md).


## Accesos del proyecto

- [ΣIM](https://sim.lemeit.ar/): aplicación y versión visible en Ayuda → Acerca de.
- [Ejemplos](https://sim.lemeit.ar/ejemplos.html) y [catálogo](https://sim.lemeit.ar/catalogo.html).
- [Ficha en Profe Lamaita](https://profe.lemeit.ar/projects/sim/).
- [Wiki de proyectos](https://wiki.lemeit.ar/sim/).
- [Portal Lemeit](https://lemeit.ar/#sim).

La aplicación conserva su identidad propia negro/blanco/rojo. La portada y las fichas aplican el diseño del portal que las contiene. ΣIM no es Bestiario · Seres Térmicos, cuyo recorrido está en Profe Lamaita y cuya documentación vive en `lemeit/simus`. Esta revisión agrega referencias documentales; no cambia la versión funcional 0.7.2 ni los motores.

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
