"""Ejercicio experimental de tanque dinámico con DWSIM MCP.

Solo el MCP ejecuta la integración. No sustituye resultados por el modelo de
Euler de ΣIM cuando la ejecución falla o el motor carece de estas herramientas.
La topología se basa en el tutorial oficial de tanque entre dos válvulas.
"""
import math
import time

REQUIRED = {
    'dwsim_dynamics_setup', 'dwsim_dynamics_monitor', 'dwsim_dynamics_object',
    'dwsim_dynamics_check', 'dwsim_dynamics_run', 'dwsim_dynamics_status',
    'dwsim_dynamics_series', 'dwsim_flowsheet_close',
}
PRESET = {
    'capacity_m3': 2.0, 'height_m': 2.0, 'temperature_C': 25.0,
    'feed_pressure_kPa': 130.0, 'outlet_pressure_kPa': 101.325,
    'feed_mass_flow_kg_s': 10.0, 'inlet_kv': 100.0,
    'outlet_kv': 400.0, 'valve_opening_pct': 50.0,
    'step_s': 5.0, 'duration_s': 600.0,
}
MAX_WALL_S = 30


class DynamicInputError(ValueError):
    pass


def capabilities(engine):
    """Public only: no schemas, tokens or MCP endpoint exposed to browser."""
    result = engine.rpc('tools/list')
    names = {item.get('name') for item in result.get('tools', []) if isinstance(item, dict)}
    missing = sorted(REQUIRED - names)
    return {
        'supported': not missing,
        'source': 'dwsim-mcp',
        'missing_tools': missing,
        'workload': 'water_tank_valves',
        'max_steps': 240,
    }


