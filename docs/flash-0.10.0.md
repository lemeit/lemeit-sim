# ΣIM 0.10.0 · Separador flash líquido-vapor

## Motor y método

El editor usa `Separator`; el MCP DWSIM 10.2.15 acepta el tipo **`Vessel`**. Una alimentación, salidas `0` (vapor) y `1` (líquido). Modelo NRTL, proceso adiabático en el vaso y calentador previo con salida fijada a 86,85 °C, presión 101,325 kPa.

## Evidencia Debian — 14 de noviembre de 2026

Informe de la sonda real `python3 tools/probe_flash_debian.py` proporcionado por el usuario:

| Magnitud | Resultado |
|---|---:|
| Alimentación | 1 kg/s, agua/etanol 50/50 másico |
| Calentador Q | +1055,824177 kW |
| Alimentación flash T | 86,85 °C |
| Vapor | 0,638235345 kg/s |
| Etanol en vapor | 0,660959414 kg/kg |
| Líquido | 0,361757524 kg/s |
| Etanol en líquido | 0,216002777 kg/kg |
| Residuo masa del flash | +7,131098705×10⁻⁶ kg/s |
| Calor residual flash | −0,007574 kW |
| Residuo agua | −4,579474821×10⁻⁶ kg/s |
| Residuo etanol | +1,171057353×10⁻⁵ kg/s |

Las dos fases existen y presentan composiciones diferentes: separación termodinámica confirmada por DWSIM. **No se obtuvo un cierre de masa perfecto**. En el caso ensayado, la desviación global equivale a 0,0007131 % del caudal de alimentación y la mayor desviación por especie a 0,0011711 % de ese caudal.

La sonda acepta temporalmente residuos absolutos `≤ 2×10⁻⁵ kg/s` de masa y de cada especie, mostrando el residuo en salida. Este límite procede de la evidencia numérica de **este caso**, no de una tolerancia universal para otros caudales o modelos: no aplicarlo indiscriminadamente a otros equipos. Para trabajos de ingeniería con tolerancias más estrictas se requiere investigar causa y convergencia de DWSIM.

## Pruebas

```bash
python3 -m unittest tests.python.simulation.test_flash_separator -v
npm run build:verified
python3 tools/probe_flash_debian.py
```

El motor Debian fue probado; **Windows todavía no**. El portal web no instala ni reinicia el gateway: para usar el tipo nuevo desde la interfaz pública, se requiere actualizar y reiniciar de forma controlada el servicio local `server.py` que atiende `127.0.0.1:5910`. La selección Windows/Debian permanece manual.

## Alcance y límites

El separador realiza equilibrio vapor/líquido, no división arbitraria. No hay validación experimental, dimensionamiento de recipiente, arrastre de gotas, caída de presión real ni dinámica. El Ejemplo 11 usa dos compuestos y NRTL. Las pruebas de versión 0.9.2 para ejemplos 01–10 permanecen independientes.
