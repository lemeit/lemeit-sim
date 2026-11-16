#!/usr/bin/env python3
"""Inspeccionar el contrato MCP del ComponentSeparator sin alterar servicios de ΣIM.

Windows: crea un DWSIM MCP temporal en modo stdio y lo cierra.
Debian: consulta el MCP existente solo para leer las definiciones de herramientas.
No calcula ni publica un equipo, no imprime tokens ni modifica procesos compartidos.
"""
import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from server import IsolatedEngine, RemoteMcpEngine

TOOLS = (
    "dwsim_unitop_add",
    "dwsim_unitop_set",
    "dwsim_unitop_connect",
    "dwsim_unitop_get_results",
)

def tool_specs(response):
    definitions = response.get("tools", [])
    if not isinstance(definitions, list):
        raise ValueError("Respuesta tools/list sin lista de herramientas.")
    return {item["name"]: {
        "description": item.get("description", ""),
        "inputSchema": item.get("inputSchema", {})
    } for item in definitions if isinstance(item, dict) and item.get("name") in TOOLS}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--motor", choices=["windows", "debian"],
                        default="windows" if os.name == "nt" else "debian")
    parser.add_argument("--engine-root", type=Path, default=ROOT / ".local/runtime")
    parser.add_argument("--token-file", type=Path, help="Solo ruta del token local Debian.")
    parser.add_argument("--out", type=Path,
                        default=ROOT / ".local/runtime/component-separator-mcp-contract.json")
    args = parser.parse_args()

    if args.motor == "windows":
        with IsolatedEngine(args.engine_root) as engine:
            result = engine.rpc("tools/list")
    else:
        if not args.token_file:
            from tools.probe_flash_debian import discover_token_file
            args.token_file = discover_token_file()
        result = RemoteMcpEngine(args.token_file).rpc("tools/list")

    specs = tool_specs(result)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps({
        "motor": args.motor,
        "operation": "ComponentSeparator",
        "source": "MCP tools/list: definiciones publicadas por el binario instalado",
        "tools": specs
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for name in TOOLS:
        item = specs.get(name)
        print(("OK" if item else "FALTA"), name)
        if item:
            fields = item.get("inputSchema", {}).get("properties", {})
            print("  Parámetros:", ", ".join(sorted(fields)) or "(sin campos declarados)")
    print("Contrato guardado:", args.out)
    print("Pendiente: comprobar que ComponentSepSpecs y SpecifiedStreamIndex "
          "puedan establecerse mediante dwsim_unitop_set. No equivale a validar el equipo.")
    return 0 if len(specs) == len(TOOLS) else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Error al inspeccionar la API MCP: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
