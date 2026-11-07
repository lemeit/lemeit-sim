# Trabajar con un proyecto

1. Entrar a Lemeit Sim abre una sesión sin proyecto. La biblioteca queda inactiva.
2. Elegir Archivo → Nuevo proyecto. Definir nombre, componentes y un modelo de
   propiedades adecuado a las sustancias y condiciones del caso.
3. Crear el proyecto: el diagrama está vacío. Los componentes/modelo son metadatos,
   no un proceso construido automáticamente.
4. Agregar corrientes y equipos desde la biblioteca por clic o arrastrándolos.
5. Seleccionar una salida y luego una entrada compatible para conectarlas. Una
   corriente une equipos; la conexión crea también el vínculo correspondiente en DWSIM.
6. Seleccionar una alimentación y completar temperatura, presión absoluta, caudal
   y fracciones másicas. Las fracciones deben sumar uno.
7. Definir las especificaciones del equipo seleccionado. El modelo de reactor y
   su estequiometría son una elección separada del paquete de propiedades físicas.
8. Calcular y revisar corrientes y balances en el panel inferior. Los cambios de
   datos físicos invalidan resultados; mover un símbolo no cambia el cálculo.
9. Guardar proyecto descarga JSON. La copia automática del navegador no sustituye
   ese archivo. Recuperar último proyecto es una acción explícita del menú Archivo.

Los ejemplos se abren opcionalmente desde el menú Ejemplos. Si hay un proyecto
activo, la aplicación avisa antes de reemplazarlo. No son resultados experimentales.

La interfaz permanece disponible cuando el motor está desconectado. Se pueden
crear y guardar diagramas con el catálogo de nombres guardado; no se inventan
resultados ni se habilita Calcular hasta contar con el motor.

## Manejo del lienzo y paneles

Las corrientes de materia se representan con flechas; las de energía, con línea
discontinua. Sus extremos conservan los puertos para conectar equipos.
La rueda del mouse o el gesto de pinza del trackpad cambian el zoom alrededor del
puntero. Los botones + y − acercan y alejan; Ajustar recupera la vista del proceso.
Alt + arrastrar, o arrastrar con el botón central, desplaza el lienzo.
En pantallas de más de 760 px, arrastrar el borde interior de los paneles laterales
cambia su ancho. También se puede enfocar el separador con Tab y usar las flechas;
un doble clic restaura el ancho original.

## Conectar corrientes mediante sus extremos

Seleccioná la corriente para mostrar sus dos extremos. Arrastrá la punta a la entrada
de un equipo, o su inicio a la salida de un equipo. Los puertos aparecen al pasar
sobre el símbolo. Soltar en un espacio libre deja ese extremo desconectado.
Se rechazan puertos ocupados, materia/energía incompatibles y sentidos incorrectos.
Los clics de salida a entrada siguen disponibles como alternativa de teclado.
La corriente completa es una única línea seleccionable; no hay una flecha separada
para cada conexión. Los proyectos guardados antes de este cambio se conservan.
