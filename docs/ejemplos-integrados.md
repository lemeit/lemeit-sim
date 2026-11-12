# Ejercicios integrados 09 y 10 · ΣIM 0.8.0

La guía del portal reúne los diez ejercicios 01–10 con resoluciones numeradas paso a paso. Esta entrega incorpora dos casos integrados:

- [09 · Red térmica ternaria](https://sim.lemeit.ar/ejemplos.html#ThermalNetwork): datos, mezcla y división, potencias, recombinación, cierre global y actividades.
- [10 · Amoníaco con bypass](https://sim.lemeit.ar/ejemplos.html#AmmoniaBypass): datos, reparto, precalentamiento, extensión/conversión, calor de reacción, enfriamiento, dilución y conservación elemental.

Hasta publicar 0.8.0, abrir la guía local `http://localhost:5910/ejemplos.html`.
Los enlaces online de estos casos aparecerán después del despliegue aprobado.
Los archivos JSON están en `site/examples/ThermalNetwork.json` y
`site/examples/AmmoniaBypass.json`. No se agregaron nuevos equipos ni ecuaciones.
La vista se ajusta al abrir un ejemplo; también puede ampliarse con Solo diagrama.

## Validación Windows

[Informe completo](validation/examples-0.8.0-windows.json), calculado el 12/11/2026
mediante procesos aislados del runtime Windows DWSIM MCP 10.2.15. No se usó Debian.
No constituye comparación independiente con Automation3 ni validación experimental.
Las condiciones son ejercicios propios, no datos de una planta industrial.

| Caso | Resultado | Comprobación |
| --- | --- | --- |
| 09 · NRTL | P1: 2 kg/s, 51,158773 °C; Q neto: +150,936145 kW | Materia por especie: 10⁻⁸ kg/s; energía global: 10⁻⁴ kW |
| 10 · PR | NH₃: 0,339948981 kg/s; P1: 69,240653 °C; conversión N₂ en R1: 42,496051 % | Masa: 10⁻⁸ kg/s; átomos N/H: 10⁻⁵ mol/s |

La composición y las temperaturas no deben obtenerse promediando temperaturas.
Para el caso 10 las especies reaccionan: se comprueban átomos. La potencia del
reactor se lee de DeltaQ e incluye reacción; no se compara un balance reactivo
con entalpías sensibles solamente. El enfriador no es un separador de fases.

## Repetir la ejecución

Desde la raíz del repositorio, con el runtime Windows instalado:

```powershell
python tools/validate_integrated_examples.py --engine-root .local/runtime --output .local/validation/0.8.0/repeticion.json
```

No requiere iniciar MCP HTTP 5901 ni modificar el motor público. Ejecuta ambos
casos, verifica las condiciones y balances y guarda el informe solo si ambos pasan.
El archivo incluye una huella SHA-256 de las entradas utilizadas, resultados sin
redondear, tolerancias y método. Las pruebas de la web verifican además menú,
topología y cierres algebraicos con las corrientes del informe de referencia.

## Referencias de progresión

El [curso de CAChemE sobre COCO/ChemSep](https://www.cacheme.org/curso-simulacion-procesos-quimicos-coco-simulator/)
se incorpora como referencia para etapas posteriores (flash, equilibrio de fases,
destilación y reacción). Los casos 09–10 son ejercicios propios, no una reproducción
de ese curso ni una comparación numérica entre COCO y DWSIM.
