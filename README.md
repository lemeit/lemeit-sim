# ΣIM

<img src="site/assets/sim-logo.svg" alt="ΣIM · Simulación de procesos" width="360">

Simulador de procesos con interfaz web en español y motor DWSIM, desarrollado con fines pedagógicos y sin finalidad comercial.
Marca: ΣIM · Simulación de procesos. El repositorio conserva el nombre lemeit-sim.
Sitio: https://sim.lemeit.ar · Identidad propia ΣIM, inspirada en tecnología retro: negro, blanco y rojo.

Es un piloto, no una réplica completa del editor de DWSIM.
[Catálogo de objetos](https://sim.lemeit.ar/catalogo.html) · [Hoja de ruta](docs/roadmap.md).

## Versión y estado

**0.4.2 — Marca discreta y descripción**, en desarrollo. La barra superior muestra
ΣIM en tamaño compacto y «Simulación de procesos» al lado. El logo completo se conserva en Acerca de
y documentación. La configuración PWA procede de la 0.4.0. Incorpora la identidad y
edición directa de corrientes de la 0.3.0.
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
- Unidades seleccionables, caudal másico o molar y composición másica o molar.
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

## Ejecución local

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
- Cloudflare Tunnel conecta el intermediario en 127.0.0.1:5911 con el Worker.
- El origen requiere Host interno y secreto para las solicitudes del túnel;
  el motor MCP no se publica. La publicación del túnel requiere autorización explícita.
- El servidor limita conexiones, crea un proceso DWSIM por cálculo y aplica un
  límite global del piloto de 12 cálculos/minuto y 120/hora, sin activar planes pagos.
- Si la PC está apagada o sin conexión, el editor sigue accesible; el cálculo
  devuelve una explicación de indisponibilidad. No se prometen disponibilidad 24/7
  ni capacidad para una clase completa hasta realizar pruebas de carga.

Las condiciones se envían al servidor para calcular. No se guardan ejercicios en
la nube: Guardar descarga JSON; Abrir restaura el proceso. Existe guardado local
automático en el navegador; borrar datos del sitio lo elimina.

## Encender y detener el cálculo online

La conexión publicada usa credenciales privadas ya configuradas en la PC del
operador. No están en GitHub ni se descargan al navegador. Desde la carpeta local:

```powershell
.\start-online.ps1
.\stop-online.ps1
```

No se instaló inicio automático de Windows: después de reiniciar la PC hay que
volver a iniciar el servicio. Apagar el servicio no elimina el editor de Cloudflare.
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
actualizar la copia local aprobada y reiniciar el servicio online. Esta entrega de
marca y corrientes no modifica el motor ni las ecuaciones.
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

La entrega 0.3.0 pasó 37 pruebas JS, compilación y empaquetado de Wrangler sin
publicar. Se verificaron en navegador la ausencia del selector, el arrastre de una
punta hacia arriba, el movimiento horizontal del codo y Acerca de 0.3.0.
Ver [detalle de comprobaciones](CHECKS.md). Estas verificaciones gráficas no
sustituyen las pruebas de cálculo con DWSIM ni las futuras pruebas de carga.

[Guía de trabajo](docs/workflow.md) · [Historial completo](docs/CHANGELOG.md) ·
[Identidad y logo](docs/brand-sim.md) · [Despliegue automático](docs/despliegue-automatico.md).

[Servicios y arranque/apagado](docs/operacion-local.md) · [Propuesta de acceso sin correo para alumnos](docs/acceso-propuesto.md).
