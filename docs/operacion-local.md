# Operación local de ΣIM · Windows

La configuración Debian se documenta [por separado](seleccion-manual-motores.md).
Los scripts de esta página solo administran Windows.

## Ubicación del motor

Runtime predeterminado: `C:\GitHub\lemeit-sim\.local\runtime`. Contiene
`server/dwsim-mcp.exe`, dependencias, credenciales y registros. Está excluido de Git.
Puede elegirse otra carpeta con `-EngineRoot`; el código y los binarios no tienen
que estar en repositorios distintos.

## Arranque y apagado

```powershell
cd C:\GitHub\lemeit-sim
.\start-online.ps1
# Comprobar qué se detendría, sin apagar:
.\stop-online.ps1 -WhatIf
# Apagar:
.\stop-online.ps1
```

El arranque reutiliza gateway y túnel del mismo runtime para evitar duplicados.
No hace falta abrir DWSIM de escritorio.

## Inicio automático opcional · 0.7.1

Ejecutar `.\enable-autostart.ps1` una vez desde el repositorio. Instala el acceso
`Lemeit-SIM-Windows.lnk` en Inicio del usuario actual. Al iniciar sesión espera
15 segundos e inicia o reutiliza gateway y túnel sin abrir ventanas; comprueba
el catálogo local y reintenta hasta cuatro veces si el gateway no responde.
Usa PowerShell incluido en Windows y la ruta de Python detectada al instalar.
No configura un servicio antes del inicio de sesión ni requiere guardar contraseñas.
La política de ejecución existente permanece intacta.

El lanzador se copia a `.local/runtime/start-at-login.ps1` para conservarlo al
cambiar de rama. Sigue necesitando `server.py` y `start-online.ps1` en el repositorio.
Los intentos quedan en `.local/runtime/startup.log`. La comprobación local no
confirma la conexión pública: revisar también el monitor del portal.

Para desactivar: `.\disable-autostart.ps1`. Esto elimina únicamente ese acceso
directo; para detener lo que ya está corriendo, ejecutar `.\stop-online.ps1`.
Si se mueve el repositorio o cambia Python, repetir `enable-autostart.ps1`.
No afecta Debian ni la vista de desarrollo 5910.

| Servicio | Puerto | Cómo se administra |
| --- | --- | --- |
| Gateway online y túnel Windows | 5911 | `start-online.ps1` / `stop-online.ps1` |
| Vista local de desarrollo | 5910 | `start-local.ps1` / Ctrl+C en su consola |
| MCP HTTP opcional | 5901 | Scripts del paquete MCP, independiente del gateway Windows |

El gateway Windows inicia un proceso DWSIM aislado por cálculo. No necesita MCP
HTTP 5901. `verify-server.py` comprueba ese MCP opcional; no arranca el gateway.
Por eso `stop-server.ps1` no apaga el servicio online de ΣIM.

El apagado online detecta gateways del mismo runtime y su túnel aunque se hayan
iniciado desde otra copia del código. No detiene vistas locales independientes,
el MCP opcional ni el motor Debian.

## Estado y registros

En el portal seleccionar Windows y abrir el monitor de conexión. HTTP 200 del
catálogo significa API accesible; una corrida tiene su propio evento de cálculo.
Los registros privados del gateway y del túnel quedan en `.local/runtime`.
No publicar registros sin revisar ni compartir archivos de claves.

La interfaz publicada permanece accesible aunque la PC esté apagada. Para calcular
se necesita gateway y túnel activos. El despliegue web no actualiza automáticamente
el backend de la PC: después de actualizar `server.py`, reiniciar su servicio.
