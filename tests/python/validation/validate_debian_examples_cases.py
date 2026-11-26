"""Pruebas locales del comparador (no ejecutan DWSIM)."""
import importlib.util
import copy
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location(
    "validate_debian_examples", ROOT / "tools" / "validate_debian_examples.py")
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


def fixture(case, ref):
    streams = {}
    for i, (ident, expected) in enumerate(ref["streams"].items()):
        key = ("ref" + str(i)) if case in mod.CASES[:5] else ident
        streams[key] = {
            "name": ident if case in mod.CASES[:5] else expected.get("name", ident),
            "temperature_K": expected.get("temperature_K", expected.get("temperature_C", 0) + 273.15),
            "pressure_Pa": expected["pressure_Pa"],
            "mass_flow_kg_s": expected["mass_flow_kg_s"],
            "phases": [{
                "enthalpy_kJ_kg": expected.get("enthalpy_kJ_kg"),
                "density_kg_m3": expected.get("density_kg_m3"),
                "compounds": {
                    compound: {"mass_fraction": value}
                    for compound, value in expected.get(
                        "mass_fractions", expected.get("composition", {})).items()
                },
            }],
        }
    balances = copy.deepcopy(ref.get("balances"))
    if balances is None:
        balances = [{
            "id": "unit", "mass_residual": 0.,
            "heat_to_fluid_kW": ref.get("heat_to_fluid_kW", 0.),
            "components": {}, "reactive": False,
        }]
    return {"engine": "DWSIM 10.2.15", "model": ref.get("model"),
            "streams": streams, "balances": balances}


class ComparatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.refs = {}
        for path, cases in mod.BASELINES:
            data = json.loads((ROOT / path).read_text(encoding="utf-8"))
            cls.refs.update({case: data["cases"][case] for case in cases})

    def test_all_ten_reference_shapes(self):
        for case in mod.CASES:
            with self.subTest(case=case):
                errors = []
                mod.compare(case, fixture(case, self.refs[case]), self.refs[case], errors)
                self.assertEqual(errors, [])

    def test_detects_temperature_regression(self):
        case = "ThermalNetwork"
        actual = fixture(case, self.refs[case])
        actual["streams"]["product"]["temperature_K"] += 1
        errors = []
        mod.compare(case, actual, self.refs[case], errors)
        self.assertTrue(any("temperature_K" in msg for msg in errors))

    def test_detects_chemistry_regression(self):
        case = "EquilibriumReactor"
        actual = fixture(case, self.refs[case])
        actual["streams"]["vapor"]["phases"][0]["compounds"]["Ammonia"]["mass_fraction"] += .01
        errors = []
        mod.compare(case, actual, self.refs[case], errors)
        self.assertTrue(any("Ammonia" in msg for msg in errors))

    def test_reactor_does_not_require_species_conservation(self):
        case = "ConversionReactor"
        errors = []
        mod.compare(case, fixture(case, self.refs[case]), self.refs[case], errors)
        self.assertEqual(errors, [])

    def test_detects_elemental_imbalance(self):
        case = "AmmoniaBypass"
        actual = fixture(case, self.refs[case])
        actual["streams"]["vapor"]["phases"][0]["compounds"]["Ammonia"]["mass_fraction"] += 0.01
        errors = []
        mod.compare(case, actual, self.refs[case], errors)
        self.assertTrue(any("/átomos/" in msg for msg in errors))

    def test_reactive_atom_reference(self):
        for case in mod.REACTIVE_PORTS:
            with self.subTest(case=case):
                errors = []
                residuals = mod.check_atomic_balance(
                    case, fixture(case, self.refs[case])["streams"], errors)
                self.assertEqual(errors, [])
                self.assertTrue(residuals)

    def test_detects_heat_regression(self):
        case = "AmmoniaBypass"
        actual = fixture(case, self.refs[case])
        actual["balances"][-1]["heat_to_fluid_kW"] += 1
        errors = []
        mod.compare(case, actual, self.refs[case], errors)
        self.assertTrue(any("/Q" in msg for msg in errors))


if __name__ == "__main__":
    unittest.main()
