"""Pruebas sin DWSIM para el monitor de gateway."""
import unittest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import Mock, patch
from server import gateway_status, Handler, KINDS, LOCK

class GatewayStatusTests(unittest.TestCase):
    def test_status_snapshot_is_safe_and_complete(self):
        data=gateway_status()
        self.assertEqual(set(data),{'gateway_version','started_at','uptime_s','state','supported_equipment','supported_features'})
        datetime.fromisoformat(data['started_at'].replace('Z','+00:00'))
        self.assertTrue(data['gateway_version'].count('.')==2)
        self.assertGreaterEqual(data['uptime_s'],0)
        self.assertEqual(set(data['supported_equipment']),set(KINDS))
        self.assertIn('simple_material_recycle', data['supported_features'])
        self.assertEqual(data['state'],'ready')
        self.assertNotIn('token',repr(data).lower())
        self.assertNotIn('/home/',repr(data))

    def test_busy_flag_from_actual_simulation_lock(self):
        with patch('server.LOCK') as mock:
            mock.locked.return_value=True
            self.assertEqual(gateway_status()['state'],'busy')

    def test_desktop_catalog_is_available_during_a_calculation(self):
        handler = object.__new__(Handler)
        handler.path = '/api/catalog'
        handler.valid_host = lambda: True
        handler.json_response = Mock()
        catalog = {'compounds': ['Water']}
        handler.server = SimpleNamespace(
            desktop_mode=True, engine=SimpleNamespace(catalog=catalog))
        with LOCK:
            handler.do_GET()
        handler.json_response.assert_called_once_with(200, catalog)

    def test_windows_desktop_capability_check_uses_an_independent_lock(self):
        handler = object.__new__(Handler)
        handler.path = '/api/dynamics/capabilities'
        handler.valid_host = lambda: True
        handler.json_response = Mock()
        handler.server = SimpleNamespace(
            desktop_mode=True, shared_mcp=False, engine=SimpleNamespace(root='test'))
        with LOCK, patch('server.IsolatedEngine'), patch('server.dynamic_capabilities', return_value={'supported': True}):
            handler.do_GET()
        handler.json_response.assert_called_once_with(200, {'supported': True})

if __name__=='__main__':
    unittest.main()
