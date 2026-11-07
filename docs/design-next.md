# Diagramas de proceso: dirección visual y alcance

Referencia visual aportada por Luciano: diagrama PFD con columnas, intercambiadores,
válvulas, equipos auxiliares y corrientes de materia. Orienta la representación gráfica; no cambia el alcance de cálculo ni se presenta como un caso simulado.
La imagen permanece como referencia local y no se redistribuye en este repositorio.

## Dirección acordada

- Dibujar símbolos de ingeniería directamente sobre el lienzo, sin tarjetas de fondo.
- Equipos reconocibles por su forma: columnas, recipientes, bombas, válvulas e
  intercambiadores. No sustituirlos por pictogramas de objetos cotidianos.
- Líneas finas, recorridos ortogonales, puertos claros y flechas de dirección.
- Etiquetas compactas junto al equipo y sobre las corrientes; detalle completo en
  el inspector al seleccionar. Evitar que todas las propiedades ocupen el diagrama.
- Color reservado para estados, selección o magnitudes con leyenda explícita;
  no suponer que el verde de la referencia tiene un significado físico universal.
- Identidad Lemeit en menús, tipografía, inspector y controles; símbolos del proceso
  sobrios y legibles también en modo oscuro.
- La geometría visual debe conservar puertos reales y correspondencia con DWSIM.

La próxima prioridad funcional sigue siendo bombas, válvulas, intercambiadores y
separadores. No agregar complejidad gráfica antes de verificar sus modelos y puertos.

## Implementado el 7 de noviembre de 2026

Los objetos disponibles se dibujan como símbolos SVG propios y genéricos: mezclador
convergente, divisor divergente, unidad térmica circular y recipiente reactor. Los
modelos de conversión y equilibrio comparten el recipiente; se distinguen por nombre
y propiedades. No se asigna una geometría física o un mecanismo de reacción que el
modelo no especifica. La biblioteca usa los mismos símbolos que el lienzo.

Cada corriente se representa por un único recorrido ortogonal y una flecha final.
Sus extremos libres o conectados son parte de la corriente, no objetos adicionales.
Arrastrar un extremo a un puerto compatible crea o reemplaza esa conexión; soltarlo
en un espacio libre la desconecta. Un puerto ocupado o incompatible conserva la
conexión anterior. Las corrientes siguen a los equipos al moverlos.

Referencias:
- [Diagrama AmineTreating de Wikimedia Commons](https://commons.wikimedia.org/wiki/File:AmineTreating.png),
  aportado por el usuario como referencia visual. No se incorpora ni calca su imagen.
- [ISO 10628-2:2012](https://www.iso.org/standard/51841.html), referencia para símbolos
  de diagramas de las industrias química y petroquímica y su relación con ISO 14617.
  Esta implementación usa símbolos genéricos propios: no se afirma conformidad
  completa con la norma ni se reproduce su catálogo de pago.

Pendiente: ajuste manual de tramos/codos, prevención de solapamientos y símbolos de
los próximos equipos cuando sus modelos de cálculo estén implementados.

## Revisión de interacción y símbolos

Se adopta el estilo de símbolos de simulación de DWSIM para mezclador/divisor y
unidades térmicas (rombo H/C), en lugar de presentar calentadores y enfriadores como
intercambiadores completos de dos lados. Referencias contrastadas con el código de
DWSIM.Drawing.SkiaSharp, Shapes/Mixer.vb y Shapes/Heater.vb, versión 10.2.15, y su
[guía de operaciones](https://dwsim.org/help/main/24-unit-operations.html).
Se conserva la atribución/licencia de DWSIM del proyecto. ISO 10628-2 sigue siendo
referencia general; la conformidad símbolo por símbolo todavía no está validada.

El movimiento actualiza atributos de los objetos existentes mediante animation frames,
sin reconstruir el SVG completo durante cada desplazamiento. Los objetos nuevos
solo se aceptan desde un clic de biblioteca o un arrastre interno identificado.
Se bloquea el clic residual posterior al arrastre. La aparición original de varios
equipos térmicos no pudo reproducirse en las comprobaciones realizadas; no se atribuye
a una causa específica demostrada.
