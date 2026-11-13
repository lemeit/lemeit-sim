# Sistemas de unidades y calculadora · ΣIM 0.9.0

## Configuración del proyecto

Herramientas → Configuración permite elegir **Ingeniería**, **SI** o **Anglosajón**.
Los sistemas se aplican a entradas, temperaturas de equipos, diagramas, tablas y
balances. No reinterpretan valores físicos: el JSON conserva °C, kPa, kg/s, mol/s,
kJ/kg y kJ/(kg·K) como valores canónicos de la integración. `unit_system` registra
la presentación del proyecto; `units` permite ajustes particulares por objeto.
Los archivos anteriores sin sistema conservan compatibilidad.

| Magnitud | Ingeniería | SI | Anglosajón |
| --- | --- | --- | --- |
| Temperatura | °C | K | °F |
| Presión absoluta | kPa | Pa | psi (psia) |
| Caudal másico | kg/s | kg/s | lb/h |
| Caudal molar | mol/s | mol/s | lbmol/h |
| Entalpía | kJ/kg | J/kg | Btu/lb |
| Entropía | kJ/(kg·K) | J/(kg·K) | Btu/(lb·°R) |
| Densidad | kg/m³ | kg/m³ | lb/ft³ |
| Caudal volumétrico | m³/s | m³/s | ft³/min |
| Potencia | kW | W | Btu/h |

Al aplicar otro sistema se reemplazan los ajustes particulares de los campos;
luego pueden elegirse unidades individuales. CSV y Excel conservan las unidades
canónicas que sus cabeceras indican, para mantener comparabilidad de los datos.
La tabla agrega caudal molar; las propiedades de fase siguen procediendo de DWSIM.

## Herramienta independiente

Herramientas → Calculadora de unidades y composición no envía datos al motor ni
modifica el proyecto. Convierte 31 familias: siete magnitudes base SI y magnitudes
de proceso (presión, caudales, densidad, energía, potencia, entalpía, entropía,
concentraciones, viscosidades, transferencia térmica y velocidad de reacción).

Se distinguen temperatura absoluta y diferencia de temperatura; galón US e
imperial; caloría termoquímica, Btu IT y hp mecánico. No se convierten dimensiones
incompatibles sin la información física necesaria. La presión manométrica requiere
una presión atmosférica explícita: Pabs = Pg + Patm. El motor recibe siempre presión
absoluta; el selector psi de las corrientes significa psia, no psig.

## Composición, caudales y gases

Se ingresan nombres, masas molares y fracciones o porcentajes. Las fracciones deben
sumar 1 dentro de tolerancia 10⁻⁶ (o 100 %). Solo se corrige la desviación numérica
aceptada; datos incompletos no se normalizan. El formato porcentaje conserva la
mezcla existente. La base de entrada de la calculadora indica cómo interpretar
los datos; siempre se muestran simultáneamente las dos bases resultantes.

- wᵢ = yᵢ Mᵢ / Σ(yⱼ Mⱼ).
- yᵢ = (wᵢ/Mᵢ) / Σ(wⱼ/Mⱼ).
- Mmezcla = Σ(yᵢ Mᵢ) = 1/Σ(wᵢ/Mᵢ).
- ṅ [mol/s] = 1000 ṁ [kg/s] / Mmezcla [g/mol].

Los cambios de base en el inspector convierten los valores, conservando la mezcla
o caudal. Si falta una masa molar o la composición no es válida, se conserva la
base original y se muestra el problema. Las conversiones de base invalidan el
resultado previo para recalcular con el motor; cambiar solo unidades no lo invalida.

El catálogo estático `site/compound-masses.json` contiene **1601 masas molares reales**
y una lista explícita de **19 no disponibles** entre 1620 nombres del catálogo.
Se exportó desde ConstantProperties.Molar_Weight de DWSIM MCP 10.2.15 en Windows.
No se completaron masas artificialmente. Los valores manuales de la calculadora se
identifican como tales y no modifican la base del motor.

Para una sola fase gaseosa, pᵢ = yᵢ P absoluta. Esto no equivale a la fugacidad
φᵢ yᵢ P. Opcionalmente se estima Cᵢ = pᵢ/(RT) como gas ideal; la herramienta no
comprueba equilibrio de fases ni sustituye el paquete termodinámico. En Resultados
del inspector las presiones parciales usan exclusivamente la composición de la fase
vapor, no la composición global de una corriente bifásica.

## Trazabilidad y repetición

```powershell
python tools/export_molar_masses.py --engine-root .local/runtime --output .local/validation/masas-repeticion.json
```

El exportador lee compuestos en lotes mediante procesos aislados. Registra lo que
no puede obtener; no expone claves ni modifica el servicio Windows o Debian.
`deploy/test-unit-tools.mjs` contrasta definiciones SI/anglosajonas, ida/vuelta,
temperaturas, presiones relativas, composición y gases. Las pruebas del catálogo
verifican finitud, cobertura y valores exportados de compuestos de referencia.

## Navegación y próximas etapas

La guía abre dentro del simulador: **Volver al simulador** cierra esa vista y
conserva el proyecto y sus resultados. También puede abrirse directamente en
`/ejemplos.html`, con índice, búsqueda, plegado y anterior/siguiente.
[Adaptación por etapas](../site/adaptacion.html) distingue capacidad disponible de
trabajo pendiente. CSTR/PFR cinéticos, perfiles y transitorios aún no están habilitados.
