param([Parameter(Mandatory=$true)][string]$EngineRoot)
$ErrorActionPreference = 'Stop'
$runtime = (Resolve-Path -LiteralPath $EngineRoot).Path
$serverPath = Join-Path $PSScriptRoot 'server.py'
foreach ($name in @('origin-key.txt','tunnel-token.txt','cloudflared.exe','server/dwsim-mcp.exe')) {
    if (!(Test-Path -LiteralPath (Join-Path $runtime $name))) { throw "Falta el archivo privado o motor: $name" }
}
$pidFile = Join-Path $runtime 'public-gateway.pid'
$existing = $null
if (Test-Path -LiteralPath $pidFile) {
    $previousId = [int](Get-Content -LiteralPath $pidFile -Raw)
    $candidate = Get-CimInstance Win32_Process -Filter "ProcessId = $previousId"
    if ($candidate -and $candidate.CommandLine.Contains($serverPath) -and $candidate.CommandLine.Contains('5911')) { $existing = $candidate }
}
if (!$existing) {
    $gateway = Start-Process python -ArgumentList @(('"'+$serverPath+'"'),'--engine-root',('"'+$runtime+'"'),'--port','5911','--public-origin','https://sim.lemeit.ar','--origin-key-file',('"'+(Join-Path $runtime 'origin-key.txt')+'"')) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'public-gateway.stdout.log') -RedirectStandardError (Join-Path $runtime 'public-gateway.stderr.log') -PassThru
    $gateway.Id | Set-Content -LiteralPath $pidFile
}
$tunnelExe = Join-Path $runtime 'cloudflared.exe'
$tunnelPidFile = Join-Path $runtime 'tunnel.pid'
$tunnelRunning = $false
if (Test-Path -LiteralPath $tunnelPidFile) {
    $previousId = [int](Get-Content -LiteralPath $tunnelPidFile -Raw)
    $candidate = Get-Process -Id $previousId -ErrorAction SilentlyContinue
    $tunnelRunning = $candidate -and $candidate.Path -eq $tunnelExe
}
if (!$tunnelRunning) {
    $connector = Start-Process -FilePath $tunnelExe -ArgumentList @('tunnel','--protocol','http2','run','--token-file',('"'+(Join-Path $runtime 'tunnel-token.txt')+'"')) -WorkingDirectory $runtime -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'tunnel.stdout.log') -RedirectStandardError (Join-Path $runtime 'tunnel.stderr.log') -PassThru
    $connector.Id | Set-Content -LiteralPath $tunnelPidFile
}
Write-Output 'Servicio online iniciado. Sitio: https://sim.lemeit.ar. Los registros privados quedan en EngineRoot.'
