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
El servidor y el editor propios están en apps/procesos/; no se modificó el motor.
Este proyecto es una integración pedagógica independiente y no una edición oficial de DWSIM.

## Lemeit Design

Estilos y utilidades originales: https://github.com/lemeit/lemeit-design
Copias locales: vendor/lemeit-theme.css y vendor/lemeit-common.js.
Licencia MIT, declarada en el README original conservado como LEMEIT-README.md.
Los tokens y el cambio de tema se utilizan sin modificaciones.
El CSS de la aplicación se agrega en style.css.

La tipografía JetBrains Mono se solicita mediante el CSS original a Google Fonts;
si no hay conexión se utiliza la pila local de tipografías monoespaciadas.

## Datos y modelos

Los compuestos y modelos se consultan al motor local. No se reemplazan propiedades
por valores ficticios. IAPWS-IF97 se restringe en esta interfaz a agua pura.
La disponibilidad de otro modelo no implica que sea adecuado para cualquier mezcla.
Los ejemplos son cálculos de modelos, no mediciones experimentales.

Pie, marca tipográfica y control de tema: adaptación del sitio propio https://tex.lemeit.ar/ (lemeit/aboutme, apps/tex/site). No se reutiliza el logotipo TeX como identidad del simulador.
