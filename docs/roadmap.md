# Hoja de ruta de Lemeit Sim

Estado al 15 de noviembre de 2026. Este editor no es todavía una réplica completa de DWSIM.
El alcance operativo se muestra en el [catálogo de la aplicación](https://sim.lemeit.ar/catalogo.html). Las capacidades se distinguen por su nivel de verificación: publicado y comprobado, implementado pero pendiente de comprobar, o planificado.

## Referencias y trazabilidad

Usamos los [tutoriales oficiales de DWSIM](https://dwsim.org/tutorials/en/) como mapa
para priorizar funciones y seleccionar casos de prueba. La documentación de Lemeit Sim
es propia: no se presenta como traducción oficial ni se copia íntegramente un tutorial.
Cada adaptación registrará enlace, versión del motor, parámetros y diferencias de interfaz.
Los resultados de modelos se distinguen de mediciones experimentales.

## Disponible y validado en motor real · hasta 0.11.0

- Corrientes, mezclador, divisor de dos salidas, calentador y enfriador.
- Reactores de conversión y equilibrio: una reacción por reactor, temperatura de
  salida especificada, dos corrientes de producto y comprobación de elementos por DWSIM.
- Selección de modelos de propiedades físicas separada del modelo del reactor.
- Balances de masa total, por especie y energía. En un reactor las especies pueden
  generarse o consumirse: su diferencia no se rotula como error de conservación.
- Para reactores, Q procede de DeltaQ del motor (kW) leído de su estado XML;
  incorpora calor de reacción. No se estima solamente con diferencias de entalpía sensible.
- 0.9.2: diez ejemplos 01–10 contrastados Windows–Debian con verificaciones de masa y conservación elemental en reactores.
- 0.10.0: separador de fases vapor–líquido (`Vessel` en MCP), ejemplo 11 NRTL agua–etanol probado en Debian, con residuos numéricos y tolerancias registrados en [el informe](flash-0.10.0.md).

## Entregado en 0.11.0 — Bomba y válvula

- Los PR #41 y #42 incorporan `Pump` y `Valve`, símbolos, campos de presión y eficiencia, pruebas de contrato y cálculo real en Debian.
- El Ejemplo 12 propone agua a 25 °C, 1 kg/s: bomba de 101,325 a 500 kPa (eficiencia 75 %) y válvula de 500 a 200 kPa.
- Primer ensayo real Debian: error de unidades. Corregida conversión kPa → bar para el adaptador MCP (500 kPa → 5 bar; 200 kPa → 2 bar). Segundo ensayo real: las siete verificaciones de presión, caudal, entalpía y estado calculado devolvieron `OK`.
- Se verificaron presión de bomba y válvula, caudal, entalpía aproximadamente constante de la válvula y cálculo de ambos equipos. El informe detallado de ejecución permanece local en Debian: `/tmp/sim-pump-valve12-debian.json`. La potencia de bomba no fue aportada numéricamente al chat; no se publica un valor no respaldado.
- Catálogo y guía del ejemplo 12 actualizados para la versión 0.11.0. Validación independiente en Windows aún pendiente.

## Mejoras continuas de corrientes

- Condiciones, composición y resultados agrupados claramente; conservar entradas canónicas al cambiar unidades.
- Caudales por masa o por moles, fracciones y propiedades por fase.
- Agregar nuevas especificaciones solo tras verificarlas con la API instalada; evitar campos incompatibles o propiedades inventadas.

## Próxima etapa: versión de administración

Antes de preparar la versión para alumnos, incorporar un panel de administración:

- Estado del motor y de la conexión: detenido, iniciando, disponible, calculando o con error.
- Controles para iniciar y detener el servidor, con confirmación de su estado real.
- Consola de actividad con fecha y hora, cálculos en curso, resultados y errores comprensibles.
- Seguimiento de disponibilidad y fallos, con indicación de la última comprobación.
- Registros sin tokens, secretos ni datos sensibles; controles reservados al administrador.

El botón de inicio necesitará un componente local que permanezca disponible: una
página web por sí sola no puede encender un proceso de una PC cuando todos sus
servicios están detenidos. Definir ese mecanismo al implementar esta etapa.
Esta planificación no activa vigilancia automática ni configura el inicio con Windows.

Una vez estabilizado el funcionamiento, preparar la versión para alumnos, centrada
en crear proyectos, configurar componentes y modelos, construir diagramas y analizar
resultados, con mensajes claros cuando el motor no esté disponible.

## En desarrollo · 0.12.0 — Intercambiador de calor

- Contrato del gateway con un equipo `HeatExchanger`, entradas 0 (caliente) y 1 (fría) y salidas 0 (caliente) y 1 (fría); cada corriente conserva identidad y composición.
- Primer modo didáctico propuesto: potencia transferida conocida (`heat_duty_kW`), ambas temperaturas de salida calculadas por DWSIM; no se fija simultáneamente una temperatura de salida, U o superficie.
- Ejemplo 13 propuesto: agua pura IAPWS-IF97, 1 kg/s a 80 °C (lado caliente) y 1 kg/s a 20 °C (lado frío), ambas alimentaciones a 300 kPa absolutos, 40 kW especificados.
- Pruebas de contrato sin motor y sonda real `tools/probe_heat_exchanger_debian.py` para verificar conexiones, sentido de Q, balances de masa por lado, temperaturas, especificación de potencia y estado de cálculo.
- **Por verificar:** la API MCP 10.2.15 acepta los parámetros `CalculationMode=CalcBothTemp` y `HeatDuty` y respeta las posiciones de los puertos. No se publicará como disponible hasta ejecutar el ejemplo real.
- Catálogo en estado `En desarrollo` hasta completar la corrida, sus resultados y la guía.
- Referencia: [Heat Exchanger Design](https://dwsim.org/tutorials/en/intermediate/02-heat-exchanger-design.html). DWSIM también admite modos por UA, área y rating que quedan fuera de esta primera adaptación.

### Criterios de publicación

1. Motor Debian devuelve las cuatro corrientes y equipo calculado sin error; masas conservadas por cada circuito.
2. El fluido caliente cede calor y el frío lo recibe, sin inversión térmica; desbalance energético dentro de tolerancia documentada.
3. Mostrar resultado real, límites y modos disponibles en el Ejemplo 13; sincronizar `site/catalogo.html`, `docs/roadmap.md`, Acerca de y CHANGELOG.
4. Pruebas automatizadas aprobadas; solo entonces fusionar y desplegar la versión 0.12.0.

## Desarrollo posterior

- Grados de libertad, explicación de estados y errores de especificación.
- Comparación de modelos, rangos de validez y disponibilidad de datos binarios.
  Referencia: [Choosing a Thermodynamic Model](https://dwsim.org/tutorials/en/fundamentals/04-choosing-a-thermodynamic-model.html).
- Gibbs y luego CSTR/PFR, con parámetros cinéticos trazables, bases y unidades explícitas.
  Referencia: [Reaction Systems](https://dwsim.org/tutorials/en/intermediate/03-reaction-systems.html).
- Columnas, recirculación y convergencia, antes de procesos industriales completos.
- Costos de materias primas y servicios, inversión, flujos de fondos y sensibilidad.
  Referencia: [Techno-Economic Analysis](https://dwsim.org/tutorials/en/features/tea-techno-economic-analysis.html).
  Documentar procedencia y fecha de precios, moneda y supuestos. Verificar licencia y
  acceso de cada función antes de prometer su disponibilidad gratuita.

## Plantilla para cada guía propia

Objetivo → caso físico → datos y fuentes → modelo y supuestos → configuración en
Lemeit Sim → resultados realmente ejecutados → balances y tolerancias → preguntas
para explorar → límites y errores frecuentes → tutorial de origen y cambios de adaptación.

Una función se marca disponible al completar puertos, formulario, validación,
conversión de unidades, cálculo real, errores y un ejemplo verificado. Dibujar su icono
no equivale a validar el equipo. **Cada PR que cambia una capacidad debe revisar tanto `site/catalogo.html` como este `docs/roadmap.md`**, documentando el estado real, el ejemplo y la evidencia de pruebas.
