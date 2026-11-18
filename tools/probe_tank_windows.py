"""Sonda reproducible del tanque estacionario con DWSIM Windows aislado."""
import argparse,copy,json,math,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import IsolatedEngine,simulate

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--engine-root',type=Path,required=True);p.add_argument('--out',type=Path,default=ROOT/'docs/validation/tank-0.25.0-windows.json');args=p.parse_args()
 graph=json.loads((ROOT/'site/examples/TankWater.json').read_text(encoding='utf-8'));cases={}
 for name,volume,drop in [('base',5,10),('small',1,10),('no_drop',5,0)]:
  g=copy.deepcopy(graph);g['nodes'][1].update(volume_m3=volume,pressure_drop_kPa=drop)
  with IsolatedEngine(args.engine_root) as engine:result=simulate(engine,g)
  a,b=result['streams']['feed'],result['streams']['product'];u=result['equipment']['tank'];bal=result['balances'][0]
  expected_tau=volume*a['phases'][0]['density_kg_m3']/a['mass_flow_kg_s']
  checks={'calculated':u['calculated'] and not u['error'],'liquid_feed':next(p['fraction'] for p in a['phases'] if p['name']=='Vapor')<1e-6,'pressure':math.isclose(b['pressure_Pa'],300000-drop*1000,abs_tol=1),'mass':abs(bal['mass_residual'])<1e-8,'enthalpy':math.isclose(a['phases'][0]['enthalpy_kJ_kg'],b['phases'][0]['enthalpy_kJ_kg'],abs_tol=1e-5),'residence':math.isclose(u['residence_time_s'],expected_tau,rel_tol=1e-6),'positive_residence':u['residence_time_s']>0,'negligible_external_energy':abs(bal['heat_to_fluid_kW'])<1e-5}
  assert all(checks.values()),checks
  cases[name]={'volume_m3':volume,'pressure_drop_kPa':drop,'result':result,'checks':checks}
  print(f'{name}: P={b["pressure_Pa"]/1000:.3f} kPa, T={b["temperature_K"]-273.15:.6f} C, residencia={u["residence_time_s"]:.6f} s; {len(checks)} controles OK',flush=True)
 assert math.isclose(cases['base']['result']['equipment']['tank']['residence_time_s'],5*cases['small']['result']['equipment']['tank']['residence_time_s'],rel_tol=1e-6)
 args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps({'portal':'0.25.0','engine':'DWSIM 10.2.15','platform':'Windows','model':graph['model'],'scope':'steady state liquid only; no dynamic or experimental validation; Debian not tested','volume_scaling_check':True,'cases':cases},ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')
if __name__=='__main__':main()
