# Expansor adiabático · 0.26.0

Especificar presión absoluta de descarga (kPa) menor que la de entrada y eficiencia
isentrópica (0 < η ≤ 100 %). El motor calcula temperatura y potencia producida.
Alimentación completamente vapor; una entrada/salida de materia y energía de
salida opcional. No equivale a estrangulamiento por válvula.

MCP: CalcMode=OutletPressure, ProcessPath=Adiabatic, POut en Pa,
AdiabaticEfficiency en %. Propiedades CLR comprobadas con el ejecutable instalado.
Power Generated en kW se contrasta con ṁ(hentrada−hsalida). El inspector muestra
potencia producida positiva; heat_to_fluid_kW se conserva como clave histórica del
balance, con energy_kind=shaft y valor negativo hacia el gas. CSV/Excel conservan
ese signo y la identificación de trabajo de eje.

## Prueba real

Nitrógeno PR, 25 °C, 300 → 100 kPa, 1 kg/s:

| Eficiencia | Temperatura salida °C | Potencia producida kW |
| --- | --- | --- |
| 60 % | −23,483519 | 49,963460 |
| 80 % | −39,464231 | 66,617946 |
| 90 % | −47,452279 | 74,945189 |

Tres procesos aislados Windows, 24 controles físicos y orden de potencia.
Sonda: python tools/probe_expander_windows.py --engine-root RUTA_PRIVADA.
Informe: docs/validation/expander-0.26.0-windows.json. Tolerancias: presión 1 Pa,
masa 1e-8 kg/s, energía absoluta y relativa 1e-6 para la sonda.
No es validación experimental. No se incluyen curvas, politropía, diseño de máquina,
limitación por humedad de descarga, pérdidas mecánicas ni transitorios.
Debian pendiente de actualizar y validar; la interfaz comprueba supported_equipment
antes de calcular y no cambia automáticamente de motor.

Referencia: https://dwsim.org/help/api/pressure-changers/expander.html.
La web puede corresponder a una revisión posterior; se comprobó el ejecutable
Windows 10.2.15 y su código Expander.vb y PropertySetter.cs.
