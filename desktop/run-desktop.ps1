# Development launcher; no permanent environment changes.
[CmdletBinding()]
param(
    [string]$EngineRoot = 'C:\GitHub\lemeit-sim\.local\runtime',
    [string]$Python = '',
    [string]$MsvcRoot = '',
    [string]$SdkVersion = ''
)
$ErrorActionPreference = 'Stop'
if (-not $Python) { $Python = (Get-Command python -ErrorAction Stop).Source }
if (-not $MsvcRoot) {
    $roots = @("${env:ProgramFiles(x86)}\Microsoft Visual Studio", "$env:ProgramFiles\Microsoft Visual Studio")
    $MsvcRoot = Get-ChildItem $roots -Directory -ErrorAction SilentlyContinue |
        ForEach-Object { Get-ChildItem $_.FullName -Directory -ErrorAction SilentlyContinue } |
        ForEach-Object { Get-ChildItem (Join-Path $_.FullName 'VC\Tools\MSVC') -Directory -ErrorAction SilentlyContinue } |
        Where-Object { (Test-Path "$($_.FullName)\bin\HostX64\x64\link.exe") -and (Test-Path "$($_.FullName)\lib\x64\libcmt.lib") } |
        Sort-Object { [version]$_.Name } -Descending |
        Select-Object -First 1 -ExpandProperty FullName
}
$sdk = "${env:ProgramFiles(x86)}\Windows Kits\10"
if (-not $SdkVersion) {
    $SdkVersion = Get-ChildItem "$sdk\Lib" -Directory -ErrorAction SilentlyContinue |
        Where-Object { (Test-Path "$($_.FullName)\um\x64\kernel32.lib") -and (Test-Path "$($_.FullName)\ucrt\x64\ucrt.lib") } |
        Sort-Object { [version]$_.Name } -Descending |
        Select-Object -First 1 -ExpandProperty Name
}
if (-not $MsvcRoot -or -not $SdkVersion) { throw 'MSVC x64 or Windows SDK not found.' }
foreach ($file in @("$MsvcRoot\bin\HostX64\x64\cl.exe","$MsvcRoot\bin\HostX64\x64\link.exe","$MsvcRoot\lib\x64\libcmt.lib","$sdk\Lib\$SdkVersion\um\x64\kernel32.lib","$sdk\Lib\$SdkVersion\ucrt\x64\ucrt.lib","$EngineRoot\server\dwsim-mcp.exe","$EngineRoot\local-token.txt",$Python)) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing: $file" }
}
$env:PATH = "$MsvcRoot\bin\HostX64\x64;$sdk\bin\$SdkVersion\x64;$env:PATH"
$env:LIB = "$MsvcRoot\lib\x64;$sdk\Lib\$SdkVersion\ucrt\x64;$sdk\Lib\$SdkVersion\um\x64"
$env:INCLUDE = "$MsvcRoot\include;$sdk\Include\$SdkVersion\ucrt;$sdk\Include\$SdkVersion\shared;$sdk\Include\$SdkVersion\um;$sdk\Include\$SdkVersion\winrt"
$env:SIM_DESKTOP_ENGINE_ROOT = $EngineRoot
$env:SIM_DESKTOP_PYTHON = $Python
Write-Host "MSVC: $MsvcRoot"
Write-Host "SDK: $SdkVersion"
Write-Host "Python: $Python"
Push-Location (Join-Path $PSScriptRoot 'src-tauri')
try { cargo run; if ($LASTEXITCODE -ne 0) { throw "Cargo exit code: $LASTEXITCODE" } }
finally { Pop-Location }
