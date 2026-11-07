"""Corrientes 0.2: validación y comparación de estados con el motor real."""
import copy
import os
import unittest
from server import IsolatedEngine, InputError, simulate, validate_graph
from test_server import case, CATALOG

class StreamValidation(unittest.TestCase):
    def test_active_flash_inputs_only(self):
        g=case('Heater'); n=g['nodes'][0]; n.update(flash_spec='PH',enthalpy_kJ_kg=209.4); n.pop('temperature_C')
        validate_graph(g,CATALOG)
        n['flash_spec']='TP'
        with self.assertRaises(InputError):validate_graph(g,CATALOG)
    def test_reject_ps_iapws_discrepancy(self):
        g=case('Heater');g['nodes'][0].update(flash_spec='PS',entropy_kJ_kgK=.7)
        with self.assertRaisesRegex(InputError,'discrepancia'):validate_graph(g,CATALOG)
    def test_reject_invalid_spec_fraction_and_basis(self):
        for values in ({'flash_spec':'invalid'},{'flash_spec':'PV','vapor_fraction':1.1},{'flow_basis':'volume'},{'composition_basis':'unknown'},{'flow_basis':'molar','molar_flow':0}):
            with self.subTest(values=values):
                g=case('Heater');g['nodes'][0].update(values)
                with self.assertRaises(InputError):validate_graph(g,CATALOG)

@unittest.skipUnless(os.environ.get('DWSIM_HOME'),'DWSIM_HOME requerido')
class RealStreams(unittest.TestCase):
    def solve(self,g):
        with IsolatedEngine(os.environ['DWSIM_HOME']) as engine:return simulate(engine,g)
    def test_flash_round_trip_tp_ph_ps(self):
        g=case('Heater');g['nodes'][0]['temperature_C']=50
        ref=self.solve(g)['streams']['a']; mixture=ref['phases'][0]
        for spec,key,property in [('PH','enthalpy_kJ_kg','enthalpy_kJ_kg'),('PS','entropy_kJ_kgK','entropy_kJ_kgK')]:
            with self.subTest(spec=spec):
                h=copy.deepcopy(g)
                if spec=='PS':
                    h['model']='NRTL';ref=self.solve(h)['streams']['a'];mixture=ref['phases'][0]
                h['nodes'][0].update(flash_spec=spec,**{key:mixture[property]});h['nodes'][0].pop('temperature_C')
                r=self.solve(h)['streams']['a'];self.assertAlmostEqual(r['temperature_K'],ref['temperature_K'],places=3)
    def test_pv_tv_same_saturated_state(self):
        g=case('Heater');g['nodes'][0].update(flash_spec='PV',vapor_fraction=.25)
        a=self.solve(g)['streams']['a'];self.assertAlmostEqual(next(p['fraction'] for p in a['phases'] if p['name']=='Vapor'),.25,places=5)
        g['nodes'][0].update(flash_spec='TV',temperature_C=a['temperature_K']-273.15)
        b=self.solve(g)['streams']['a'];self.assertAlmostEqual(b['pressure_Pa']/a['pressure_Pa'],1,places=4)
    def test_molar_composition_and_flow_match_mass_input(self):
        g=case('Heater');g.update(compounds=['Water','Ethanol'],model='NRTL');g['nodes'][0].update(composition_basis='molar',composition={'Water':.5,'Ethanol':.5},flow_basis='molar',molar_flow=10)
        original=self.solve(g);a=original['streams']['a'];self.assertAlmostEqual(a['molar_flow_mol_s'],10,places=6)
        expected=.5*18.01528/(.5*18.01528+.5*46.06844)
        self.assertAlmostEqual(a['phases'][0]['compounds']['Water']['mass_fraction'],expected,places=7)
        self.assertAlmostEqual(a['phases'][0]['compounds']['Water']['mole_fraction'],.5,places=7)
        g['nodes'][0].update(composition_basis='mass',composition={'Water':expected,'Ethanol':1-expected},flow_basis='mass',mass_flow=a['mass_flow_kg_s'])
        equivalent=self.solve(g);b=equivalent['streams']['b'];c=original['streams']['b'];self.assertAlmostEqual(b['temperature_K'],c['temperature_K'],places=6)
        self.assertAlmostEqual(equivalent['streams']['a']['molar_flow_mol_s'],10,places=6)

if __name__=='__main__':unittest.main()
