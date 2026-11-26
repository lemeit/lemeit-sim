"""Regresión de nuevos casos didácticos: referencias analíticas, no prueba real del solver."""
import json
import unittest
from pathlib import Path
from recycle import simple_recycle_shape
from server import validate_graph

ROOT = Path(__file__).resolve().parents[3]

class RecycleTutorialExamples(unittest.TestCase):
    def test_new_cases_are_valid_simple_recycle_graphs(self):
        for key, ratio in (('Recycle7030', 0.7), ('Recycle5050', 0.5)):
            with self.subTest(case=key):
                graph = json.loads((ROOT / 'site' / 'examples' / (key + '.json')).read_text(encoding='utf-8'))
                validate_graph(graph, {'compounds':['Water'], 'models':['Steam Tables (IAPWS-IF97)']})
                shape = simple_recycle_shape(graph)
                self.assertIsNotNone(shape)
                by_id = {node['id']:node for node in graph['nodes']}
                self.assertAlmostEqual(by_id[shape['splitter']]['split'], ratio)
                fresh = by_id[shape['fresh']]
                self.assertAlmostEqual(fresh['temperature_C'] + 273.15, 300, places=6)
                self.assertAlmostEqual(fresh['mass_flow'], 1)
                total = fresh['mass_flow'] / ratio
                recycle = total * (1 - ratio)
                self.assertAlmostEqual(total - recycle, fresh['mass_flow'])
                self.assertEqual({node['type'] for node in graph['nodes']}, {'Mixer','Splitter','MaterialStream'})
                self.assertIn('referencia', graph['learning'].lower())
    def test_cases_and_guides_are_listed(self):
        page = (ROOT/'site/index.html').read_text(encoding='utf-8')
        guide = (ROOT/'site/ejemplos.html').read_text(encoding='utf-8')
        for key in ('Recycle7030', 'Recycle5050'):
            self.assertIn('data-example="'+key+'"', page)
            self.assertIn('<option value="'+key+'">', page)
            self.assertIn('<section id="'+key+'">', guide)
            self.assertIn('examples/'+key+'.json', guide)
        self.assertIn('https://dwsim.org/tutorials/en/intermediate/04-recycle-loops.html', guide)
        self.assertIn('no reproduce exactamente el tutorial', guide.lower())

if __name__ == '__main__':
    unittest.main()
