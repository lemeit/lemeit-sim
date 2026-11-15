"""Pruebas sin DWSIM para el monitor de gateway."""
import unittest
from datetime import datetime
from unittest.mock import patch
from server import gateway_status, KINDS

class GatewayStatusTests(unittest.TestCase):
    def test_status_snapshot_is_safe_and_complete(self):
        data=gateway_status()
        self.assertEqual(set(data),{'gateway_version','started_at','uptime_s','state','supported_equipment'})
        datetime.fromisoformat(data['started_at'].replace('Z','+00:00'))
        self.assertTrue(data['gateway_version'].count('.')==2)
        self.assertGreaterEqual(data['uptime_s'],0)
        self.assertEqual(set(data['supported_equipment']),set(KINDS))
        self.assertEqual(data['state'],'ready')
        self.assertNotIn('token',repr(data).lower())
        self.assertNotIn('/home/',repr(data))

    def test_busy_flag_from_actual_simulation_lock(self):
        with patch('server.LOCK') as mock:
            mock.locked.return_value=True
            self.assertEqual(gateway_status()['state'],'busy')

if __name__=='__main__':
    unittest.main()
