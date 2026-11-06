"""Validación de entradas e integración con el motor real (DWSIM_HOME)."""
import os
import json
import unittest
from pathlib import Path
from server import Engine, IsolatedEngine, InputError, simulate, validate_graph

MODEL = 'Steam Tables (IAPWS-IF97)'
CATALOG = {'models': [MODEL, 'NRTL'], 'compounds': ['Water', 'Ethanol']}


def stream(ident, temperature=20):
    return {'id': ident, 'type': 'MaterialStream', 'name': ident,
            'temperature_C': temperature, 'pressure_kPa': 101.325,
            'mass_flow': 1, 'composition': {'Water': 1}}


def case(kind='Mixer'):
    unit = {'id': 'u', 'name': 'Equipo', 'type': kind, 'outlet_C': 60 if kind == 'Heater' else 30, 'split': .7}
    nodes = [stream('a', 80 if kind == 'Cooler' else 20), unit, stream('b')]
    edges = [{'from': 'a', 'to': 'u'}, {'from': 'u', 'to': 'b'}]
    if kind == 'Mixer':
        nodes.append(stream('c', 80))
        edges.append({'from': 'c', 'to': 'u', 'toIndex': 1})
    if kind == 'Splitter':
        nodes.append(stream('c'))
        edges.append({'from': 'u', 'to': 'c', 'fromIndex': 1})
    return {'version': 1, 'compounds': ['Water'], 'model': MODEL, 'nodes': nodes, 'edges': edges}


class ValidationTests(unittest.TestCase):
    def test_reject_model_for_wrong_fluid(self):
        graph = case()
        graph['compounds'] = ['Water', 'Ethanol']
        with self.assertRaisesRegex(InputError, 'agua pura'): validate_graph(graph, CATALOG)

    def test_reject_nonconserving_composition(self):
        graph = case()
        graph['nodes'][0]['composition']['Water'] = .5
        with self.assertRaisesRegex(InputError, 'sumar 1'): validate_graph(graph, CATALOG)

    def test_reject_shared_port(self):
        graph = case()
        graph['edges'][-1].pop('toIndex')
        with self.assertRaisesRegex(InputError, 'más de una conexión'): validate_graph(graph, CATALOG)

    def test_reject_nonfinite_input(self):
        graph = case()
        graph['nodes'][0]['mass_flow'] = float('nan')
        with self.assertRaises(InputError): validate_graph(graph, CATALOG)

    def test_reject_cycles(self):
        graph = case('Heater')
        graph['nodes'].append({'id': 'u2', 'type': 'Heater', 'name': 'Otro', 'outlet_C': 30})
        graph['edges'] += [{'from': 'b', 'to': 'u2'}, {'from': 'u2', 'to': 'a'}]
        with self.assertRaisesRegex(InputError, 'recirculaciones'): validate_graph(graph, CATALOG)

    def test_reject_script_equipment(self):
        graph = case()
        graph['nodes'][1]['type'] = 'PythonScript'
        with self.assertRaisesRegex(InputError, 'no admitido'): validate_graph(graph, CATALOG)


