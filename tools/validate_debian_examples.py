#!/usr/bin/env python3
"""Regresión de ΣIM 01–10 contra referencias Windows versionadas.

Ejecuta la API LOCAL de Debian secuencialmente. No modifica el motor ni publica.
El informe contiene datos calculados reales y tolerancias, no secretos.
"""
import argparse
import datetime as dt
import json
import math
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASES = [
    "mix", "HeaterWater", "CoolerWater", "SplitterWater", "WaterEthanol",
    "MulticomponentBalance", "ConversionReactor", "EquilibriumReactor",
    "ThermalNetwork", "AmmoniaBypass",
]
BASELINES = (
    ("docs/validation/examples-0.5.0.json", CASES[:5]),
    ("docs/validation/examples-0.7.0-windows.json", CASES[5:8]),
    ("docs/validation/examples-0.8.0-windows.json", CASES[8:]),
)
TOL = {
    "temperature_K": 0.001, "pressure_Pa": 1.0,
    "mass_flow_kg_s": 1e-7, "enthalpy_kJ_kg": 0.005,
    "density_kg_m3": 0.05, "mass_fraction": 1e-6,
    "vapor_fraction": 1e-6, "heat_to_fluid_kW": 0.01,
    "mass_residual_kg_s": 1e-7, "component_residual_kg_s": 1e-7,
}

def check(label, actual, expected, tolerance, errors):
    if not isinstance(actual, (int, float)) or not math.isfinite(actual):
        errors.append(f"{label}: valor ausente o no finito: {actual!r}")
    elif abs(actual - expected) > tolerance:
        errors.append(f"{label}: Debian={actual:.12g} Windows={expected:.12g} diferencia={actual-expected:.6g} tolerancia={tolerance}")

def get_fraction(stream, compound):
    return stream["phases"][0]["compounds"][compound]["mass_fraction"]

def compare(case, actual, baseline, errors):
    """Contrasta magnitudes comunes; no compara tiempos de ejecución."""
    if actual.get("error"):
        errors.append(f"{case}: error del motor: {actual['error']}")
        return
    if actual.get("engine") != "DWSIM 10.2.15":
        errors.append(f"{case}: motor inesperado {actual.get('engine')!r}")
    if case in CASES[:5] and actual.get("model") != baseline["model"]:
        errors.append(f"{case}: modelo diferente al de Windows")
    if case in CASES[8:] and actual.get("model") != baseline["model"]:
        errors.append(f"{case}: modelo diferente al de Windows")

    streams = actual.get("streams", {})
    refs = baseline.get("streams", {})
    if len(streams) != len(refs):
        errors.append(f"{case}: cantidad de corrientes Debian={len(streams)} Windows={len(refs)}")
    by_name = {s.get("name"): s for s in streams.values()}
    for ident, ref in refs.items():
        stream = by_name.get(ident) if case in CASES[:5] else streams.get(ident)
        if not stream:
            errors.append(f"{case}: corriente faltante {ident}")
            continue
        label = f"{case}/{ident}"
        for key in ("temperature_K", "pressure_Pa", "mass_flow_kg_s"):
            expected = ref.get(key)
            if key == "temperature_K" and expected is None and "temperature_C" in ref:
                expected = ref["temperature_C"] + 273.15
            if expected is not None:
                check(label + "/" + key, stream.get(key), expected, TOL[key], errors)
        global_phase = (stream.get("phases") or [{}])[0]
        for key in ("enthalpy_kJ_kg", "density_kg_m3"):
            if key in ref:
                check(label + "/" + key, global_phase.get(key), ref[key], TOL[key], errors)
        fractions = ref.get("mass_fractions", ref.get("composition", {}))
        for compound, expected in fractions.items():
            try:
                value = get_fraction(stream, compound)
            except (KeyError, IndexError, TypeError):
                value = None
            check(label + "/" + compound, value, expected, TOL["mass_fraction"], errors)

    balances = actual.get("balances", [])
    check_atomic_balance(case, streams, errors)
    for balance in balances:
        check(f"{case}/{balance.get('id')}/residuo masa",
              balance.get("mass_residual"), 0.0, TOL["mass_residual_kg_s"], errors)
        if not balance.get("reactive"):
            for compound, values in balance.get("components", {}).items():
                check(f"{case}/{balance.get('id')}/{compound}/residuo",
                      values.get("residual_kg_s"), 0.0, TOL["component_residual_kg_s"], errors)
    if case in CASES[5:]:
        refs_by_id = {b["id"]: b for b in baseline.get("balances", [])}
        if {b.get("id") for b in balances} != set(refs_by_id):
            errors.append(f"{case}: equipos/balances distintos a Windows")
        for balance in balances:
            ref = refs_by_id.get(balance.get("id"))
            if ref:
                check(f"{case}/{balance['id']}/Q",
                      balance.get("heat_to_fluid_kW"), ref["heat_to_fluid_kW"],
                      TOL["heat_to_fluid_kW"], errors)
                if balance.get("reactive") != ref.get("reactive"):
                    errors.append(f"{case}/{balance['id']}: estado reactivo distinto")
    elif balances:
        ref_q = baseline.get("heat_to_fluid_kW")
        if ref_q is not None:
            check(f"{case}/Q", sum(b.get("heat_to_fluid_kW", 0) for b in balances),
                  ref_q, TOL["heat_to_fluid_kW"], errors)


