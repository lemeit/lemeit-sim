param([string]$EngineRoot = (Join-Path $PSScriptRoot '.local/runtime'))
$ErrorActionPreference = 'Stop'
$runtime = (Resolve-Path -LiteralPath $EngineRoot).Path
$serverPath = Join-Path $PSScriptRoot 'server.py'
. (Join-Path $PSScriptRoot 'online-processes.ps1')
$runningOnline = @(Find-SimproxOnlineProcess $runtime)
foreach ($name in @('origin-key.txt','tunnel-token.txt','cloudflared.exe','server/dwsim-mcp.exe')) {
    if (!(Test-Path -LiteralPath (Join-Path $runtime $name))) { throw "Falta el archivo privado o motor: $name" }
}
$pidFile = Join-Path $runtime 'public-gateway.pid'
$existing = $runningOnline | Where-Object Kind -eq 'gateway' | Select-Object -First 1
if ($existing) { $existing.Process.ProcessId | Set-Content -LiteralPath $pidFile }
if (!$existing) {
    $gateway = Start-Process python -ArgumentList @(('"'+$serverPath+'"'),'--engine-root',('"'+$runtime+'"'),'--port','5911','--public-origin','https://sim.lemeit.ar','--origin-key-file',('"'+(Join-Path $runtime 'origin-key.txt')+'"')) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'public-gateway.stdout.log') -RedirectStandardError (Join-Path $runtime 'public-gateway.stderr.log') -PassThru
    $gateway.Id | Set-Content -LiteralPath $pidFile
}
$tunnelExe = Join-Path $runtime 'cloudflared.exe'
$tunnelPidFile = Join-Path $runtime 'tunnel.pid'
$tunnelRunning = $runningOnline | Where-Object Kind -eq 'tunnel' | Select-Object -First 1
if ($tunnelRunning) { $tunnelRunning.Process.ProcessId | Set-Content -LiteralPath $tunnelPidFile }
if (!$tunnelRunning) {
    $connector = Start-Process -FilePath $tunnelExe -ArgumentList @('tunnel','--protocol','http2','run','--token-file',('"'+(Join-Path $runtime 'tunnel-token.txt')+'"')) -WorkingDirectory $runtime -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'tunnel.stdout.log') -RedirectStandardError (Join-Path $runtime 'tunnel.stderr.log') -PassThru
    $connector.Id | Set-Content -LiteralPath $tunnelPidFile
}
Write-Output 'Servicio online iniciado. Sitio: https://sim.lemeit.ar. Los registros privados quedan en EngineRoot.'
