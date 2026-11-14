#!/usr/bin/env python3
"""Prueba real NO intrusiva del Ejemplo 11 contra DWSIM MCP local Debian.

Usar cuando no haya otros cálculos activos: el MCP tiene estado compartido.
No reinicia servicios, no usa Cloudflare y no expone el token.
"""
import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import RemoteMcpEngine, simulate

ROOT = Path(__file__).resolve().parents[1]


def discover_token_file():
    """Lee solo argumentos del proceso propio gateway; nunca muestra credenciales."""
    for proc in Path("/proc").iterdir():
        if not proc.name.isdigit():
            continue
        try:
            args = (proc / "cmdline").read_bytes().decode("utf-8").split("\0")
        except (OSError, UnicodeError):
            continue
        if not any(arg.endswith("/server.py") or arg == "server.py" for arg in args):
            continue
        if "--mcp-token-file" in args:
            i = args.index("--mcp-token-file")
            if i + 1 < len(args) and args[i+1]:
                return Path(args[i+1])
    raise RuntimeError("No encontré --mcp-token-file en el gateway. "
                       "Indicá --token-file RUTA (no pegues el contenido del token).")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--token-file", type=Path)
    parser.add_argument("--out", type=Path, default=Path("/tmp/sim-flash11-debian.json"))
    args = parser.parse_args()
    token_path = args.token_file or discover_token_file()
    graph = json.loads((ROOT / "site/examples/FlashDrum.json").read_text(encoding="utf-8"))
    engine = RemoteMcpEngine(token_path)
    print("Ejemplo 11: solicitando cálculo real a DWSIM MCP 10.2.15...", flush=True)
    data = simulate(engine, graph)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print("Motor:", data.get("engine"), "| Modelo:", data.get("model"),
          "| Duración:", data.get("elapsed_s"), "s")

    def report(ident):
        stream = data["streams"][ident]
        phase = stream["phases"][0]
        fractions = {c: round(v["mass_fraction"], 9) for c,v in phase["compounds"].items()}
        print(stream["name"], "m =", round(stream["mass_flow_kg_s"], 9), "kg/s;",
              "T =", round(stream["temperature_K"] - 273.15, 6), "°C;",
              "w =", fractions)
        return stream

    for ident in ("feed", "two_phase", "vapor", "liquid"):
        report(ident)
    print("\nBalances:")
    for b in data["balances"]:
        print(b["name"], "| Q =", round(b["heat_to_fluid_kW"], 6),
              "kW | Δm =", b["mass_residual"], "kg/s")
        for name, comp in b["components"].items():
            if abs(comp["residual_kg_s"]) > 1e-7:
                print("  ALERTA componente:", name, comp["residual_kg_s"], "kg/s")
    vapor = data["streams"]["vapor"]
    liquid = data["streams"]["liquid"]
    inlet = data["streams"]["two_phase"]
    mv, ml, mf = [x["mass_flow_kg_s"] for x in (vapor, liquid, inlet)]
    if abs(mv + ml - mf) > 1e-7:
        print("FALLA: el balance global de masa no cierra.")
        return 1
    if mv <= 1e-6 or ml <= 1e-6:
        print("ATENCIÓN: la corriente no se dividió en dos fases significativas; "
              "habrá que ajustar temperatura y/o presión.")
        return 2
    wv = vapor["phases"][0]["compounds"]["Ethanol"]["mass_fraction"]
    wl = liquid["phases"][0]["compounds"]["Ethanol"]["mass_fraction"]
    if not all(map(math.isfinite, [wv, wl])) or abs(wv-wl) <= 1e-6:
        print("ATENCIÓN: las composiciones de vapor/líquido no muestran separación.")
        return 3
    print("FLASH BIFÁSICO VALIDADO: masa y dos fases presentes; composición de etanol distinta.")
    print("Informe:", args.out)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR de integración real: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
