# Próxima iteración: diagramas de proceso más simples

Referencia visual aportada por Luciano: diagrama PFD con columnas, intercambiadores,
válvulas, equipos auxiliares y corrientes de materia. Es una orientación para una
próxima iteración; no cambia el alcance de cálculo ni se presenta como un caso simulado.
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
