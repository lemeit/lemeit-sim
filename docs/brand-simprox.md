# SIMPROX · Simulación de procesos

Se incorpora la opción A (primera fila) de la propuesta PNG provista por el usuario.
El archivo se conserva en assets/simprox-propuesta.png. El encabezado muestra solo
esa fila mediante un viewBox SVG: no se cambia ni redibuja la propuesta raster.
El nombre completo continúa siendo PNG; preparar un SVG independiente con letras
trazadas queda pendiente. El favicon es una interpretación vectorial del emblema.

La marca usa negro, blanco y rojo, con letras angulares inclinadas de la propuesta.
La aplicación mantiene temas claro/oscuro, el control de tema existente y el pie
con la atribución Lemeit y los enlaces a licencias. El dominio y el repositorio
conservan sus nombres actuales.

## Distribución de controles

- Cabecera compacta con marca y menús Archivo, Simulación, Ver, Ejemplos y Ayuda.
- Una barra de herramientas para Nuevo, Abrir, Guardar, nombre y Calcular, junto a
  controles compactos de vista y zoom. Iconos con nombre accesible y tooltip.
- Modelo y compuestos dentro de Simulación, sin una franja permanente adicional.
- La biblioteca lateral es la forma principal de agregar objetos. Agregar… se muestra
  en la vista Solo diagrama, donde puede estar oculta la biblioteca.
- El estado del motor se muestra en el pie. El espacio del diagrama se prioriza.

El cambio no amplía las capacidades del motor ni los campos de una corriente.
La siguiente prioridad es la ventana de corriente: condiciones, composición y
resultados, con unidades y especificaciones consistentes con DWSIM.

## Sistema visual independiente

SIMPROX UI v0.1 es una línea propia inspirada en la estética retro tecnológica de
Robotech. No es la versión de Lemeit Design: la hoja activa simprox-theme.css define
sus tokens --spx-*, tipografías locales y temas. Los componentes de la aplicación
se apoyan en esos tokens. La preferencia de tema se guarda como simprox-theme;
se acepta la preferencia anterior solo como transición, sin volver a escribirla.

Las ventanas usan cabecera oscura, acento rojo y cierre SVG blanco sobre rojo con
área de 32 × 32 px, foco visible y acceso por teclado. El cierre no depende de la
validación del formulario. La cabecera queda visible al desplazar su contenido.
Las bibliotecas y temas de otros portales se podrán extraer después de estabilizar
esta línea visual; no se modificaron esos portales ni el paquete lemeit-design.
