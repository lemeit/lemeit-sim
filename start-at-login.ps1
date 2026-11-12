param(
    [Parameter(Mandatory=$true)][string]$PythonExe,
    [string]$RepositoryRoot = $PSScriptRoot,
    [int]$DelaySeconds = 15
)
$ErrorActionPreference = 'Stop'
$runtime = Join-Path $RepositoryRoot '.local/runtime'
$log = Join-Path $runtime 'startup.log'
$mutex = New-Object Threading.Mutex($false, 'Local\LemeitSimStartup')
$owned = $false
try {
    $owned = $mutex.WaitOne(0)
    if (!$owned) { exit 0 }
    if (!(Test-Path -LiteralPath $runtime)) { throw 'Falta .local/runtime.' }
    if (!(Test-Path -LiteralPath $PythonExe)) { throw 'No se encuentra Python.' }
    $env:PATH = (Split-Path -Parent $PythonExe) + ';' + $env:PATH
    if ($DelaySeconds -gt 0) { Start-Sleep -Seconds $DelaySeconds }
    for ($attempt = 1; $attempt -le 4; $attempt++) {
        try {
            & (Join-Path $RepositoryRoot 'start-online.ps1') *> $null
            $ready = $false
            for ($check = 0; $check -lt 10; $check++) {
                try {
                    $response = Invoke-WebRequest 'http://127.0.0.1:5911/api/catalog' -UseBasicParsing -TimeoutSec 5
                    if ($response.StatusCode -eq 200) { $ready = $true; break }
                } catch { }
                Start-Sleep -Seconds 2
            }
            if (!$ready) { throw 'El gateway no respondio.' }
            Add-Content -LiteralPath $log -Value ((Get-Date -Format o) + ' Gateway Windows disponible; tunel iniciado o reutilizado. Verificar conexion publica en el portal.')
            exit 0
        } catch {
            Add-Content -LiteralPath $log -Value ((Get-Date -Format o) + " Intento $attempt sin gateway disponible.")
            if ($attempt -lt 4) { Start-Sleep -Seconds 15 }
        }
    }
    exit 1
} finally {
    if ($owned) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
