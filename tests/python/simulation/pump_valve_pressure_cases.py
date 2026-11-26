"""Control sin motor de la presión enviada a MCP en Pump y Valve."""
import json
import unittest
from pathlib import Path
from server import simulate

ROOT=Path(__file__).resolve().parents[3]
CATALOG={"compounds":["Water"],"models":["Steam Tables (IAPWS-IF97)"]}

class CapturingMCP:
    def __init__(self):
        self.calls=[]
    def get_catalog(self):
        return CATALOG
    def call(self, tool, **kw):
        self.calls.append((tool,kw))
        if tool=="dwsim_flowsheet_create":
            return {"flowsheet_id":"test"}
        if tool=="dwsim_solve_run":
            raise RuntimeError("FIN_DE_CAPTURA")
        return {}

class PressureMappingTests(unittest.TestCase):
    def test_kpa_to_mcp_bar(self):
        graph=json.loads((ROOT/"site/examples/PumpValve.json").read_text(encoding="utf-8"))
        e=CapturingMCP()
        with self.assertRaisesRegex(RuntimeError,"FIN_DE_CAPTURA"):
            simulate(e,graph)
        sets={kw["name"]:kw["properties"] for tool,kw in e.calls if tool=="dwsim_unitop_set"}
        self.assertAlmostEqual(sets["P1 · Bomba"]["PROP_PU_5"],5.0)
        self.assertAlmostEqual(sets["V1 · Válvula"]["PROP_VA_2"],2.0)
        self.assertAlmostEqual(sets["P1 · Bomba"]["PROP_PU_1"],75)
        self.assertEqual(sets["P1 · Bomba"]["CalcMode"],"OutletPressure")
        self.assertEqual(sets["V1 · Válvula"]["CalcMode"],"OutletPressure")

if __name__=="__main__":
    unittest.main()
