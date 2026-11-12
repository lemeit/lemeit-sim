"""Ejecutar casos 09–10 con el runtime Windows y verificar balances."""
import argparse,hashlib,json,math,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import IsolatedEngine,simulate
CASES=['ThermalNetwork','AmmoniaBypass']
TOL_MASS=1e-8
TOL_ATOMS=1e-5

def close(a,b,tol=TOL_MASS):
 if not math.isfinite(a) or abs(a-b)>tol:raise AssertionError(f'{a} != {b}; tolerancia {tol}')
def atoms(s):
 c=s['mass_fractions'];n=s['molar_flow_mol_s'];x=s['mole_fractions']
 return {'N':n*(2*x.get('Nitrogen',0)+x.get('Ammonia',0)), 'H':n*(2*x.get('Hydrogen',0)+3*x.get('Ammonia',0))}
def verify(name,r):
 streams={k:{'name':s['name'],'temperature_C':s['temperature_K']-273.15,'pressure_Pa':s['pressure_Pa'],'mass_flow_kg_s':s['mass_flow_kg_s'],'molar_flow_mol_s':s['molar_flow_mol_s'],'enthalpy_kJ_kg':s['phases'][0]['enthalpy_kJ_kg'],'mass_fractions':{c:v['mass_fraction'] for c,v in s['phases'][0]['compounds'].items()},'mole_fractions':{c:v['mole_fraction'] for c,v in s['phases'][0]['compounds'].items()},'vapor_mole_fraction':next((p['fraction'] for p in s['phases'] if p['name']=='Vapor'),0)} for k,s in r['streams'].items()}
 for b in r['balances']:
  close(b['mass_in'],b['mass_out'])
  if not b['reactive']:
   for c in b['components'].values():close(c['in_kg_s'],c['out_kg_s'])
 duties={b['id']:b['heat_to_fluid_kW'] for b in r['balances']}
 close(streams['hotout' if name=='ThermalNetwork' else 'hot']['temperature_C'],70 if name=='ThermalNetwork' else 450,1e-5)
 close(streams['coldout' if name=='ThermalNetwork' else 'cooled']['temperature_C'],15 if name=='ThermalNetwork' else 80,1e-5)
 if not(duties['h1']>0 and duties['c1']<0):raise AssertionError('Signo térmico incorrecto')
 checks={}
 if name=='ThermalNetwork':
  for key,flow in [('s1',2),('hotin',1.3),('coldin',.7),('product',2)]:close(streams[key]['mass_flow_kg_s'],flow)
  for key in ['s1','hotin','coldin','hotout','coldout','product']:
   for c,v in {'Water':.5,'Ethanol':.32,'Acetone':.18}.items():close(streams[key]['mass_fractions'][c],v)
  net=streams['product']['mass_flow_kg_s']*streams['product']['enthalpy_kJ_kg']-sum(streams[k]['mass_flow_kg_s']*streams[k]['enthalpy_kJ_kg'] for k in ['f1','f2'])
  residual=net-duties['h1']-duties['c1'];close(residual,0,1e-4)
  checks={'global_energy_residual_kW':residual,'global_heat_kW':duties['h1']+duties['c1']}
 else:
  close(streams['rfeed']['mass_flow_kg_s'],.8);close(streams['bypass']['mass_flow_kg_s'],.2)
  close(streams['product']['mass_flow_kg_s']+streams['liquid']['mass_flow_kg_s'],1)
  incoming=atoms(streams['feed']);outgoing=[atoms(streams[k]) for k in ['product','liquid']]
  residual={c:incoming[c]-sum(s[c] for s in outgoing) for c in ['N','H']}
  for v in residual.values():close(v,0,TOL_ATOMS)
  n2in=streams['hot']['molar_flow_mol_s']*streams['hot']['mole_fractions']['Nitrogen']
  n2out=sum(streams[k]['molar_flow_mol_s']*streams[k]['mole_fractions']['Nitrogen'] for k in ['vapor','liquid'])
  conversion=(n2in-n2out)/n2in
  if not 0<conversion<1:raise AssertionError('Conversión fuera de rango')
  nh3=sum(streams[k]['mass_flow_kg_s']*streams[k]['mass_fractions']['Ammonia'] for k in ['product','liquid'])
  if nh3<=0:raise AssertionError('No se produjo NH3')
  checks={'global_atom_residual_mol_s':residual,'reactor_nitrogen_conversion':conversion,'ammonia_production_kg_s':nh3,'net_equipment_duty_kW':duties['h1']+duties['reactor']+duties['c1'],'energy_note':'La potencia del reactor procede de DeltaQ e incluye reacción; no se contrasta con entalpías sensibles globales sin incluir formación química.'}
 return {'streams':streams,'balances':r['balances'],'checks':checks}

def main():
 p=argparse.ArgumentParser();p.add_argument('--engine-root',required=True);p.add_argument('--output',required=True);args=p.parse_args()
 report={'portal_version':'0.8.0','utc':datetime.now(timezone.utc).isoformat(),'engine':'Windows · DWSIM MCP 10.2.15','method':'Ejecuciones aisladas mediante server.simulate. Referencias analíticas de materia y comprobación de átomos; sin comparación separada con Automation3 ni validación experimental. Debian no se utilizó.','tolerances':{'mass_kg_s':TOL_MASS,'atoms_mol_s':TOL_ATOMS,'thermal_energy_kW':1e-4},'cases':{}}
 for name in CASES:
  path=ROOT/'site/examples'/f'{name}.json';g=json.loads(path.read_text(encoding='utf-8'))
  with IsolatedEngine(args.engine_root) as engine:r=simulate(engine,g)
  report['cases'][name]={'input_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'model':g['model'],**verify(name,r)}
  print(name+': OK',flush=True)
 output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')
if __name__=='__main__':main()
