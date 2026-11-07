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

## Espacio de diseño ampliado y ventana independiente

- **Solo diagrama** oculta encabezado, biblioteca, propiedades y resultados.
  **Volver a paneles** o Escape recupera el entorno completo.
- **⛶** solicita pantalla completa al navegador.
- **Separar ↗** abre una ventana del mismo proyecto. Puede requerir habilitar ventanas
  emergentes. Las vistas abiertas se sincronizan en el mismo navegador mediante
  BroadcastChannel; no necesita otro servicio. No es una función multiusuario.
  Mantener abierta la vista principal mientras se abre o recarga la secundaria.
- **Agregar…** incorpora un único objeto desde la barra del propio diagrama.

Seleccioná un equipo y arrastrá el cuadrado de su esquina inferior derecha para
cambiar el tamaño. También se puede indicar un porcentaje (50–300 %) en Propiedades.
Se escala el símbolo con sus puertos: no se dimensiona físicamente el equipo ni
se cambian sus resultados termodinámicos.

Seleccioná una corriente y arrastrá el círculo central para desplazar su codo.
Al arrastrar un extremo cerca de un puerto compatible y libre, el puerto se resalta
y el extremo se ajusta a él. Los puertos ocupados siguen protegidos.

La ventana separada abre con **Equipos y corrientes** visible. El botón **Biblioteca**
permite ocultarla o recuperarla dentro de Solo diagrama. Conserva sus controles de
arrastre, alta de objetos y ancho ajustable.

## Menús y herramientas

Los menús abren de a uno. Con un menú abierto, pasar por otro cambia el desplegable;
el clic posterior mantiene abierto el que se acaba de seleccionar. Escape y un clic
fuera cierran. Flechas izquierda/derecha cambian de menú; arriba/abajo recorren
acciones. Ctrl+N, Ctrl+O y Ctrl+S actúan sobre el proyecto fuera de los diálogos.

- Archivo: nuevo, abrir, recuperar, guardar, cerrar y exportar resultados.
- Simulación: calcular, revisar conexiones/especificaciones, modelo y compuestos.
- Ver: diagrama, biblioteca, ventana separada, pantalla completa y balances.
- Ejemplos: acceso directo a los tres casos implementados.
- Herramientas: configuración, estado del motor y diagnóstico/actividad.
- Ayuda: alcance, documentación y licencias.

Configuración permite variar los decimales de las tablas y ocultar las ayudas del
lienzo. Las preferencias son locales; no modifican el cálculo ni las exportaciones.

## Diagnóstico y estado

Estado del motor comprueba manualmente /api/catalog, registra fecha y latencia,
catálogo disponible y estado del último cálculo. No representa CPU/memoria,
no inicia servicios y no da acceso a registros privados del servidor.

Diagnóstico muestra una revisión básica, el mensaje original del último fallo y
sugerencias por tipo de mensaje. Las sugerencias no prueban la causa del error.
La actividad conserva hasta 30 entradas en memoria de esa vista; se pierde al
recargar y no es una auditoría persistente del servidor. Descargar diagnóstico
genera un archivo local con esos datos, sin incluir credenciales de conexión.

## Exportaciones y panel de resultados

El borde superior del panel permite cambiar su altura; también se puede enfocar
con Tab y usar arriba/abajo. Home o doble clic restablece un tamaño de trabajo.
× oculta el panel; Ver → Mostrar balances y resultados lo recupera.
↗ abre otra vista sincronizada con resultados del mismo workspace. Mantener abierta
la principal; no se recalcula por abrir la vista. Esta función no es multiusuario.

Solo se exportan resultados vigentes:
- CSV de corrientes o de balances: UTF-8 con BOM, separador punto y coma y punto decimal.
- Excel .xlsx: hojas Corrientes, Balances, Componentes y Datos. Celdas numéricas con
  los valores originales, unidades en encabezados, modelo y versión del motor.

La exportación ocurre en el navegador, sin nuevos servicios. El formato de pantalla
no redondea los valores exportados. Los resultados son de una simulación, no mediciones.

