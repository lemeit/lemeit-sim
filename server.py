"""Puerta local, acotada, entre el editor pedagógico y DWSIM MCP. Python 3.11+."""
import argparse
import hmac
import json
import math
import re
import subprocess
import threading
import time
from collections import deque
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOCK = threading.Lock()  # El motor tiene estado global: serializar una simulación completa.
REACTORS = {'ConversionReactor', 'EquilibriumReactor'}
KINDS = {'MaterialStream', 'EnergyStream', 'Mixer', 'Splitter', 'Heater', 'Cooler'} | REACTORS
MODELS = ['Steam Tables (IAPWS-IF97)', "Raoult's Law", 'NRTL', 'Peng-Robinson (PR)', 'Soave-Redlich-Kwong (SRK)', 'UNIQUAC', 'UNIFAC', 'Modified UNIFAC (Dortmund)', 'Modified UNIFAC (NIST)', 'Wilson', 'Peng-Robinson 1978 (PR78)', 'Peng-Robinson / Lee-Kesler (PR/LK)', 'Lee-Kesler-Plöcker', 'Chao-Seader', 'Grayson-Streed', 'CoolProp', 'Seawater IAPWS-08', 'PC-SAFT (with Association Support) (.NET Code)']


class InputError(ValueError):
    pass


class Engine:
    def __init__(self, engine_root):
        self.root = Path(engine_root)
        self.catalog = None

    def rpc(self, method, params=None):
        token = (self.root / 'local-token.txt').read_text(encoding='utf-8-sig').strip()
        request = urllib.request.Request('http://localhost:5901/mcp',
            data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or {}}).encode(),
            headers={'Content-Type': 'application/json', 'X-MCP-Token': token})
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as exc:
            raise RuntimeError('DWSIM rechazó la conexión. Revisá la credencial local del motor.') from exc
        except (OSError, TimeoutError) as exc:
            raise RuntimeError('No se pudo conectar con DWSIM. Iniciá start-server.ps1 y volvé a intentar.') from exc
        if 'error' in payload:
            raise RuntimeError(payload['error'].get('message', 'Error del motor'))
        return payload['result']

    def call(self, tool, **arguments):
        result = self.rpc('tools/call', {'name': tool, 'arguments': arguments})
        if result.get('isError'):
            message = ' '.join(x.get('text', '') for x in result.get('content', []))
            raise InputError(message or 'DWSIM no pudo completar la operación.')
        for block in result.get('content', []):
            if block.get('type') == 'text':
                return json.loads(block['text'])
        raise RuntimeError('Respuesta inesperada del motor.')

    def get_catalog(self):
        if self.catalog is None:
            compounds = self.call('dwsim_thermo_list_compounds')
            fid = self.call('dwsim_flowsheet_create', name='Catálogo del editor')['flowsheet_id']
            try:
                packages = self.call('dwsim_thermo_list_property_packages', flowsheet_id=fid)['property_packages']
            finally:
                self.call('dwsim_flowsheet_close', flowsheet_id=fid)
            names = [c for c in compounds['compounds'] if c.strip()]
            self.catalog = {'compounds': names, 'models': [p for p in MODELS if p in packages],
                            'engine': 'DWSIM 10.2.15', 'compound_count': len(names)}
        return self.catalog


class RemoteMcpEngine(Engine):
    """Conecta al servicio MCP HTTP de Debian sin iniciar otro proceso."""
    def __init__(self, token_file, url='http://127.0.0.1:5901/mcp'):
        super().__init__(Path(token_file).parent)
        self.token_file = Path(token_file)
        self.url = url
        self.token = self.token_file.read_text(encoding='utf-8').strip()
        if not self.token:
            raise RuntimeError('El token local del motor está vacío.')

    def rpc(self, method, params=None):
        data = json.dumps({'jsonrpc': '2.0', 'id': 1,
                           'method': method, 'params': params or {}}).encode()
        request = urllib.request.Request(
            self.url, data=data,
            headers={'Content-Type': 'application/json', 'X-MCP-Token': self.token})
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f'DWSIM MCP HTTP rechazó la consulta ({exc.code}).') from exc
        except (OSError, TimeoutError) as exc:
            raise RuntimeError('DWSIM MCP local no responde.') from exc
        if 'error' in payload:
            raise InputError(payload['error'].get('message', 'Error de DWSIM MCP'))
        return payload['result']


