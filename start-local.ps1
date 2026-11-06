param([Parameter(Mandatory=$true)][string]$EngineRoot, [int]$Port=5910)
$ErrorActionPreference = 'Stop'
$resolvedEngine = (Resolve-Path -LiteralPath $EngineRoot).Path
if (!(Test-Path -LiteralPath (Join-Path $resolvedEngine 'server/dwsim-mcp.exe'))) {
    throw 'No se encuentra server/dwsim-mcp.exe en la carpeta del motor.'
}
python (Join-Path $PSScriptRoot 'server.py') --engine-root $resolvedEngine --port $Port
