"""Contrato y validaciones del compresor; no sustituyen la sonda con motor real."""
import copy,json,unittest
from pathlib import Path
from server import InputError,ports,simulate,validate_graph
ROOT=Path(__file__).parent
CATALOG={'compounds':['Nitrogen'],'models':['Peng-Robinson (PR)'],'engine':'DWSIM 10.2.15'}
def graph():return json.loads((ROOT/'site/examples/CompressorNitrogen.json').read_text(encoding='utf-8'))
class CompressorContract(unittest.TestCase):
 def test_material_and_optional_energy_ports(self):
  self.assertEqual(ports('Compressor'),{'in':('material',1),'out':('material',1),'energy-in':('energy',1)})
  validate_graph(graph(),CATALOG)
 def test_valid_without_energy_stream(self):
  g=graph();g['nodes']=[n for n in g['nodes'] if n['id']!='power'];g['edges']=g['edges'][:2];validate_graph(g,CATALOG)
 def test_pressure_and_efficiency_rejected(self):
  for key,values in [('outlet_pressure_kPa',[0,-3,float('nan'),float('inf')]),('efficiency_pct',[0,101,-2,float('nan')])]:
   for value in values:
    with self.subTest(key=key,value=value):
     g=graph();g['nodes'][1][key]=value
     with self.assertRaises(InputError):validate_graph(g,CATALOG)
 def test_energy_on_material_port_rejected(self):
  g=graph();g['edges'][-1]['toPort']='in'
  with self.assertRaises(InputError):validate_graph(g,CATALOG)
 def test_native_configuration_and_balance(self):
  engine=Stub();r=simulate(engine,graph())
  configured=[kw['properties'] for t,kw in engine.calls if t=='dwsim_unitop_set']
  self.assertEqual(configured,[{'CalcMode':'OutletPressure','ProcessPath':'Adiabatic','POut':300000,'AdiabaticEfficiency':75}])
  self.assertEqual(r['balances'][0]['energy_kind'],'shaft')
  self.assertAlmostEqual(r['balances'][0]['mass_residual'],0)
  self.assertEqual(engine.calls[-1][0],'dwsim_flowsheet_close')
 def test_liquid_feed_result_rejected(self):
  engine=Stub();next(p for p in engine.result['streams']['feed']['phases'] if p['name']=='Vapor')['fraction']=.5
  with self.assertRaisesRegex(InputError,'completamente vapor'):simulate(engine,graph())
  self.assertEqual(engine.calls[-1][0],'dwsim_flowsheet_close')
 def test_expansion_result_rejected(self):
  engine=Stub();engine.result['streams']['product']['pressure_Pa']=50000
  with self.assertRaisesRegex(InputError,'debe superar'):simulate(engine,graph())
 def test_ignored_pressure_result_rejected(self):
  engine=Stub();engine.result['streams']['product']['pressure_Pa']=400000
  with self.assertRaisesRegex(InputError,'no conservó'):simulate(engine,graph())
class Stub:
 def __init__(self):
  self.calls=[];self.result=json.loads((ROOT/'docs/validation/compressor-0.24.0-windows.json').read_text(encoding='utf-8'))['cases']['75']['result']
 def get_catalog(self):return CATALOG
 def call(self,tool,**kw):
  self.calls.append((tool,kw))
  if tool=='dwsim_flowsheet_create':return {'flowsheet_id':'test'}
  if tool=='dwsim_solve_run':return {'ok':True}
  if tool=='dwsim_stream_get_results':return self.result['streams']['feed' if kw['name']=='Nitrógeno entrada' else 'product']
  if tool=='dwsim_unitop_get_results':return self.result['equipment']['compressor']
  return {}
if __name__=='__main__':unittest.main()
