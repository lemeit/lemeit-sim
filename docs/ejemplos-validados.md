# Cinco ejemplos validados · ΣIM 0.5.0

Los casos 06–08 se ejecutaron posteriormente con el motor Windows en 0.7.0.
Ver [informe y alcance](validacion-windows-0.7.0.md); la comparación separada
con la API de escritorio descrita aquí corresponde a los casos 01–05.

Resultados de modelos, no mediciones experimentales. Se comparó el motor de ΣIM
con la API Automation3 de DWSIM Open Source 10.2.15.0 instalado en la PC.
Ambos comparten la familia de modelos DWSIM: esto comprueba la integración, no
constituye una validación experimental independiente de esos modelos.

| Caso | Modelo | Salida 1 · °C | Caudal salida 1 · kg/s | Calor hacia el fluido · kW |
| --- | --- | ---: | ---: | ---: |
| 01 · Mezcla adiabática de agua | Steam Tables (IAPWS-IF97) | 50.021387 | 2.000000 | 0.000000 |

## 01 · Mezcla adiabática de agua
Mezclá 1 kg/s de agua a 20 °C con 1 kg/s a 80 °C. Revisá por qué el resultado no es exactamente la media aritmética: se conserva la entalpía, no la temperatura.

- Entrada 1: 1 kg/s, 20 °C, 101.325 kPa absolutos; Water 1 kg/kg
- Entrada 2: 1 kg/s, 80 °C, 101.325 kPa absolutos; Water 1 kg/kg

[ΣIM JSON](../site/examples/mix.json) · [DWSIM DWXML](../site/examples/dwsim/mix.dwxml)
| 02 · Calentamiento de agua | Steam Tables (IAPWS-IF97) | 60.000000 | 1.000000 | 167.209679 |

## 02 · Calentamiento de agua
Calentá 1 kg/s de agua de 20 a 60 °C y consultá la potencia térmica. Se especifica temperatura de salida; DWSIM calcula el calor.

- Entrada 1: 1 kg/s, 20 °C, 101.325 kPa absolutos; Water 1 kg/kg

[ΣIM JSON](../site/examples/HeaterWater.json) · [DWSIM DWXML](../site/examples/dwsim/HeaterWater.dwxml)
| 03 · Enfriamiento de agua | Steam Tables (IAPWS-IF97) | 30.000000 | 1.000000 | -209.157884 |

## 03 · Enfriamiento de agua
Enfriá 1 kg/s de agua de 80 a 30 °C. El balance usa calor positivo hacia el fluido: aquí la potencia neta será negativa.

- Entrada 1: 1 kg/s, 80 °C, 101.325 kPa absolutos; Water 1 kg/kg

[ΣIM JSON](../site/examples/CoolerWater.json) · [DWSIM DWXML](../site/examples/dwsim/CoolerWater.dwxml)
| 04 · División de una corriente | Steam Tables (IAPWS-IF97) | 20.000000 | 0.700000 | 0.000000 |

## 04 · División de una corriente
Dividí 1 kg/s de agua: 70 % hacia la salida 1 y 30 % hacia la salida 2. Compará composición, temperatura y caudales.

- Entrada 1: 1 kg/s, 20 °C, 101.325 kPa absolutos; Water 1 kg/kg

[ΣIM JSON](../site/examples/SplitterWater.json) · [DWSIM DWXML](../site/examples/dwsim/SplitterWater.dwxml)
| 05 · Mezcla agua–etanol con NRTL | NRTL | 51.671926 | 2.000000 | 0.000000 |

## 05 · Mezcla agua–etanol con NRTL
Mezclá 1 kg/s de agua–etanol 80/20 % másico a 20 °C con 1 kg/s 30/70 % másico a 80 °C. Usá NRTL y comprobá el balance por componente; el modelo incluye mezcla no ideal.

- Entrada 1: 1 kg/s, 20 °C, 101.325 kPa absolutos; Water 0.8 kg/kg, Ethanol 0.2 kg/kg
- Entrada 2: 1 kg/s, 80 °C, 101.325 kPa absolutos; Water 0.3 kg/kg, Ethanol 0.7 kg/kg

[ΣIM JSON](../site/examples/WaterEthanol.json) · [DWSIM DWXML](../site/examples/dwsim/WaterEthanol.dwxml)

## Qué se comparó

En todas las corrientes: temperatura, presión, caudal másico, entalpía, densidad y
fracciones másicas globales y fracción molar de vapor. También potencia térmica por balance de entalpía.
Diferencia máxima observada: 0 en los números serializados comparados de los cinco casos.
Tolerancias absolutas: 1e-4 K, 0.1 Pa, 1e-8 kg/s, 1e-4 kJ/kg, 1e-3 kg/m³,
1e-8 kg/kg, 1e-7 mol/mol de vapor y 1e-4 kW para calor. No se comprobó todo el catálogo ni todo el rango de operación.

Se conservaron los residuos reales del solver en el [informe JSON](validation/examples-0.5.0.json).
Los valores |Q| menores que 1e-5 kW se presentan como cero en la tabla, no se cambian en el informe.

En la interfaz de escritorio se abrieron y recalcularon mezcla de agua y calentamiento.
Las cinco comparaciones numéricas se ejecutaron mediante la API de las bibliotecas instaladas,
cada una en un proceso separado. Los archivos DWXML se exportaron del caso de ΣIM y se
recalcularon: no se construyeron manualmente desde cero en el editor de DWSIM.

## Repetir la comparación

Requiere Python 3.11+, el motor MCP de ΣIM, DWSIM Open Source 10.2.15.0 instalado
y PowerShell sobre .NET 10 (probado con PowerShell 7.6). Usar una carpeta de salida nueva:

```powershell
python tools/validate_examples.py --engine-root .local/runtime --output .local/validation/nueva-corrida
```

El script no cambia los proyectos fuente ni los archivos del usuario; guarda referencias
en la carpeta de salida y rechaza sobrescribir una referencia existente. El informe resultante
incluye todas las propiedades comparadas y sus diferencias. No requiere MCP HTTP 5901.

### Fases en agua–etanol

A 80 °C y 101.325 kPa la entrada 30/70 % másico presenta fracción molar de vapor
0.023747420 (aproximadamente 2.375 %). La salida a 51.671926 °C es líquida. El balance
de entalpía incorpora tanto el comportamiento de mezcla no ideal como el cambio
de fase; no debe atribuirse la temperatura final únicamente al calor de mezcla.
La fracción de vapor también se comparó entre ambas rutas de cálculo.
