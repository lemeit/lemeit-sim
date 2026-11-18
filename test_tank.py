"""Contrato del tanque. La sonda separada documenta el cálculo con DWSIM real."""
import json,unittest
from pathlib import Path
from server import InputError,ports,simulate,validate_graph
ROOT=Path(__file__).parent
CATALOG={'compounds':['Water'],'models':['Steam Tables (IAPWS-IF97)'],'engine':'DWSIM 10.2.15'}
def graph():return json.loads((ROOT/'site/examples/TankWater.json').read_text(encoding='utf-8'))
class TankContract(unittest.TestCase):
 def test_material_ports_only(self):
  self.assertEqual(ports('Tank'),{'in':('material',1),'out':('material',1)});validate_graph(graph(),CATALOG)
 def test_invalid_volume_and_drop(self):
  for key,values in [('volume_m3',[0,-1,float('nan'),float('inf')]),('pressure_drop_kPa',[-1,float('nan'),float('inf')])]:
   for value in values:
    with self.subTest(key=key,value=value):
     g=graph();g['nodes'][1][key]=value
     with self.assertRaises(InputError):validate_graph(g,CATALOG)
 def test_zero_drop_allowed(self):
  g=graph();g['nodes'][1]['pressure_drop_kPa']=0;validate_graph(g,CATALOG)
 def test_native_parameters_and_residence(self):
  e=Stub();result=simulate(e,graph())
  props=[kw['properties'] for t,kw in e.calls if t=='dwsim_unitop_set']
  self.assertEqual(props,[{'Volume':5,'DeltaP':10000,'IgnorePhase':False}]);self.assertAlmostEqual(result['equipment']['tank']['residence_time_s'],4985.687324640951);self.assertEqual(e.calls[-1][0],'dwsim_flowsheet_close')
 def test_vapor_rejected(self):
  e=Stub();next(p for p in e.result['streams']['feed']['phases'] if p['name']=='Vapor')['fraction']=.5
  with self.assertRaisesRegex(InputError,'líquida sin vapor'):simulate(e,graph())
 def test_pressure_drop_too_large(self):
  g=graph();g['nodes'][1]['pressure_drop_kPa']=300
  with self.assertRaisesRegex(InputError,'menor que la presión'):simulate(Stub(),g)
 def test_ignored_drop_rejected(self):
  e=Stub();e.result['streams']['product']['pressure_Pa']=300000
  with self.assertRaisesRegex(InputError,'no conservó'):simulate(e,graph())
 def test_wrong_residence_rejected(self):
  e=Stub();e.result['equipment']['tank']['properties']['Residence Time']['value']='10'
  with self.assertRaisesRegex(InputError,'no coincide'):simulate(e,graph())
 def test_nonfinite_residence_rejected(self):
  e=Stub();e.result['equipment']['tank']['properties']['Residence Time']['value']='NaN'
  with self.assertRaisesRegex(InputError,'segundos válidos'):simulate(e,graph())
class Stub:
 def __init__(self):self.calls=[];self.result=json.loads((ROOT/'docs/validation/tank-0.25.0-windows.json').read_text(encoding='utf-8'))['cases']['base']['result']
 def get_catalog(self):return CATALOG
 def call(self,tool,**kw):
  self.calls.append((tool,kw))
  if tool=='dwsim_flowsheet_create':return {'flowsheet_id':'test'}
  if tool=='dwsim_solve_run':return {'ok':True}
  if tool=='dwsim_stream_get_results':return self.result['streams']['feed' if kw['name']=='Agua entrada' else 'product']
  if tool=='dwsim_unitop_get_results':return self.result['equipment']['tank']
  return {}
if __name__=='__main__':unittest.main()
