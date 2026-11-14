#!/usr/bin/env python3
"""Sonda de integración real bomba/válvula (Ejemplo 12). No despliega ni reinicia servicios."""
import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from server import RemoteMcpEngine, simulate
from tools.probe_flash_debian import discover_token_file


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--token-file", type=Path, help="Ruta al token local, nunca su contenido")
    ap.add_argument("--out", type=Path, default=Path("/tmp/sim-pump-valve12-debian.json"))
    args = ap.parse_args()
    graph = json.loads((ROOT/"site/examples/PumpValve.json").read_text(encoding="utf-8"))
    engine = RemoteMcpEngine(args.token_file or discover_token_file())
    print("Ejemplo 12: ejecutando bomba y válvula con DWSIM MCP...", flush=True)
    result = simulate(engine, graph)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)+"\n", encoding="utf-8")
    print("Motor:",result.get("engine"),"| Modelo:",result.get("model"),"| Duración:",result.get("elapsed_s"),"s")
    for id in ("feed","high","out"):
        s=result["streams"][id]
        phase=s["phases"][0]
        print(f"{s['name']}: P={s['pressure_Pa']/1000:.6f} kPa abs, T={s['temperature_K']-273.15:.6f} °C, m={s['mass_flow_kg_s']:.9f} kg/s, h={phase['enthalpy_kJ_kg']:.6f} kJ/kg")
    for b in result["balances"]:
        print(f"{b['name']}: Q={b['heat_to_fluid_kW']:.6f} kW, Δm={b['mass_residual']:.9g} kg/s")
    for key, eq in result["equipment"].items():
        print(f"{eq['name']} ({eq['type']}): calculated={eq['calculated']}, error={eq['error']}")
        print("  Propiedades DWSIM:",json.dumps(eq.get("properties",{}),ensure_ascii=False)[:1000])
    feed,high,out=(result["streams"][i] for i in ("feed","high","out"))
    checks={
        "presión bomba sube": high["pressure_Pa"]>feed["pressure_Pa"],
        "presión válvula baja":out["pressure_Pa"]<high["pressure_Pa"],
        "descarga bomba 500 kPa":abs(high["pressure_Pa"]/1000-500)<0.1,
        "descarga válvula 200 kPa":abs(out["pressure_Pa"]/1000-200)<0.1,
        "masa constante":max(abs(feed["mass_flow_kg_s"]-high["mass_flow_kg_s"]),abs(high["mass_flow_kg_s"]-out["mass_flow_kg_s"]))<1e-6,
        "entalpía válvula aproximadamente constante":abs(high["phases"][0]["enthalpy_kJ_kg"]-out["phases"][0]["enthalpy_kJ_kg"])<0.1,
        "equipos calculados":all(x["calculated"] and not x["error"] for x in result["equipment"].values()),
    }
    for label, ok in checks.items():
        print(("OK" if ok else "FALLA"),label)
    print("Informe:",args.out)
    return 0 if all(checks.values()) else 1


if __name__=="__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {type(exc).__name__}: {exc}",file=sys.stderr)
        sys.exit(1)
