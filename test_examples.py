"""Verificar coherencia de los cinco ejercicios y sus referencias."""
import json,unittest,copy
from pathlib import Path
from server import validate_graph
from tools.validate_examples import CASES,read_desktop,compare
ROOT=Path(__file__).parent
class ExamplesTests(unittest.TestCase):
 def test_all_cases_pass_graph_validation(self):
  for key in CASES:
   with self.subTest(case=key):
    g=json.loads((ROOT/f'site/examples/{key}.json').read_text(encoding='utf-8'))
    validate_graph(g,{'compounds':['Water','Ethanol'],'models':['Steam Tables (IAPWS-IF97)','NRTL']})
    self.assertTrue(g['learning']);self.assertTrue((ROOT/f'site/examples/dwsim/{key}.dwxml').is_file())
 def test_native_feed_inputs_match_json(self):
  for key in CASES:
   with self.subTest(case=key):
    g=json.loads((ROOT/f'site/examples/{key}.json').read_text(encoding='utf-8'));native=read_desktop(ROOT/f'site/examples/dwsim/{key}.dwxml')
    for n in g['nodes']:
     if n['type']=='MaterialStream' and not any(e['to']==n['id'] for e in g['edges']):
      r=native[n['name']];self.assertAlmostEqual(r['temperature_K'],n['temperature_C']+273.15,places=6);self.assertAlmostEqual(r['mass_flow_kg_s'],n['mass_flow'],places=8)
      for c,v in n['composition'].items():self.assertAlmostEqual(r['composition'][c],v,places=8)
 def test_reference_comparison_detects_a_real_difference(self):
  key='mix';g=json.loads((ROOT/f'site/examples/{key}.json').read_text(encoding='utf-8'));native=json.loads((ROOT/'docs/validation/examples-0.5.0.json').read_text(encoding='utf-8'))['cases'][key]['streams'];streams={}
  for n in g['nodes']:
   if n['type']=='MaterialStream':
    r=native[n['name']];streams[n['id']]={k:r[k] for k in ['temperature_K','pressure_Pa','mass_flow_kg_s']};streams[n['id']]['phases']=[{'enthalpy_kJ_kg':r['enthalpy_kJ_kg'],'density_kg_m3':r['density_kg_m3'],'compounds':{c:{'mass_fraction':v} for c,v in r['composition'].items()}}]
  engine={'streams':streams,'balances':[{'heat_to_fluid_kW':0}]};compare(g,engine,native)
  changed=copy.deepcopy(native);changed['Salida 1']['temperature_K']+=1
  with self.assertRaises(AssertionError):compare(g,engine,changed)
if __name__=='__main__':unittest.main()
