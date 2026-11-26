# Gráficas

## Módulo general (0.50.0)

Calculá cualquier ejemplo con el botón Calcular y abrí Simulación → Gráficas o el icono de la barra. Elegí el conjunto Corrientes, Balances, Componentes, dinámica del tanque o Datos propios. Para ingresar datos propios, pegá una tabla numérica con encabezados y unidades entre corchetes, o importá CSV/TSV. Las filas vacías se omiten; los campos faltantes no se inventan. Se admiten hasta 10.000 filas y 30 columnas.

Seleccioná X e Y y opcionalmente una segunda curva de igual unidad. Configurá título, color principal, grosor, representación línea/puntos/dispersión, escalas logarítmicas, cuadrícula y leyenda. Exportá SVG o CSV. En estacionario cada punto es una corriente, equipo o componente, no un instante; para obtener curvas temporales o paramétricas reales hacen falta series calculadas o importadas. No se recalcula al graficar. Los datos se conservan en memoria hasta modificar condiciones o cambiar de proyecto; guardá las exportaciones. Todavía no hay barrido automático, regresión, persistencia ni panel acoplable.


Versión de referencia: **ΣIM 0.49.0**, integrada en main y con CI aprobado. Comprobá la versión instalada en Ayuda → Acerca de. El despliegue del portal se verifica por separado.

## Abrir y calcular

1. Ingresá al portal y abrí **Ejemplos → 20 · Llenado dinámico de tanque**.
2. En el pie fijá el motor Debian para reproducir la corrida comprobada. Windows queda pendiente de validación física.
3. Seleccioná T-01 en el diagrama y en Propiedades pulsá **Dinámica del tanque · nivel y curvas…**.
4. En Motor de dinámica elegí DWSIM real si la consulta de capacidades lo habilita, o Modelo didáctico ΣIM para una práctica independiente.
5. Revisá volumen 2 m³, altura 2 m, entrada 10 kg/s, presión de entrada 130 kPa, salida 101,325 kPa, Kv 100 y 400, apertura 50 %, duración 600 s y paso 5 s. Ejecutá dinámica DWSIM.
6. Esperá el resultado de la solicitud en pantalla. Si falla, leé el mensaje; no hay sustitución silenciosa por una curva didáctica.

El modo didáctico usa geometría, densidad y volumen inicial editables, caudal de salida constante o descarga por gravedad y Euler explícito. El modo DWSIM crea una topología temporal fija de agua con dos válvulas; no integra cualquier PFD ni utiliza el volumen inicial didáctico.

## Ventana Gráficas (0.49.1)

Desde **Simulación → Gráficas**, el icono de gráfica de la barra de Simulación o **Abrir en Gráficas ↗** dentro del tanque, podés consultar la última serie calculada sin volver a ejecutar DWSIM. Elegí libremente X e Y, una segunda curva de la misma unidad y un título. La ventana es redimensionable y conserva la serie mientras no se cambie de proyecto ni de condiciones físicas. No es todavía un panel acoplable ni persiste datos en la nube.

## Leer y configurar las gráficas

| Selector | Magnitud | Unidad |
| --- | --- | --- |
| Nivel | Altura de líquido | m |
| Volumen | Volumen líquido | m³ |
| Caudales | Entrada y salida volumétricas | m³/s |
| Descarga | Caudal másico de salida | kg/s |
| Llenado | Fracción de capacidad en porcentaje | % |

El eje X es tiempo en segundos. El eje Y y la leyenda cambian con la selección. En DWSIM el nivel y la descarga másica proceden del motor; el volumen y el porcentaje se derivan de la geometría, y los caudales volumétricos son aproximaciones con densidad de referencia. En el modelo didáctico la descarga másica se deriva de su densidad configurada.

- **Cuadrícula:** activa o desactiva líneas auxiliares.
- **Puntos:** muestra marcadores en las muestras, sin crear mediciones adicionales.
- **Y log:** escala logarítmica para valores positivos; ceros y negativos no se representan en ella. Si no hay datos positivos se vuelve a escala lineal. Para llenado desde cero conviene la escala lineal.
- **Deslizador:** recorre las muestras calculadas y actualiza el cursor, tiempo, volumen, nivel y porcentaje.
- **Reproducir / Pausar:** anima la serie ya calculada; no vuelve a ejecutar el motor ni equivale a tiempo real.

El diseño usa fondo blanco, tipografía legible, ejes enmarcados, leyenda y origen de datos. Es independiente del tema claro/oscuro de los controles de ΣIM.

## Exportar y presentar

**Exportar CSV** descarga las series numéricas con origen y unidades, para Excel, OriginPro u otro programa científico. **Exportar SVG** conserva la gráfica vectorial visible, incluido el cursor y los controles de presentación aplicados. Insertá el SVG en el informe o convertílo con una herramienta externa si necesitás otro formato. No es la exportación PDF del diagrama.

Guardá el CSV antes de cerrar el diálogo: las series y la configuración del graficador todavía no se conservan con el proyecto en nube. Registrá motor, parámetros, paso temporal, fecha y versión.

## Caso comprobado

El 25/11/2026 Debian produjo 121 puntos en 120 pasos. Los siguientes son resultados calculados, no mediciones de laboratorio.

| Tiempo (s) | Nivel (m) | Descarga (kg/s) |
| ---: | ---: | ---: |
| 60 | 0,2339 | 8,3828 |
| 120 | 0,2962 | 9,4336 |
| 600 | 0,3329 | 9,9997 |

El balance dm/dt = entrada − salida explica la estabilización: al final la descarga casi iguala 10 kg/s. No se ha auditado independientemente el residuo integral completo. Ver [Ejemplo 20](ejemplo-20-tanque-dinamico-dwsim.md).

## Alcance y evolución

El núcleo gráfico es reutilizable, pero la interfaz actual está dentro del tanque. Panel acoplable, zoom, importación de datos experimentales, incertidumbre, regresiones, cinética y persistencia son desarrollos pendientes. No se atribuyen al módulo actual.


## Modelos físicos (0.50.1)

Abrí Modelos físicos, elegí el modelo y completá los parámetros. Generá la curva y seleccioná ejes XY. Activá Superponer estados DWSIM compatibles si hay variables de igual magnitud y unidad en resultados vigentes. Se muestran como puntos, sin atribuirles una trayectoria. Los parámetros del gas ideal deben corresponder al gas de estudio; los valores iniciales son ilustrativos. La selección incluye todas las corrientes compatibles, no solo las de un compresor. Exportar CSV descarga el conjunto seleccionado; SVG incluye la superposición visible. No hay barridos automáticos ni ajuste de modelos reales de gas en esta revisión.

### Navegación y datos del tanque

No se requiere importar CSV. Una corrida dinámica entrega sus muestras a Gráficas automáticamente; Abrir en Gráficas selecciona la serie temporal y mantiene los datos al cerrar la ventana del tanque. La tabla Datos de la gráfica muestra todas las columnas en páginas de 100 filas. Rueda o +/− para zoom, arrastre o flechas para desplazar la vista ampliada y Ajustar para recuperar el gráfico completo. El botón de ampliar cambia el tamaño de la ventana y el cuerpo tiene desplazamiento propio. El SVG exportado conserva la gráfica completa. Las series permanecen en memoria, no sobreviven a recargar la página ni a cambios físicos del proyecto.
