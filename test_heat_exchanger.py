"""Contrato sin motor del intercambiador. No afirma compatibilidad real con DWSIM MCP."""
import json
import unittest
from pathlib import Path
from server import InputError,ports,validate_graph,simulate

ROOT=Path(__file__).resolve().parent
CATALOG={"compounds":["Water"],"models":["Steam Tables (IAPWS-IF97)"],"engine":"DWSIM 10.2.15"}

def example():
    return json.loads((ROOT/"site/examples/HeatExchangerWater.json").read_text(encoding="utf-8"))

class HeatExchangerContract(unittest.TestCase):
    def test_four_ports(self):
        self.assertEqual(ports("HeatExchanger")["in"],("material",2))
        self.assertEqual(ports("HeatExchanger")["out"],("material",2))

    def test_case(self):
        result=validate_graph(example(),CATALOG)
        self.assertEqual(result["hx"]["heat_duty_kW"],40)
        self.assertEqual({e.get("toIndex",0) for e in example()["edges"] if e["to"]=="hx"},{0,1})
        self.assertEqual({e.get("fromIndex",0) for e in example()["edges"] if e["from"]=="hx"},{0,1})

    def test_missing_cold_product(self):
        g=example()
        g["edges"]=[e for e in g["edges"] if e["to"]!="cold_out"]
        g["nodes"]=[n for n in g["nodes"] if n["id"]!="cold_out"]
        with self.assertRaisesRegex(InputError,"dos alimentaciones"):
            validate_graph(g,CATALOG)

    def test_invalid_duty(self):
        g=example()
        g["nodes"][2]["heat_duty_kW"]=-5
        with self.assertRaises(InputError):
            validate_graph(g,CATALOG)

    def test_same_port_cannot_be_shared(self):
        g=example()
        g["edges"][1]["toIndex"]=0
        with self.assertRaisesRegex(InputError,"más de una conexión"):
            validate_graph(g,CATALOG)

    def test_calls_mcp_with_parameters(self):
        class Stub:
            def __init__(self):self.calls=[]
            def get_catalog(self):return CATALOG
            def call(self,tool,**kwargs):
                self.calls.append((tool,kwargs))
                if tool=="dwsim_flowsheet_create":return {"flowsheet_id":"mock"}
                if tool=="dwsim_solve_run":raise RuntimeError("CAPTURA_HX")
                return {}
        stub=Stub()
        with self.assertRaisesRegex(RuntimeError,"CAPTURA_HX"):
            simulate(stub,example())
        added=[a for tool,a in stub.calls if tool=="dwsim_unitop_add" and a.get("type")=="HeatExchanger"]
        self.assertEqual(len(added),1)
        configured=[a for tool,a in stub.calls if tool=="dwsim_unitop_set" and a.get("name")=="HX1 · Intercambiador"]
        self.assertEqual(configured[0]["properties"],{"CalculationMode":"CalcBothTemp","HeatDuty":40})
        self.assertEqual(stub.calls[-1][0],"dwsim_flowsheet_close")

if __name__=="__main__":unittest.main()
