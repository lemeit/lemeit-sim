# Tanque líquido estacionario · 0.25.0

El equipo Tank tiene una entrada y una salida de materia. Volumen útil en m³,
pérdida de presión en kPa; el motor recibe Volume en m³ y DeltaP en Pa.
IgnorePhase=False conserva el rechazo de vapor del modelo nativo.

La presión de salida es Pentrada − ΔP y debe permanecer positiva. Se conserva
masa, composición y entalpía; la temperatura puede variar levemente con la presión.
El tiempo de residencia se lee de Residence Time en segundos y se contrasta con
τ=Vρ/ṁ usando la densidad de entrada calculada por DWSIM. No es una estimación
gráfica ni una lectura del nivel de un tanque real.

No incluye acumulación, nivel, llenado/vaciado, agitación, transferencia térmica ni
separación de fases. Para flash vapor/líquido existe Separator como equipo distinto.
No admite alimentación vapor o bifásica en esta adaptación.

## Evidencia

Ejemplo 15, agua IAPWS-IF97, 25 °C, 300 kPa y 1 kg/s, volumen útil 5 m³,
pérdida 10 kPa: P salida=290 kPa, T salida=25,002215 °C,
residencia=4985,687325 s (83,094789 min), residuo de masa=0 kg/s.
A 1 m³ la residencia es 997,137465 s. A pérdida nula se conserva 300 kPa y 25 °C.
Tres ejecuciones reales Windows, ocho controles por caso y proporcionalidad de
residencia con volumen; tolerancias presión 1 Pa, masa 1e-8 kg/s,
entalpía/energía 1e-5, residencia relativa 1e-6.

Sonda: python tools/probe_tank_windows.py --engine-root RUTA_PRIVADA.
Informe: docs/validation/tank-0.25.0-windows.json. No contiene credenciales.
Debian necesita actualizar y validar su gateway. El frontend comprueba capacidad
por supported_equipment; nunca cambia de motor sin elección del usuario.

Referencia oficial: https://dwsim.org/help/api/mixing-separation/tank.html.
La documentación web puede corresponder a una versión posterior. La evidencia
corresponde al ejecutable Windows 10.2.15 instalado y su código Tank.vb.