# Masas molares g/mol coherentes con el cálculo DWSIM de los casos 07, 08 y 10.
# Control independiente de que la masa total cierre; sin modificar el motor.
ATOMIC_MASSES = {
    "Hydrogen": (2.01588, {"H": 2}),
    "Oxygen": (31.9988, {"O": 2}),
    "Water": (18.01528, {"H": 2, "O": 1}),
    "Nitrogen": (28.0134, {"N": 2}),
    "Ammonia": (17.03052, {"N": 1, "H": 3}),
}
REACTIVE_PORTS = {
    "ConversionReactor": (["feed"], ["vapor", "liquid"]),
    "EquilibriumReactor": (["feed"], ["vapor", "liquid"]),
    "AmmoniaBypass": (["hot"], ["vapor", "liquid"]),
}
ATOMIC_TOL_MOL_S = 1e-5


def check_atomic_balance(case, streams, errors):
    """Balance H/O o N/H del reactor por mol de átomos por segundo."""
    if case not in REACTIVE_PORTS:
        return {}
    ins, outs = REACTIVE_PORTS[case]
    def totals(ids):
        atom_flow = {}
        for ident in ids:
            stream = streams.get(ident)
            if not stream:
                errors.append(f"{case}: corriente reactiva ausente: {ident}")
                continue
            phases = stream.get("phases") or []
            if not phases:
                errors.append(f"{case}: fases ausentes en {ident}")
                continue
            mass_flow = stream.get("mass_flow_kg_s")
            if not isinstance(mass_flow, (int, float)) or not math.isfinite(mass_flow):
                errors.append(f"{case}: caudal no finito en {ident}")
                continue
            for compound, props in phases[0].get("compounds", {}).items():
                if compound not in ATOMIC_MASSES:
                    errors.append(f"{case}: fórmula no definida para {compound}")
                    continue
                mw, atoms = ATOMIC_MASSES[compound]
                fraction = props.get("mass_fraction")
                if not isinstance(fraction, (int, float)) or not math.isfinite(fraction):
                    errors.append(f"{case}: fracción no finita para {compound}")
                    continue
                mol_s = 1000 * mass_flow * fraction / mw
                for atom, count in atoms.items():
                    atom_flow[atom] = atom_flow.get(atom, 0.0) + count * mol_s
        return atom_flow
    input_atoms, output_atoms = totals(ins), totals(outs)
    residuals = {}
    for atom in sorted(set(input_atoms) | set(output_atoms)):
        residual = input_atoms.get(atom, 0.0) - output_atoms.get(atom, 0.0)
        residuals[atom] = residual
        check(f"{case}/átomos/{atom}", residual, 0.0, ATOMIC_TOL_MOL_S, errors)
    return residuals


def run_case(url, graph):
    payload = json.dumps(graph, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url.rstrip("/") + "/api/simulate", data=payload,
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5910",
                        help="Solo servidor local, por seguridad")
    parser.add_argument("--output", default=".local/validation/debian-0.9.2.json")
    parser.add_argument("--cases", nargs="+", choices=CASES, default=CASES)
    args = parser.parse_args(argv)
    if args.url.rstrip("/") not in ("http://127.0.0.1:5910", "http://localhost:5910"):
        parser.error("Este verificador solo admite el gateway local de Debian en puerto 5910.")
    references = {}
    for path, names in BASELINES:
        data = json.loads((ROOT / path).read_text(encoding="utf-8"))
        for name in names:
            references[name] = {"source": path, "data": data["cases"][name]}
    result = {
        "simulator": "ΣIM", "portal_version": "0.9.1",
        "date_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "method": "API local Debian /api/simulate; comparación con informes Windows versionados",
        "limitations": "No es validación experimental ni comparación independiente de DWSIM; no demuestra disponibilidad pública del túnel.",
        "tolerances_absolute": {**TOL, "atoms_mol_s": ATOMIC_TOL_MOL_S}, "cases": {},
    }
    failures = 0
    for name in args.cases:
        print(f"[{name}] ejecutando...", flush=True)
        graph = json.loads((ROOT / "site" / "examples" / (name + ".json")).read_text(encoding="utf-8"))
        errors = []
        try:
            status, actual = run_case(args.url, graph)
            if status != 200:
                errors.append(f"HTTP {status}: {actual.get('error', 'respuesta no exitosa')}")
            else:
                compare(name, actual, references[name]["data"], errors)
        except (OSError, TimeoutError, ValueError, KeyError) as exc:
            status, actual = None, None
            errors.append(f"{type(exc).__name__}: {exc}")
        result["cases"][name] = {
            "reference": references[name]["source"], "http_status": status,
            "pass": not errors, "errors": errors, "result": actual,
        }
        failures += bool(errors)
        print(f"  {'OK' if not errors else 'FALLÓ'}" +
              (": " + "; ".join(errors[:3]) if errors else ""), flush=True)
    result["passed"] = len(args.cases) - failures
    result["failed"] = failures
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(f"Resultado: {result['passed']}/{len(args.cases)}; informe: {output}")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
