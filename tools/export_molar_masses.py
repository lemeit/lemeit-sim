"""Exportar masas molares reales desde el runtime Windows de DWSIM."""
import argparse,json,math,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from server import IsolatedEngine
p=argparse.ArgumentParser();p.add_argument('--engine-root',required=True);p.add_argument('--output',required=True);args=p.parse_args()
with IsolatedEngine(args.engine_root) as engine:names=engine.get_catalog()['compounds']
masses={};missing=[]
def batch(items):
 try:
  with IsolatedEngine(args.engine_root) as engine:
   fid=engine.call('dwsim_flowsheet_create',name='Masas molares')['flowsheet_id']
   engine.call('dwsim_thermo_add_compounds',flowsheet_id=fid,names=items)
   data=engine.call('dwsim_flowsheet_get_xml',flowsheet_id=fid)
   if data.get('truncated'):raise ValueError('XML incompleto')
   found={c.findtext('Name'):float(c.findtext('Molar_Weight')) for c in ET.fromstring(data['xml']).findall('./Compounds/Compound')}
   for name in items:
    if found.get(name,0)>0 and math.isfinite(found[name]):masses[name]=found[name]
    else:missing.append(name)
 except Exception:
  if len(items)>1:batch(items[:len(items)//2]);batch(items[len(items)//2:])
  else:missing.extend(items)
for i in range(0,len(names),20):
 batch(names[i:i+20])
 if i%100==0:print(f'{min(i+20,len(names))}/{len(names)} compuestos procesados',flush=True)
Path(args.output).write_text(json.dumps({'engine':'DWSIM MCP 10.2.15','source':'ConstantProperties.Molar_Weight exportado por dwsim_flowsheet_get_xml; sin estimaciones','unit':'g/mol','masses':dict(sorted(masses.items())),'unavailable':missing},ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')
print(f'Exportadas {len(masses)} masas; no disponibles: {len(missing)}',flush=True)
