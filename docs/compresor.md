# Compresor adiabático · 0.24.0

La presión de descarga se expresa en kPa absolutos y la eficiencia isentrópica
como porcentaje (0 < η ≤ 100). Se necesita una alimentación completamente vapor
y presión de salida mayor que la entrada. La potencia y temperatura son resultados,
no especificaciones adicionales. El puerto inferior admite energía opcional.

El adaptador MCP usa CalcMode=OutletPressure, ProcessPath=Adiabatic,
POut en Pa y AdiabaticEfficiency en %. Son propiedades CLR del motor;
se evita depender de las unidades de pantalla de los códigos PROP_CO_n.

El trabajo positivo hacia el gas es Ẇ = ṁ(hsalida − hentrada), sin calor externo,
energía cinética/potencial ni pérdidas mecánicas adicionales. Los balances agregan
energy_kind=shaft y conservan heat_to_fluid_kW para compatibilidad de archivos y
exportaciones existentes. Esa clave histórica representa aquí trabajo, no calor.

## Prueba real

Sonda: python tools/probe_compressor_windows.py --engine-root RUTA_PRIVADA.
Informe: docs/validation/compressor-0.24.0-windows.json. Nunca subir el runtime.
Nitrógeno puro a 25 °C, 100 kPa, 1 kg/s; PR; descarga 300 kPa:

| Eficiencia | Temperatura salida °C | Potencia kW |
| --- | --- | --- |
| 60 % | 206,986887 | 190,291488 |
| 75 % | 170,880686 | 152,233190 |
| 90 % | 146,735335 | 126,860992 |

Comprobados cálculo final, vapor de entrada, presión, masa, calentamiento,
potencia positiva, cierre de energía y tipo de balance en cada caso, además del
orden de potencia. Tolerancia de masa 1e-8 kg/s; presión 1 Pa; energía 1e-6
absoluta y relativa. No es validación experimental ni validación de otros gases.

Solo Windows fue ejecutado. El gateway Debian necesita actualizar server.py y
reiniciar su servicio antes de validar esta capacidad. El frontend comprueba
supported_equipment y explica el motivo si no está disponible.

## Referencias

- https://dwsim.org/help/api/pressure-changers/compressor.html
- https://dwsim.org/help/main/24-unit-operations.html
- Código local DWSIM 10.2.15: Compressor.vb y PropertySetter.cs; la documentación
  web puede corresponder a una revisión posterior. La evidencia de integración
  corresponde al ejecutable realmente instalado, no a ejemplos copiados.
