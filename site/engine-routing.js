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
  function supports(status,graph){
    if(!status||!['ready','busy'].includes(status.state)||!Array.isArray(status.supported_equipment))return false;
    const need=requirements(graph);
    return need.types.every(type=>status.supported_equipment.includes(type))
      &&(!need.recirculation||status.supported_features?.includes('simple_material_recycle')===true);
  }
  function order(mode,current){
    if(ENGINES.includes(mode))return [mode];
    return current==='debian'?['debian','windows']:['windows','debian'];
  }
  return {requirements,supports,order};
})();
