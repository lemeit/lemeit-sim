# Validación Windows · 0.7.0

El 12 de noviembre de 2026 se ejecutaron los ejemplos 06, 07 y 08 con
`server.simulate` e `IsolatedEngine` del runtime Windows DWSIM MCP 10.2.15.
Cada caso utilizó un proceso aislado. No se utilizó Debian ni se alteraron motores,
credenciales o túneles. [Informe numérico](validation/examples-0.7.0-windows.json).
El informe conserva las entradas identificadas por SHA-256, las corrientes globales
y los balances devueltos por el motor. No incluye propiedades de fases ausentes,
que pueden ser indefinidas.

## Ejemplo 06

NRTL resolvió el sistema agua–etanol–acetona. Se comprobaron caudales totales y
másicos por componente con tolerancia absoluta de 10⁻⁸ kg/s:

| Corriente | Total kg/s | Agua kg/s | Etanol kg/s | Acetona kg/s | Temperatura °C |
| --- | --- | --- | --- | --- | --- |
| S1 | 2,000 | 0,830 | 0,700 | 0,470 | 25,000000 |
| P1 | 1,200 | 0,498 | 0,420 | 0,282 | 25,000000 |
| P2 | 1,300 | 0,382 | 0,430 | 0,488 | 25,000036 |

Entradas y productos suman 2,5 kg/s. Los residuos de masa total por equipo fueron
cero; los de componente, menores que 10⁻⁸ kg/s. El balance de entalpía calculado
para M1 presenta un residuo de −0,000156769 kW; no se interpreta como calor impuesto
al mezclador adiabático ni se oculta como cero exacto.

## Reactores 07 y 08

| Caso | Vapor kg/s | Temperatura °C | Fracción másica de producto | Calor hacia el fluido kW |
| --- | --- | --- | --- | --- |
| 07 · Conversión | 1,000000 | 500 | Agua: 0,500007399250 | −6836,902074 |
| 08 · Equilibrio | 1,000000 | 500 | Amoníaco: 0,311687291752 | −999,736216 |

Se conserva la masa total. En reacciones los balances por especie incluyen consumo
y generación, por lo que sus diferencias no deben exigirse nulas. La salida líquida
del 07 fue −2,22×10⁻¹⁶ kg/s, numéricamente nula por redondeo; la del 08 fue cero.
Las temperaturas de 500 °C son especificaciones de estos reactores. El calor negativo
representa extracción para mantenerlas.

## Alcance

Estos resultados verifican ejecución e integración con Windows y el balance de
materia analítico del caso 06. Para 06–08 no se realizó todavía una comparación
separada con Automation3 del DWSIM de escritorio ni una validación experimental.
La comparación previa con la API instalada sigue limitada a los casos 01–05.
La selección de Windows/Debian permanece manual; no hay respaldo automático.
