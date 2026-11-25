import unittest
from dynamic_tank_mcp import capabilities, run_tank, DynamicInputError, REQUIRED


class FakeDynamicMcp:
    def __init__(self, missing=None, ready=True, run_ok=True):
        self.calls = []
        self.missing = set(missing or ())
        self.ready = ready
        self.run_ok = run_ok
        self.closed = False

    def rpc(self, method, params=None):
        self.calls.append((method, params))
        if method != 'tools/list':
            raise AssertionError(method)
        return {'tools': [{'name': n} for n in REQUIRED - self.missing]}

    def call(self, tool, **kw):
        self.calls.append((tool, kw))
        if tool == 'dwsim_flowsheet_create':
            return {'flowsheet_id': 'mock-session'}
        if tool == 'dwsim_flowsheet_close':
            self.closed = True
            return {'closed': True}
        if tool == 'dwsim_solve_run':
            return {'ok': True}
        if tool == 'dwsim_dynamics_properties':
            if kw['tag'] == 'T-01':
                return {'properties': [{'id': 'LevelOfLiquid', 'description': 'Liquid Level', 'units': 'm', 'dynamic': True}]}
            return {'properties': [{'id': 'PROP_MS_2', 'description': 'Mass Flow', 'units': 'kg/s'}]}
        if tool == 'dwsim_dynamics_check':
            return {'ready': self.ready, 'findings': [{'message': 'Falta presión'}]}
        if tool == 'dwsim_dynamics_run':
            return {'started': self.run_ok, 'run_id': 'mock-run'}
        if tool == 'dwsim_dynamics_status':
            return {'state': 'completed'}
        if tool == 'dwsim_dynamics_series':
            return {'t_s': [0, 60, 120, 600], 'series': {
                'T-01.Liquid Level': {'units': 'm', 'values': [0, .23, .3, .333]},
                'Outlet.PROP_MS_2': {'units': 'kg/s', 'values': [0, 8.4, 9.4, 10]}
            }, 'decimated_from': 121}
        return {'ok': True}


class DynamicMcpTests(unittest.TestCase):
    def test_discovery_does_not_expose_secrets(self):
        engine = FakeDynamicMcp()
        reply = capabilities(engine)
        self.assertTrue(reply['supported'])
        self.assertNotIn('token', reply)
        self.assertEqual(reply['missing_tools'], [])

    def test_missing_tools_block_real_run(self):
        engine = FakeDynamicMcp(missing={'dwsim_dynamics_series'})
        with self.assertRaisesRegex(DynamicInputError, 'dwsim_dynamics_series'):
            run_tank(engine)
        self.assertFalse(engine.closed)

    def test_real_series_from_mock_engine_is_labeled_and_closed(self):
        engine = FakeDynamicMcp()
        result = run_tank(engine)
        self.assertTrue(engine.closed)
        self.assertEqual(result['source'], 'dwsim-mcp-dynamics')
        self.assertEqual(len(result['points']), 4)
        self.assertAlmostEqual(result['points'][-1]['level_m'], .333)
        self.assertAlmostEqual(result['points'][-1]['volume_m3'], .333)
        self.assertAlmostEqual(result['points'][-1]['outlet_kg_s'], 10)
        self.assertEqual(result['decimated_from'], 121)
        call_names = [name for name, _ in engine.calls]
        self.assertLess(call_names.index('dwsim_dynamics_setup'), call_names.index('dwsim_dynamics_run'))
        self.assertIn('dwsim_dynamics_monitor', call_names)
        monitor = next(kw for name,kw in engine.calls if name == 'dwsim_dynamics_monitor')
        self.assertEqual(monitor['variables'], ['T-01.LevelOfLiquid', 'Outlet.PROP_MS_2'])
        self.assertIn('dwsim_dynamics_check', call_names)
        self.assertIn('dwsim_dynamics_series', call_names)

    def test_readiness_failure_is_not_silently_faked(self):
        engine = FakeDynamicMcp(ready=False)
        with self.assertRaisesRegex(DynamicInputError, 'DWSIM bloqueó'):
            run_tank(engine)
        self.assertTrue(engine.closed)

    def test_invalid_configuration_rejected_before_mcp(self):
        engine = FakeDynamicMcp()
        for payload in ({'capacity_m3': 0}, {'step_s': 0},
                        {'step_s': 0.5, 'duration_s': 600},
                        {'feed_pressure_kPa': 101.325}, {'other': 9}):
            with self.subTest(payload=payload):
                with self.assertRaises(DynamicInputError):
                    run_tank(engine, payload)
        self.assertFalse(engine.calls)


if __name__ == '__main__':
    unittest.main()
