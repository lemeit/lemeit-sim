#!/usr/bin/env python3
"""Ejemplo 13: prueba real del intercambiador de dos corrientes en Debian DWSIM MCP.

No publica, no reinicia procesos y no expone secretos.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from server import RemoteMcpEngine,simulate
from tools.probe_flash_debian import discover_token_file


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--token-file",type=Path)
    parser.add_argument("--out",type=Path,default=Path("/tmp/sim-hx13-debian.json"))
    args=parser.parse_args()
    graph=json.loads((ROOT/"site/examples/HeatExchangerWater.json").read_text(encoding="utf-8"))
    print("Ejemplo 13: ejecutando intercambiador real en DWSIM MCP...",flush=True)
    result=simulate(RemoteMcpEngine(args.token_file or discover_token_file()),graph)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False)+"\n",encoding="utf-8")
    streams=result["streams"]
    states={}
    for key in ("hot_feed","hot_out","cold_feed","cold_out"):
        s=streams[key]
        state={"m":s["mass_flow_kg_s"],"t":s["temperature_K"]-273.15,
               "p":s["pressure_Pa"]/1000,"h":s["phases"][0]["enthalpy_kJ_kg"]}
        states[key]=state
        print(f"{s['name']}: T={state['t']:.6f} °C, P={state['p']:.6f} kPa abs, m={state['m']:.9f} kg/s, h={state['h']:.6f} kJ/kg")
    hi,ho,ci,co=[states[k] for k in ("hot_feed","hot_out","cold_feed","cold_out")]
    qhot=hi["m"]*hi["h"]-ho["m"]*ho["h"]
    qcold=co["m"]*co["h"]-ci["m"]*ci["h"]
    print(f"Calor cedido lado caliente: {qhot:.8f} kW")
    print(f"Calor recibido lado frío: {qcold:.8f} kW")
    print(f"Error de cierre térmico |Qcaliente-Qfrío|: {abs(qhot-qcold):.8f} kW")
    print("Equipo:",json.dumps(result["equipment"].get("hx",{}),ensure_ascii=False)[:1400])
    tests={
      "caliente se enfría":ho["t"]<hi["t"],
      "frío se calienta":co["t"]>ci["t"],
      "sin inversión de temperaturas":ho["t"]>co["t"],
      "masa caliente":abs(hi["m"]-ho["m"])<1e-5,
      "masa fría":abs(ci["m"]-co["m"])<1e-5,
      "calor cedido próximo a 40 kW":abs(qhot-40)<0.5,
      "calor recibido próximo a 40 kW":abs(qcold-40)<0.5,
      "cierre térmico":abs(qhot-qcold)<0.5,
      "equipo calculado":bool(result["equipment"].get("hx",{}).get("calculated")) and not result["equipment"]["hx"].get("error"),
    }
    for label,passed in tests.items():print(("OK" if passed else "FALLA"),label)
    print("Informe:",args.out)
    return 0 if all(tests.values()) else 1


if __name__=="__main__":
    try:sys.exit(main())
    except Exception as exc:
        print(f"ERROR de integración: {type(exc).__name__}: {exc}",file=sys.stderr)
        sys.exit(1)
