/* ΣIM · ventana científica independiente de la simulación. Datos en memoria del proyecto. */
'use strict';
globalThis.SimChartWorkspace=(()=>{
 const $=id=>document.getElementById(id);
 let dataset=null,interval=null,dynamic=null,manual=null,model=null,getData=()=>({}),sources=[],preferredSource='',view=[0,0,785,340],dataPage=0,availableModels=[],modelContext=null;
 const vars=[
  ['time_s','Tiempo','s'],['level_m','Nivel','m'],['volume_m3','Volumen','m³'],['fill_pct','Llenado','%'],
  ['inlet_m3_s','Entrada volumétrica','m³/s'],['outlet_m3_s','Salida volumétrica','m³/s'],
  ['inlet_kg_s','Entrada másica','kg/s'],['outlet_kg_s','Descarga másica','kg/s'],['mass_kg','Masa','kg']
 ];
 const fmt=v=>Number.isFinite(v)?v.toLocaleString('es-AR',{maximumSignificantDigits:7}):'—';
 function pause(){if(interval!==null){clearInterval(interval);interval=null;}if($('charts-play'))$('charts-play').textContent='▶ Reproducir';}
 function reset(){pause();dataset=null;dynamic=null;manual=null;model=null;preferredSource='';modelContext=null;if($('charts-title'))$('charts-title').value='';$('charts-subtitle').value='';$('charts-subtitle-mode').value='auto';if($('charts-dialog'))close();}
 function accept(data,meta={}){
  if(!Array.isArray(data?.points)||!data.points.length)return;
  const real=data.source==='dwsim-mcp-dynamics';
  const density=data.config?.density;
  const points=data.points.map(p=>({...p,...(!real&&Number.isFinite(density)?{inlet_kg_s:p.inlet_m3_s*density,outlet_kg_s:p.outlet_m3_s*density}:{})}));
  const definitions=Array.isArray(data.columns)?data.columns.map(c=>[c.key,c.name,c.unit]):vars;
  const columns=definitions.filter(([key])=>points.some(p=>Number.isFinite(p[key]))).map(([key,name,unit])=>({key,name:real&&['inlet_m3_s','outlet_m3_s'].includes(key)?name+' estimada':real&&['volume_m3','fill_pct'].includes(key)?name+' derivado':name,unit}));
  if(!columns.length)return;
  preferredSource='dynamic';dynamic={points,columns,title:meta.title||'Tanque',source:real?'DWSIM · Dinámica':'ΣIM · Modelo analítico',assumptions:data.assumptions||'',defaultY:meta.defaultY||'level_m'};
  if($('charts-title'))$('charts-title').value='';
  show('dynamic');
 }
 function option(select,column){const o=document.createElement('option');o.value=column.key;o.textContent=column.name+(column.unit?' ['+column.unit+']':'');select.append(o);}
 function refresh(preferred){
  pause();const state=getData();availableModels=dynamic?[]:SimChartModels.available(state.graph,state.result,state.selectedId);updateModelOptions();sources=SimChartData.stationary(state.graph||{nodes:[]},state.graph?.simulation?.regime==='dynamic'?null:state.result,state.engine).map((d,i)=>({id:'steady'+i,d}));if(dynamic)sources.push({id:'dynamic',d:dynamic});if(manual)sources.push({id:'manual',d:manual});if(model&&availableModels.some(m=>m.id===modelContext?.id&&m.equipment===modelContext?.equipment))sources.push({id:'model',d:model});const picker=$('charts-dataset'),previous=preferred||preferredSource||picker.value;picker.replaceChildren();for(const entry of sources){const o=document.createElement('option');o.value=entry.id;o.textContent=entry.id==='dynamic'?entry.d.title+' · Evolución temporal':entry.id==='manual'?'Datos importados':entry.id==='model'?entry.d.title:entry.d.title+' · Estado estacionario';picker.append(o);}picker.value=sources.some(s=>s.id===previous)?previous:dynamic?'dynamic':sources[0]?.id||'';dataset=sources.find(s=>s.id===picker.value)?.d||null;preferredSource=picker.value;view=[0,0,785,340];dataPage=0;const ready=!!dataset;
  $('charts-empty').hidden=ready;$('charts-dataset').disabled=sources.length<2;$('charts-content').hidden=!ready;
  if(!ready)return;
  $('charts-source').textContent=dataset.title+' · '+dataset.source+' · '+dataset.points.length+' registros';$('charts-dataset').disabled=sources.length<2;
  $('charts-note').textContent=dataset.assumptions;
  for(const id of ['charts-x','charts-y','charts-y2'])$(id).replaceChildren();
  const none=document.createElement('option');none.value='';none.textContent='Ninguna';$('charts-y2').append(none);
  for(const c of dataset.columns)for(const id of ['charts-x','charts-y','charts-y2'])option($(id),c);
  $('charts-x').value=dataset.columns.some(c=>c.key==='time_s')?'time_s':dataset.columns[0].key;
  $('charts-y').value=dataset.columns.some(c=>c.key===dataset.defaultY)?dataset.defaultY:dataset.columns.some(c=>c.key==='level_m')?'level_m':dataset.columns.some(c=>c.key==='temperature')?'temperature':dataset.columns[1]?.key||dataset.columns[0].key;
  $('charts-y2').value='';$('charts-log-y2').checked=false;$('charts-zero-y2').checked=true;$('charts-log').checked=false;$('charts-log-x').checked=false;$('charts-style').value=dataset.categorical?'points':'both';$('charts-markers').checked=true;$('charts-play').hidden=!!dataset.categorical;
  const scrub=$('charts-scrub');scrub.max=String(dataset.points.length-1);scrub.value='0';render();renderTable();
 }
 function render(){
  if(!dataset)return;
  const x=dataset.columns.find(c=>c.key===$('charts-x').value),y=dataset.columns.find(c=>c.key===$('charts-y').value);
  const y2=dataset.columns.find(c=>c.key===$('charts-y2').value);
  const chosen=[y,...(y2&&y2.key!==y.key&&y2.key!==x.key?[y2]:[])];
  for(const option of $('charts-y2').options){const c=dataset.columns.find(v=>v.key===option.value);option.disabled=!!c&&(c.key===y.key||c.key===x.key);}
  if(chosen.length===1)$('charts-y2').value='';
  $('charts-series2-format').hidden=chosen.length!==2;
  const dual=chosen.length===2&&y.unit!==chosen[1].unit;$('charts-y2-scale').hidden=!dual;
  const index=Number($('charts-scrub').value),p=dataset.points[index];
  const graph=getData().graph;const imported=dataset===manual;const regime=dataset===dynamic?'Dinámico':dataset===model?'Modelo analítico':imported?'Datos importados':'Estacionario';const autoSubtitle=[graph?.title,regime].filter(Boolean).join(' · ');const custom=$('charts-subtitle-mode').value==='custom';$('charts-subtitle').disabled=!custom;if(!custom)$('charts-subtitle').value=autoSubtitle;const config={subtitle:$('charts-meta-subtitle').checked?$('charts-subtitle').value:'',reference:$('charts-meta-reference').checked?['ΣIM '+document.documentElement.dataset.portalVersion,!imported?graph?.model:null,dataset.points.length+' registros'].filter(Boolean).join(' · '):'',generated:$('charts-meta-date').checked?'Generado: '+new Date().toLocaleString('es-AR'):'',points:dataset.points,xKey:x.key,xLabel:x.name+(x.unit?' ['+x.unit+']':''),y2Label:dual?chosen[1].name+(chosen[1].unit?' ['+chosen[1].unit+']':''):'',logY2:$('charts-log-y2').checked,zeroY2:$('charts-zero-y2').checked,yLabel:chosen.length===1||dual?y.name+(y.unit?' ['+y.unit+']':''):'Magnitud ['+y.unit+']',series:chosen.map((c,i)=>({key:c.key,name:c.name,axis:dual&&i===1?'right':'left',color:$(i?'charts-color2':'charts-color').value,connect:$(i?'charts-style2':'charts-style').value!=='points',markers:$(i?'charts-style2':'charts-style').value==='both'&&(i||$('charts-markers').checked)?true:false,strokeWidth:Number($(i?'charts-width2':'charts-width').value)})),index,grid:$('charts-grid').checked,markers:$('charts-markers').checked&&$('charts-style').value!=='line',connect:$('charts-style').value!=='points',logX:$('charts-log-x').checked,strokeWidth:Number($('charts-width').value),legend:$('charts-legend').checked,logY:$('charts-log').checked,zeroY:$('charts-zero').checked,title:$('charts-title').value||dataset.title,source:dataset.source,categories:dataset.categorical&&x.key==='index'?dataset.points.map(p=>p.label):null};
  const compare=$('charts-compare');compare.closest('label').hidden=dataset!==model;compare.disabled=dataset!==model||!sources.some(e=>e.id.startsWith('steady')&&e.d.columns.some(c=>c.key===x.key&&c.unit===x.unit)&&e.d.columns.some(c=>c.key===y.key&&c.unit===y.unit));
  if(!compare.disabled&&compare.checked){const other=sources.find(e=>e.id.startsWith('steady')&&e.d.columns.some(c=>c.key===x.key&&c.unit===x.unit)&&e.d.columns.some(c=>c.key===y.key&&c.unit===y.unit));config.extra=[{name:'Estados DWSIM · '+other.d.title,points:other.d.points.filter(p=>modelContext?.streamIds?.includes(p.objectId)).map(p=>({x:p[x.key],y:p[y.key]})),color:'#a33b35'}];}
  try{SimScientificCharts.render($('charts-svg'),config);applyView();$('charts-error').textContent='';}
  catch(e){$('charts-svg').replaceChildren();$('charts-error').textContent=e.message;}
  $('charts-reading').textContent=(p?.label?p.label+' · ':'')+[x,...chosen].map(c=>c.name+': '+fmt(p?.[c.key])+' '+c.unit).join(' · ');
  for(const id of ['charts-export-svg','charts-export-png','charts-export-jpg'])$(id).disabled=!!$('charts-error').textContent;
 }
 function show(preferred){const panel=$('charts-dialog');if(!panel)return;if(document.body.classList.contains('diagram-focus')&&!document.body.classList.contains('diagram-window'))$('diagram-focus')?.click();panel.hidden=false;syncVisibility();try{refresh(typeof preferred==='string'?preferred:undefined);$('charts-open-error').hidden=true;}catch(error){$('charts-content').hidden=true;$('charts-empty').hidden=true;$('charts-open-error').textContent='No se pudieron preparar los datos de la gráfica: '+error.message;$('charts-open-error').hidden=false;console.error('Gráficas:',error);}globalThis.SimDockLayout?.reveal?.('charts');}
 function syncVisibility(){const open=!$('charts-dialog').hidden;for(const id of ['charts-open','charts-menu-open'])$(id)?.setAttribute('aria-pressed',String(open));}
 function open(preferred){document.querySelectorAll('.app-menu[open]').forEach(m=>m.removeAttribute('open'));show(preferred);}
 function toggle(){if(!$('charts-dialog').hidden)close();else open();}
 function close(){pause();$('charts-dialog').hidden=true;syncVisibility();}
 function completed(){// No imponer una gráfica estacionaria arbitraria ni tapar el diagrama tras cada cálculo.
 if(!$('charts-dialog').hidden)show(dynamic?'dynamic':'steady0');}
 function applyView(){$('charts-svg').setAttribute('viewBox',view.join(' '));}
 function zoom(factor,cx=.5,cy=.5){const [x,y,w,h]=view;const nw=Math.max(785/16,Math.min(785,w*factor)),nh=nw*340/785;view=[Math.max(0,Math.min(785-nw,x+(w-nw)*cx)),Math.max(0,Math.min(340-nh,y+(h-nh)*cy)),nw,nh];applyView();}
 function renderTable(){if(!dataset)return;const host=$('charts-data-table'),table=document.createElement('table'),head=table.createTHead().insertRow();for(const name of ['#',...dataset.columns.map(c=>c.name+(c.unit?' ['+c.unit+']':''))]){const th=document.createElement('th');th.textContent=name;head.append(th);}const body=table.createTBody(),start=dataPage*100,end=Math.min(start+100,dataset.points.length);for(let i=start;i<end;i++){const row=body.insertRow();for(const value of [i+1,...dataset.columns.map(c=>fmt(dataset.points[i][c.key]))])row.insertCell().textContent=String(value);}host.replaceChildren(table);$('charts-data-count').textContent=(start+1)+'–'+end+' / '+dataset.points.length;$('charts-data-prev').disabled=start===0;$('charts-data-next').disabled=end===dataset.points.length;}
 function bindNavigation(){const svg=$('charts-svg');let drag=null;$('charts-close').onclick=close;$('charts-zoom-in').onclick=()=>zoom(.8);$('charts-zoom-out').onclick=()=>zoom(1.25);$('charts-fit').onclick=()=>{view=[0,0,785,340];applyView();};svg.addEventListener('wheel',e=>{if(!dataset)return;e.preventDefault();const r=svg.getBoundingClientRect();zoom(e.deltaY<0?.8:1.25,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);},{passive:false});svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,view:[...view]};svg.setPointerCapture(e.pointerId);});svg.addEventListener('pointermove',e=>{if(!drag)return;const r=svg.getBoundingClientRect(),[x,y,w,h]=drag.view;view=[Math.max(0,Math.min(785-w,x-(e.clientX-drag.x)*w/r.width)),Math.max(0,Math.min(340-h,y-(e.clientY-drag.y)*h/r.height)),w,h];applyView();});for(const event of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(event,()=>{drag=null;});svg.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){zoom(.8);e.preventDefault();}else if(e.key==='-'){zoom(1.25);e.preventDefault();}else if(e.key.startsWith('Arrow')){const [x,y,w,h]=view;view=[Math.max(0,Math.min(785-w,x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)*w*.1)),Math.max(0,Math.min(340-h,y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)*h*.1)),w,h];applyView();e.preventDefault();}});$('charts-data-prev').onclick=()=>{dataPage=Math.max(0,dataPage-1);renderTable();};$('charts-data-next').onclick=()=>{if((dataPage+1)*100<dataset.points.length){dataPage++;renderTable();}};}
 function play(){if(interval!==null){pause();return;}const s=$('charts-scrub');if(Number(s.value)>=Number(s.max))s.value='0';$('charts-play').textContent='⏸ Pausar';interval=setInterval(()=>{s.value=String(Math.min(Number(s.max),Number(s.value)+1));render();if(s.value===s.max)pause();},80);}
 function csv(){
  if(!dataset)return;
  const escape=s=>{let v=String(s);if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};
  const rows=['Origen;'+escape(dataset.source),'Objeto;'+dataset.columns.map(c=>escape(c.name+' ['+c.unit+']')).join(';'),...dataset.points.map(p=>escape(p.label||'')+';'+dataset.columns.map(c=>Number.isFinite(p[c.key])?String(p[c.key]).replace('.',','):'').join(';'))];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='sim-series.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
 }
 function updateModelOptions(){const select=$('charts-model'),previous=select.value;select.replaceChildren();$('charts-model-section').hidden=!availableModels.length;for(const m of availableModels){const o=document.createElement('option');o.value=m.id;o.textContent=SimChartModels.definitions[m.id].name;select.append(o);}if(availableModels.some(m=>m.id===previous))select.value=previous;modelFields();}
 function modelFields(){const d=SimChartModels.definitions[$('charts-model').value],host=$('charts-model-params'),ctx=availableModels.find(m=>m.id===$('charts-model').value);host.replaceChildren();if(!d||!ctx)return;for(const [key,name,value] of d.params){const l=document.createElement('label'),input=document.createElement('input');l.textContent=name;input.type='number';input.step='any';input.value=String(ctx.params[key]??value);input.dataset.key=key;l.append(input);host.append(l);}}
 function bind(options={}){
  bindNavigation();
  document.querySelectorAll('[data-palette]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.palette;$(id).value=button.dataset.color;document.querySelectorAll('[data-palette="'+id+'"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
  $('charts-subtitle').addEventListener('input',render);

  $('charts-model').addEventListener('change',modelFields);
  $('charts-model-run').addEventListener('click',()=>{try{const p=Object.fromEntries([...$('charts-model-params').querySelectorAll('input')].map(e=>[e.dataset.key,e.valueAsNumber]));modelContext=availableModels.find(m=>m.id===$('charts-model').value);if(!modelContext)throw Error('No hay un modelo compatible con este proceso.');model=SimChartModels.generate(modelContext.id,p);$('charts-model-error').textContent='';refresh('model');}catch(e){$('charts-model-error').textContent=e.message;}});
  $('charts-compare').addEventListener('change',render);
  if(typeof options.getData==='function')getData=options.getData;
  $('charts-dataset').addEventListener('change',()=>refresh($('charts-dataset').value));
  $('charts-load-data').addEventListener('click',()=>{try{manual=SimChartData.parse($('charts-paste').value);$('charts-import-error').textContent='';refresh('manual');}catch(e){$('charts-import-error').textContent=e.message;}});
  $('charts-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;if(f.size>2000000){$('charts-import-error').textContent='Archivo demasiado grande.';return;}try{$('charts-paste').value=await f.text();manual=SimChartData.parse($('charts-paste').value);$('charts-import-error').textContent='';refresh('manual');}catch(err){$('charts-import-error').textContent=err.message;}});
  for(const id of ['charts-open','charts-menu-open'])$(id).addEventListener('click',toggle);syncVisibility();
  $('charts-from-tank').addEventListener('click',()=>{globalThis.SimTankDynamicsUI?.publishCurrent?.();$('tank-dynamics-dialog').close();open('dynamic');});
  for(const id of ['charts-x','charts-y','charts-log-x','charts-log'])$(id).addEventListener('change',()=>{view=[0,0,785,340];});
  for(const id of ['charts-x','charts-y','charts-y2','charts-log-y2','charts-zero-y2','charts-grid','charts-markers','charts-log','charts-zero','charts-log-x','charts-style','charts-color','charts-width','charts-style2','charts-width2','charts-color2','charts-subtitle-mode','charts-legend','charts-meta-subtitle','charts-meta-reference','charts-meta-date'])$(id).addEventListener('change',render);
  $('charts-title').addEventListener('input',render);$('charts-scrub').addEventListener('input',()=>{pause();render();});
  $('charts-play').addEventListener('click',play);for(const format of ['svg','png','jpg'])$('charts-export-'+format).addEventListener('click',async()=>{try{render();const name=(getData().graph?.title||dataset?.title||'sim-grafica').replace(/[^\p{L}\p{N}._-]+/gu,'-').slice(0,75);await SimScientificCharts.download($('charts-svg'),name+'.'+format,format);}catch(error){$('charts-error').textContent=error.message;}});
  $('charts-export-csv').addEventListener('click',csv);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('charts-dialog').hidden&&$('charts-dialog').contains(document.activeElement)&&!document.querySelector('dialog[open]'))close();});
 }
 return Object.freeze({accept,reset,bind,open,close,completed});
})();
