[CmdletBinding(SupportsShouldProcess=$true)]
param([Parameter(Mandatory=$true)][string]$EngineRoot)
$ErrorActionPreference = 'Stop'
$runtime = (Resolve-Path -LiteralPath $EngineRoot).Path
. (Join-Path $PSScriptRoot 'online-processes.ps1')
$targets = @(Find-SimproxOnlineProcess $runtime)
$gatewayIds = @($targets | Where-Object Kind -eq 'gateway' | ForEach-Object { $_.Process.ProcessId })
# Terminar solamente los trabajos DWSIM hijos de los gateways encontrados.
foreach ($child in Get-CimInstance Win32_Process -Filter "Name = 'dwsim-mcp.exe'") {
    if ($child.ParentProcessId -in $gatewayIds -and $child.ExecutablePath -eq [IO.Path]::GetFullPath((Join-Path $runtime 'server/dwsim-mcp.exe'))) {
        if ($PSCmdlet.ShouldProcess("Trabajo DWSIM (PID $($child.ProcessId))",'Detener')) { Stop-Process -Id $child.ProcessId -ErrorAction SilentlyContinue }
    }
}
foreach ($target in $targets) {
    $idToStop = $target.Process.ProcessId
    if ($PSCmdlet.ShouldProcess("SIMPROX $($target.Kind) (PID $idToStop)",'Detener')) { Stop-Process -Id $idToStop -ErrorAction SilentlyContinue }
}
if ($WhatIfPreference) { Write-Output "Vista previa: $($targets.Count) procesos del servicio online encontrados. No se detuvo ninguno." }
elseif (!$targets.Count) { Write-Output 'No se encontraron gateways ni túneles online de esta instalación.' }
else { Write-Output 'Cálculo remoto detenido. La interfaz alojada en Cloudflare sigue disponible. El MCP 5901 se administra por separado.' }
