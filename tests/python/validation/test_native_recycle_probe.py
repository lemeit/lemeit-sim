"""Pruebas de protocolo; no afirman validar la física de DWSIM."""
import unittest
from tools.probe_recycle_native import native_probe, EXPECTED

class FakeEngine:
    def __init__(self, bad=False, fails=False):
        self.calls=[];self.bad=bad;self.fails=fails
    def call(self, tool, **kwargs):
        self.calls.append((tool,kwargs))
        if tool=='dwsim_flowsheet_create':return {'flowsheet_id':'f-test'}
        if tool=='dwsim_solve_run':
            return {'ok':not self.fails, 'errors':['No convergence'] if self.fails else []}
        if tool=='dwsim_stream_get_results':
            val={**EXPECTED, 'R2':EXPECTED['R1']}[kwargs['name']]
            if self.bad and kwargs['name']=='R2':val=.4
            return {'mass_flow_kg_s':val}
        if tool=='dwsim_unitop_get_results':
            return {'calculated':True,'error':None}
        return {}

class NativeRecycleProbeTests(unittest.TestCase):
    def test_recycle_tool_connections_and_cleanup(self):
        m=FakeEngine()
        result=native_probe(m)
        self.assertTrue(result['reference_match'])
        self.assertEqual([kw['type'] for tool,kw in m.calls if tool=='dwsim_unitop_add'],
                         ['Mixer','Splitter','Recycle'])
        connections=[kw for tool,kw in m.calls if tool=='dwsim_unitop_connect' and kw['unitop']=='RC1']
        self.assertEqual([x.get('feed_stream') or x.get('product_stream') for x in connections],['R1','R2'])
        self.assertEqual(m.calls[-1][0],'dwsim_flowsheet_close')
    def test_mismatch_never_passes(self):
        result=native_probe(FakeEngine(bad=True))
        self.assertFalse(result['reference_match'])
        self.assertGreater(abs(result['residuals_kg_s']['recycle']), .1)
    def test_windows_observed_values_with_explicit_tolerance(self):
        observed={'F1':1.0,'F2':1.6667016192,'P1':1.00002097152,
                  'R1':0.66668064768,'R2':0.66668064768}
        class ObservedEngine(FakeEngine):
            def call(self,tool,**kwargs):
                if tool=='dwsim_stream_get_results':
                    return {'mass_flow_kg_s':observed[kwargs['name']]}
                return super().call(tool,**kwargs)
        m=ObservedEngine()
        result=native_probe(m)
        self.assertTrue(result['reference_match'])
        self.assertLess(result['max_balance_residual_kg_s'],5e-5)
        self.assertGreater(result['max_deviation_kg_s'],1e-5)
        self.assertFalse(native_probe(ObservedEngine(),mass_tolerance_kg_s=1e-5)['reference_match'])
    def test_failure_closes_flowsheet(self):
        m=FakeEngine(fails=True)
        with self.assertRaisesRegex(RuntimeError, 'No convergence'):
            native_probe(m)
        self.assertEqual(m.calls[-1][0],'dwsim_flowsheet_close')

if __name__=='__main__': unittest.main()
