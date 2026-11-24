# Interpretación de balances energéticos en intercambiadores (ΣIM)

Revisión: 24/11/2026 · corrección 0.47.5 propuesta (aún no publicada).

## Qué significa cada magnitud

Un intercambiador de dos circuitos intercambia energía **entre corrientes**. Si no recibe ni pierde calor hacia el entorno y no consume trabajo, la suma de los cambios de flujo de entalpía de sus dos lados se aproxima a cero, aunque cada transferencia individual sea importante.

Para cada circuito `i`:

`ΔH_i = ṁ_s h_s − ṁ_e h_e` (kW), con `ṁ` en kg/s y `h` en kJ/kg.

- **Potencia térmica cedida**: magnitud positiva de los cambios de entalpía negativos de los circuitos (el lado que se enfría).
- **Potencia térmica recibida**: magnitud positiva de los cambios de entalpía positivos (el lado que se calienta).
- **Potencia intercambiada aproximada**: promedio aritmético de las magnitudes cedida y recibida; es una estimación de presentación, no una propiedad adicional devuelta por DWSIM.
- **Residuo del balance entre circuitos**: suma algebraica de los `ΔH_i` (kW). El cierre debe contrastarse con la tolerancia indicada.
- **Energía neta al fluido**: valor conservado del balance entregado por el gateway; en un intercambiador **no equivale** a la potencia de intercambio entre los dos circuitos. No se debe interpretar automáticamente como calor externo medido.

Las potencias de cada lado se derivan de las propiedades que devuelve DWSIM para las cuatro corrientes, no de un segundo cálculo del motor. Si faltan corrientes, conexiones por puertos, caudal o entalpía, las columnas suplementarias quedan vacías (no se inventan ceros ni datos).

## Ejemplo 13 (referencia histórica; no es una medición)

Agua IAPWS-IF97, dos alimentaciones de 1 kg/s:

| Magnitud | Referencia aproximada |
| --- | ---: |
| Entrada y salida caliente | 80 °C → 70,4566 °C |
| Entrada y salida fría | 20 °C → 29,5658 °C |
| Cedida por circuito caliente | 40,00000037 kW |
| Recibida por circuito frío | 40,00000004 kW |
| Diferencia algebraica | ≈ −0,00000033 kW |
| Transferencia interna representativa | ≈ 40 kW |

El signo del residuo depende de la convención de resta. Debe informarse siempre el orden de operación. Un residuo cercano a cero no significa transferencia de calor cero.

## Aparición en ΣIM

- **Balances en pantalla**: se muestran las cuatro magnitudes calculadas al disponer de los dos lados.
- **Explorar proceso**: presenta la ecuación usada, los valores y una nota sobre la diferencia entre intercambio interno y balance neto.
- **CSV, Excel y tablas de reportes PDF**: añaden columnas suplementarias solo con valores numéricos válidos; los datos del gateway se preservan sin reemplazarlos.
- **Otros equipos**: su energía sigue informándose según el tipo de transferencia, sin deducir por analogía potencias inexistentes.

## Verificación requerida antes de publicar

1. Ejecutar las pruebas automatizadas de exportación, Node y compilación.
2. Confirmar visualmente que las tablas del PDF mantienen márgenes legibles con columnas adicionales.
3. Comparar los resultados del Ejemplo 13 Windows y Debian con la referencia histórica.
4. Comprobar que en un intercambiador sin cuatro corrientes válidas aparezcan datos no disponibles, no cifras inventadas.

## Referencias internas

- [Guía de motores](seleccion-manual-motores.md)
- [Hoja de ruta](roadmap.md)
- [Historial](CHANGELOG.md)
