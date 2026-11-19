"""Prueba aislada del bloque Recycle nativo de DWSIM MCP 10.2.15.
No cambia el gateway publicado y no expone credenciales.
Windows: python tools/probe_recycle_native.py --engine windows
Debian: python3 tools/probe_recycle_native.py --engine debian --token-file RUTA_PRIVADA
"""
import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path: sys.path.insert(0, str(ROOT))
from server import IsolatedEngine, RemoteMcpEngine

EXPECTED = {'F1': 1., 'F2': 1./.6, 'P1': 1., 'R1': .4/.6}

def native_probe(engine, timeout_s=30):
    """Valores observados exclusivamente del solver; la referencia se usa solo al final."""
    fid = engine.call('dwsim_flowsheet_create', name='Prueba nativa Recycle')['flowsheet_id']
    def call(tool, **kw): return engine.call(tool, flowsheet_id=fid, **kw)
    try:
        call('dwsim_thermo_add_compounds', names=['Water'])
        call('dwsim_thermo_set_property_package', name='Steam Tables (IAPWS-IF97)')
        for name in ('F1','F2','P1','R1','R2'):
            kw = {'name':name}
            if name == 'F1':
                kw.update(temperature_K=298.15, pressure_Pa=101325,
                          mass_flow_kg_s=1., composition={'Water':1.})
            call('dwsim_stream_add_material', **kw)
        for typ, name in (('Mixer','M1'),('Splitter','D1'),('Recycle','RC1')):
            call('dwsim_unitop_add', type=typ, name=name)
        connections = (
            ('M1', {'feed_stream':'F1','feed_port':0}),
            ('M1', {'feed_stream':'R2','feed_port':1}),
            ('M1', {'product_stream':'F2','product_port':0}),
            ('D1', {'feed_stream':'F2','feed_port':0}),
            ('D1', {'product_stream':'P1','product_port':0}),
            ('D1', {'product_stream':'R1','product_port':1}),
            ('RC1',{'feed_stream':'R1','feed_port':0}),
            ('RC1',{'product_stream':'R2','product_port':0}),
        )
        for unit, props in connections: call('dwsim_unitop_connect', unitop=unit, **props)
        call('dwsim_unitop_set', name='D1', properties={'OperationMode':'SplitRatios','SR1':.6})
        solved = call('dwsim_solve_run', timeout_s=timeout_s)
        if not solved.get('ok'):
            raise RuntimeError('DWSIM no convergió: '+str(solved.get('errors',[]))[:300])
        streams = {name: call('dwsim_stream_get_results',name=name)
                   for name in ('F1','F2','P1','R1','R2')}
        recycle = call('dwsim_unitop_get_results',name='RC1')
        flows = {name:float(state['mass_flow_kg_s']) for name,state in streams.items()}
        deviations = {name: flows[name]-value for name,value in EXPECTED.items()}
        residuals = {'recycle':flows['R1']-flows['R2'],
                     'mixer':flows['F1']+flows['R2']-flows['F2'],
                     'splitter':flows['F2']-flows['P1']-flows['R1'],
                     'global':flows['F1']-flows['P1']}
        reference_match = (all(math.isfinite(x) for x in flows.values())
            and all(abs(x)<=1e-5 for x in (*deviations.values(),*residuals.values())))
        return {'method':'DWSIM native Recycle', 'solver_ok':solved['ok'],
                'recycle_calculated':recycle.get('calculated'),
                'recycle_error':str(recycle.get('error') or '')[:200],
                'flows_kg_s':flows,'deviations_kg_s':deviations,
                'residuals_kg_s':residuals,'reference_match':reference_match}
    finally:
        engine.call('dwsim_flowsheet_close', flowsheet_id=fid)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--engine', choices=['windows','debian'], required=True)
    p.add_argument('--engine-root', default=str(ROOT/'.local'/'runtime'))
    p.add_argument('--token-file', help='Ruta privada del token MCP Debian (no se imprime)')
    p.add_argument('--timeout', type=int,default=30)
    args=p.parse_args()
    if args.engine=='windows':
        with IsolatedEngine(args.engine_root) as engine:
            result=native_probe(engine,args.timeout)
    else:
        if not args.token_file:p.error('Debian requiere --token-file')
        result=native_probe(RemoteMcpEngine(args.token_file),args.timeout)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0 if result['reference_match'] else 1

if __name__=='__main__':
    try: sys.exit(main())
    except Exception as exc:
        print(json.dumps({'probe':'native_recycle','error_type':type(exc).__name__,
                          'message':str(exc)[:400]},ensure_ascii=False),file=sys.stderr)
        sys.exit(2)
