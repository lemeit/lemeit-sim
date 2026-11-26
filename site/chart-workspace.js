/* ΣIM · ventana científica independiente de la simulación. Datos en memoria del proyecto. */
'use strict';
globalThis.SimChartWorkspace=(()=>{
 const $=id=>document.getElementById(id);
 let dataset=null,interval=null,dynamic=null,manual=null,model=null,getData=()=>({}),sources=[];
 const vars=[
  ['time_s','Tiempo','s'],['level_m','Nivel','m'],['volume_m3','Volumen','m³'],['fill_pct','Llenado','%'],
  ['inlet_m3_s','Entrada volumétrica','m³/s'],['outlet_m3_s','Salida volumétrica','m³/s'],
  ['inlet_kg_s','Entrada másica','kg/s'],['outlet_kg_s','Descarga másica','kg/s'],['mass_kg','Masa','kg']
 ];
 const fmt=v=>Number.isFinite(v)?v.toLocaleString('es-AR',{maximumSignificantDigits:7}):'—';
 function pause(){if(interval!==null){clearInterval(interval);interval=null;}if($('charts-play'))$('charts-play').textContent='▶ Reproducir';}
 function reset(){pause();dataset=null;dynamic=null;manual=null;model=null;if($('charts-title'))$('charts-title').value='';if($('charts-dialog')?.open)refresh();}
 function accept(data,meta={}){
  if(!Array.isArray(data?.points)||!data.points.length)return;
  const real=data.source==='dwsim-mcp-dynamics';
  const density=data.config?.density;
  const points=data.points.map(p=>({...p,...(!real&&Number.isFinite(density)?{inlet_kg_s:p.inlet_m3_s*density,outlet_kg_s:p.outlet_m3_s*density}:{})}));
  const columns=vars.filter(([key])=>points.some(p=>Number.isFinite(p[key]))).map(([key,name,unit])=>({key,name:real&&['inlet_m3_s','outlet_m3_s'].includes(key)?name+' estimada':real&&['volume_m3','fill_pct'].includes(key)?name+' derivado':name,unit}));
  if(!columns.length)return;
  dynamic={points,columns,title:meta.title||'Tanque',source:real?'DWSIM MCP'+(meta.engine?' · '+meta.engine:''):'ΣIM · modelo didáctico',assumptions:data.assumptions||''};
  if($('charts-title'))$('charts-title').value='';
  if($('charts-dialog')?.open)refresh('dynamic');
 }
 function option(select,column){const o=document.createElement('option');o.value=column.key;o.textContent=column.name+(column.unit?' ['+column.unit+']':'');select.append(o);}
 function refresh(preferred){
  pause();const state=getData();sources=SimChartData.stationary(state.graph||{nodes:[]},state.result,state.engine).map((d,i)=>({id:'steady'+i,d}));if(dynamic)sources.push({id:'dynamic',d:dynamic});if(manual)sources.push({id:'manual',d:manual});if(model)sources.push({id:'model',d:model});const picker=$('charts-dataset'),previous=preferred||picker.value;picker.replaceChildren();for(const entry of sources){const o=document.createElement('option');o.value=entry.id;o.textContent=entry.d.title+' · '+entry.d.source;picker.append(o);}picker.value=sources.some(s=>s.id===previous)?previous:dynamic?'dynamic':sources[0]?.id||'';dataset=sources.find(s=>s.id===picker.value)?.d||null;const ready=!!dataset;
  $('charts-empty').hidden=ready;$('charts-content').hidden=!ready;
  if(!ready)return;
  $('charts-source').textContent=dataset.title+' · '+dataset.source+' · '+dataset.points.length+' registros';
  $('charts-note').textContent=dataset.assumptions;
  for(const id of ['charts-x','charts-y','charts-y2'])$(id).replaceChildren();
  const none=document.createElement('option');none.value='';none.textContent='Ninguna';$('charts-y2').append(none);
  for(const c of dataset.columns)for(const id of ['charts-x','charts-y','charts-y2'])option($(id),c);
  $('charts-x').value=dataset.columns.some(c=>c.key==='time_s')?'time_s':dataset.columns[0].key;
  $('charts-y').value=dataset.columns.some(c=>c.key==='level_m')?'level_m':dataset.columns.some(c=>c.key==='temperature')?'temperature':dataset.columns[1]?.key||dataset.columns[0].key;
  $('charts-y2').value='';$('charts-log').checked=false;$('charts-log-x').checked=false;$('charts-style').value=dataset.categorical?'points':'both';$('charts-play').hidden=!!dataset.categorical;
  const scrub=$('charts-scrub');scrub.max=String(dataset.points.length-1);scrub.value='0';render();
 }
 function render(){
  if(!dataset)return;
  const x=dataset.columns.find(c=>c.key===$('charts-x').value),y=dataset.columns.find(c=>c.key===$('charts-y').value);
  const y2=dataset.columns.find(c=>c.key===$('charts-y2').value);
  const chosen=[y,...(y2&&y2.key!==y.key&&y2.unit===y.unit?[y2]:[])];
  for(const option of $('charts-y2').options){const c=dataset.columns.find(v=>v.key===option.value);option.disabled=!!c&&(c.unit!==y.unit||c.key===y.key);}
  if(chosen.length===1)$('charts-y2').value='';
  const index=Number($('charts-scrub').value),p=dataset.points[index];
  const config={points:dataset.points,xKey:x.key,xLabel:x.name+(x.unit?' ['+x.unit+']':''),yLabel:chosen.length===1?y.name+(y.unit?' ['+y.unit+']':''):'Magnitud ['+y.unit+']',series:chosen.map((c,i)=>({key:c.key,name:c.name,color:i===0?$('charts-color').value:undefined})),index,grid:$('charts-grid').checked,markers:$('charts-markers').checked||$('charts-style').value!=='line',connect:$('charts-style').value!=='points',logX:$('charts-log-x').checked,strokeWidth:Number($('charts-width').value),legend:$('charts-legend').checked,logY:$('charts-log').checked,zeroY:$('charts-zero').checked,title:$('charts-title').value||dataset.title,source:dataset.source,categories:dataset.categorical&&x.key==='index'?dataset.points.map(p=>p.label):null};
  const compare=$('charts-compare');compare.disabled=dataset!==model||!sources.some(e=>e.id.startsWith('steady')&&e.d.columns.some(c=>c.key===x.key&&c.unit===x.unit)&&e.d.columns.some(c=>c.key===y.key&&c.unit===y.unit));
  if(!compare.disabled&&compare.checked){const other=sources.find(e=>e.id.startsWith('steady')&&e.d.columns.some(c=>c.key===x.key&&c.unit===x.unit)&&e.d.columns.some(c=>c.key===y.key&&c.unit===y.unit));config.extra=[{name:'Estados DWSIM · '+other.d.title,points:other.d.points.map(p=>({x:p[x.key],y:p[y.key]})),color:'#a33b35'}];}
  try{SimScientificCharts.render($('charts-svg'),config);$('charts-error').textContent='';}
  catch(e){$('charts-svg').replaceChildren();$('charts-error').textContent=e.message;}
  $('charts-reading').textContent=(p?.label?p.label+' · ':'')+[x,...chosen].map(c=>c.name+': '+fmt(p?.[c.key])+' '+c.unit).join(' · ');
  $('charts-export-svg').disabled=!!$('charts-error').textContent;
 }
 function open(preferred){document.querySelectorAll('.app-menu[open]').forEach(m=>m.removeAttribute('open'));refresh(typeof preferred==='string'?preferred:undefined);$('charts-dialog').showModal();}
 function play(){if(interval!==null){pause();return;}const s=$('charts-scrub');if(Number(s.value)>=Number(s.max))s.value='0';$('charts-play').textContent='⏸ Pausar';interval=setInterval(()=>{s.value=String(Math.min(Number(s.max),Number(s.value)+1));render();if(s.value===s.max)pause();},80);}
 function csv(){
  if(!dataset)return;
  const escape=s=>{let v=String(s);if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};
  const rows=['Origen;'+escape(dataset.source),'Objeto;'+dataset.columns.map(c=>escape(c.name+' ['+c.unit+']')).join(';'),...dataset.points.map(p=>escape(p.label||'')+';'+dataset.columns.map(c=>Number.isFinite(p[c.key])?String(p[c.key]).replace('.',','):'').join(';'))];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='sim-series.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
 }
 function modelFields(){const d=SimChartModels.definitions[$('charts-model').value],host=$('charts-model-params');host.replaceChildren();for(const [key,name,value] of d.params){const l=document.createElement('label'),input=document.createElement('input');l.textContent=name;input.type='number';input.step='any';input.value=String(value);input.dataset.key=key;l.append(input);host.append(l);}}
 function bind(options={}){
  for(const [id,d] of Object.entries(SimChartModels.definitions)){const o=document.createElement('option');o.value=id;o.textContent=d.name;$('charts-model').append(o);}modelFields();
  $('charts-model').addEventListener('change',modelFields);
  $('charts-model-run').addEventListener('click',()=>{try{const p=Object.fromEntries([...$('charts-model-params').querySelectorAll('input')].map(e=>[e.dataset.key,e.valueAsNumber]));model=SimChartModels.generate($('charts-model').value,p);$('charts-model-error').textContent='';refresh('model');}catch(e){$('charts-model-error').textContent=e.message;}});
  $('charts-compare').addEventListener('change',render);
  if(typeof options.getData==='function')getData=options.getData;
  $('charts-dataset').addEventListener('change',()=>refresh($('charts-dataset').value));
  $('charts-load-data').addEventListener('click',()=>{try{manual=SimChartData.parse($('charts-paste').value);$('charts-import-error').textContent='';refresh('manual');}catch(e){$('charts-import-error').textContent=e.message;}});
  $('charts-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;if(f.size>2000000){$('charts-import-error').textContent='Archivo demasiado grande.';return;}try{$('charts-paste').value=await f.text();manual=SimChartData.parse($('charts-paste').value);$('charts-import-error').textContent='';refresh('manual');}catch(err){$('charts-import-error').textContent=err.message;}});
  for(const id of ['charts-open','charts-menu-open'])$(id).addEventListener('click',open);
  $('charts-from-tank').addEventListener('click',()=>{$('tank-dynamics-dialog').close();open('dynamic');});
  for(const id of ['charts-x','charts-y','charts-y2','charts-grid','charts-markers','charts-log','charts-zero','charts-log-x','charts-style','charts-color','charts-width','charts-legend'])$(id).addEventListener('change',render);
  $('charts-title').addEventListener('input',render);$('charts-scrub').addEventListener('input',()=>{pause();render();});
  $('charts-play').addEventListener('click',play);$('charts-export-svg').addEventListener('click',()=>SimScientificCharts.download($('charts-svg')));
  $('charts-export-csv').addEventListener('click',csv);$('charts-dialog').addEventListener('close',pause);
 }
 return Object.freeze({accept,reset,bind,open});
})();
