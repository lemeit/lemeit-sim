/* Integración optativa DWSIM MCP. Nunca sustituye fallos del motor por el
 * integrador didáctico de ΣIM, ni altera el cálculo estacionario. */
'use strict';
globalThis.SimTankDwsimMode=(()=>{
 const $=id=>document.getElementById(id);
 let getEngine=()=> 'windows', generation=0, running=false, last=null;
 const real=()=>$('tank-dynamic-source').value==='dwsim';
 const number=id=>Number($(id).value);
 const info=message=>{$('tank-dynamic-source-info').textContent=message;};
 function update(){
   const isReal=real();
   $('tank-dynamic-mcp-parameters').hidden=!isReal;
   $('tank-dynamic-model-label').textContent=isReal?'DWSIM MCP · integración temporal real (experimental)':'Modelo didáctico de ΣIM · no calculado con DWSIM';
   for(const id of ['tank-dynamic-area','tank-dynamic-density','tank-dynamic-initial']){
     $(id).closest('label').hidden=isReal;
   }
   $('tank-dynamic-mode').closest('label').hidden=isReal;
   $('tank-dynamic-outlet-container').hidden=isReal||$('tank-dynamic-mode').value==='gravity';
   $('tank-dynamic-gravity-parameters').hidden=isReal||$('tank-dynamic-mode').value!=='gravity';
   $('tank-dynamic-calculate').textContent=isReal?'Ejecutar dinámica DWSIM':'Calcular evolución';
   $('tank-dynamic-result').hidden=true;
   $('tank-dynamic-empty').hidden=false;
   $('tank-dynamic-play').disabled=true;
   $('tank-dynamic-download').disabled=true;
 }
 async function onOpen(){
   const token=++generation;last=null;running=false;
   $('tank-dynamic-source').value='sim';update();
   const option=$('tank-dynamic-source').querySelector('[value="dwsim"]');option.disabled=true;
   info('Comprobando el motor dinámico '+getEngine()+'…');
   $('tank-dynamic-height').value=String(Math.min(30,Math.max(.2,number('tank-dynamic-capacity')||2)));
   try{
     const engine=getEngine();
     const res=await fetch('/api/dynamics/capabilities',{headers:{'X-SIM-Engine':engine},signal:AbortSignal.timeout(12000),cache:'no-store'});
     const data=await res.json();
     if(token!==generation||!$('tank-dynamics-dialog').open)return;
     option.disabled=!(res.ok&&data.supported);
     info(option.disabled?'DWSIM dinámico no disponible en '+engine+': '+(data.error||'herramientas MCP incompletas')+'. Podés usar el modelo didáctico.':
       'Motor '+engine+' compatible con las herramientas de dinámica MCP. La integración real es experimental.');
     if(!option.disabled){
       $('tank-dynamic-source').value='dwsim';
       $('tank-dynamic-height').value=String(number('tank-dynamic-capacity')===2?2:Math.min(30,Math.max(.2,number('tank-dynamic-capacity')||2)));
       $('tank-dynamic-step').value='5';
       $('tank-dynamic-duration').value='600';
       update();
     }
   }catch(error){
     if(token!==generation)return;
     info('No se pudo verificar el motor '+getEngine()+'; se conserva el modelo didáctico.');
   }
 }
 async function calculate(){
   if(running)return;
   running=true;const token=generation,engine=getEngine();
   $('tank-dynamic-calculate').disabled=true;
   $('tank-dynamic-error').hidden=true;
   info('DWSIM '+engine+' · integrando nivel y caudales…');
   try{
     const payload={
       capacity_m3:number('tank-dynamic-capacity'),
       height_m:number('tank-dynamic-height'),
       feed_pressure_kPa:number('tank-dynamic-feed-pressure'),
       outlet_pressure_kPa:number('tank-dynamic-exit-pressure'),
       feed_mass_flow_kg_s:number('tank-dynamic-inlet'),
       inlet_kv:number('tank-dynamic-inlet-kv'),
       outlet_kv:number('tank-dynamic-outlet-kv'),
       valve_opening_pct:number('tank-dynamic-opening'),
       step_s:number('tank-dynamic-step'),duration_s:number('tank-dynamic-duration')
     };
     const response=await fetch('/api/dynamics/tank',{method:'POST',headers:{
       'Content-Type':'application/json','X-SIM-Engine':engine},
       body:JSON.stringify(payload),signal:AbortSignal.timeout(51000)});
     const data=await response.json();
     if(!response.ok)throw Error(data.error||'El motor DWSIM no pudo calcular el tanque.');
     if(data.source!=='dwsim-mcp-dynamics'||!Array.isArray(data.points)||data.points.length<2)
       throw Error('DWSIM no devolvió una serie temporal completa.');
     if(token!==generation||!$('tank-dynamics-dialog').open)return;
     last=data;
     SimTankDynamicsUI.showExternal(data);
     info('Resultado real de DWSIM '+engine+'. '+data.assumptions);
   }catch(error){
     if(token!==generation)return;
     last=null;
     $('tank-dynamic-error').textContent=error.message;
     $('tank-dynamic-error').hidden=false;
     info('No hay resultados DWSIM válidos. El modelo didáctico NO reemplazó la corrida.');
   }finally{
     if(token===generation){running=false;$('tank-dynamic-calculate').disabled=false;}
   }
 }
 function download(){
   if(!last||last.source!=='dwsim-mcp-dynamics')return;
   const value=n=>Number.isFinite(n)?String(Number(n.toPrecision(11))).replace('.',','):'';
   const lines=['Origen;DWSIM MCP · integración dinámica real',
     'Nota;'+last.assumptions,
     'Tiempo [s];Nivel [m];Volumen derivado [m3];Llenado [%];Entrada estimada [m3/s];Salida estimada [m3/s];Salida DWSIM [kg/s]'];
   for(const p of last.points)lines.push([p.time_s,p.level_m,p.volume_m3,p.fill_pct,p.inlet_m3_s,p.outlet_m3_s,p.outlet_kg_s].map(value).join(';'));
   const blob=new Blob(['\uFEFF'+lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='sim-tanque-dinamico-DWSIM.csv';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),500);
 }
 function bind(options={}){
   if(typeof options.getEngine==='function')getEngine=options.getEngine;
   const selection=$('tank-dynamic-source');if(!selection)return;
   selection.addEventListener('change',()=>{last=null;update();});
   $('tank-dynamic-calculate').addEventListener('click',e=>{
     if(!real())return;
     e.stopImmediatePropagation();e.preventDefault();
     void calculate();
   },true);
   $('tank-dynamic-download').addEventListener('click',e=>{
     if(!real())return;
     e.stopImmediatePropagation();e.preventDefault();download();
   },true);
   $('tank-dynamics-dialog').addEventListener('close',()=>{generation++;last=null;});
 }
 return Object.freeze({bind,onOpen});
})();
