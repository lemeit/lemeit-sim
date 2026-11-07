# SIMPROX

Simulador de procesos con interfaz web en español y motor DWSIM, desarrollado con fines pedagógicos y sin finalidad comercial.
Marca: SIMPROX · Simulación de procesos. El repositorio conserva el nombre lemeit-sim.
Sitio: https://sim.lemeit.ar · Identidad propia SIMPROX, inspirada en tecnología retro: negro, blanco y rojo.

Es un piloto, no una réplica completa del editor de DWSIM.
[Catálogo de objetos](https://sim.lemeit.ar/catalogo.html) · [Hoja de ruta](docs/roadmap.md).

## Versión y estado

**0.2.1 — Preparación del despliegue automático**, en desarrollo.
Incluye las capacidades de corrientes y propiedades de la 0.2.0, ya fusionada en main.
La última versión pública comprobada es **0.1.1**. La publicación de la versión nueva
queda pendiente de fusionar esta configuración y conectar Workers Builds en Cloudflare.
Ver [configuración paso a paso](docs/despliegue-automatico.md).
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

### Edición, resultados y operación

- Corrientes con extremos reconectables y recorrido ortogonal ajustable; orientación
  horizontal/vertical y símbolos de equipos con tamaño gráfico ajustable.
- Paneles laterales y balances ajustables; diagrama y resultados separables en ventanas
  sincronizadas del mismo navegador. Mantener abierta la ventana principal.
- Balances de materia y energía, exportación CSV y Excel, diagnóstico con mensaje
  original del motor y sugerencias orientativas.
- Monitor de conexión con HTTP, latencia y antigüedad de la comprobación. Indica
  disponibilidad del servicio; no mide CPU ni ejecuta un cálculo de prueba.
- Ventanas minimalistas, modo claro/oscuro, guardado JSON y recuperación local.

## Ejecución local

Requisitos: Python 3.11+, Node 18+ solo para verificar/preparar la interfaz, y una
distribución de DWSIM MCP 10.2.15 para Windows x64. La carpeta del motor contiene
server/dwsim-mcp.exe y sus dependencias. No se incluyen binarios del motor.
No requiere paquetes Python de terceros ni la aplicación de escritorio.
Ubicación predeterminada del motor: `.local/runtime`, dentro del repositorio local.
Incluye DWSIM, configuración privada y registros, excluidos de Git.
Puede usarse otra ubicación mediante `-EngineRoot "C:\ruta\al\motor"`.

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
node --check site/app.js
node --test deploy/test-*.mjs
python -m unittest discover -s . -p "test_*.py" -v
node deploy/build.mjs
```

Para pruebas aisladas reales en PowerShell:

```powershell
$env:DWSIM_HOME = (Resolve-Path .local/runtime).Path
python -m unittest test_stream_properties test_server.IsolatedIntegrationTests -v
```

Las pruebas históricas EngineIntegrationTests requieren además el MCP HTTP 5901;
las pruebas aisladas anteriores no lo necesitan.
.build/ y los archivos de credenciales no se versionan. El Worker publicado se
prepara desde los archivos de site/. Esta entrega agrega configuración para
Workers Builds: al conectar el repositorio, cada actualización de main publica el Worker.
GitHub Actions comprueba los PR; no realiza un segundo despliegue.
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

## Herramientas de trabajo

Menús con navegación por teclado, configuración de presentación, comprobación manual
de conexión y diagnóstico del último cálculo. Resultados redimensionables, ocultables
y separables en otra vista sincronizada. Exportación local CSV y Excel .xlsx de
resultados vigentes. Ver [guía de trabajo](docs/workflow.md).

[Servicios y arranque/apagado](docs/operacion-local.md) · [Propuesta de acceso sin correo para alumnos](docs/acceso-propuesto.md).
