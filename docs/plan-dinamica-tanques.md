# Módulo propuesto: simulación dinámica de llenado y vaciado de un tanque

Estado: **prototipo didáctico implementado en ΣIM 0.48.0** con balance transitorio de masa a densidad constante; **puente MCP experimental desarrollado en 0.48.1, corrida real verificada en Debian, pendiente de validación Windows**. El equipo `Tank` actual de ΣIM usa el cálculo estacionario de DWSIM para presión, estado de salida y tiempo de residencia `V / Q`; el Ejemplo 15 **no** calcula la evolución temporal.

## 1. Modelo físico mínimo

Para tanque no presurizado con líquido incompresible:
- Balance integral de masa: `m(t)-m(0)=∫₀ᵗ [ṁ_in(τ)-ṁ_out(τ)]dτ`.
- Si `ρ` es constante: `V_L(t)=V_L(0)+∫₀ᵗ[Q_in(τ)-Q_out(τ)]dτ`, con `Q=ṁ/ρ`.
- Tanque cilíndrico vertical: `h(t)=V_L(t)/A` y porcentaje de llenado `100 V_L/V_total`.
- Caso didáctico de caudales constantes: `V_L=V_0+(Q_in-Q_out)t` hasta el primer evento (vacío o lleno).
- Caso con descarga por gravedad: `Q_out=C_d A_o√(2gh)` para líquido libre, apertura constante y pérdidas agrupadas en `C_d`. Requiere condiciones de descarga válidas; no aplicar sin ellas.
- Para líquidos variables, mezclas, efectos térmicos o presión interna: resolver balances de masa, componentes y energía, usar propiedades de DWSIM y condiciones dinámicas del tanque; no suponer densidad ni temperatura constantes.

## 2. Requisitos de interfaz

Panel “Dinámica” diferenciado del botón “Calcular” estacionario: elegir volumen/altura/área, nivel inicial, caudales o condiciones de borde, duración y paso temporal; validar unidades, masas y límites. Incluir estados **detenido / ejecutando / pausado / terminado / error**.

Resultados como curvas interactivas `h(t)`, `V(t)`, `m(t)`, `Q_in(t)`, `Q_out(t)` y temperatura/presión si el modelo lo permite. Permitir lectura de cursor, descarga CSV de series temporales y captura opcional para reporte PDF del diagrama. Las curvas del explorador estacionario no deben confundirse con resultados dinámicos.

## 3. Arquitectura y etapas

1. **Prototipo didáctico explícito (implementado en 0.48.0)** con integrador matemático verificado para líquido incompresible y caudales prescritos, rotulado “modelo simplificado de ΣIM”; nunca presentarlo como corrida de DWSIM.
2. **Investigación del puente DWSIM**: inspeccionar herramientas MCP instaladas en ambos gateways, determinar si pueden crear un Dynamics Manager / Integrator, definir estados iniciales y obtener series temporales. La documentación pública de DWSIM prueba que la biblioteca tiene esta capacidad, no que nuestro MCP la exponga.
3. **Adaptador DWSIM dinámico** (prototipo experimental 0.48.1), solo después de confirmar API disponible o extender el puente con pruebas en Debian y Windows. Mantener elección manual del motor; trabajo de simulación por ejecución con estado, progreso y cancelación.
4. **Validación**: comparación con solución analítica de caudales constantes, balance integral `m(t)`, eventos de lleno/vacío; luego ejemplo DWSIM “Dynamic Simulation - Water Tank Level Control” y pruebas cruzadas de motores. Comparar resultados con tolerancias definidas.

## Gráficas científicas (0.49.0)

Renderizador SVG común integrado en el diálogo de dinámica; ver [guía de gráficas](graficas-cientificas.md). El panel autónomo, la persistencia y el análisis experimental siguen en desarrollo.

## 4. Reglas y seguridad

No equiparar `V/Q` (tiempo de residencia estacionario) a tiempo de llenado cuando hay descarga; no graficar cifras estáticas como si fueran una simulación dinámica. Detener o señalar sobrellenado y nivel negativo; controlar condiciones iniciales y avisos de cambio de modelo. Evitar tiempos reales de espera: la simulación puede calcular toda la serie rápidamente y reproducirla después a velocidad elegida.

Guía del Ejemplo 20: [docs/ejemplo-20-tanque-dinamico-dwsim.md](ejemplo-20-tanque-dinamico-dwsim.md).

Referencias DWSIM:
- https://dwsim.org/tutorials/en/dynamics/01-from-steady-state-to-dynamic.html
- https://dwsim.org/help/fluent/examples/17-dynamic-simulation.html
- https://dwsim.org/help/api/mixing-separation/tank.html
