"""Pruebas de contrato del separador flash. No requieren DWSIM."""
import json
import unittest
from pathlib import Path

from server import InputError, ports, simulate, validate_graph

ROOT = Path(__file__).resolve().parent
GRAPH = ROOT / "site/examples/FlashDrum.json"
CATALOG = {"compounds": ["Water", "Ethanol"], "models": ["NRTL"], "engine": "DWSIM 10.2.15"}


def case():
    return json.loads(GRAPH.read_text(encoding="utf-8"))


class SeparatorContractTests(unittest.TestCase):
    def test_ports_one_input_two_material_outputs(self):
        self.assertEqual(ports("Separator")["in"], ("material", 1))
        self.assertEqual(ports("Separator")["out"], ("material", 2))

    def test_example_validates(self):
        graph = case()
        by_id = validate_graph(graph, CATALOG)
        self.assertEqual(graph["model"], "NRTL")
        self.assertEqual(graph["compounds"], ["Water", "Ethanol"])
        self.assertEqual(by_id["flash"]["type"], "Separator")
        self.assertEqual(sorted(e.get("fromIndex", 0) for e in graph["edges"] if e["from"] == "flash"), [0, 1])

    def test_rejects_missing_liquid_outlet(self):
        graph = case()
        graph["edges"] = [e for e in graph["edges"] if e["to"] != "liquid"]
        graph["nodes"] = [n for n in graph["nodes"] if n["id"] != "liquid"]
        with self.assertRaisesRegex(InputError, "vapor.*líquido"):
            validate_graph(graph, CATALOG)

    def test_rejects_shared_outlet_port(self):
        graph = case()
        for edge in graph["edges"]:
            if edge["to"] == "liquid":
                edge["fromIndex"] = 0
        with self.assertRaisesRegex(InputError, "más de una conexión"):
            validate_graph(graph, CATALOG)

    def test_rejects_extra_inlet(self):
        graph = case()
        graph["nodes"].append({
            "id": "extra", "name": "F2 · Extra", "type": "MaterialStream",
            "temperature_C": 25, "pressure_kPa": 101.325,
            "mass_flow": 1, "composition": {"Water": 0.5, "Ethanol": 0.5}
        })
        graph["edges"].append({"from": "extra", "to": "flash", "toIndex": 1})
        with self.assertRaisesRegex(InputError, "puerto inválido"):
            validate_graph(graph, CATALOG)

    def test_backend_sends_separator_type_to_mcp(self):
        """Confirma la invocación, NO que el motor acepte el tipo en tiempo real."""
        class StopAtSeparator:
            def __init__(self):
                self.calls = []
            def get_catalog(self):
                return CATALOG
            def call(self, tool, **kwargs):
                self.calls.append((tool, kwargs))
                if tool == "dwsim_flowsheet_create":
                    return {"flowsheet_id": "mock"}
                if tool == "dwsim_unitop_add" and kwargs.get("type") == "Vessel":
                    raise RuntimeError("SEPARATOR_MCP_PROBE")
                return {}
        engine = StopAtSeparator()
        with self.assertRaisesRegex(RuntimeError, "SEPARATOR_MCP_PROBE"):
            simulate(engine, case())
        self.assertTrue(any(t == "dwsim_unitop_add" and k.get("type") == "Vessel" for t, k in engine.calls))
        self.assertEqual(engine.calls[-1][0], "dwsim_flowsheet_close")


if __name__ == "__main__":
    unittest.main()
