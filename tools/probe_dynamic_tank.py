#!/usr/bin/env python3
"""Diagnóstico local y prueba explícita de DWSIM MCP dinámico en Debian.

Usa los mismos archivos privados del gateway. Nunca muestra el token y nunca
expone el MCP fuera de 127.0.0.1. La corrida solo empieza con --run.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from server import RemoteMcpEngine
from dynamic_tank_mcp import capabilities, run_tank


def main():
    parser = argparse.ArgumentParser(description='Diagnóstico del integrador dinámico DWSIM')
    parser.add_argument('--token-file', default=str(Path.home() / '.config/lemeit-sim/mcp-token'))
    parser.add_argument('--run', action='store_true', help='Crear un flowsheet temporal y ejecutar el tanque DWSIM')
    args = parser.parse_args()
    engine = RemoteMcpEngine(args.token_file)
    info = capabilities(engine)
    print('Herramientas dinámicas disponibles:', 'sí' if info['supported'] else 'no')
    if info['missing_tools']:
        print('Herramientas faltantes:', ', '.join(info['missing_tools']))
    if not args.run:
        print('Sin ejecución de DWSIM. Para una corrida real usá --run.')
        return 0 if info['supported'] else 2
    if not info['supported']:
        print('No puede ejecutarse: MCP incompleto.', file=sys.stderr)
        return 2
    print('Preparando el flowsheet DWSIM de agua con dos válvulas y tanque de 2 m³.')
    diagnostics = {}
    try:
        result = run_tank(engine, {}, diagnostics=diagnostics)
    except Exception as exc:
        print('La corrida DWSIM no pudo completarse:', str(exc)[:1600], file=sys.stderr)
        print('Diagnóstico de monitorización (sin credenciales):')
        for key in ('requested', 'monitor_returned', 'run_state', 'run_steps',
                    'run_summary_keys', 'time_count', 'series_names', 'series_note'):
            if key in diagnostics:
                print(' ', key + ':', str(diagnostics[key])[:650])
        return 1
    print('Fuente:', result['source'])
    print('Puntos:', len(result['points']), 'tiempo final [s]:', result['simulatedDurationS'])
    print('t [s]    nivel [m]    salida [kg/s]')
    for target in (60, 120, 600):
        p = min(result['points'], key=lambda x: abs(x['time_s'] - target))
        print(f"{p['time_s']:>7.2f} {p['level_m']:>11.4f} {p['outlet_kg_s']:>16.4f}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
