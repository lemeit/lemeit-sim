# Servicios locales de SIMPROX

EngineRoot es la carpeta que contiene server/dwsim-mcp.exe, archivos del motor y
configuración privada. No es el repositorio de SIMPROX. El código puede estar en
C:\GitHub\lemeit-sim y el motor en otra carpeta; no implica dos instalaciones del motor.

## Tres servicios diferentes

1. MCP HTTP (5901), administrado por los scripts del paquete dwsim-server.
   verify-server.py lo consulta; stop-server.ps1 detiene solo ese proceso.
2. Gateway de la web (5911), server.py de SIMPROX. Inicia un proceso DWSIM aislado
   por cálculo; no utiliza el MCP HTTP persistente de 5901.
3. Túnel Cloudflare, que conecta la web publicada con el gateway de esta PC.

La interfaz publicada sigue abriendo aunque el motor y el túnel estén detenidos.
El indicador muestra la API accesible, no la existencia de un DWSIM permanente.

## Arranque y apagado de la web

Desde el repositorio actualizado:

```powershell
$motor = "C:\ruta\a\dwsim-server"
.\start-online.ps1 -EngineRoot $motor
.\stop-online.ps1 -EngineRoot $motor -WhatIf
.\stop-online.ps1 -EngineRoot $motor
```

WhatIf solo muestra qué procesos se detendrían. El apagado busca todos los gateways
5911 que usan ese EngineRoot y el túnel con su token-file, incluso si fueron
arrancados desde otra copia del código. Solo termina trabajos DWSIM hijos de esos
gateways. No detiene el MCP 5901 ni otras vistas locales. El arranque reutiliza el
servicio online de ese motor si ya existe, evitando duplicados por cambiar de copia.

Una vista de desarrollo en otro puerto es otro servicio y debe detenerse por
separado. No hay inicio automático de Windows configurado por estos scripts.