## Ventanas compactas y monitor de conexión

Las cabeceras internas usan 30 px y un cierre circular de 12 px dentro de un área
interactiva de 24 px. El pie reúne estado y licencias, con la marca al margen derecho.
Hacer clic en la conexión abre una consola de solo lectura: HTTP, latencia, fecha y
últimas 40 comprobaciones. Se actualiza cada 30 s mientras la vista principal está
visible; se puede desactivar y está desactivado por defecto en ventanas auxiliares.
HTTP 409 se muestra como ocupado, no desconectado. Una señal de más de 75 s se marca
sin actualizar. La luz pulsa suavemente con conexión reciente y respeta movimiento
reducido. No comprueba una simulación ni da acceso a una terminal.

## Orientación de corrientes y energía

El inspector permite elegir arriba, abajo, izquierda, derecha o automático para
un extremo libre. El recorrido respeta la dirección de entrada/salida de los puertos;
el puerto inferior de energía del calentador recibe una flecha hacia arriba y el
del enfriador la emite hacia abajo. Los codos se ajustan en el eje correspondiente.
Ajustar incluye los extremos reales de las corrientes y no solo su posición inicial.

En los equipos térmicos actuales, la energía representa calor sin transporte de
materia. Se especifica la temperatura de salida y el motor calcula la potencia.
Un intercambiador completo de dos fluidos, con cuatro puertos de materia, sigue
pendiente; no debe confundirse con el calentador/enfriador de un solo lado.
Referencia: https://dwsim.org/help/main/24-unit-operations.html

## Corrientes y propiedades · 0.2.0

Seleccionar una corriente abre Condiciones, Composición y Resultados. Solo las
alimentaciones admiten datos de entrada. Las demás corrientes se calculan desde
su equipo de origen. Los archivos anteriores conservan TP, kg/s y base másica.

La especificación flash fija dos propiedades independientes: TP (temperatura y
presión), PH (presión y entalpía), PS (presión y entropía), PV (presión y fracción
molar de vapor) o TV (temperatura y fracción molar de vapor). Cada modelo tiene
un dominio de aplicación; el motor puede rechazar estados sin solución. La
referencia de entalpía/entropía depende del modelo. PS con IAPWS-IF97 se bloquea
porque una prueba real devolvió un estado con entropía distinta de la pedida;
PS se verificó con NRTL. No se sustituyen modelos automáticamente.

Elegir una unidad convierte la presentación y mantiene el valor físico canónico
del proyecto. Puede especificarse caudal másico o molar. Al elegir una base nueva
de caudal debe completarse su valor. Las fracciones suman 1. Al cambiar de base
de composición en mezclas se vacían: hay que ingresarlas en la nueva base. En
base molar el servidor obtiene las masas molares de DWSIM y convierte a base
másica para el conector, sin usar tablas aproximadas propias.

Resultados muestra mezcla global y fases presentes, con composición másica y
molar, entalpía, entropía y densidad. Líquido total agrega las fases líquidas y
no debe sumarse otra vez a Líquido 1/2. El caudal volumétrico global se obtiene
como caudal másico/densidad. El conector original devuelve cero para algunas
propiedades ausentes: se omiten fases sin fracción y densidades no positivas.
Las unidades de resultados pueden cambiarse sin recalcular. Cambiar datos físicos
invalida resultados anteriores. No se implementan aquí dinámica ni fase forzada.

## Monitor de conexión y cálculos · 0.2.2

La consola distingue CONEXIÓN (GET del catálogo) y CÁLCULO (POST de simulación).
Los cálculos registran inicio y finalización o error, HTTP cuando existe respuesta
y duración total medida desde el navegador, que incluye comunicación y cálculo.
La disponibilidad del servicio y el último cálculo son estados independientes:
un error de datos no demuestra que el motor esté desconectado. Las comprobaciones
de catálogo no ejecutan corridas ni borran el estado del cálculo anterior.
Se conservan los últimos 40 eventos de esta vista; se pierden al recargar.
