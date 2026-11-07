# Fuentes y licencias

## DWSIM

Motor: DWSIM 10.2.15, Daniel Wagner Oliveira de Medeiros y colaboradores.
Repositorio: https://github.com/DanWBR/dwsim10/tree/v10.2.15

Los ocho PNG de `assets/dwsim/` son copias sin modificar de
`engine/DWSIM.Drawing.SkiaSharp/Icons/` de esa versión:
material_stream.png, energy_stream.png, mixer.png, splitter.png, heater.png, cooler.png, reactor_conversion.png, reactor_equilibrium.png.
Su presentación en el editor aplica un filtro CSS de color; no se reemplaza la autoría.
Se conserva la licencia GPL en DWSIM-GPL-3.txt. Estos símbolos proceden de la
distribución abierta; no se incorporaron recursos de Patreon/Plus.

La aplicación y su integración se distribuyen bajo GPL-3.0-or-later.
El servidor y la interfaz propios están en este repositorio; no se modificó el motor.
Este proyecto es una integración pedagógica independiente y no una edición oficial de DWSIM.

## Diseño ΣIM y antecedentes

ΣIM UI (antes SIMPROX) es el sistema visual propio en desarrollo de este simulador: estética
retro tecnológica inspirada en Robotech, con negro, blanco y rojo. Los tokens y
el cambio de tema activos están en simprox-theme.css y theme-toggle.js; no cargan
lemeit-theme.css ni importan tipografías de Google Fonts. Se usan fuentes locales.

La versión inicial se apoyó en Lemeit Design:
https://github.com/lemeit/lemeit-design. Se conservan las copias históricas
vendor/lemeit-theme.css y vendor/lemeit-common.js, su licencia MIT y el README
original LEMEIT-README.md como atribución y trazabilidad. Ya no son la hoja de
estilos activa del simulador. El pie y el icono de tema proceden de la adaptación
anterior del sitio propio tex.lemeit.ar; se conserva su atribución.

La finalidad pedagógica y sin finalidad comercial describe el propósito de este
proyecto; no cambia las licencias de distribución de DWSIM ni de los componentes.

## Datos y modelos

Los compuestos y modelos se consultan al motor local. No se reemplazan propiedades
por valores ficticios. IAPWS-IF97 se restringe en esta interfaz a agua pura.
La disponibilidad de otro modelo no implica que sea adecuado para cualquier mezcla.
Los ejemplos son cálculos de modelos, no mediciones experimentales.

Pie, marca tipográfica y control de tema: adaptación del sitio propio https://tex.lemeit.ar/ (lemeit/aboutme, apps/tex/site). No se reutiliza el logotipo TeX como identidad del simulador.

Marca ΣIM: reconstrucción vectorial propia basada en la referencia del usuario, opción 02 Retro técnico. El logo activo es assets/sim-logo.svg; la bajada está convertida en curvas, sin incrustar archivos de fuente. La propuesta PNG anterior de SIMPROX queda solo como antecedente.
