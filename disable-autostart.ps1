$ErrorActionPreference = 'Stop'
$linkPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'Lemeit-SIM-Windows.lnk'
if (Test-Path -LiteralPath $linkPath) {
    Remove-Item -LiteralPath $linkPath
    Write-Output 'Inicio automatico desactivado. El servicio actual no se detuvo.'
} else { Write-Output 'El inicio automatico ya estaba desactivado.' }
Write-Output 'Para apagar el servicio actual: .\stop-online.ps1.'
