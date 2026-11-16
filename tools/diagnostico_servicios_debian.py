#!/usr/bin/env python3
"""Diagnóstico local, no intrusivo, de servicios ΣIM Debian.

No modifica servicios, no lee credenciales y no imprime rutas ni variables de entorno.
La conexión TCP al MCP NO verifica que DWSIM pueda calcular; la presencia de cloudflared
NO confirma el estado del túnel remoto.
"""
import argparse
import json
import socket
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone

LOCAL='127.0.0.1'
GATEWAY_PORT=5910
MCP_PORT=5901


def gateway_probe(timeout=2):
    req=urllib.request.Request(f'http://{LOCAL}:{GATEWAY_PORT}/api/status',
                               headers={'Accept':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=timeout) as response:
            if response.status!=200:return {'state':'unconfirmed','detail':'HTTP no satisfactorio'}
            raw=response.read(4096)
        info=json.loads(raw)
        if (not isinstance(info,dict) or not isinstance(info.get('gateway_version'),str)
            or info.get('state') not in ('ready','busy')):
            return {'state':'unconfirmed','detail':'Contrato de estado inválido o gateway antiguo'}
        return {'state':info['state'],'version':info['gateway_version'],
                'uptime_s':info.get('uptime_s'),'detail':'Endpoint de estado accesible'}
    except urllib.error.HTTPError as exc:
        return {'state':'unconfirmed','detail':'Endpoint de estado no disponible','http_status':exc.code}
    except (urllib.error.URLError,TimeoutError,OSError,ValueError,UnicodeError):
        return {'state':'unreachable','detail':'No se obtuvo estado HTTP local'}


def mcp_probe(timeout=2):
    try:
        with socket.create_connection((LOCAL,MCP_PORT),timeout=timeout):pass
        return {'state':'listening','detail':'Puerto TCP abierto; cálculo DWSIM no verificado'}
    except OSError:
        return {'state':'unreachable','detail':'No se pudo establecer conexión TCP local'}


def systemd_probe(timeout=2):
    """Solo una unidad conocida, no usar shell ni revelar argumentos de procesos."""
    try:
        r=subprocess.run(['systemctl','is-active','lemeit-sim.service'],capture_output=True,
                         text=True,timeout=timeout,check=False)
        state=r.stdout.strip()
        if state not in ('active','inactive','failed','activating','deactivating'):
            state='unconfirmed'
        return {'state':state}
    except (OSError,subprocess.TimeoutExpired):
        return {'state':'unconfirmed'}


def tunnel_probe(timeout=2):
    """Presencia del proceso, no conectividad extremo a extremo."""
    try:
        result=subprocess.run(['pgrep','-x','cloudflared'],capture_output=True,
                              timeout=timeout,check=False)
        return {'state':'process_seen' if result.returncode==0 else 'unconfirmed',
                'detail':'Proceso local observado; conectividad del túnel no verificada'
                         if result.returncode==0 else
                         'No se observó proceso cloudflared; unidad/nombre no verificados'}
    except (OSError,subprocess.TimeoutExpired):
        return {'state':'unconfirmed','detail':'No se pudo verificar el proceso local'}


def collect():
    return {
        'schema_version':1,
        'checked_at':datetime.now(timezone.utc).isoformat().replace('+00:00','Z'),
        'scope':'local_only',
        'gateway':gateway_probe(),
        'gateway_service':systemd_probe(),
        'dwsim_mcp':mcp_probe(),
        'cloudflare_tunnel':tunnel_probe(),
        'limitations':[
            'Las pruebas no realizan simulaciones de procesos.',
            'Un puerto abierto no garantiza disponibilidad del motor DWSIM.',
            'La presencia de cloudflared no prueba acceso al túnel desde Internet.',
            'No se consultan credenciales ni se modifican servicios.'
        ]
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--json',action='store_true',help='Informe JSON, sin datos sensibles')
    args=parser.parse_args()
    data=collect()
    if args.json:print(json.dumps(data,ensure_ascii=False,indent=2))
    else:
        print('ΣIM · Diagnóstico local Debian (solo lectura)')
        for key,label in [('gateway_service','Servicio systemd'),('gateway','Gateway HTTP :5910'),
                          ('dwsim_mcp','DWSIM MCP TCP :5901'),
                          ('cloudflare_tunnel','cloudflared local')]:
            item=data[key]
            print(f"  {label}: {item['state']}" +
                  (f" · versión {item['version']}" if 'version' in item else '') +
                  (f" · {item['detail']}" if 'detail' in item else ''))
        print('Nota: no se comprobó la conectividad remota del túnel ni se ejecutó una simulación.')
    # No considerar fallo de cloudflared como motor caído: el túnel puede ejecutarse
    # fuera de este proceso o usar otra instalación. Fallar solo ante gateway/MCP inalcanzables.
    return 1 if data['gateway']['state']=='unreachable' or data['dwsim_mcp']['state']=='unreachable' else 0


if __name__=='__main__':
    raise SystemExit(main())
