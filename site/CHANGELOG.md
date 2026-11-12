# Historial de versiones de ΣIM (antes SIMPROX)

La numeración del portal comienza en 0.1.0; las entregas anteriores no tenían versión explícita.
Cada entrega incrementa la versión: correcciones 0.1.x, nuevas capacidades 0.x.0;
1.0.0 quedará reservada para la primera versión estable para alumnos.
Actualizar este historial y la sección de versión en Ayuda → Acerca de en cada entrega.
La versión del portal es independiente de la versión del motor DWSIM.

## 0.7.0 — 2026-11-12

- Ejemplo 06: balance ternario agua–etanol–acetona con cuatro alimentaciones, dos mezcladores y un divisor, más problema inverso resuelto por sistema matricial 2×2.
- Menú Ejemplos consolidado y numerado del 01 al 08, con casos 07 y 08 de reactor de conversión y reactor de equilibrio previamente disponibles.
- Guía ampliada: enunciados, configuraciones, archivos JSON, tablas de referencia analítica y actividades de comprobación de reactores.
- Casos 06–08 ejecutados con el motor Windows: cierre de masa total y por componente del 06, temperaturas y resultados de reactores registrados en docs/validation/examples-0.7.0-windows.json. Sin comparación independiente con la API de escritorio para estos tres casos.
- README y Acerca de sincronizados con 0.7.0. Sin cambios en motores, túneles ni selección manual; Debian no se probó.

## 0.6.0 — 2026-11-11

- Selección manual del motor de cálculo desde el editor: PC remota Windows (predeterminado) o notebook Debian online.
- Comprobación de disponibilidad del motor elegido antes de calcular, sin conmutación automática ni transferencia de credenciales al navegador.
- Worker con destinos y secretos independientes para cada motor; se conserva el funcionamiento previo de Windows.
- Backend Linux compatible con DWSIM MCP 10.2.15 mediante HTTP local autenticado, sin exponer el puerto MCP a Internet.
- Prueba local en Debian: mezcla de agua con 2 kg/s y temperatura de salida 50,02138676 °C, consistente con el ejemplo de referencia.
- Se documentan instalación, restricciones de memoria, túnel privado y pruebas de la integración. La disponibilidad online de Debian depende de que la notebook y el túnel permanezcan encendidos.

## 0.5.0 — 2026-11-08

- Cinco ejemplos básicos en el menú: mezcla de agua, calentamiento, enfriamiento, división y mezcla agua–etanol con NRTL.
- Guía pedagógica con entradas, resultados de referencia y archivos JSON/DWXML descargables.
- Comparación reproducible de propiedades globales de todas las corrientes y potencia térmica contra la API oficial del DWSIM 10.2.15.0 instalado, mediante procesos aislados.
- Mezcla de agua y calentamiento también abiertos y recalculados en la interfaz de escritorio. No es una validación experimental ni una construcción independiente de los archivos en el editor nativo.
- Informe numérico con tolerancias y diferencias, scripts para repetir la comparación.

## 0.4.2 — 2026-11-08

- Marca de cabecera reducida a 86 × 24 px, con descripción legible al lado. Barra de 42 px conservada.

## 0.4.1 — 2026-11-07

- Cabecera del simulador y catálogo con marca ΣIM sin bajada, ampliada dentro de la misma barra.
- Nuevo sim-wordmark.svg con el mismo trazado de letras; logo completo conservado en Acerca de y documentación.

## 0.4.0 — 2026-11-07

- Manifest PWA de ΣIM: nombre, iconos, inicio y ventana standalone.
- Icono cuadrado con sigma roja sobre carbón; variantes SVG, PNG 16/32/180/192/512, ICO multiresolución y PNG adaptable a máscaras del sistema.
- Ayuda ofrece Instalar ΣIM cuando el navegador emite la invitación de instalación.
- Service worker para una página explicativa sin conexión. Interfaz por red, sin caché de API ni resultados; solo se guarda la página offline y su estilo.
- Tipos MIME de manifest e ICO en el Worker y servidor local. El motor sigue siendo remoto y requiere conexión.

## 0.3.0 — 2026-11-07

- SIMPROX pasa a llamarse ΣIM · Simulación de procesos. Dominio y repositorio sin cambios.
- Logo vectorial independiente según la opción 02 Retro técnico: Σ roja, IM blanco cálido, letras y bajada convertidas en curvas. Favicon sigma.
- Paleta carbón #101215, blanco cálido #F4F3EE y rojo #CF263B.
- Se elimina Dirección del extremo libre del inspector. La dirección sigue la posición de los extremos arrastrados; los puertos conectados conservan su normal.
- El control del codo admite arrastre horizontal o vertical. Mover un extremo reinicia el recorrido manual anterior y elimina la orientación heredada.
- La vista previa de desconexión orienta el extremo libre durante el arrastre, no recién al soltarlo.

## 0.2.2 — 2026-11-07

- Monitor: las consultas del catálogo se describen como comprobaciones de disponibilidad.
- Consola con eventos CONEXIÓN y CÁLCULO; inicio, finalización/error, HTTP y duración completa de la solicitud.
- Estado del último cálculo en curso, completado o fallido, separado de la última comprobación de conexión.
- Diagnóstico incorpora el inicio y la duración del cálculo. Registro limitado a esta vista y a la sesión actual.

## 0.2.1 — 2026-11-07

- Configuración reproducible de Wrangler para publicar el Worker existente desde Workers Builds al actualizar main; pendiente de conectar GitHub en Cloudflare.
- GitHub Actions verifica PR y main: pruebas, versión, validación del servidor y preparación de despliegue sin publicar.
- Se preservan las variables del panel y el secreto ORIGIN_KEY existente; no se incorporan claves al repositorio.
- Se incorpora la actualización del README y el control de versión que quedaron fuera de la fusión anterior.
- No modifica el motor ni automatiza la actualización de server.py en la PC.

## 0.2.0 — 2026-11-07

- Inspector de corrientes con Condiciones, Composición y Resultados.
- TP, PH, PS, PV y TV; solo se envían las propiedades independientes activas.
- Unidades de temperatura, presión, caudal, entalpía, entropía y fracción de vapor.
- Caudal másico o molar, composición másica o molar. Las masas molares provienen del XML de DWSIM.
- Resultados globales y por fase: entalpía, entropía, densidad y fracciones másicas/molares.
- Caudal volumétrico global derivado de caudal másico/densidad calculados por DWSIM.
- Compatibilidad de proyectos anteriores: TP, kg/s y composición másica por defecto.
- PS/IAPWS-IF97 bloqueado: prueba de ida y vuelta detectó falta de conservación de la entropía solicitada. PS validado con NRTL.
- Cambiar la base de composición vacía los valores de mezclas para evitar reinterpretarlos sin conversión.

## 0.1.1 — 2026-11-07

- Ventanas minimalistas con identidad SIMPROX, sin control circular tipo Mac.
- Títulos alineados a la izquierda y cierre a la derecha.
- Mismo cierre discreto en el panel de resultados.

## 0.1.0 — 2026-11-07

- Versión y cambios visibles en Acerca de.
- Scripts de inicio y detención usan .local/runtime dentro del repositorio por defecto.
- Motor, configuración privada y registros excluidos de Git.
- Cruz de cierre centrada en ventanas y panel de resultados.

Base existente: editor de diagramas, corrientes de materia y energía, equipos básicos,
modelos termodinámicos, cálculo con DWSIM, balances, exportación CSV/Excel y monitor de conexión.
