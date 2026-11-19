# Validación del bloque Recycle nativo de DWSIM · etapa experimental

## Propósito

Determinar si DWSIM MCP 10.2.15 permite crear, conectar, calcular y leer un bloque `Recycle` para reemplazar la iteración virtual específica del Ejemplo 17. **Esta prueba no modifica el gateway ni el portal publicado** y crea un flowsheet temporal que cierra siempre, incluso si falla.

El código fuente de `DWSIM.MCPServer/Tools/UnitOps/UnitOpTools.cs` incluye `Recycle` en `UnitOpFactory` y admite `dwsim_unitop_add(type='Recycle')`. Eso confirma la interfaz declarada, pero no su convergencia en nuestros dos entornos.

## Ejecutar

Desde el repositorio en Windows (DWSIM MCP en `.local/runtime/server/dwsim-mcp.exe`):

```powershell
cd C:\GitHub\lemeit-sim
python -m unittest test_native_recycle_probe -v
python tools/probe_recycle_native.py --engine windows
```

Desde Debian, utilizar la ruta **local ya configurada** al token MCP; no pegar ni subir su contenido a GitHub:

```bash
cd ~/lemeit-sim
python3 -m unittest test_native_recycle_probe -v
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

También informa residuos de mezclador, divisor, recirculación y balance global. `reference_match` requiere residuos menores a 1e-5 kg/s. **Un resultado de pruebas unitarias `OK` no demuestra que DWSIM haya convergido**: solo valida el protocolo con un motor ficticio.

## Criterios antes de integrar al gateway

1. Confirmar que `dwsim_unitop_add(type='Recycle')` y las conexiones de RC1 funcionan con el binario MCP instalado en Windows y Debian.
2. Confirmar el cálculo con `dwsim_solve_run`, `dwsim_stream_get_results` y `dwsim_unitop_get_results`; registrar errores reales de puertos, propiedades o solver.
3. Comprobar balance de materia y conservación de condiciones térmicas; contrastar ambos motores y el Ejemplo 17 actual.
4. Solo con pruebas físicas exitosas diseñar la transformación genérica del grafo del usuario a lazos con Recycle nativo. No retirar el algoritmo viejo ni anunciar una capacidad general antes de validar.

El código no registra credenciales ni configura rutas de red públicas. Evitar distribuir rutas privadas del token o trazas del motor sin revisarlas.
