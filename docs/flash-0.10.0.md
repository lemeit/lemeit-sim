# ΣIM 0.10.0 · Separador flash líquido-vapor (en desarrollo)

## Objetivo

Introducir un separador de fases con una alimentación material y dos productos:
**vapor, puerto 0**, y **líquido, puerto 1**. DWSIM 10.2.15
debe determinar el reparto por equilibrio, sin usar la fracción fija de
un `Splitter`.

Referencia de la API DWSIM:
- https://dwsim.org/help/api/mixing-separation/separator.html
- https://dwsim.org/tutorials/en/beginner/04-simple-flash-drum.html

## Primera entrega: contrato del gateway, todavía no visible

- `server.py` reconoce el tipo `Separator` y sus puertos.
- `site/examples/FlashDrum.json` contiene el borrador del Ejemplo 11.
- `test_flash_separator.py` valida conexiones y comprueba que el
  backend emite `dwsim_unitop_add(type="Separator")` hacia MCP.
- **No se habilita en el editor público:** el símbolo, la paleta, el
  inspector y los resultados visuales aún requieren integración.
- **No se afirma compatibilidad del motor:** la prueba con motor real
  debe confirmar que MCP 10.2.15 acepta el tipo `Separator`
  y las salidas en los puertos 0 y 1.

## Caso didáctico propuesto

`F1` (agua/etanol 50/50 % másico, 1 kg/s, 101,325 kPa, 26,85 °C)
→ `H1` (temperatura de salida 86,85 °C)
→ `S1` (mezcla)
→ `V1` (separator)
→ `P1` vapor + `P2` líquido.

Modelo NRTL. Temperatura elegida para intentar una alimentación bifásica,
**sin anticipar** cuánto vapor se producirá; verificar estado real de
fases, caudal, composición y potencia del calentador en Debian.

## Criterios de aceptación

1. El servidor acepta exactamente una entrada y dos salidas; rechaza puertos duplicados.
2. MCP 10.2.15 ejecuta realmente el caso y devuelve HTTP 200 o un diagnóstico localizado.
3. `m_v + m_l = m_F` dentro de 1e-7 kg/s; además cada compuesto se conserva
   dentro de 1e-7 kg/s (sin reacción).
4. Ambas corrientes existen. Para enseñar separación real de dos fases
   se requiere caudal significativamente positivo en ambas; si no se cumple,
   **ajustar condiciones, no inventar resultados**.
5. Etanol y agua en vapor y líquido tienen composiciones calculadas
   distintas si el sistema está bifásico.
6. Se valida en Debian y, cuando sea posible, en Windows, sin
   seleccionar automáticamente el motor alternativo.
7. El símbolo, menú, puertos y exportaciones funcionan en el editor;
   pruebas del DOM y contrato del backend sin regresión 01–10.
8. Actualizar guía, Acerca de, changelog y número de versión **solo
   antes de publicar**.

## Próximo paso técnico en notebook Debian

Sobre una rama de trabajo separada, ejecutar únicamente las pruebas
sin motor:

```bash
python3 -m unittest test_flash_separator -v
```

Luego se requiere una prueba de integración controlada con el motor real.
No reiniciar servicios de producción ni desplegar esta rama mientras
el tipo y los puertos MCP no estén comprobados.