@unittest.skipUnless(os.environ.get('DWSIM_HOME'), 'Definir DWSIM_HOME para integración real')
class EngineIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.engine = Engine(os.environ['DWSIM_HOME'])

    def test_adiabatic_mixing(self):
        result = simulate(self.engine, case())
        self.assertAlmostEqual(result['streams']['b']['mass_flow_kg_s'], 2, places=7)
        self.assertAlmostEqual(result['streams']['b']['temperature_K'], 323.17138676, places=5)
        self.assertLess(abs(result['balances'][0]['heat_to_fluid_kW']), 1e-4)

    def test_heater_with_energy_stream(self):
        graph = case('Heater')
        graph['nodes'].append({'id': 'q', 'name': 'Calor', 'type': 'EnergyStream'})
        graph['edges'].append({'from': 'q', 'to': 'u', 'toPort': 'energy-in'})
        result = simulate(self.engine, graph)
        self.assertAlmostEqual(result['streams']['b']['temperature_K'], 333.15, places=5)
        self.assertGreater(result['balances'][0]['heat_to_fluid_kW'], 160)
        self.assertAlmostEqual(result['balances'][0]['mass_residual'], 0, places=8)

    def test_cooling(self):
        result = simulate(self.engine, case('Cooler'))
        self.assertAlmostEqual(result['streams']['b']['temperature_K'], 303.15, places=5)
        self.assertLess(result['balances'][0]['heat_to_fluid_kW'], -200)

    def test_splitter_conserves_mass(self):
        result = simulate(self.engine, case('Splitter'))
        self.assertAlmostEqual(result['streams']['b']['mass_flow_kg_s'], .7, places=7)
        self.assertAlmostEqual(result['streams']['c']['mass_flow_kg_s'], .3, places=7)
        self.assertAlmostEqual(result['balances'][0]['mass_residual'], 0, places=8)

    def test_real_binary_mixture_and_component_balance(self):
        graph = case()
        graph['compounds'] = ['Water', 'Ethanol']
        graph['model'] = 'NRTL'
        graph['nodes'][0]['composition'] = {'Water': .8, 'Ethanol': .2}
        graph['nodes'][-1]['composition'] = {'Water': .3, 'Ethanol': .7}
        result = simulate(self.engine, graph)
        compounds = result['streams']['b']['phases'][0]['compounds']
        self.assertAlmostEqual(compounds['Water']['mass_fraction'], .55, places=6)
        self.assertAlmostEqual(compounds['Ethanol']['mass_fraction'], .45, places=6)
        for balance in result['balances'][0]['components'].values():
            self.assertLess(abs(balance['residual_kg_s']), 1e-6)


@unittest.skipUnless(os.environ.get('DWSIM_HOME'), 'Definir DWSIM_HOME para integración real')
class IsolatedIntegrationTests(unittest.TestCase):
    def test_isolated_water_mixing(self):
        with IsolatedEngine(os.environ['DWSIM_HOME']) as engine:
            result = simulate(engine, case())
            process = engine.process
        self.assertIsNotNone(process.poll())
        self.assertAlmostEqual(result['streams']['b']['mass_flow_kg_s'], 2, places=7)

    def test_conversion_and_heat_of_reaction(self):
        graph = json.loads((Path(__file__).parent/'site/examples/ConversionReactor.json').read_text(encoding='utf-8'))
        with IsolatedEngine(os.environ['DWSIM_HOME']) as engine: result = simulate(engine, graph)
        self.assertAlmostEqual(result['balances'][0]['mass_residual'], 0, places=7)
        self.assertLess(result['balances'][0]['heat_to_fluid_kW'], -6000)
        self.assertGreater(result['streams']['vapor']['phases'][0]['compounds']['Water']['mass_fraction'], .49)
        self.assertTrue(result['balances'][0]['reactive'])

    def test_chemical_equilibrium(self):
        graph = json.loads((Path(__file__).parent/'site/examples/EquilibriumReactor.json').read_text(encoding='utf-8'))
        with IsolatedEngine(os.environ['DWSIM_HOME']) as engine: result = simulate(engine, graph)
        self.assertAlmostEqual(result['balances'][0]['mass_residual'], 0, places=7)
        ammonia = result['streams']['vapor']['phases'][0]['compounds']['Ammonia']['mass_fraction']
        self.assertGreater(ammonia, 0)
        self.assertLess(ammonia, 1)

    def test_reject_unbalanced_reaction(self):
        graph = json.loads((Path(__file__).parent/'site/examples/ConversionReactor.json').read_text(encoding='utf-8'))
        graph['nodes'][1]['stoichiometry']['Water'] = 1
        with IsolatedEngine(os.environ['DWSIM_HOME']) as engine:
            with self.assertRaisesRegex(InputError, 'does not balance'): simulate(engine, graph)


if __name__ == '__main__': unittest.main()
