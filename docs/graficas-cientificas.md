# Gráficas · ΣIM 0.51.6

Los ejes, títulos y el formato de las curvas se guardan en el proyecto al guardar en la nube o en una copia JSON de respaldo. Al abrirlo, recalculá o importá de nuevo los datos para reconstruir la gráfica. Exportá CSV para conservar las muestras y SVG, PNG o JPG para conservar la imagen.

## Uso

Ejemplo 20 → Dinámico → Calcular. DWSIM integra 600 s con paso de 5 s; Gráficas aparece flotante con tiempo frente a nivel. En estacionario, abrir Simulación → Gráficas a pedido; los puntos representan objetos, no instantes. Arrastrar la cabecera contra un borde para acoplar; el botón alterna visibilidad.

Elegir X, Y y segunda curva opcional. Si las unidades coinciden se comparte el eje Y; si difieren aparece el eje derecho, con escala logarítmica e inclusión de cero independientes. Formato permite título, paleta de ocho colores, línea/puntos/dispersión, cuadrícula y referencias. Exportar SVG, PNG o JPG (1570 × 680 px para raster) y CSV. El proyecto/régimen, pie técnico y fecha local de generación son configurables. La leyenda distingue puntos, línea o ambos. Las series se conservan en memoria hasta cambiar condiciones o proyecto; no se guardan en nube.

Datos propios: importar CSV/TSV o pegar tabla numérica con unidades entre corchetes (hasta 10.000 filas y 30 columnas). No se inventan datos faltantes. No hay barridos automáticos ni regresión todavía.

## Dinámica del tanque

Circuito experimental de agua a 25 °C, tanque de 2 m³, altura 2 m, alimentación 10 kg/s a 130 kPa, salida 101,325 kPa, Kv 100 y 400, apertura 50 %. El estado inicial lo define DWSIM. El nivel y la descarga másica proceden de la integración; volumen y llenado derivan de la geometría; caudales volumétricos estimados. No se admite cualquier PFD ni se sustituye un fallo por un modelo didáctico. El Ejemplo 15 sigue estacionario; su herramienta didáctica independiente no equivale a la integración real.

| Tiempo [s] | Nivel Windows [m] | Descarga [kg/s] |
|---:|---:|---:|
|0|0,0100295|0|
|60|0,233917|8,382833|
|120|0,296234|9,433611|
|300|0,330749|9,968056|
|600|0,332854|9,999722|

Debian reprodujo los niveles a 60, 120 y 600 s (0,2339; 0,2962; 0,3329 m). Consistencia entre motores, no validación experimental independiente.

Formato y opciones permite editar el subtítulo o conservarlo automático, elegir colores mediante muestras y configurar representación, color y grosor de cada curva por separado.
