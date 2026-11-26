# Validación cruzada Windows–Debian · ΣIM 0.9.2

## Resultado registrado: 14/11/2026

El informe original calculado en la notebook Debian indica **10 de 10 casos aprobados**, con HTTP 200 en todos, motor DWSIM MCP 10.2.15. Se compararon las propiedades disponibles de las corrientes, potencias y cierres contra informes Windows ya versionados.

- Fecha UTC del informe: `2026-11-14T15:47:56.744774+00:00`.
- SHA-256 del archivo JSON recibido, sin normalización: `a4e8afab02a743e4131cc463ddd4ef75d1a29afa7468d3c85682cf6d4fc6bdf9`.
- Tolerancias de la corrida: temperatura 0,001 K; presión 1 Pa; caudal 1e-7 kg/s; entalpía 0,005 kJ/kg; densidad 0,05 kg/m³; fracción másica 1e-6; potencia 0,01 kW.
- Residuos reactivos de H, O y N calculados de forma independiente a partir de las composiciones del archivo: máximo 2,84e-14 mol de átomos/s para los casos 07, 08 y 10. El comparador de 0.9.2 incorpora también este control con tolerancia 1e-5 mol/s.

| Caso | Duración Debian (s) | Estado |
| --- | ---: | --- |
| 01 · Mezcla agua | 4,76 | OK |
| 02 · Calentamiento | 1,39 | OK |
| 03 · Enfriamiento | 0,82 | OK |
| 04 · División | 1,08 | OK |
| 05 · Agua–etanol | 0,88 | OK |
| 06 · Multicomponente | 0,91 | OK |
| 07 · Conversión | 1,32 | OK |
| 08 · Equilibrio | 1,16 | OK |
| 09 · Red térmica | 1,80 | OK |
| 10 · Amoníaco con bypass | 1,84 | OK |

El archivo completo se preservó por el usuario fuera de Git; se identifica por su huella SHA-256. Este resumen no sustituye el informe detallado. Las referencias están en `docs/validation/examples-0.5.0.json`, `examples-0.7.0-windows.json` y `examples-0.8.0-windows.json`.

## Repetición

```bash
cd ~/lemeit-sim
python3 -m unittest tests.python.validation.test_validate_debian_examples -v
python3 tools/validate_debian_examples.py
```

Se requiere DWSIM MCP en 127.0.0.1:5901 y el gateway local en 127.0.0.1:5910. El nuevo informe se guarda en `.local/validation/debian-0.9.2.json` (excluido de Git). No utiliza ni modifica la computadora Windows.

## Alcance y límites

Se comprobaron respuestas numéricas con el mismo motor DWSIM sobre sistemas operativos distintos. Esto **no es validación experimental** ni comprobación independiente del modelo físico, y tampoco prueba que el túnel Debian esté disponible permanentemente. El verificador no sustituye ensayos de concurrencia con múltiples alumnos. La comparación del informe recibido se efectuó antes de añadir el control atómico automático; los residuos atómicos informados se calcularon posteriormente a partir de esos mismos datos.
