# Hoja de ruta de Lemeit Sim

Estado al 6 de noviembre de 2026. Este editor no es todavía una réplica completa de DWSIM.
El alcance operativo se muestra en el catálogo de la propia aplicación.

## Referencias y trazabilidad

Usamos los [tutoriales oficiales de DWSIM](https://dwsim.org/tutorials/en/) como mapa
para priorizar funciones y seleccionar casos de prueba. La documentación de Lemeit Sim
es propia: no se presenta como traducción oficial ni se copia íntegramente un tutorial.
Cada adaptación registrará enlace, versión del motor, parámetros y diferencias de interfaz.
Los resultados de modelos se distinguen de mediciones experimentales.

## Primera publicación: disponible

- Corrientes, mezclador, divisor de dos salidas, calentador y enfriador.
- Reactores de conversión y equilibrio: una reacción por reactor, temperatura de
  salida especificada, dos corrientes de producto y comprobación de elementos por DWSIM.
- Selección de modelos de propiedades físicas separada del modelo del reactor.
- Balances de masa total, por especie y energía. En un reactor las especies pueden
  generarse o consumirse: su diferencia no se rotula como error de conservación.
- Para reactores, Q procede de DeltaQ del motor (kW) leído de su estado XML;
  incorpora calor de reacción. No se estima solamente con diferencias de entalpía sensible.

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

## Siguiente bloque de equipos elegido: procesos básicos

1. Bombas y válvulas: presión absoluta, caída/aumento de presión, eficiencia,
   potencia y condiciones que permiten usar cada equipo.
2. Separador de fases: introducir vapor/líquido y composiciones diferentes en las salidas.
   Referencia: [Simple Flash Drum](https://dwsim.org/tutorials/en/beginner/04-simple-flash-drum.html).
3. Intercambiador: dos corrientes, cuatro puertos de materia, balances por lado,
   configuración térmica y límites de especificación.
   Referencia: [Heat Exchanger Design](https://dwsim.org/tutorials/en/intermediate/02-heat-exchanger-design.html).

La adaptación del separador debe verificar el ejemplo con el motor instalado;
no copiar números orientativos del tutorial como si fueran resultados obtenidos aquí.

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

Una función se marca disponible al completar sus puertos, formulario, validación,
conversión de unidades, cálculo real, errores y un ejemplo verificado. Dibujar su icono
no equivale a implementar el equipo.
