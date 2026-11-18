"""Recirculación estacionaria elemental: mezclador + divisor, sin reacción.
El lazo se corta temporalmente mediante una alimentación virtual y se resuelve
con DWSIM en cada iteración; el JSON y los resultados públicos conservan su topología.
No pretende resolver lazos generales, reactores ni sistemas dinámicos.
"""
import copy
import math
import time

class RecycleError(ValueError):
    pass

def simple_recycle_shape(graph):
    """Identifica exclusivamente F + R -> Mixer -> Splitter -> (P,R)."""
    nodes=graph.get('nodes', [])
    edges=graph.get('edges', [])
    if len(nodes)!=6 or len(edges)!=6 or not isinstance(nodes,list) or not isinstance(edges,list):
        return None
    by_id={n.get('id'):n for n in nodes if isinstance(n,dict)}
    if len(by_id)!=6:return None
    mixers=[n for n in nodes if n.get('type')=='Mixer']
    splitters=[n for n in nodes if n.get('type')=='Splitter']
    streams=[n for n in nodes if n.get('type')=='MaterialStream']
    if len(mixers)!=1 or len(splitters)!=1 or len(streams)!=4:return None
    mixer,splitter=mixers[0],splitters[0]
    def outgoing(ident):return [e for e in edges if e.get('from')==ident]
    def incoming(ident):return [e for e in edges if e.get('to')==ident]
    mo=outgoing(mixer['id']);si=incoming(splitter['id']);so=outgoing(splitter['id']);mi=incoming(mixer['id'])
    if len(mo)!=1 or len(si)!=1 or len(so)!=2 or len(mi)!=2:return None
    if {e.get('fromIndex',0) for e in so}!={0,1}:return None
    if {e.get('toIndex',0) for e in mi}!={0,1}:return None
    intermediate=by_id.get(mo[0]['to'])
    if intermediate not in streams or si[0].get('from')!=intermediate['id']:return None
    product=by_id.get(next(e for e in so if e.get('fromIndex',0)==0).get('to'))
    recycle=by_id.get(next(e for e in so if e.get('fromIndex',0)==1).get('to'))
    if product not in streams or recycle not in streams or product is recycle:return None
    if outgoing(product['id']) or incoming(product['id'])!=[next(e for e in so if e.get('fromIndex',0)==0)]:return None
    if len(outgoing(recycle['id']))!=1 or outgoing(recycle['id'])[0].get('to')!=mixer['id']:return None
    if len(incoming(recycle['id']))!=1 or incoming(recycle['id'])[0].get('from')!=splitter['id']:return None
    fresh_candidates=[e for e in mi if e.get('from')!=recycle['id']]
    if len(fresh_candidates)!=1:return None
    fresh=by_id.get(fresh_candidates[0].get('from'))
    if fresh not in streams or incoming(fresh['id']) or outgoing(fresh['id'])!=[fresh_candidates[0]]:return None
    if len({fresh['id'],intermediate['id'],product['id'],recycle['id']})!=4:return None
    if any(e.get('fromPort','out')!='out' or e.get('toPort','in')!='in' for e in edges):return None
    return {'mixer':mixer['id'],'splitter':splitter['id'],'fresh':fresh['id'],
            'mixed':intermediate['id'],'product':product['id'],'recycle':recycle['id']}


