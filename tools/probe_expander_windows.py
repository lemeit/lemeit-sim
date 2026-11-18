"""Validación real y reproducible del expansor con DWSIM Windows aislado."""
import argparse,copy,json,math,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import IsolatedEngine,simulate

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--engine-root',type=Path,required=True)
 p.add_argument('--out',type=Path,default=ROOT/'docs/validation/expander-0.26.0-windows.json')
 args=p.parse_args()
 graph=json.loads((ROOT/'site/examples/ExpanderNitrogen.json').read_text(encoding='utf-8'))
 cases={}
 for efficiency in [60,80,90]:
  g=copy.deepcopy(graph);g['nodes'][1]['efficiency_pct']=efficiency
  with IsolatedEngine(args.engine_root) as engine:result=simulate(engine,g)
  a,b=result['streams']['feed'],result['streams']['product'];balance=result['balances'][0]
  power=float(result['equipment']['expander']['properties']['Power Generated']['value'])
  checks={
   'calculated':result['equipment']['expander']['calculated'] and not result['equipment']['expander']['error'],
   'inlet_vapor':next(p['fraction'] for p in a['phases'] if p['name']=='Vapor')>=1-1e-6,
   'outlet_pressure':math.isclose(b['pressure_Pa'],100000,abs_tol=1),
   'mass_conserved':abs(balance['mass_residual'])<1e-8,
   'temperature_decreases':b['temperature_K']<a['temperature_K'],
   'shaft_power_positive':power>0,
   'energy_balance':math.isclose(power,-balance['heat_to_fluid_kW'],rel_tol=1e-6,abs_tol=1e-6),
   'shaft_label':balance['energy_kind']=='shaft',
  }
  if not all(checks.values()):raise AssertionError(checks)
  cases[str(efficiency)]={'result':result,'checks':checks}
  print(f'{efficiency}%: T={b["temperature_K"]-273.15:.6f} C, P={b["pressure_Pa"]/1000:.3f} kPa, W={power:.6f} kW; {len(checks)} controles OK',flush=True)
 powers=[float(cases[str(x)]['result']['equipment']['expander']['properties']['Power Generated']['value']) for x in [60,80,90]]
 assert powers[0]<powers[1]<powers[2]
 report={'portal':'0.26.0','engine':'DWSIM 10.2.15','platform':'Windows','model':graph['model'],'scope':'real isolated MCP; no experimental validation; Debian not tested','pressure_Pa':100000,'efficiency_order_check':True,'cases':cases}
 args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')
 print('Informe guardado. Sin rutas privadas ni credenciales.')
if __name__=='__main__':main()
