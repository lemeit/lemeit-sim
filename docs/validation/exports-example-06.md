# Validación de exportaciones del Ejemplo 6

Ejecución del 18/11/2026 con DWSIM MCP 10.2.15 Windows, mediante
`server.simulate` e `IsolatedEngine` sobre `site/examples/MulticomponentBalance.json`.
La captura para pruebas conserva las ocho corrientes, los balances y las fases
Mixture y Vapor del resultado. Los valores de referencia pertenecen al paquete
NRTL del ejemplo y no son mediciones experimentales.

| Corriente | Densidad [kg/m³] | Caudal molar [mol/s] |
| --- | ---: | ---: |
| F1 · Base acuosa | 941,2494715054087 | 44,919060011504634 |
| F2 · Rica en etanol | 836,9887672302929 | 15,662239342643415 |
| F3 · Rica en acetona | 810,7696304272108 | 8,777892182258512 |
| S1 · Mezcla inicial | 880,6366215889592 | 69,35919153640657 |
| P1 · Producto A | 880,6366215889592 | 41,61551492184394 |
| S2 · Ramal 40 % | 880,6366215889592 | 27,743676614562627 |
| F4 · Ajuste final | 815,1273506919057 | 11,196812659733597 |
| P2 · Producto B | 854,9664111819683 | 38,940489274296226 |

El CSV anterior separaba campos con punto y coma y escribía números con punto
decimal. Excel con configuración argentina podía interpretar el punto como
separador de millares. Con el CSV localizado, F1 se escribe
`941,2494715054087;44,919060011504634`. En el CSV internacional se escribe
`941.2494715054087,44.919060011504634`.

El MCP devuelve temperatura en K, presión absoluta en Pa, caudales en kg/s y
mol/s y propiedades de mezcla en kg/m³, kJ/kg y kJ/(kg K). En F1 devolvió
0,10764946283363493 kJ/kg y 0,0003610580675285425 kJ/(kg K). Estos valores usan
la referencia del paquete termodinámico. P2 devolvió 298,15003571985943 K
(aprox. 25,00003571985945 °C). Se conserva ese valor y se ajusta la visualización
de temperaturas en XLSX con un formato decimal y una columna más ancha.

`npm test` verifica ida y vuelta de las ocho corrientes en ambos CSV y en XLSX.
`npx playwright install chromium` y `npm run test:exports-browser` prueban las
descargas del editor, la selección, el contenido fuera de la vista y el PDF
vectorial. En Windows se puede usar Edge con `PLAYWRIGHT_CHANNEL=msedge`.

La prueba de navegador incluye un proyecto de 30 objetos, el máximo del formato
actual, con un equipo fuera de la vista. Un lector independiente abrió el XLSX
y comparó las 56 celdas numéricas con ambos CSV. Se comprobó texto extraíble y
dentro de los márgenes en PDF A4 horizontal (selección) y A3 vertical (completo),
con trazos vectoriales y tipografía incrustada.
