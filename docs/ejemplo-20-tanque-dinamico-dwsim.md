# Ejemplo 20 · Llenado dinámico de un tanque con DWSIM

**Complemento del Ejemplo 15** (tanque estacionario y tiempo de residencia).
**Estado: integración experimental; falta una corrida real validada en los gateways Debian y Windows.**

## Objetivo

Pasar de un balance estacionario (entrada = salida) al balance integral de masa con acumulación en un tanque abierto. Medir nivel, volumen y caudal de descarga a lo largo del tiempo mediante el **integrador temporal DWSIM**. No confundir con el modelo didáctico simplificado de ΣIM.

## Proceso

Alimentación de agua → válvula V-01 → tanque T-01 → válvula V-02 → salida atmosférica.

| Parámetro | Valor |
|---|---:|
| Sustancia y modelo | Water · Steam Tables (IAPWS-IF97) |
| Alimentación | 25 °C, 130 kPa, 10 kg/s |
| V-01 | Kv 100; apertura 50 %; coeficiente fijo |
| T-01 | Volumen 2 m³; altura 2 m |
| V-02 | Kv 400; apertura 50 %; característica lineal |
| Descarga | 101,325 kPa |
| Integración | Paso de 5 s; duración de 600 s |

El Ejemplo 20 almacena el **diagrama de referencia**. El módulo DWSIM crea su propio flowsheet temporal de prueba, con sus valores explícitos, en una sesión de MCP que se cierra al terminar. No resuelve dinámicamente cualquier PFD arbitrario.

## Cómo probarlo

1. Verificar que ambos servicios (gateway ΣIM y DWSIM MCP) estén activos.
2. Elegir manualmente **Debian** o **Windows** como motor de cálculo.
3. Abrir **Ejemplo 20** en el catálogo; seleccionar **T-01**.
4. En Propiedades, abrir **Dinámica del tanque · nivel y curvas**.
5. Verificar que la opción **DWSIM real (experimental)** aparezca habilitada después de consultar las capacidades del gateway seleccionado.
6. Elegir DWSIM real, revisar sus parámetros y ejecutar.
7. Explorar el nivel y volumen en función del tiempo y los caudales de entrada/salida. Exportar CSV.
8. Si DWSIM informa un error, leerlo: **el programa no sustituye los resultados por la integración didáctica**.

## Control físico

El balance acumulativo es `m(t)-m(0)=∫₀ᵗ(ṁ_e-ṁ_s)dt`. En la referencia oficial, a 1 min el nivel es alrededor de 0,23 m; a 2 min, 0,30 m; a 10 min, 0,333 m; el caudal de descarga se aproxima a 10 kg/s. Son valores **de la guía oficial**, no resultados medidos todavía desde los gateways de ΣIM.

La curva del **nivel** y el **caudal de salida** debe provenir de DWSIM. El volumen se obtiene a partir del nivel calculado y el área transversal supuesta `A=V_total/h_total`. La conversión aproximada de caudal másico a volumétrico usa 997 kg/m³ hasta integrar la densidad dinámica de DWSIM.

DWSIM puede permitir sobrepasar la altura del tanque sin producir un rebalse real: si el nivel sobrepasa la capacidad, se debe señalar al alumno y no interpretar como una operación segura.

## Estado de validación

- [x] Especificación del ejemplo y parámetros de integración
- [x] Puente al MCP: setup, monitor, check, run, status y series
- [x] Diferenciación explícita entre curva DWSIM y curva didáctica
- [x] Test unitario del puente y prueba de navegador con MCP simulado
- [ ] Corrida DWSIM real en Debian
- [ ] Corrida DWSIM real en Windows
- [ ] Comparación con la tabla de referencia y revisión de posibles incompatibilidades MCP
- [ ] Publicación al portal de producción

## Diagnóstico Debian sin revelar el token

Desde la rama que contiene la integración:

```bash
cd ~/lemeit-sim
python3 tools/probe_dynamic_tank.py
# Solo cuando la lista indique todas las herramientas necesarias:
python3 tools/probe_dynamic_tank.py --run
```

El comando lee el token de `~/.config/lemeit-sim/mcp-token`, no lo imprime y comunica únicamente las magnitudes de la corrida.

Referencias:
- https://dwsim.org/tutorials/en/dynamics/01-from-steady-state-to-dynamic.html
- https://dwsim.org/help/fluent/api/dynamics.html
- https://dwsim.org/help/api/mixing-separation/tank.html