class IsolatedEngine(Engine):
    """Un proceso de DWSIM por trabajo, sin puerto HTTP y con límite total real."""
    def __enter__(self):
        executable = self.root / 'server' / 'dwsim-mcp.exe'
        if not executable.is_file(): raise RuntimeError('Falta el ejecutable local del motor DWSIM.')
        self.process = subprocess.Popen([str(executable), '--stdio'], cwd=executable.parent,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        self.timer = threading.Timer(45, self.process.kill)
        self.timer.daemon = True
        self.timer.start()
        return self

    def rpc(self, method, params=None):
        body = {'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or {}}
        try:
            self.process.stdin.write((json.dumps(body) + '\n').encode('utf-8'))
            self.process.stdin.flush()
            line = self.process.stdout.readline()
        except (OSError, ValueError) as exc:
            raise RuntimeError('El trabajo terminó o alcanzó su tiempo máximo de 45 segundos.') from exc
        if not line: raise RuntimeError('DWSIM terminó el trabajo o alcanzó el límite de 45 segundos.')
        try: text = line.decode('utf-8')
        except UnicodeDecodeError:
            import ctypes
            text = line.decode('cp' + str(ctypes.windll.kernel32.GetOEMCP()))
        payload = json.loads(text)
        if 'error' in payload: raise InputError(payload['error'].get('message', 'Error del motor'))
        return payload['result']

    def __exit__(self, *_):
        self.timer.cancel()
        if self.process.poll() is None: self.process.kill()
        self.process.wait(timeout=5)
        self.process.stdin.close()
        self.process.stdout.close()


class BoundedServer(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, *args, **kwargs):
        self.slots = threading.BoundedSemaphore(16)
        self.jobs = deque(maxlen=120)
        super().__init__(*args, **kwargs)

    def process_request(self, request, client_address):
        if not self.slots.acquire(blocking=False):
            request.close()
            return
        try: super().process_request(request, client_address)
        except BaseException:
            self.slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try: super().process_request_thread(request, client_address)
        finally: self.slots.release()


def number(value, label, low, high):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not low <= value <= high:
        raise InputError(f'{label}: ingresá un número entre {low:g} y {high:g}.')
    return value


def ports(kind):
    if kind == 'MaterialStream':
        return {'in': ('material', 1), 'out': ('material', 1)}
    if kind == 'EnergyStream':
        return {'in': ('energy', 1), 'out': ('energy', 1)}
    result = {'in': ('material', 3 if kind == 'Mixer' else 1), 'out': ('material', 2 if kind == 'Splitter' or kind in REACTORS else 1)}
    if kind == 'Heater': result['energy-in'] = ('energy', 1)
    if kind == 'Cooler': result['energy-out'] = ('energy', 1)
    return result


def validate_graph(graph, catalog):
    if not isinstance(graph, dict): raise InputError('El archivo debe contener un proceso.')
    nodes, edges = graph.get('nodes'), graph.get('edges')
    if not isinstance(nodes, list) or not 2 <= len(nodes) <= 30: raise InputError('Usá entre 2 y 30 objetos.')
    if not isinstance(edges, list) or len(edges) > 60: raise InputError('Lista de conexiones inválida.')
    compounds = graph.get('compounds', [])
    if not isinstance(compounds, list) or not 1 <= len(compounds) <= 8 or any(not isinstance(c, str) for c in compounds):
        raise InputError('Seleccioná entre 1 y 8 compuestos del catálogo.')
    if len(set(compounds)) != len(compounds) or any(c not in catalog['compounds'] for c in compounds):
        raise InputError('Los compuestos deben pertenecer al catálogo de DWSIM y no repetirse.')
    if graph.get('model') not in catalog['models']: raise InputError('Seleccioná un modelo disponible.')
    if graph['model'] == 'Steam Tables (IAPWS-IF97)' and compounds != ['Water']:
        raise InputError('IAPWS-IF97 es para agua pura. Para mezclas seleccioná otro modelo apropiado.')
    by_id, names = {}, set()
    for node in nodes:
        if not isinstance(node, dict): raise InputError('Objeto inválido.')
        ident, kind, name = node.get('id'), node.get('type'), node.get('name')
        if not isinstance(ident, str) or not re.fullmatch(r'[a-zA-Z][a-zA-Z0-9_-]{0,39}', ident) or ident in by_id:
            raise InputError('Identificador de objeto inválido o repetido.')
        if kind not in KINDS: raise InputError('Equipo no admitido en esta versión.')
        if not isinstance(name, str) or not name.strip() or len(name) > 45 or name in names or any(ord(c) < 32 for c in name):
            raise InputError('Cada objeto necesita un nombre único de hasta 45 caracteres.')
        by_id[ident] = node
        names.add(name)
    occupied, adjacency = set(), {i: [] for i in by_id}
    for edge in edges:
        if not isinstance(edge, dict): raise InputError('Conexión inválida.')
        a, b = by_id.get(edge.get('from')), by_id.get(edge.get('to'))
        if not a or not b or a is b: raise InputError('Conexión sin origen o destino válido.')
        if a['type'].endswith('Stream') == b['type'].endswith('Stream'):
            raise InputError('Conectá una corriente con un equipo, o un equipo con una corriente.')
        fp, tp = edge.get('fromPort', 'out'), edge.get('toPort', 'in')
        ap, bp = ports(a['type']).get(fp), ports(b['type']).get(tp)
        if not ap or not bp or not fp.endswith('out') or not tp.endswith('in') or ap[0] != bp[0]:
            raise InputError('Los puertos deben tener igual tipo y dirección salida → entrada.')
        for node, port, index, spec in [(a, fp, edge.get('fromIndex', 0), ap), (b, tp, edge.get('toIndex', 0), bp)]:
            if type(index) is not int or not 0 <= index < spec[1]: raise InputError('Número de puerto inválido.')
            key = (node['id'], port, index)
            if key in occupied: raise InputError('Un puerto tiene más de una conexión.')
            occupied.add(key)
        adjacency[a['id']].append(b['id'])
    active, done = set(), set()
    def visit(ident):
        if ident in active: raise InputError('Esta versión admite procesos sin recirculaciones.')
        if ident in done: return
        active.add(ident)
        for nxt in adjacency[ident]: visit(nxt)
        active.remove(ident)
        done.add(ident)
    for ident in by_id: visit(ident)
    for node in nodes:
        incoming = [e for e in edges if e['to'] == node['id']]
        outgoing = [e for e in edges if e['from'] == node['id']]
        kind, name = node['type'], node['name']
        if kind.endswith('Stream'):
            if not incoming and not outgoing: raise InputError(f'{name}: conectá la corriente o eliminala.')
            if kind == 'EnergyStream' and len(incoming) + len(outgoing) != 1:
                raise InputError(f'{name}: conectá la corriente de energía a un solo equipo.')
            if kind == 'MaterialStream' and not incoming:
                spec = node.get('flash_spec', 'TP')
                if spec not in ('TP', 'PH', 'PS', 'PV', 'TV'): raise InputError(f'{name}: especificación flash inválida.')
                if spec in ('TP', 'TV'): number(node.get('temperature_C'), name + ': temperatura (°C)', -273.14, 3000)
                if spec != 'TV': number(node.get('pressure_kPa'), name + ': presión (kPa)', .001, 1000000)
                if spec == 'PH': number(node.get('enthalpy_kJ_kg'), name + ': entalpía (kJ/kg)', -1000000, 1000000)
                if spec == 'PS' and graph['model'] == 'Steam Tables (IAPWS-IF97)': raise InputError(f'{name}: presión–entropía no está habilitada con IAPWS-IF97 por una discrepancia verificada en el motor. Usá TP o PH.')
                if spec == 'PS': number(node.get('entropy_kJ_kgK'), name + ': entropía (kJ/(kg·K))', -10000, 10000)
                if spec in ('PV', 'TV'): number(node.get('vapor_fraction'), name + ': fracción molar de vapor', 0, 1)
                basis = node.get('flow_basis', 'mass')
                if basis not in ('mass', 'molar'): raise InputError(f'{name}: base de caudal inválida.')
                number(node.get('mass_flow' if basis == 'mass' else 'molar_flow'), name + ': caudal', .000001, 1000000)
                if node.get('composition_basis', 'mass') not in ('mass', 'molar'): raise InputError(f'{name}: base de composición inválida.')
                fractions = node.get('composition', {})
                if not isinstance(fractions, dict) or set(fractions) != set(compounds): raise InputError(f'{name}: completá la composición.')
                for value in fractions.values(): number(value, name + ': fracción', 0, 1)
                if abs(sum(fractions.values()) - 1) > .000001: raise InputError(f'{name}: las fracciones deben sumar 1.')
        else:
            ins = [e for e in incoming if e.get('toPort', 'in') == 'in']
            outs = [e for e in outgoing if e.get('fromPort', 'out') == 'out']
            if not ins or not outs: raise InputError(f'{name}: faltan corrientes de materia de entrada o salida.')
            if kind == 'Splitter':
                if len(outs) != 2: raise InputError(f'{name}: conectá las dos salidas del divisor.')
                number(node.get('split'), name + ': fracción de salida 1', .000001, .999999)
            if kind in ('Heater', 'Cooler'):
                number(node.get('outlet_C'), name + ': temperatura objetivo (°C)', -273.14, 3000)
            if kind in REACTORS:
                if len(outs) != 2: raise InputError(f'{name}: conectá las salidas de vapor (1) y líquido (2).')
                stoich = node.get('stoichiometry')
                if not isinstance(stoich, dict) or set(stoich) - set(compounds): raise InputError(f'{name}: estequiometría inválida.')
                for value in stoich.values(): number(value, 'Coeficiente estequiométrico', -100, 100)
                if not any(v < 0 for v in stoich.values()) or not any(v > 0 for v in stoich.values()):
                    raise InputError(f'{name}: usá coeficientes negativos para reactivos y positivos para productos.')
                if stoich.get(node.get('base_compound'), 0) >= 0: raise InputError(f'{name}: el compuesto base debe ser un reactivo.')
                if node.get('phase') not in ('Vapor', 'Liquid', 'Mixture'): raise InputError('Seleccioná una fase de reacción.')
                number(node.get('outlet_C'), name + ': temperatura de reacción (°C)', -273.14, 3000)
                if kind == 'ConversionReactor': number(node.get('conversion'), name + ': conversión (%)', 0, 100)
    return by_id


def simulate(engine, graph):
    catalog = engine.get_catalog()
    by_id = validate_graph(graph, catalog)
    started = time.monotonic()
    fid = engine.call('dwsim_flowsheet_create', name='Proceso pedagógico')['flowsheet_id']
    def call(tool, **kw): return engine.call(tool, flowsheet_id=fid, **kw)
    try:
        call('dwsim_thermo_add_compounds', names=graph['compounds'])
        call('dwsim_thermo_set_property_package', name=graph['model'])
        molecular_weights = {}
        if any(n.get('composition_basis') == 'molar' for n in graph['nodes']):
            exported = call('dwsim_flowsheet_get_xml')
            if exported.get('truncated'): raise InputError('No se pudieron leer las masas molares completas del motor.')
            for compound in ET.fromstring(exported['xml']).findall('./Compounds/Compound'):
                molecular_weights[compound.findtext('Name')] = float(compound.findtext('Molar_Weight', '0'))
            if any(not math.isfinite(molecular_weights.get(c, 0)) or molecular_weights.get(c, 0) <= 0 for c in graph['compounds']):
                raise InputError('DWSIM no informó una masa molar válida para todos los compuestos.')
        for node in graph['nodes']:
            if node['type'] in REACTORS:
                kw = {'name': node['id'] + '-reaction', 'stoichiometry': {c:v for c,v in node['stoichiometry'].items() if v},
                      'base_compound': node['base_compound'], 'phase': node['phase'], 'reaction_set': node['id'] + '-set'}
                if node['type'] == 'ConversionReactor':
                    call('dwsim_reaction_add_conversion', conversion=str(node['conversion']), **kw)
                else: call('dwsim_reaction_add_equilibrium', basis='fugacity', **kw)
        for node in graph['nodes']:
            kind = node['type']
            if kind == 'MaterialStream':
                kw = {'name': node['name']}
                spec = node.get('flash_spec', 'TP')
                if not any(e['to'] == node['id'] for e in graph['edges']):
                    spec = node.get('flash_spec', 'TP')
                    if spec in ('TP', 'TV'): kw['temperature_K'] = node['temperature_C'] + 273.15
                    if spec != 'TV': kw['pressure_Pa'] = node['pressure_kPa'] * 1000
                    if spec in ('PV', 'TV'): kw['vapor_fraction'] = node['vapor_fraction']
                    if node.get('flow_basis', 'mass') == 'mass': kw['mass_flow_kg_s'] = node['mass_flow']
                    else: kw['molar_flow_mol_s'] = node['molar_flow']
                    fractions = node['composition']
                    if node.get('composition_basis', 'mass') == 'molar':
                        total = sum(v * molecular_weights[c] for c, v in fractions.items())
                        fractions = {c: v * molecular_weights[c] / total for c, v in fractions.items()}
                    kw['composition'] = fractions
                call('dwsim_stream_add_material', **kw)
                if not any(e['to'] == node['id'] for e in graph['edges']) and spec in ('PH', 'PS'):
                    prop, key, mode = ('PROP_MS_7', 'enthalpy_kJ_kg', 'Pressure_and_Enthalpy') if spec == 'PH' else ('PROP_MS_8', 'entropy_kJ_kgK', 'Pressure_and_Entropy')
                    call('dwsim_unitop_set', name=node['name'], properties={'SpecType': mode, prop: node[key]})
            elif kind == 'EnergyStream': call('dwsim_stream_add_energy', name=node['name'])
            else: call('dwsim_unitop_add', type=kind, name=node['name'])
        for edge in graph['edges']:
            a, b = by_id[edge['from']], by_id[edge['to']]
            if a['type'].endswith('Stream'):
                key = 'energy_feed' if a['type'] == 'EnergyStream' else 'feed_stream'
                call('dwsim_unitop_connect', unitop=b['name'], **{key: a['name'],
                    'energy_feed_port' if key == 'energy_feed' else 'feed_port': edge.get('toIndex', 0)})
            else:
                key = 'energy_product' if b['type'] == 'EnergyStream' else 'product_stream'
                call('dwsim_unitop_connect', unitop=a['name'], **{key: b['name'],
                    'energy_product_port' if key == 'energy_product' else 'product_port': edge.get('fromIndex', 0)})
        for node in graph['nodes']:
            props = None
            if node['type'] in ('Heater', 'Cooler'):
                props = {'CalcMode': 'OutletTemperature', 'OutletTemperature': node['outlet_C'] + 273.15}
            if node['type'] == 'Splitter': props = {'OperationMode': 'SplitRatios', 'SR1': node['split']}
            if node['type'] in REACTORS:
                props = {'ReactionSetID':node['id'] + '-set', 'ReactorOperationMode':'OutletTemperature', 'OutletTemperature':node['outlet_C'] + 273.15}
            if props: call('dwsim_unitop_set', name=node['name'], properties=props)
        solved = call('dwsim_solve_run', timeout_s=30)
        if not solved.get('ok'): raise InputError('DWSIM no resolvió el proceso: ' + '; '.join(str(e) for e in solved.get('errors', [])))
        streams, equipment = {}, {}
        for node in graph['nodes']:
            if node['type'] == 'MaterialStream': streams[node['id']] = call('dwsim_stream_get_results', name=node['name'])
            elif not node['type'].endswith('Stream'): equipment[node['id']] = call('dwsim_unitop_get_results', name=node['name'])
        # Algunos paquetes pueden informar éxito sin respetar la especificación solicitada.
        for node in graph['nodes']:
            if node['type'] != 'MaterialStream' or any(e['to'] == node['id'] for e in graph['edges']): continue
            spec = node.get('flash_spec', 'TP')
            if spec in ('PH', 'PS'):
                key = 'enthalpy_kJ_kg' if spec == 'PH' else 'entropy_kJ_kgK'
                actual = streams[node['id']]['phases'][0][key]
                if not math.isclose(actual, node[key], rel_tol=1e-4, abs_tol=1e-4):
                    raise InputError(f"{node['name']}: el motor no conservó la especificación {spec}. Revisá el modelo y el estado solicitado.")
        def h(ident): return streams[ident]['phases'][0]['enthalpy_kJ_kg']
        reactor_heat = {}
        if any(n['type'] in REACTORS for n in graph['nodes']):
            exported = call('dwsim_flowsheet_get_xml')
            if exported.get('truncated'): raise InputError('El proceso químico supera el tamaño de lectura del motor.')
            xml = ET.fromstring(exported['xml'])
            objects = call('dwsim_flowsheet_list_objects')['objects']
            for obj in objects:
                for element in xml.iter():
                    if element.findtext('Name') == obj['id'] and element.find('DeltaQ') is not None:
                        reactor_heat[obj['name']] = float(element.findtext('DeltaQ'))
        # Los balances se reconstruyen con propiedades del motor; h está en kJ/kg.
        checks = []
        for node in graph['nodes']:
            if node['type'].endswith('Stream'): continue
            ins = [e['from'] for e in graph['edges'] if e['to'] == node['id'] and e['from'] in streams]
            outs = [e['to'] for e in graph['edges'] if e['from'] == node['id'] and e['to'] in streams]
            mass_in = sum(streams[i]['mass_flow_kg_s'] for i in ins)
            mass_out = sum(streams[i]['mass_flow_kg_s'] for i in outs)
            heat = sum(streams[i]['mass_flow_kg_s'] * h(i) for i in outs) - sum(streams[i]['mass_flow_kg_s'] * h(i) for i in ins)
            if node['type'] in REACTORS:
                if node['name'] not in reactor_heat: raise RuntimeError('No se pudo leer la potencia térmica del reactor en el motor.')
                heat = reactor_heat[node['name']]
            components = {}
            for compound in graph['compounds']:
                def component_flow(ident):
                    return streams[ident]['mass_flow_kg_s'] * streams[ident]['phases'][0]['compounds'][compound]['mass_fraction']
                cin, cout = sum(component_flow(i) for i in ins), sum(component_flow(i) for i in outs)
                components[compound] = {'in_kg_s': cin, 'out_kg_s': cout, 'residual_kg_s': cin - cout}
            checks.append({'id': node['id'], 'name': node['name'], 'mass_in': mass_in, 'mass_out': mass_out,
                           'mass_residual': mass_in - mass_out, 'heat_to_fluid_kW': heat, 'components': components,
                           'reactive':node['type'] in REACTORS})
        return {'streams': streams, 'equipment': equipment, 'balances': checks,
                'elapsed_s': round(time.monotonic() - started, 2), 'engine': catalog['engine'], 'model': graph['model']}
    finally:
        engine.call('dwsim_flowsheet_close', flowsheet_id=fid)


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'}
    def setup(self):
        self.request.settimeout(15)
        super().setup()

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-store, no-transform')
        self.send_header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        super().end_headers()

    def json_response(self, code, data):
        body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def valid_host(self):
        host = self.headers.get('Host')
        if host == 'sim-engine.internal':
            key = self.headers.get('X-Origin-Key', '')
            return bool(self.server.origin_key and hmac.compare_digest(key, self.server.origin_key))
        return host in (f'localhost:{self.server.server_port}', f'127.0.0.1:{self.server.server_port}')

    def do_GET(self):
        if not self.valid_host(): return self.json_response(403, {'error': 'Acceso local únicamente.'})
        if self.path == '/api/catalog':
            if not LOCK.acquire(blocking=False): return self.json_response(409, {'error': 'Motor ocupado. Volvé a intentar en unos segundos.'})
            try: self.json_response(200, self.server.engine.get_catalog())
            except Exception as exc: self.json_response(503, {'error': str(exc)})
            finally: LOCK.release()
        elif self.path.startswith('/api/'): self.json_response(404, {'error': 'Operación no disponible.'})
        else: super().do_GET()

    def do_POST(self):
        origin = self.headers.get('Origin')
        allowed = (None, f'http://{self.headers.get("Host")}', self.server.public_origin)
        if not self.valid_host() or origin not in allowed or self.headers.get('Sec-Fetch-Site') == 'cross-site':
            return self.json_response(403, {'error': 'Origen no autorizado.'})
        if self.path != '/api/simulate': return self.json_response(404, {'error': 'Operación no disponible.'})
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.json_response(415, {'error': 'Se requiere JSON.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 100000: raise InputError('Proceso vacío o demasiado grande.')
            graph = json.loads(self.rfile.read(length))
        except (ValueError, TypeError) as exc: return self.json_response(400, {'error': str(exc)})
        if not LOCK.acquire(blocking=False): return self.json_response(409, {'error': 'Motor ocupado. Volvé a calcular en unos segundos.'})
        try:
            catalog = self.server.engine.get_catalog()
            validate_graph(graph, catalog)
            now = time.monotonic()
            if self.server.public_origin and (sum(now-t < 60 for t in self.server.jobs) >= 12 or sum(now-t < 3600 for t in self.server.jobs) >= 120):
                return self.json_response(429, {'error': 'El piloto alcanzó su límite de cálculos. Esperá unos minutos y volvé a intentar.'})
            self.server.jobs.append(now)
            if self.server.shared_mcp:
                data = simulate(self.server.engine, graph)
            else:
                with IsolatedEngine(self.server.engine.root) as worker:
                    worker.catalog = catalog
                    data = simulate(worker, graph)
            self.json_response(200, data)
        except InputError as exc: self.json_response(422, {'error': str(exc)})
        except Exception as exc: self.json_response(503, {'error': str(exc)})
        finally: LOCK.release()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine-root', help='Carpeta del motor Windows con local-token.txt')
    parser.add_argument('--mcp-token-file', help='Token privado para el servicio MCP HTTP de Debian')
    parser.add_argument('--mcp-url', default='http://127.0.0.1:5901/mcp', help='URL del MCP HTTP local de Debian')
    parser.add_argument('--port', type=int, default=5910)
    parser.add_argument('--public-origin', default=None, help='Origen HTTPS autorizado, por ejemplo https://sim.lemeit.ar')
    parser.add_argument('--origin-key-file', default=None, help='Archivo privado para autenticar al Worker de Cloudflare')
    args = parser.parse_args()
    if bool(args.engine_root) == bool(args.mcp_token_file):
        parser.error('Indicá --engine-root (Windows) o --mcp-token-file (Debian), pero no ambos.')
    if args.mcp_token_file and args.mcp_url != 'http://127.0.0.1:5901/mcp':
        parser.error('En esta etapa Debian solo admite MCP en 127.0.0.1:5901.')
    if args.public_origin and not re.fullmatch(r'https://[a-z0-9.-]+', args.public_origin):
        parser.error('--public-origin debe ser un origen HTTPS sin ruta ni puerto.')
    server = BoundedServer(('127.0.0.1', args.port), partial(Handler, directory=str(ROOT / 'site')))
    server.shared_mcp = bool(args.mcp_token_file)
    server.engine = RemoteMcpEngine(args.mcp_token_file, args.mcp_url) if server.shared_mcp else Engine(args.engine_root)
    server.public_origin = args.public_origin
    server.origin_key = Path(args.origin_key_file).read_text(encoding='utf-8').strip() if args.origin_key_file else None
    if args.public_origin and not server.origin_key: parser.error('La publicación requiere --origin-key-file.')
    if server.shared_mcp:
        server.engine.get_catalog()
    else:
        with IsolatedEngine(args.engine_root) as bootstrap:
            server.engine.catalog = bootstrap.get_catalog()
    print(f'Simulador local: http://localhost:{args.port}', flush=True)
    server.serve_forever()
