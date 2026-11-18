/* Selección de gateway por capacidad, conservando el modo manual administrativo. */
'use strict';
globalThis.SimEngineRouting=(()=>{
  const ENGINES=['windows','debian'];
  function requirements(graph){
    const types=[...new Set((graph?.nodes||[]).filter(n=>!['CSTR','PFR','Polymerization','RigorousColumn','AbsorptionColumn','ReliefValve'].includes(n.type)).map(n=>n.type))];
    const linked=new Map((graph?.nodes||[]).map(n=>[n.id,[]]));
    for(const e of graph?.edges||[])if(linked.has(e.from))linked.get(e.from).push(e.to);
    const active=new Set(),done=new Set();
    function cycle(id){if(active.has(id))return true;if(done.has(id))return false;active.add(id);for(const to of linked.get(id)||[])if(cycle(to))return true;active.delete(id);done.add(id);return false;}
    const recirculation=[...linked.keys()].some(cycle);
    return {types,recirculation};
  }
  function check(status,graph){
    const need=requirements(graph);
    if(!status||!Array.isArray(status.supported_equipment))return {compatible:false,reason:'El gateway no informó las operaciones disponibles.',missing:[],missingFeatures:[]};
    if(status.state!=='ready')return {compatible:false,reason:status.state==='busy'?'El gateway está ocupado.':'El gateway no está listo.',missing:[],missingFeatures:[]};
    const missing=need.types.filter(type=>!status.supported_equipment.includes(type));
    const missingFeatures=need.recirculation&&!status.supported_features?.includes('simple_material_recycle')?['simple_material_recycle']:[];
    const issues=[];
    if(missing.length)issues.push('No admite: '+missing.join(', '));
    if(missingFeatures.length)issues.push('Falta la función de recirculación simple (simple_material_recycle)');
    return {compatible:issues.length===0,reason:issues.join('; '),missing,missingFeatures};
  }
  function supports(status,graph){return check(status,graph).compatible;}
  function order(mode,current){
    if(ENGINES.includes(mode))return [mode];
    return current==='debian'?['debian','windows']:['windows','debian'];
  }
  return {requirements,check,supports,order};
})();
