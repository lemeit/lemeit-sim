"""Pruebas del reciclado estacionario elemental sin requerir un motor DWSIM."""
import copy
import json
import unittest
from pathlib import Path
from recycle import simple_recycle_shape, solve_simple_recycle, RecycleError
from server import validate_graph, InputError

ROOT=Path(__file__).parent

def case():
    return json.loads((ROOT/'site/examples/RecycleWater.json').read_text(encoding='utf-8'))

def fake_open(graph):
    by_id={n['id']:n for n in graph['nodes']}
    f=by_id['fresh']['mass_flow']
    guess=by_id['tearRecycle']['mass_flow']
    total=f+guess
    product=.6*total
    recycle=.4*total
    def stream(flow):
        return {'mass_flow_kg_s':flow,'temperature_K':298.15,'pressure_Pa':101325,
                'phases':[{'compounds':{'Water':{'mass_fraction':1.0}}}]}
    return {'streams':{name:stream(value) for name,value in
                       [('fresh',f),('tearRecycle',guess),('mixed',total),('product',product),('recycle',recycle)]},
            'equipment':{},'balances':[], 'elapsed_s':0.01,'engine':'mock','model':graph['model']}

class RecycleTests(unittest.TestCase):
    def test_case_is_valid_and_shape_detected(self):
        graph=case()
        validate_graph(graph,{'compounds':['Water'],'models':['Steam Tables (IAPWS-IF97)']})
        shape=simple_recycle_shape(graph)
        self.assertEqual(shape['recycle'],'recycle')
        self.assertEqual(shape['product'],'product')

    def test_solution_matches_analytic_matter_balance(self):
        graph=case()
        shape=simple_recycle_shape(graph)
        result=solve_simple_recycle(graph,shape,fake_open)
        streams=result['streams']
        self.assertAlmostEqual(streams['fresh']['mass_flow_kg_s'],1,places=6)
        self.assertAlmostEqual(streams['product']['mass_flow_kg_s'],1,places=6)
        self.assertAlmostEqual(streams['mixed']['mass_flow_kg_s'],5/3,places=6)
        self.assertAlmostEqual(streams['recycle']['mass_flow_kg_s'],2/3,places=6)
        self.assertNotIn('tearRecycle',streams)
        self.assertEqual(result['recycle']['mode'],'simple_material')
        self.assertLessEqual(result['recycle']['iterations'],5)

    def test_80_percent_product_and_convergence_with_modified_ratio(self):
        graph=case();next(n for n in graph['nodes'] if n['id']=='d1')['split']=.8
        shape=simple_recycle_shape(graph)
        def solve(graph):
            result=fake_open(graph)
            result['streams']['product']['mass_flow_kg_s']=.8*(1+next(n for n in graph['nodes'] if n['id']=='tearRecycle')['mass_flow'])
            result['streams']['recycle']['mass_flow_kg_s']=.2*(1+next(n for n in graph['nodes'] if n['id']=='tearRecycle')['mass_flow'])
            return result
        result=solve_simple_recycle(graph,shape,solve)
        self.assertAlmostEqual(result['streams']['recycle']['mass_flow_kg_s'],.25,places=6)

    def test_rejects_unspecified_cycles_and_reactions(self):
        graph=case()
        graph['nodes'].append({'id':'r1','type':'ConversionReactor','name':'Reactor','x':90,'y':400})
        self.assertIsNone(simple_recycle_shape(graph))
        with self.assertRaisesRegex(InputError,'Recirculación no admitida'):
            validate_graph(graph,{'compounds':['Water'],'models':['Steam Tables (IAPWS-IF97)']})

    def test_rejects_near_complete_recycle_and_nonconvergence(self):
        graph=case();next(n for n in graph['nodes'] if n['id']=='d1')['split']=.01
        with self.assertRaisesRegex(RecycleError,'fracción de producto'):
            solve_simple_recycle(graph,simple_recycle_shape(graph),fake_open)
        graph=case()
        def inconsistent(g):
            result=fake_open(g)
            result['streams']['recycle']['temperature_K']=320.0
            return result
        with self.assertRaisesRegex(RecycleError,'no convergió'):
            solve_simple_recycle(graph,simple_recycle_shape(graph),inconsistent,max_iterations=2)

if __name__=='__main__':unittest.main()
