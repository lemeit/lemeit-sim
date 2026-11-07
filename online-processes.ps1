function Get-SimproxArgument([string]$Line, [string]$Name) {
    $pattern = '(?:^|\s)--' + [regex]::Escape($Name) + '(?:=|\s+)(?:"([^"]+)"|(\S+))'
    if ($Line -match $pattern) { if ($Matches[1]) { return $Matches[1] }; return $Matches[2] }
    return $null
}
function Find-SimproxOnlineProcess([string]$Runtime) {
    $expectedEngine = [IO.Path]::GetFullPath($Runtime)
    $expectedTunnel = Join-Path $expectedEngine 'cloudflared.exe'
    $expectedTokenFile = Join-Path $expectedEngine 'tunnel-token.txt'
    foreach ($candidate in Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe' OR Name = 'cloudflared.exe'") {
        $line = $candidate.CommandLine
        if (!$line) { continue }
        if ($candidate.Name -in @('python.exe','pythonw.exe')) {
            $engineArg = Get-SimproxArgument $line 'engine-root'
            if ($engineArg -and (Get-SimproxArgument $line 'port') -eq '5911' -and $line -match '(?:^|\s)(?:"[^"]*server\.py"|\S*server\.py)(?:\s|$)') {
                try { $matchesRuntime = [IO.Path]::GetFullPath($engineArg) -eq $expectedEngine } catch { $matchesRuntime = $false }
                if ($matchesRuntime) { [pscustomobject]@{ Kind='gateway'; Process=$candidate } }
            }
        } elseif ($candidate.ExecutablePath -eq $expectedTunnel) {
            $tokenArg = Get-SimproxArgument $line 'token-file'
            if ($tokenArg) {
                try { $matchesToken = [IO.Path]::GetFullPath($tokenArg) -eq $expectedTokenFile } catch { $matchesToken = $false }
                if ($matchesToken) { [pscustomobject]@{ Kind='tunnel'; Process=$candidate } }
            }
        }
    }
}