def solve_simple_recycle(graph,shape,solve_open,max_iterations=5):
    """Converge una corriente de corte y verifica masa, T, P y composición.
    solve_open(torn_graph) resuelve mediante el motor real y devuelve su salida habitual.
    """
    if graph.get('compounds')!=['Water'] or graph.get('model')!='Steam Tables (IAPWS-IF97)':
        raise RecycleError('Este primer reciclado está limitado a agua pura con IAPWS-IF97; otros sistemas quedan para una etapa posterior.')
    by_id={n['id']:n for n in graph['nodes']}
    fresh=by_id[shape['fresh']]
    splitter=by_id[shape['splitter']]
    split=float(splitter['split'])
    if not .05<=split<=.95:
        raise RecycleError('Para este primer reciclado, la fracción de producto debe estar entre 0,05 y 0,95.')
    if fresh.get('flow_basis','mass')!='mass' or fresh.get('composition_basis','mass')!='mass' or fresh.get('flash_spec','TP')!='TP':
        raise RecycleError('Este ejemplo de reciclado requiere alimentación en base másica, composición másica y especificación T-P.')
    feed_flow=float(fresh['mass_flow'])
    expected=feed_flow*(1-split)/split
    if expected>1000000:raise RecycleError('El reciclado calculado supera el límite de caudal.')
    torn=copy.deepcopy(graph)
    ids={n['id'] for n in torn['nodes']}
    guess_id='tearRecycle'
    while guess_id in ids:guess_id+='X'
    guessed=dict(fresh)
    guessed.update({'id':guess_id,'name':'Alimentación virtual de reciclado',
                    'x':by_id[shape['recycle']]['x'],'y':by_id[shape['recycle']]['y']+35,
                    'mass_flow':expected,'flow_basis':'mass','composition_basis':'mass','flash_spec':'TP'})
    torn['nodes'].append(guessed)
    edge=next(e for e in torn['edges'] if e['from']==shape['recycle'] and e['to']==shape['mixer'])
    edge['from']=guess_id
    last=None
    total_elapsed=0.0
    started=time.monotonic()
    for iteration in range(1,max_iterations+1):
        if time.monotonic()-started>40:
            raise RecycleError('El reciclado excedió los 40 segundos de cómputo. Revisá las condiciones.')
        result=solve_open(torn)
        total_elapsed+=float(result.get('elapsed_s',0))
        if not isinstance(result,dict) or shape['recycle'] not in result.get('streams',{}):
            raise RecycleError('DWSIM no devolvió los datos de la corriente reciclada.')
        actual=result['streams'][shape['recycle']]
        mass=float(actual['mass_flow_kg_s'])
        temp=float(actual['temperature_K'])-273.15
        pressure=float(actual['pressure_Pa'])/1000
        fractions={c:float(actual['phases'][0]['compounds'][c]['mass_fraction']) for c in graph['compounds']}
        if any(not math.isfinite(value) for value in (mass,temp,pressure,*fractions.values())):
            raise RecycleError('DWSIM devolvió valores no finitos en el reciclado.')
        if mass<=0 or pressure<=0 or abs(sum(fractions.values())-1)>1e-5:
            raise RecycleError('Estado físico inválido en la corriente reciclada.')
        mass_error=abs(mass-guessed['mass_flow'])
        temperature_error=abs(temp-guessed['temperature_C'])
        pressure_error=abs(pressure-guessed['pressure_kPa'])
        composition_error=max(abs(fractions[c]-guessed['composition'][c]) for c in fractions)
        last=(mass_error,temperature_error,pressure_error,composition_error)
        if (mass_error<=1e-6*max(1.,mass)
            and temperature_error<=0.01 and pressure_error<=0.01
            and composition_error<=1e-6):
            # La alimentación virtual solo existe durante la iteración; la salida
            # final usa el identificador original del reciclado y no la publica.
            result['streams'].pop(guess_id,None)
            result['elapsed_s']=round(total_elapsed,2)
            result['recycle']={'mode':'simple_material','iterations':iteration,
                               'mass_residual_kg_s':mass_error,
                               'temperature_residual_K':temperature_error,
                               'pressure_residual_kPa':pressure_error}
            return result
        # Relajación parcial para disminuir oscilaciones térmicas.
        guessed['mass_flow']=expected
        guessed['temperature_C']=.5*guessed['temperature_C']+.5*temp
        guessed['pressure_kPa']=.5*guessed['pressure_kPa']+.5*pressure
        guessed['composition']={c:.5*guessed['composition'][c]+.5*fractions[c] for c in fractions}
    raise RecycleError('El reciclado no convergió tras '+str(max_iterations)+
                       ' iteraciones (residuos masa/T/P/composición: '+', '.join(f'{v:.5g}' for v in last)+').')
