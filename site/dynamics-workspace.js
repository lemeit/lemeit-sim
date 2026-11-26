/* Régimen dinámico del proyecto. Registro de adaptadores; no reemplaza el solver estacionario. */
'use strict';
globalThis.SimDynamics=(()=>{
 const defaults={duration_s:600,step_s:5,height_m:2,inlet_kv:100,outlet_kv:400,valve_opening_pct:50};
 const fields=[['duration_s','Duración [s]'],['step_s','Paso temporal [s]'],['height_m','Altura del tanque [m]'],['inlet_kv','Kv entrada [m³/h]'],['outlet_kv','Kv salida [m³/h]'],['valve_opening_pct','Apertura de válvulas [%]']];
 function regime(g){return g?.simulation?.regime==='dynamic'?'dynamic':'steady';}
 function normalize(g){if(!g.simulation&&/^20 · Tanque con válvulas/.test(g.title||''))g.simulation={regime:'dynamic',model:'tank-valves',parameters:{...defaults}};if(g.simulation?.regime==='dynamic'){g.simulation={regime:'dynamic',model:g.simulation.model||'tank-valves',parameters:{...defaults,...g.simulation.parameters}};}else g.simulation={regime:'steady'};return g;}
 function tank(g){
  const ns=g.nodes||[],es=g.edges||[],incoming=new Map(ns.map(n=>[n.id,[]])),outgoing=new Map(ns.map(n=>[n.id,[]]));
  for(const e of es){if(!incoming.has(e.to)||!outgoing.has(e.from))throw Error('Conexión inválida.');incoming.get(e.to).push(e.from);outgoing.get(e.from).push(e.to);}
  if(ns.length!==7||es.length!==6||g.compounds?.length!==1||g.compounds[0]!=='Water')throw Error('La dinámica DWSIM disponible admite solamente el circuito de agua con tanque y dos válvulas del Ejemplo 20.');
  let n=ns.find(n=>incoming.get(n.id).length===0),chain=[];
  while(n&&chain.length<7){chain.push(n);const next=outgoing.get(n.id);if(next.length>1)throw Error('La dinámica del tanque requiere un circuito sin ramificaciones.');n=ns.find(v=>v.id===next[0]);}
  if(n||chain.map(n=>n.type).join(',')!=='MaterialStream,Valve,MaterialStream,Tank,MaterialStream,Valve,MaterialStream'||new Set(chain.map(n=>n.id)).size!==7)throw Error('Conectá alimentación, válvula, tanque y válvula de descarga como en el Ejemplo 20.');
  const [feed,, ,vessel,,exit]=chain,p={...defaults,...g.simulation?.parameters};
  if(feed.temperature_C!==25)throw Error('Este integrador experimental utiliza agua a 25 °C; no admite otra temperatura todavía.');
  if(feed.flow_basis&&feed.flow_basis!=='mass'||feed.flash_spec&&feed.flash_spec!=='TP')throw Error('La alimentación dinámica requiere temperatura, presión y caudal másico.');
  const payload={capacity_m3:vessel.volume_m3,height_m:p.height_m,feed_pressure_kPa:feed.pressure_kPa,outlet_pressure_kPa:exit.outlet_pressure_kPa,feed_mass_flow_kg_s:feed.mass_flow,inlet_kv:p.inlet_kv,outlet_kv:p.outlet_kv,valve_opening_pct:p.valve_opening_pct,step_s:p.step_s,duration_s:p.duration_s};
  for(const [key,val] of Object.entries(payload))if(!Number.isFinite(val)||val<=0)throw Error('Parámetro dinámico inválido: '+key);
  if(payload.step_s>payload.duration_s||payload.valve_opening_pct>100||payload.feed_pressure_kPa<=payload.outlet_pressure_kPa)throw Error('Revisá paso temporal, apertura y presiones.');
  return {payload,title:vessel.name,objectId:vessel.id};
 }
 const adapters={'tank-valves':{prepare:tank,path:'/api/dynamics/tank',source:'dwsim-mcp-dynamics',defaultY:'level_m'}};
 function prepare(g){const a=adapters[g.simulation?.model];if(!a)throw Error('Modelo dinámico todavía no disponible.');return {...a,...a.prepare(g)};}
 async function run(prepared,engine){const headers={'X-SIM-Engine':engine};const cap=await fetch('/api/dynamics/capabilities',{headers,cache:'no-store',signal:AbortSignal.timeout(12000)});const c=await cap.json().catch(()=>({}));if(cap.status===409)throw Error('Motor ocupado. Hay otra operación en curso; volvé a calcular en unos segundos.');if(!cap.ok)throw Error(c.error||'No se pudo consultar la capacidad dinámica (HTTP '+cap.status+').');if(c.supported!==true)throw Error('El servicio no admite integración dinámica DWSIM. No se ejecutó un cálculo estacionario ni un sustituto.');const res=await fetch(prepared.path,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(prepared.payload),signal:AbortSignal.timeout(51000)});const data=await res.json();if(!res.ok)throw Error(data.error||'Falló la integración dinámica.');if(data.source!==prepared.source||!Array.isArray(data.points)||data.points.length<2||!data.points.every((p,i)=>Number.isFinite(p.time_s)&&Number.isFinite(p[prepared.defaultY])&&(i===0||p.time_s>data.points[i-1].time_s)))throw Error('La integración no devolvió una serie temporal válida.');return data;}
 return Object.freeze({regime,normalize,prepare,run,defaults,fields});
})();