def _check_params(payload):
    if not isinstance(payload, dict):
        raise DynamicInputError('Configuración dinámica inválida.')
    unknown = set(payload) - set(PRESET)
    if unknown:
        raise DynamicInputError('Parámetros no admitidos: ' + ', '.join(sorted(unknown)))
    result = dict(PRESET)
    result.update(payload)
    bounds = {
        'capacity_m3': (0.2, 200), 'height_m': (0.2, 30),
        'temperature_C': (1, 90),
        'feed_pressure_kPa': (110, 2000), 'outlet_pressure_kPa': (50, 500),
        'feed_mass_flow_kg_s': (0.01, 200), 'inlet_kv': (0.01, 10000),
        'outlet_kv': (0.01, 10000), 'valve_opening_pct': (1, 100),
        'step_s': (0.5, 60), 'duration_s': (10, 1200),
    }
    for name, (low, high) in bounds.items():
        value = result[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
            raise DynamicInputError(name + ': valor fuera de rango.')
        result[name] = float(value)
    if result['duration_s'] / result['step_s'] > 240:
        raise DynamicInputError('Máximo 240 pasos por corrida experimental.')
    if result['outlet_pressure_kPa'] >= result['feed_pressure_kPa']:
        raise DynamicInputError('La presión de entrada debe superar la presión de salida.')
    return result


def _curve(series, name):
    data = series.get(name)
    if not isinstance(data, dict) or not isinstance(data.get('values'), list):
        raise DynamicInputError('DWSIM no registró la variable ' + name + '.')
    return [float(x) for x in data['values']]


def run_tank(engine, payload=None):
    """Serie real desde DWSIM; jamás inferir datos del modelo didáctico."""
    p = _check_params(payload or {})
    caps = capabilities(engine)
    if not caps['supported']:
        raise DynamicInputError('El MCP instalado no expone la dinámica requerida: ' + ', '.join(caps['missing_tools']))
    fid = engine.call('dwsim_flowsheet_create', name='SIM: prueba dinámica agua, válvulas y tanque')['flowsheet_id']
    def call(tool, **args):
        return engine.call(tool, flowsheet_id=fid, **args)
    try:
        call('dwsim_thermo_add_compounds', names=['Water'])
        call('dwsim_thermo_set_property_package', name='Steam Tables (IAPWS-IF97)')
        call('dwsim_stream_add_material', name='Inlet', temperature_K=p['temperature_C'] + 273.15,
             pressure_Pa=p['feed_pressure_kPa'] * 1000,
             mass_flow_kg_s=p['feed_mass_flow_kg_s'], composition={'Water': 1.0})
        for name in ('S-1', 'S-2'):
            call('dwsim_stream_add_material', name=name)
        call('dwsim_stream_add_material', name='Outlet', pressure_Pa=p['outlet_pressure_kPa'] * 1000)
        for kind, name in (('Valve', 'V-01'), ('Tank', 'T-01'), ('Valve', 'V-02')):
            call('dwsim_unitop_add', type=kind, name=name)
        call('dwsim_unitop_connect', unitop='V-01', feed_stream='Inlet', product_stream='S-1')
        call('dwsim_unitop_connect', unitop='T-01', feed_stream='S-1', product_stream='S-2')
        call('dwsim_unitop_connect', unitop='V-02', feed_stream='S-2', product_stream='Outlet')
        # Set the steady-state model before activating dynamic mode.
        call('dwsim_unitop_set', name='T-01', properties={'Volume': p['capacity_m3']})
        for tag, kv in (('V-01', p['inlet_kv']), ('V-02', p['outlet_kv'])):
            # Properties that don't exist must be rejected by the MCP; no silent success.
            call('dwsim_unitop_set', name=tag, properties={'CalcMode':'Kv_Liquid', 'Kv': kv})
        solved = call('dwsim_solve_run', timeout_s=25)
        if not solved.get('ok'):
            raise DynamicInputError('El estado estacionario previo no convergió: '+str(solved.get('errors', []))[:700])
        # The pressure boundary is imposed after the steady-state solve, which updates Outlet.
        call('dwsim_stream_set_conditions', name='Outlet',
             pressure_Pa=p['outlet_pressure_kPa'] * 1000)
        call('dwsim_dynamics_object', tag='Inlet', dynamics_spec='Flow')
        call('dwsim_dynamics_object', tag='Outlet', dynamics_spec='Pressure')
        call('dwsim_dynamics_object', tag='T-01', properties={'Height': p['height_m']})
        call('dwsim_dynamics_object', tag='V-01', valve_calc_mode='Kv_Liquid',
             properties={'OpeningPercent':p['valve_opening_pct']})
        call('dwsim_dynamics_object', tag='V-02', valve_calc_mode='Kv_Liquid',
             valve_opening_characteristic='Linear',
             properties={'OpeningPercent':p['valve_opening_pct']})
        call('dwsim_dynamics_setup', schedule='SIM-Filling', integrator='SIM-Integrator',
             step_s=p['step_s'], duration_s=p['duration_s'], method='ExplicitEuler')
        monitored = ['T-01.Liquid Level', 'Outlet.PROP_MS_2']
        call('dwsim_dynamics_monitor', integrator='SIM-Integrator', action='set', variables=monitored)
        readiness = call('dwsim_dynamics_check', schedule='SIM-Filling')
        if not readiness.get('ready'):
            raise DynamicInputError('DWSIM bloqueó la simulación dinámica: '+str(readiness.get('findings', []))[:900])
        start = call('dwsim_dynamics_run', schedule='SIM-Filling',
                     max_wall_time_s=MAX_WALL_S, max_steps=240, wait=True)
        if not start.get('started'):
            raise DynamicInputError('DWSIM no pudo iniciar la integración: '+str(start.get('blockers', []))[:900])
        job = engine.call('dwsim_dynamics_status', run_id=start['run_id'])
        if job.get('state') not in ('completed', 'finished', 'success'):
            raise DynamicInputError('La integración no terminó correctamente: '+str(job.get('error') or job.get('state')))
        preview = engine.call('dwsim_dynamics_series', run_id=start['run_id'],
                              variables=monitored, max_points=240)
        times = [float(t) for t in preview.get('t_s', [])]
        levels = _curve(preview.get('series', {}), monitored[0])
        outlet = _curve(preview.get('series', {}), monitored[1])
        if len(times) < 2 or len(times) != len(levels) or len(levels) != len(outlet):
            raise DynamicInputError('DWSIM devolvió una serie temporal incompleta.')
        area = p['capacity_m3'] / p['height_m']
        density = 997.0  # approximation used only to derive volume from level, not by the MCP.
        points = [{
            'time_s':t, 'level_m':h, 'volume_m3':h*area,
            'fill_pct':100*h/p['height_m'], 'mass_kg':h*area*density,
            'inlet_m3_s':p['feed_mass_flow_kg_s']/density,
            'outlet_m3_s':q/density,
            'outlet_kg_s':q,
        } for t,h,q in zip(times,levels,outlet)]
        return {'source':'dwsim-mcp-dynamics', 'model':'DWSIM · integración temporal real',
                'engine':'DWSIM MCP', 'points':points, 'event':None,
                'simulatedDurationS':times[-1], 'massResidualKg':None,
                'assumptions':'Nivel y caudal de salida calculados por DWSIM. Volumen derivado de nivel y área; caudal volumétrico derivado con densidad orientativa 997 kg/m³.',
                'config':p, 'schedule':'SIM-Filling',
                'variables':monitored, 'decimated_from':preview.get('decimated_from')}
    finally:
        engine.call('dwsim_flowsheet_close', flowsheet_id=fid)
