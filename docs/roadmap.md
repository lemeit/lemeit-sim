# Hoja de ruta de ΣIM

Estado al 17 de noviembre de 2026 · portal 0.21.4. Este editor no es todavía una réplica completa de DWSIM.
El alcance operativo se muestra en el [catálogo de la aplicación](https://sim.lemeit.ar/catalogo.html). Las capacidades se distinguen por su nivel de verificación: publicado y comprobado, implementado pero pendiente de comprobar, o planificado.

## Estado integrado · PR #72 / 0.21.4

- Acceso por código de clase sin correo y administración privada; sesiones, vencimientos y desactivación de clases.
- Manual de uso en la wiki y ayuda contextual desde el inspector (0.18.0); trece ejercicios y actividad guiada del intercambiador integrada en el Ejemplo 13 (0.19.1).
- Paneles flotantes y acoplables a los cuatro bordes, redimensionamiento y distribución persistente en el navegador (0.20.0–0.21.1).
- Arrastre de equipos y corrientes desde la biblioteca, eliminación con Supr/Retroceso y correcciones para Firefox (0.21.2–0.21.3).
- Tipografía uniforme de los desplegables del inspector (0.21.4, PR #72).

Estos avances de acceso, documentación e interfaz no amplían por sí mismos los modelos del motor. Continúan pendientes la adaptación de CSTR/PFR cinéticos, perfiles de reacción, recirculaciones, análisis económico y pruebas de carga con una clase. Windows y Debian se eligen manualmente; la disponibilidad depende de cada instalación.

Los apartados por versión que siguen conservan la trazabilidad histórica. Ver el [historial completo](CHANGELOG.md) para el detalle de cada entrega. Esta revisión documental no constituye una nueva ejecución ni validación de los motores.

## Referencias y trazabilidad

Usamos los [tutoriales oficiales de DWSIM](https://dwsim.org/tutorials/en/) como mapa
para priorizar funciones y seleccionar casos de prueba. La documentación de Lemeit Sim
es propia: no se presenta como traducción oficial ni se copia íntegramente un tutorial.
Cada adaptación registrará enlace, versión del motor, parámetros y diferencias de interfaz.
Los resultados de modelos se distinguen de mediciones experimentales.

## Base de cálculo y validaciones históricas

- Corrientes, mezclador, divisor de dos salidas, calentador y enfriador.
- Reactores de conversión y equilibrio: una reacción por reactor, temperatura de
  salida especificada, dos corrientes de producto y comprobación de elementos por DWSIM.
- Selección de modelos de propiedades físicas separada del modelo del reactor.
- Balances de masa total, por especie y energía. En un reactor las especies pueden
  generarse o consumirse: su diferencia no se rotula como error de conservación.
- Para reactores, Q procede de DeltaQ del motor (kW) leído de su estado XML;
  incorpora calor de reacción. No se estima solamente con diferencias de entalpía sensible.
- 0.9.2: diez ejemplos 01–10 contrastados Windows–Debian con verificaciones de masa y conservación elemental en reactores.
- 0.10.0: separador de fases vapor–líquido (`Vessel` en MCP), ejemplo 11 NRTL agua–etanol probado en Debian, con residuos numéricos y tolerancias registrados en [el informe](flash-0.10.0.md).

## Entregado en 0.11.0 — Bomba y válvula

- Los PR #41 y #42 incorporan `Pump` y `Valve`, símbolos, campos de presión y eficiencia, pruebas de contrato y cálculo real en Debian.
- El Ejemplo 12 propone agua a 25 °C, 1 kg/s: bomba de 101,325 a 500 kPa (eficiencia 75 %) y válvula de 500 a 200 kPa.
- Primer ensayo real Debian: error de unidades. Corregida conversión kPa → bar para el adaptador MCP (500 kPa → 5 bar; 200 kPa → 2 bar). Segundo ensayo real: las siete verificaciones de presión, caudal, entalpía y estado calculado devolvieron `OK`.
- Se verificaron presión de bomba y válvula, caudal, entalpía aproximadamente constante de la válvula y cálculo de ambos equipos. El informe detallado de ejecución permanece local en Debian: `/tmp/sim-pump-valve12-debian.json`. La potencia de bomba no fue aportada numéricamente al chat; no se publica un valor no respaldado.
- Catálogo y guía del ejemplo 12 actualizados para la versión 0.11.0. Validación independiente en Windows aún pendiente.

## Mejora editorial de guía · 16/11/2026

- Los 13 ejercicios mantienen un formato de ficha común: objetivo, datos y enunciado, resolución paso a paso, tabla de resultados, actividades, alcance de validación y descargas.
- Se eliminó la tabla inicial exclusiva de 01–05 para integrar sus referencias dentro de las respectivas fichas. Se conservan valores y enlaces de referencia, sin volver a calcular ni atribuir validaciones nuevas.
- El menú Herramientas separa **Estado de motores** (ambos motores, diálogo de consulta) de **Diagnóstico del proyecto** (conexiones y último cálculo). El monitor detallado del motor elegido continúa accesible desde el pie del editor.

## Mejoras continuas de corrientes

- Condiciones, composición y resultados agrupados claramente; conservar entradas canónicas al cambiar unidades.
- Caudales por masa o por moles, fracciones y propiedades por fase.
- Agregar nuevas especificaciones solo tras verificarlas con la API instalada; evitar campos incompatibles o propiedades inventadas.

## Entregado en 0.13.0 — Diagnóstico de versiones del gateway

- Endpoint acotado `GET /api/status` en cada gateway, consultado por Cloudflare solo para el motor elegido (Windows o Debian), con el mismo control de origen que el catálogo.
- Mostrar versión de gateway tomada al iniciar Python, instante de arranque, horas en ejecución, estado ocupado/libre y tipos de equipos que reconoce; sin rutas, tokens, claves ni administración remota.
- Monitor de conexión: distingue catálogo operativo de información de versión. Un gateway anterior sin `/api/status` sigue pudiendo calcular, pero su versión se presenta como **no confirmada** y se recomienda actualizar/reiniciar.
- Pruebas automatizadas del contrato HTTP y datos de estado. La publicación del Worker no reinicia el servicio: ejecutar `sudo systemctl restart lemeit-sim.service` tras actualizar `server.py` en Debian y verificar `GET /api/status`. Hasta comprobar la instalación concreta, la ejecución real en producción está pendiente.
- No incorpora controles de inicio/apagado: requieren autenticación de administrador, autorización explícita y un proceso supervisor seguro.

## Entregado en 0.14.0 — Diagnóstico rápido y validación cruzada (histórico)

- Monitor inicial de solo lectura en `site/admin.html` (hoy reservado al panel administrativo; la consulta se abre en el editor): comprobar Windows y Debian en paralelo mediante `/api/status`, ver estado, versión, último arranque y equipos reconocidos; seguimiento opcional cada 30 segundos con historial limitado a la sesión.
- Guía de recuperación local para Windows (`start-online.ps1` / `stop-online.ps1`) y Debian (`systemctl`), sin acciones remotas ni exposición de credenciales.
- Sonda Windows `tools/validate-hx13-windows.ps1`: ejecuta el Ejemplo 13 a través del gateway HTTP real y compara temperaturas, presión, caudales, calor cedido/recibido, balance energético y estado del equipo con la referencia Debian.
- **Validación Windows realizada el 16/11/2026:** los 19 controles de la sonda devolvieron OK. Las cuatro temperaturas, presiones, caudales y entalpías coinciden con la prueba Debian en las cifras informadas. Agua caliente: 80,000000 → 70,456556 °C; agua fría: 20,000000 → 29,565765 °C; ambas a 300 kPa y 1 kg/s. Q cedido = 40,00000037 kW; Q recibido = 40,00000004 kW; residuo = 0,00000033 kW. Fuente: salida de PowerShell aportada por el usuario, ejecutando `tools/validate-hx13-windows.ps1` contra el gateway Windows real; informe JSON permanece local en `.local/runtime/validacion-hx13-windows.json`. Validación cruzada limitada a este caso, no prueba todos los modos de `HeatExchanger`.
- El monitor de consulta se mantiene sin acciones administrativas; el panel actual de clases requiere rol admin.
- Inicio/apagado desde el navegador requiere supervisor persistente y autenticación robusta; queda fuera del monitor de consulta.

## 0.17.4 — Historial de transiciones del monitor

- En el panel administrativo, cada consulta de Windows y Debian registra un evento solo al cambiar el estado del motor, en vez de registrar cada comprobación redundante.
- Se muestra desde cuándo dura el estado observado, los errores consecutivos sin estado confirmado y las versiones de gateway anteriores al portal. No se interpreta falta de respuesta como confirmación de apagado.
- Historial limitado a 20 eventos en memoria de la pestaña, sin datos de proyectos, claves, credenciales ni persistencia.
- Consulta de solo lectura; arranque/reinicio remotos siguen fuera de alcance hasta contar con supervisor autorizado.

## 0.17.5 — Especificaciones antes del cálculo

- Revisión local de parámetros de bombas, válvulas, intercambiadores, divisores, calentadores/enfriadores y reactores; avisos en español cuando faltan valores, no son finitos o están fuera de rangos del contrato actual.
- Mantiene la validación definitiva en `server.py`; la revisión no realiza un análisis algebraico completo de grados de libertad ni garantiza convergencia o plausibilidad física.
- Vincular el diagnóstico con [la guía original de grados de libertad en la wiki](https://wiki.lemeit.ar/sim/grados-libertad-especificaciones/). No cambia la simulación DWSIM ni abre funciones nuevas.

## Pendiente: supervisión remota de equipos

El acceso por clases y el panel administrativo ya están publicados. Siguen pendientes el inicio, parada o reinicio remotos de procesos y el encendido de computadoras. Requieren un supervisor independiente, autenticación de administrador y comandos permitidos; el propio túnel de una máquina apagada no puede encenderla.

Los estados actuales son disponibilidad/ocupación o estado no confirmado; no se presentan «iniciando» o «reiniciando» sin un supervisor que los confirme. La actividad visible no es un registro privado completo del servidor.

## Entregado en 0.12.0 — Intercambiador de calor

- Contrato del gateway con un equipo `HeatExchanger`, entradas 0 (caliente) y 1 (fría) y salidas 0 (caliente) y 1 (fría); cada corriente conserva identidad y composición.
- Modo didáctico validado: potencia transferida conocida (`heat_duty_kW`), ambas temperaturas de salida calculadas por DWSIM; no se fija simultáneamente una temperatura de salida, U o superficie.
- Ejemplo 13 validado en Debian: agua pura IAPWS-IF97, 1 kg/s a 80 °C (lado caliente) y 1 kg/s a 20 °C (lado frío), ambas alimentaciones a 300 kPa absolutos, 40 kW especificados.
- Pruebas de contrato sin motor y sonda real `tools/probe_heat_exchanger_debian.py` para verificar conexiones, sentido de Q, balances de masa por lado, temperaturas, especificación de potencia y estado de cálculo.
- **Comprobado con ejecución real Debian DWSIM MCP 10.2.15:** `CalculationMode=CalcBothTemp` y `HeatDuty` aceptados. El agua caliente baja de 80 a 70,456556 °C, la fría sube de 20 a 29,565765 °C; 40,00000037 kW cedidos y 40,00000004 kW recibidos, residuo térmico 0,00000033 kW. Los dos caudales permanecen en 1 kg/s y las presiones a 300 kPa. Los 9 controles físicos y 6 pruebas unitarias terminaron correctamente.
- Catálogo actualizado como `Disponible` desde 0.12.0; Ejemplo 13 con resultados documentados. No incluye diseño por U/área; el ensayo Windows se documentó posteriormente en 0.14.0.
- Referencia: [Heat Exchanger Design](https://dwsim.org/tutorials/en/intermediate/02-heat-exchanger-design.html). DWSIM también admite modos por UA, área y rating que quedan fuera de esta primera adaptación.

### Criterios de publicación

1. Motor Debian devuelve las cuatro corrientes y equipo calculado sin error; masas conservadas por cada circuito.
2. El fluido caliente cede calor y el frío lo recibe, sin inversión térmica; desbalance energético dentro de tolerancia documentada.
3. Mostrar resultado real, límites y modos disponibles en el Ejemplo 13; sincronizar `site/catalogo.html`, `docs/roadmap.md`, Acerca de y CHANGELOG.
4. Pruebas automatizadas aprobadas; solo entonces fusionar y desplegar la versión 0.12.0.

## Entregado hasta 0.17.2 — Clases, administración e interfaz

- Ingreso por código de 12 caracteres sin correo ni cuenta individual; sesiones seguras, vencimiento y desactivación, permisos comprobados en servidor antes de contactar motores.
- Panel privado de clases con creación, estado, vencimiento y copia de códigos activos. Desde 0.17.0, copia cifrada además del HMAC; los códigos previos no son recuperables.
- Cuota de cuatro cálculos por minuto y sesión de alumno; bloqueo temporal de intentos de acceso fallidos. No sustituye pruebas de carga ni identifica personalmente a cada alumno.
- Pie compacto con clase, rol, cuenta regresiva solo para alumnos y salida; administrador sin contador. Diálogos con cierre exterior, Escape y botón; monitor sin tarjetas recortadas.
- Tipografía unificada y resumen breve en Acerca de. Documentación de alumno, administración y operación sincronizada con la wiki.
- Comprobaciones: 107 pruebas en 0.17.0, integración SQLite y recorridos locales de acceso/administración; revisión tipográfica y 18 comprobaciones relevantes en 0.17.1. Sin nuevos cálculos reales de DWSIM en esas entregas.

[Administración de clases](administracion-clases.md) · [Acceso y seguridad](acceso-clases-admin.md) · [Verificaciones](../CHECKS.md).


## Desarrollo posterior

- Grados de libertad, explicación de estados y errores de especificación.
- Comparación de modelos, rangos de validez y disponibilidad de datos binarios.
  Referencia: [Choosing a Thermodynamic Model](https://dwsim.org/tutorials/en/fundamentals/04-choosing-a-thermodynamic-model.html).
- Gibbs y luego CSTR/PFR, con parámetros cinéticos trazables, bases y unidades explícitas.
  Referencia: [Reaction Systems](https://dwsim.org/tutorials/en/intermediate/03-reaction-systems.html).
- Columnas, recirculación y convergencia, antes de procesos industriales completos.
- Costos de materias primas y servicios, inversión, flujos de fondos y sensibilidad.
  Referencia: [Techno-Economic Analysis](https://dwsim.org/tutorials/en/features/tea-techno-economic-analysis.html).
  Documentar procedencia y fecha de precios, moneda y supuestos. Verificar licencia y
  acceso de cada función antes de prometer su disponibilidad gratuita.

## Plantilla para cada guía propia

Objetivo → caso físico → datos y fuentes → modelo y supuestos → configuración en
Lemeit Sim → resultados realmente ejecutados → balances y tolerancias → preguntas
para explorar → límites y errores frecuentes → tutorial de origen y cambios de adaptación.

Una función se marca disponible al completar puertos, formulario, validación,
conversión de unidades, cálculo real, errores y un ejemplo verificado. Dibujar su icono
no equivale a validar el equipo. **Cada PR que cambia una capacidad debe revisar tanto `site/catalogo.html` como este `docs/roadmap.md`**, documentando el estado real, el ejemplo y la evidencia de pruebas.
