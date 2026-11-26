# Validación del bloque Recycle nativo de DWSIM · etapa experimental

## Propósito

Determinar si DWSIM MCP 10.2.15 permite crear, conectar, calcular y leer un bloque `Recycle` para reemplazar la iteración virtual específica del Ejemplo 17. **Esta prueba no modifica el gateway ni el portal publicado** y crea un flowsheet temporal que cierra siempre, incluso si falla.

El código fuente de `DWSIM.MCPServer/Tools/UnitOps/UnitOpTools.cs` incluye `Recycle` en `UnitOpFactory` y admite `dwsim_unitop_add(type='Recycle')`. Eso confirma la interfaz declarada, pero no su convergencia en nuestros dos entornos.

## Ejecutar

Desde el repositorio en Windows (DWSIM MCP en `.local/runtime/server/dwsim-mcp.exe`):

```powershell
cd C:\GitHub\lemeit-sim
python -m unittest tests.python.validation.test_native_recycle_probe -v
python tools/probe_recycle_native.py --engine windows
```

Desde Debian, utilizar la ruta **local ya configurada** al token MCP; no pegar ni subir su contenido a GitHub:

```bash
cd ~/lemeit-sim
python3 -m unittest tests.python.validation.test_native_recycle_probe -v
python3 tools/probe_recycle_native.py --engine debian --token-file "$HOME/.config/lemeit-sim/mcp-token"
```

Si la ubicación del token es distinta, cambiar solo la ruta. No es necesario detener el gateway web. Evitar ejecutar el probe en paralelo con otra simulación desde el portal porque el MCP Debian es compartido.

## Topología que prueba

- `F1 -> Mixer M1 -> F2 -> Splitter D1 -> P1`
- `Splitter D1 -> R1 -> Recycle RC1 -> R2 -> Mixer M1`
- Agua, IAPWS-IF97, alimentación a 25 °C y 101,325 kPa, 1 kg/s, divisor 60 % producto / 40 % retorno.

DWSIM debe calcular por sí mismo los cinco caudales. El script recién después contrasta con el balance analítico:

| Corriente | kg/s |
|---|---:|
| F1 | 1 |
| F2 | 1,6666667 |
| P1 | 1 |
| R1 | 0,6666667 |
| R2 | 0,6666667 |

También informa residuos de mezclador, divisor, recirculación y balance global. La convergencia de DWSIM (`solver_ok`, `recycle_calculated`) es independiente de la comprobación de masa analítica (`reference_match`). Esta última utiliza una **tolerancia externa explícita** de 5e-5 kg/s (configurable con `--mass-tolerance`). No cambia la tolerancia interna de convergencia de DWSIM y no redondea resultados.

### Primer ensayo físico Windows · 18/11/2026

Se ejecutó el bloque nativo en el MCP Windows 10.2.15: `solver_ok=true`, `recycle_calculated=true`, sin error reportado. Se obtuvieron `F1=1`, `F2=1.6667016192`, `P1=1.00002097152`, `R1=R2=0.66668064768` kg/s. El máximo desvío frente a la solución analítica fue **3.4953e-5 kg/s** y el máximo residuo de balance **2.0972e-5 kg/s**. Esos residuos superaron el primer umbral experimental de 1e-5, pero están dentro del umbral externo documentado de 5e-5. Es precisión aproximada, no cierre matemático exacto ni validación térmica. Deben revisarse las tolerancias internas del bloque Recycle antes de una integración general.

Para repetir con el criterio original estricto: `python tools/probe_recycle_native.py --engine windows --mass-tolerance 1e-5`. Se espera `reference_match=false` para los valores observados aunque `solver_ok=true`.

**Un resultado de pruebas unitarias `OK` no demuestra que DWSIM haya convergido**: solo valida el protocolo con un motor ficticio.

## Criterios antes de integrar al gateway

1. Confirmar que `dwsim_unitop_add(type='Recycle')` y las conexiones de RC1 funcionan con el binario MCP instalado en Windows y Debian.
2. Confirmar el cálculo con `dwsim_solve_run`, `dwsim_stream_get_results` y `dwsim_unitop_get_results`; registrar errores reales de puertos, propiedades o solver.
3. Comprobar balance de materia y conservación de condiciones térmicas; contrastar ambos motores y el Ejemplo 17 actual.
4. Solo con pruebas físicas exitosas diseñar la transformación genérica del grafo del usuario a lazos con Recycle nativo. No retirar el algoritmo viejo ni anunciar una capacidad general antes de validar.

El código no registra credenciales ni configura rutas de red públicas. Evitar distribuir rutas privadas del token o trazas del motor sin revisarlas.
