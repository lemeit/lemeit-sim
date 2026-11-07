# Historial de versiones de SIMPROX

La numeración del portal comienza en 0.1.0; las entregas anteriores no tenían versión explícita.
Cada entrega incrementa la versión: correcciones 0.1.x, nuevas capacidades 0.x.0;
1.0.0 quedará reservada para la primera versión estable para alumnos.
Actualizar este historial y la sección de versión en Ayuda → Acerca de en cada entrega.
La versión del portal es independiente de la versión del motor DWSIM.

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
