param([Parameter(Mandatory=$true)][string]$EngineRoot)
$ErrorActionPreference = 'Stop'
$runtime = (Resolve-Path -LiteralPath $EngineRoot).Path
$serverPath = Join-Path $PSScriptRoot 'server.py'
foreach ($name in @('public-gateway','tunnel')) {
    $pidFile = Join-Path $runtime ($name+'.pid')
    if (!(Test-Path -LiteralPath $pidFile)) { continue }
    $ownedId = [int](Get-Content -LiteralPath $pidFile -Raw)
    $candidate = Get-CimInstance Win32_Process -Filter "ProcessId = $ownedId"
    if (!$candidate) { continue }
    $matches = if ($name -eq 'tunnel') { $candidate.ExecutablePath -eq (Join-Path $runtime 'cloudflared.exe') } else { $candidate.CommandLine.Contains($serverPath) -and $candidate.CommandLine.Contains('5911') }
    if (!$matches) { throw "El PID de $name corresponde a otro programa; no se detuvo." }
    Stop-Process -Id $ownedId
}
Write-Output 'Cálculo remoto detenido. La interfaz alojada en Cloudflare sigue disponible.'
