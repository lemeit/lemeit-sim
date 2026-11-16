param(
    [string]$GatewayUrl = 'http://127.0.0.1:5911',
    [string]$ReportPath = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $ReportPath) { $ReportPath = Join-Path $root '.local/runtime/validacion-hx13-windows.json' }
$case = Get-Content -LiteralPath (Join-Path $root 'site/examples/HeatExchangerWater.json') -Raw -Encoding UTF8
Write-Output 'Ejemplo 13: comparacion Windows–Debian con DWSIM real...'
$result = Invoke-RestMethod -Uri "$GatewayUrl/api/simulate" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($case)) -TimeoutSec 75
$reference = @{
    hot_feed = @{t=80.0; m=1.0; p=300.0}
    hot_out = @{t=70.45655598276471; m=1.0; p=300.0}
    cold_feed = @{t=20.0; m=1.0; p=300.0}
    cold_out = @{t=29.56576488476321; m=1.0; p=300.0}
}
$actual = @{}
$checks = [ordered]@{}
foreach ($id in @('hot_feed','hot_out','cold_feed','cold_out')) {
    $s = $result.streams.$id
    if ($null -eq $s) { throw "No se encontro corriente $id." }
    $state = @{
        t = [double]$s.temperature_K - 273.15
        p = [double]$s.pressure_Pa / 1000
        m = [double]$s.mass_flow_kg_s
        h = [double]$s.phases[0].enthalpy_kJ_kg
    }
    $actual[$id] = $state
    $checks["$id temperatura vs Debian"] = [Math]::Abs($state.t - $reference[$id].t) -lt 0.1
    $checks["$id caudal"] = [Math]::Abs($state.m - 1) -lt 0.00001
    $checks["$id presion"] = [Math]::Abs($state.p - 300) -lt 0.1
    Write-Output ("{0}: T={1:N6} C; P={2:N3} kPa; m={3:N6} kg/s; h={4:N6} kJ/kg" -f $id,$state.t,$state.p,$state.m,$state.h)
}
$hotIn=$actual.hot_feed;$hotOut=$actual.hot_out;$coldIn=$actual.cold_feed;$coldOut=$actual.cold_out
$qHot = $hotIn.m*$hotIn.h - $hotOut.m*$hotOut.h
$qCold = $coldOut.m*$coldOut.h - $coldIn.m*$coldIn.h
$checks['Q caliente aproximadamente 40 kW'] = [Math]::Abs($qHot - 40) -lt 0.5
$checks['Q frio aproximadamente 40 kW'] = [Math]::Abs($qCold - 40) -lt 0.5
$checks['Balance termico entre circuitos'] = [Math]::Abs($qHot - $qCold) -lt 0.5
$checks['Equipo calculado'] = [bool]$result.equipment.hx.calculated -and -not $result.equipment.hx.error
$checks['Caliente se enfria'] = $hotOut.t -lt $hotIn.t
$checks['Frio se calienta'] = $coldOut.t -gt $coldIn.t
$checks['Sin cruce termico'] = $hotOut.t -gt $coldOut.t
Write-Output ("Q cedido={0:N8} kW; Q recibido={1:N8} kW; residuo={2:N8} kW" -f $qHot,$qCold,[Math]::Abs($qHot-$qCold))
foreach ($name in $checks.Keys) { Write-Output ("{0}: {1}" -f $(if($checks[$name]){'OK'}else{'FALLA'}),$name) }
$report = [ordered]@{
    generated_at=(Get-Date).ToUniversalTime().ToString('o')
    platform='Windows'
    case='HeatExchangerWater'
    engine=$result.engine
    states=$actual
    q_hot_kW=$qHot
    q_cold_kW=$qCold
    thermal_residual_kW=[Math]::Abs($qHot-$qCold)
    checks=$checks
    all_passed=(-not @($checks.Values | Where-Object { -not $_ }).Count)
}
$folder = Split-Path -Parent $ReportPath
if (-not (Test-Path -LiteralPath $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReportPath -Encoding UTF8
Write-Output "Informe: $ReportPath"
if (-not $report.all_passed) { exit 1 }
