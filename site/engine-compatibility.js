/* Comparación pura de capacidades anunciadas por gateways; nunca implica ejecutar un solver. */
'use strict';
globalThis.SimEngineCompatibility=(()=>{
  const OPERATIONS=Object.freeze([
    ['MaterialStream','Corriente de materia'],
    ['EnergyStream','Corriente de energía'],
    ['Mixer','Mezclador'],
    ['Splitter','Divisor'],
    ['Separator','Separador flash'],
    ['Pump','Bomba'],
    ['Compressor','Compresor'],
    ['Expander','Expansor'],
    ['Tank','Tanque'],
    ['Valve','Válvula'],
    ['Heater','Calentador'],
    ['Cooler','Enfriador'],
    ['HeatExchanger','Intercambiador'],
    ['ConversionReactor','Reactor de conversión'],
    ['EquilibriumReactor','Reactor de equilibrio'],
    ['simple_material_recycle','Recirculación simple · sin reacción']
  ].map(([type,label])=>Object.freeze({type,label})));
  const validVersion=value=>typeof value==='string'&&/^\d+\.\d+\.\d+$/.test(value);
  function compareVersions(gateway,portal){
    if(!validVersion(gateway)||!validVersion(portal))return 'unknown';
    const a=gateway.split('.').map(Number),b=portal.split('.').map(Number);
    for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]<b[i]?'older':'newer';
    return 'same';
  }
  function capability(status,type){
    if(!status||!Array.isArray(status.supported_equipment))return 'unknown';
    const capabilities=type==='simple_material_recycle'?(status.supported_features||[]):status.supported_equipment;
    return Array.isArray(capabilities)&&capabilities.includes(type)?'supported':'unsupported';
  }
  function comparison(windows,debian){
    return OPERATIONS.map(operation=>({
      ...operation,windows:capability(windows,operation.type),debian:capability(debian,operation.type)
    }));
  }
  function missing(status,types){
    if(!status||!Array.isArray(status.supported_equipment))return null;
    return types.filter(type=>!status.supported_equipment.includes(type));
  }
  return Object.freeze({OPERATIONS,compareVersions,capability,comparison,missing});
})();
