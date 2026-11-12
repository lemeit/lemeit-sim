$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '.local/runtime'
foreach ($name in @('origin-key.txt','tunnel-token.txt','cloudflared.exe','server/dwsim-mcp.exe')) {
    if (!(Test-Path -LiteralPath (Join-Path $runtime $name))) { throw "Falta el motor o configuracion: $name" }
}
$pythonExe = (Get-Command python -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
$shellExe = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
$launcher = Join-Path $runtime 'start-at-login.ps1'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'start-at-login.ps1') -Destination $launcher -Force
$startup = [Environment]::GetFolderPath('Startup')
$linkPath = Join-Path $startup 'Lemeit-SIM-Windows.lnk'
$wsh = New-Object -ComObject WScript.Shell
$link = $wsh.CreateShortcut($linkPath)
$link.TargetPath = $shellExe
$link.Arguments = '-NoProfile -NonInteractive -WindowStyle Hidden -File "' + $launcher + '" -PythonExe "' + $pythonExe + '" -RepositoryRoot "' + $PSScriptRoot + '"'
$link.WorkingDirectory = $PSScriptRoot
$link.WindowStyle = 7
$link.Description = 'Arranque del motor Windows de SIM y su tunel al iniciar sesion.'
$link.Save()
Write-Output 'Inicio automatico habilitado para este usuario. Se ejecuta al iniciar sesion, sin privilegios de administrador.'
Write-Output 'Para desactivarlo: .\disable-autostart.ps1. Para apagar ahora: .\stop-online.ps1.'
