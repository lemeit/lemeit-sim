"""Comparar los ejemplos de ΣIM con la API oficial del DWSIM instalado."""
import argparse,json,math,os,subprocess,sys,xml.etree.ElementTree as ET
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import IsolatedEngine,simulate
CASES=['mix','HeaterWater','CoolerWater','SplitterWater','WaterEthanol']
TOL={'temperature_K':1e-4,'pressure_Pa':.1,'mass_flow_kg_s':1e-8,'enthalpy_kJ_kg':1e-4,'density_kg_m3':1e-3,'mass_fraction':1e-8}
def read_desktop(path):
 root=ET.parse(path).getroot();tags={g.findtext('Name'):g.findtext('Tag') for g in root.findall('./GraphicObjects/GraphicObject')};out={}
 for obj in root.findall('./SimulationObjects/SimulationObject'):
  if 'MaterialStream' not in obj.findtext('Type',''):continue
  phase=next(p for p in obj.findall('./Phases/Phase') if p.findtext('ID')=='0');props=phase.findall('Properties')[-1]
  out[tags[obj.findtext('Name')]]={dest:float(props.findtext(src)) for dest,src in [('temperature_K','temperature'),('pressure_Pa','pressure'),('mass_flow_kg_s','massflow'),('enthalpy_kJ_kg','enthalpy'),('density_kg_m3','density')]}
  out[tags[obj.findtext('Name')]]['composition']={c.findtext('Name'):float(c.findtext('MassFraction')) for c in next(c for c in phase.findall('Compounds') if c.find('Compound') is not None).findall('Compound')}
 return out
def compare(graph,engine,desktop):
 maxima={key:0.0 for key in TOL}
 for n in graph['nodes']:
  if n['type']!='MaterialStream':continue
  a=engine['streams'][n['id']];b=desktop[n['name']]
  for key in list(TOL)[:-1]:
   av=a[key] if key in a else a['phases'][0][key];difference=abs(av-b[key]);maxima[key]=max(maxima[key],difference)
   if not math.isfinite(difference) or difference>TOL[key]:raise AssertionError(f'{n["name"]}: diferencia en {key}: {difference}')
  for compound in graph['compounds']:
   difference=abs(a['phases'][0]['compounds'][compound]['mass_fraction']-b['composition'][compound]);maxima['mass_fraction']=max(maxima['mass_fraction'],difference)
   if not math.isfinite(difference) or difference>TOL['mass_fraction']:raise AssertionError('Diferencia de composición')
 unit=next(n for n in graph['nodes'] if not n['type'].endswith('Stream'));byid={n['id']:n for n in graph['nodes']}
 incoming=[desktop[byid[e['from']]['name']] for e in graph['edges'] if e['to']==unit['id'] and byid[e['from']]['type']=='MaterialStream'];outgoing=[desktop[byid[e['to']]['name']] for e in graph['edges'] if e['from']==unit['id'] and byid[e['to']]['type']=='MaterialStream']
 heat=sum(s['mass_flow_kg_s']*s['enthalpy_kJ_kg'] for s in outgoing)-sum(s['mass_flow_kg_s']*s['enthalpy_kJ_kg'] for s in incoming)
 if abs(heat-engine['balances'][0]['heat_to_fluid_kW'])>1e-4:raise AssertionError('Diferencia en potencia térmica')
 return {'case':graph['title'],'model':graph['model'],'max_abs_difference':maxima,'streams':desktop,'heat_to_fluid_kW':heat,'mass_residual_kg_s':sum(s['mass_flow_kg_s'] for s in outgoing)-sum(s['mass_flow_kg_s'] for s in incoming)}
def main():
 p=argparse.ArgumentParser();p.add_argument('--engine-root',required=True);p.add_argument('--desktop-root',default=str(Path(os.environ.get('LOCALAPPDATA',''))/'Programs/DWSIM'));p.add_argument('--output',required=True);args=p.parse_args();output=Path(args.output).resolve();output.mkdir(parents=True,exist_ok=True)
 report={'simulator':'ΣIM','version':json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['version'],'engine':'DWSIM MCP 10.2.15','reference':'DWSIM Open Source instalado 10.2.15.0 · Automation3','method':'Procesos aislados por caso. Archivos nativos con las mismas entradas; recálculo explícito por API de la instalación local. No son mediciones experimentales ni validación independiente del modelo físico.','utc':datetime.now(timezone.utc).isoformat(),'tolerances_absolute':TOL,'cases':{}}
 for key in CASES:
  graph=json.loads((ROOT/f'site/examples/{key}.json').read_text(encoding='utf-8'));dest=output/f'{key}-reference.dwxml'
  result=subprocess.run(['pwsh','-NoProfile','-File',str(ROOT/'tools/run-desktop-reference.ps1'),'-InputFile',str(ROOT/f'site/examples/dwsim/{key}.dwxml'),'-OutputFile',str(dest),'-DesktopHome',args.desktop_root],capture_output=True,text=True,timeout=60)
  if result.returncode:raise RuntimeError(result.stdout+result.stderr)
  with IsolatedEngine(args.engine_root) as engine:r=simulate(engine,graph)
  report['cases'][key]=compare(graph,r,read_desktop(dest));print(key+': OK',flush=True)
 (output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')
if __name__=='__main__':main()
