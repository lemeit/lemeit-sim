# Segunda paleta visual DWSIM

Versión 0.23.1 lista para publicación. Rama feature/paleta-dwsim.

## Uso y alcance

El selector «Símbolos» de la biblioteca Equipos y corrientes alterna ΣIM y DWSIM.
La apariencia se aplica simultáneamente a biblioteca, vista previa de arrastre
y equipos del diagrama. ΣIM sigue siendo el valor inicial y conserva sus SVG.
Las corrientes conservan su representación y enrutamiento actuales.

Se cubren bomba, mezclador, divisor, intercambiador, separador flash, válvula,
calentador, enfriador y reactores de conversión y equilibrio. El tanque
independiente queda para otro alcance por decisión del usuario. El separador
se representa como recipiente flash; no se agregó un tipo de cálculo ficticio.

## Integración

Se inspeccionaron AGENTS.md, TYPES, renderPalette, equipmentSymbol,
basePortList, portList, renderDiagram, sincronización de ventanas y catálogo HTML.
El gestor equipment-palettes.js ofrece listado, selección, suscripción y fallback
para tipos no cubiertos. Se carga antes del editor. Los eventos de la biblioteca
se enlazan una sola vez aunque sus botones se vuelvan a dibujar.

La preferencia se guarda en lemeit-visual-palette-v1 y se propaga con storage
a las demás ventanas del mismo origen. Valores inválidos recuperan ΣIM y el
almacenamiento bloqueado permite seguir cambiando durante la sesión.
No se escribe en graph, no se invoca changed ni persist ni se transmite al motor.
Se mantienen versión del proyecto, IDs, coordenadas, dimensiones, escala,
puertos, selección, zoom, conexiones, exportaciones y resultados calculados.
Los archivos existentes siguen abriendo con la apariencia elegida en el navegador.

## Autoría

Los diez SVG son dibujos propios y se distribuyen bajo GPL-3.0-or-later.
DWSIM es la referencia nominal de la apariencia, no una paleta oficial.
No se incorporaron imágenes ni código de terceros para estos símbolos.
Las imágenes DWSIM históricas ya presentes conservan sus licencias y créditos.

## Validación

- Build local completo, sin despliegue.
- Suite `npm test`: preferencia, sincronización, almacenamiento bloqueado,
  fallback, todos los equipos, puertos, tamaños y conservación de estado calculado;
  además de las regresiones existentes de selección, movimiento, borrado,
  arrastre, exportaciones, catálogo y proyectos.
- Navegador local: alternancia sobre el ejemplo conectado Bomba y válvula,
  conservación de etiquetas y conexiones visibles, preferencia tras recargar,
  y Ayuda → Acerca de mostrando 0.23.0 y estado de desarrollo.
- El servidor de prueba es estático y no tiene motor: no se ejecutó un cálculo
  termodinámico real. El cambio no afecta sus rutas ni parámetros.

Para ampliar la biblioteca se agrega el tipo al catálogo físico existente y su
entrada SVG al gestor; los puertos siguen siendo responsabilidad del editor.

## Revisión 0.23.1

Selector trasladado al panel Equipos y corrientes y siluetas más diferenciadas
con acento azul compatible con temas claro y oscuro. Movimiento individual,
extremos y codos sin recorte al origen; validación admite coordenadas finitas
negativas y Ajustar encuadra también esas posiciones. Suite completa: 159 pruebas.
Navegador: bomba trasladada con teclado desde x=340 hasta x=-210 y encuadrada
con Ajustar; Acerca de verificado tras recarga en 0.23.1.

## Ampliaciones funcionales

0.24.0 incorporó Compressor; 0.25.0 incorpora Tank con cálculo propio y ejemplo validado. El tanque deja de estar pospuesto. Los detalles físicos están en compresor.md y tanque.md. Energía se representa en la biblioteca con una flecha recta de trazos, como en el lienzo.
