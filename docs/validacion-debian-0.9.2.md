# Validación Debian de los diez ejercicios · preparación 0.9.2

Esta etapa compara las respuestas del **gateway local de Debian** con las referencias
Windows ya registradas, sin editar el motor DWSIM, cambiar túneles ni publicar.
El código del portal sigue en **0.9.1** hasta terminar y aprobar las pruebas.

## Estado conocido al 14/11/2026

El usuario ejecutó directamente los casos 06–10 con DWSIM MCP 10.2.15 en Debian:
todos devolvieron HTTP 200 y cerraron el balance de masa total. Se compararon
composiciones, temperaturas y potencias principales con los informes Windows.
La reacción de equilibrio del 08 mostró diferencias de ~5,6×10⁻⁸ en fracción
másica de NH₃ y ~0,000182 kW en potencia de reacción.

**Estos resultados fueron comunicados en el chat y NO están reproducidos en un
archivo de evidencia firmado o ejecutado por CI.** No se atribuye validación
de los casos 01–05 a Debian antes de ejecutar el verificador completo.

## Ejecutar en la notebook

Con Debian encendida y sus servicios DWSIM MCP (5901) y gateway (5910)
efectivamente activos:

```bash
cd ~/lemeit-sim
git fetch origin
git switch --track origin/feature/validacion-debian-092

python3 -m unittest test_validate_debian_examples -v
python3 tools/validate_debian_examples.py
```

Si la rama ya existe localmente, usar `git switch feature/validacion-debian-092`
y `git pull --ff-only`. No hacer `git reset --hard` ni sobrescribir cambios.

El verificador ejecuta los diez JSON secuencialmente sobre
`http://127.0.0.1:5910/api/simulate`. No usa Cloudflare ni requiere Windows.
Devuelve código distinto de cero si hay errores o diferencias mayores a las
tolerancias y guarda los **resultados completos**, errores y versiones en
`.local/validation/debian-0.9.2.json`.

El archivo de salida se deja en `.local`, excluida de Git, para revisión
antes de seleccionar qué evidencia publicar: no copiar tokens ni claves.

Para repetir solo los cinco casos básicos:

```bash
python3 tools/validate_debian_examples.py --cases mix HeaterWater CoolerWater SplitterWater WaterEthanol
```

## Referencias y campos

| Casos | Archivo Windows | Contraste |
| --- | --- | --- |
| 01–05 | `docs/validation/examples-0.5.0.json` | Temperatura, presión, caudal, entalpía, densidad, composición y potencia térmica |
| 06–08 | `docs/validation/examples-0.7.0-windows.json` | Temperatura, presión, caudal, composición, balance por especie (equipos no reactivos) y potencia |
| 09–10 | `docs/validation/examples-0.8.0-windows.json` | Mismos campos y potencias de todos los equipos |

Los valores de referencia no se modifican. Las tolerancias absolutas están
declaradas en `tools/validate_debian_examples.py` y en cada informe nuevo.
El tiempo de corrida se registra, pero no se usa como condición de aprobación.

## Límites de esta etapa

- Ambos motores usan DWSIM: comparar las salidas **no constituye validación experimental**
  ni garantiza que los modelos termodinámicos sean correctos para un caso industrial.
- El verificador comprueba cierre de masa total y por especie en equipos no reactivos.
  En reactores compara resultados y potencia, **sin tratar el cambio de especies como
  un error de masa por componente**. La conservación elemental debe agregarse como
  prueba específica antes de considerar validación química independiente de la
  referencia Windows.
- El archivo de referencia 0.5.0 contiene resultados de Automation3 y del motor
  Windows; los casos posteriores usan el motor Windows.
- El estado HTTP 200 de catálogo solo muestra disponibilidad de esa API; esta
  regresión exige una respuesta de simulación por caso.
- El verificador no determina si el túnel público de Debian está disponible.
- No se ha ejecutado desde este entorno de chat en la notebook: se requiere correrlo
  allí y revisar el informe para cerrar la etapa 0.9.2.

Siguiente etapa después de aprobar: control elemental de reacciones, registrar
reproducción Debian en el repositorio y preparar separador flash como 0.10.0.
