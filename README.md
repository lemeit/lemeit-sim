# Lemeit Sim

Simulador pedagógico de procesos, con interfaz web en español y motor DWSIM.
Sitio: https://sim.lemeit.ar · Diseño: https://design.lemeit.ar

Es un piloto, no una réplica completa del editor de DWSIM.
[Catálogo de objetos](https://sim.lemeit.ar/catalogo.html) · [Hoja de ruta](docs/roadmap.md).

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

## Ejecución local

Requisitos: Python 3.11+, Node 18+ solo para verificar/preparar la interfaz, y una
distribución de DWSIM MCP 10.2.15 para Windows x64. La carpeta del motor contiene
server/dwsim-mcp.exe y sus dependencias. No se incluyen binarios del motor.
No requiere paquetes Python de terceros ni la aplicación de escritorio.

```powershell
.\start-local.ps1 -EngineRoot "C:\ruta\a\dwsim-server"
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

## Desarrollar y comprobar

```powershell
node --check site/app.js
node --test deploy/test-worker.mjs
python -m unittest discover -s . -p "test_*.py" -v
node deploy/build.mjs
```

La integración con el motor real requiere DWSIM_HOME apuntando a su carpeta.
.build/ y los archivos de credenciales no se versionan. El Worker publicado se
prepara desde los archivos de site/; no hay un despliegue automático al hacer push.

## Próximos pasos

Prioridad elegida: bombas, válvulas, intercambiadores y separadores. Se usarán los
tutoriales oficiales de DWSIM como referencias para casos de validación y guías
propias, con trazabilidad. Ver [plan y fuentes](docs/roadmap.md).

## Licencias

Integración y símbolos DWSIM: GPL-3.0-or-later; ver LICENSE y
[atribuciones](site/licenses/NOTICE.md). Componentes lemeit-design: MIT.
El pie de dos colores y el control de tema se adaptaron del sitio tex.lemeit.ar.
No se incorporan componentes exclusivos de Patreon. Esta integración no es una
edición oficial de DWSIM.
