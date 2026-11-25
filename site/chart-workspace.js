/* ΣIM · ventana científica independiente de la simulación. Datos en memoria del proyecto. */
'use strict';
globalThis.SimChartWorkspace=(()=>{
 const $=id=>document.getElementById(id);
 let dataset=null,interval=null;
 const vars=[
  ['time_s','Tiempo','s'],['level_m','Nivel','m'],['volume_m3','Volumen','m³'],['fill_pct','Llenado','%'],
  ['inlet_m3_s','Entrada volumétrica','m³/s'],['outlet_m3_s','Salida volumétrica','m³/s'],
  ['inlet_kg_s','Entrada másica','kg/s'],['outlet_kg_s','Descarga másica','kg/s'],['mass_kg','Masa','kg']
 ];
 const fmt=v=>Number.isFinite(v)?v.toLocaleString('es-AR',{maximumSignificantDigits:7}):'—';
 function pause(){if(interval!==null){clearInterval(interval);interval=null;}if($('charts-play'))$('charts-play').textContent='▶ Reproducir';}
 function reset(){pause();dataset=null;if($('charts-title'))$('charts-title').value='';if($('charts-dialog')?.open)refresh();}
 function accept(data,meta={}){
  if(!Array.isArray(data?.points)||!data.points.length)return;
  const real=data.source==='dwsim-mcp-dynamics';
  const density=data.config?.density;
  const points=data.points.map(p=>({...p,...(!real&&Number.isFinite(density)?{inlet_kg_s:p.inlet_m3_s*density,outlet_kg_s:p.outlet_m3_s*density}:{})}));
  const columns=vars.filter(([key])=>points.some(p=>Number.isFinite(p[key]))).map(([key,name,unit])=>({key,name:real&&['inlet_m3_s','outlet_m3_s'].includes(key)?name+' estimada':real&&['volume_m3','fill_pct'].includes(key)?name+' derivado':name,unit}));
  if(!columns.length)return;
  dataset={points,columns,title:meta.title||'Tanque',source:real?'DWSIM MCP'+(meta.engine?' · '+meta.engine:''):'ΣIM · modelo didáctico',assumptions:data.assumptions||''};
  if($('charts-title'))$('charts-title').value='';
  if($('charts-dialog')?.open)refresh();
 }
 function option(select,column){const o=document.createElement('option');o.value=column.key;o.textContent=column.name+' ['+column.unit+']';select.append(o);}
 function refresh(){
  pause();const ready=!!dataset;
  $('charts-empty').hidden=ready;$('charts-content').hidden=!ready;
  if(!ready)return;
  $('charts-source').textContent=dataset.title+' · '+dataset.source+' · '+dataset.points.length+' muestras';
  $('charts-note').textContent=dataset.assumptions;
  for(const id of ['charts-x','charts-y','charts-y2'])$(id).replaceChildren();
  const none=document.createElement('option');none.value='';none.textContent='Ninguna';$('charts-y2').append(none);
  for(const c of dataset.columns)for(const id of ['charts-x','charts-y','charts-y2'])option($(id),c);
  $('charts-x').value=dataset.columns.some(c=>c.key==='time_s')?'time_s':dataset.columns[0].key;
  $('charts-y').value=dataset.columns.some(c=>c.key==='level_m')?'level_m':dataset.columns.at(-1).key;
  $('charts-y2').value='';$('charts-log').checked=false;
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
  const config={points:dataset.points,xKey:x.key,xLabel:x.name+' ['+x.unit+']',yLabel:chosen.length===1?y.name+' ['+y.unit+']':'Magnitud ['+y.unit+']',series:chosen.map(c=>({key:c.key,name:c.name})),index,grid:$('charts-grid').checked,markers:$('charts-markers').checked,logY:$('charts-log').checked,zeroY:$('charts-zero').checked,title:$('charts-title').value||dataset.title,source:dataset.source};
  try{SimScientificCharts.render($('charts-svg'),config);$('charts-error').textContent='';}
  catch(e){$('charts-svg').replaceChildren();$('charts-error').textContent=e.message;}
  $('charts-reading').textContent=[x,...chosen].map(c=>c.name+': '+fmt(p?.[c.key])+' '+c.unit).join(' · ');
  $('charts-export-svg').disabled=!!$('charts-error').textContent;
 }
 function open(){document.querySelectorAll('.app-menu[open]').forEach(m=>m.removeAttribute('open'));refresh();$('charts-dialog').showModal();}
 function play(){if(interval!==null){pause();return;}const s=$('charts-scrub');if(Number(s.value)>=Number(s.max))s.value='0';$('charts-play').textContent='⏸ Pausar';interval=setInterval(()=>{s.value=String(Math.min(Number(s.max),Number(s.value)+1));render();if(s.value===s.max)pause();},80);}
 function csv(){
  if(!dataset)return;
  const escape=s=>'"'+String(s).replaceAll('"','""')+'"';
  const rows=['Origen;'+escape(dataset.source),dataset.columns.map(c=>escape(c.name+' ['+c.unit+']')).join(';'),...dataset.points.map(p=>dataset.columns.map(c=>Number.isFinite(p[c.key])?String(p[c.key]).replace('.',','):'').join(';'))];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='sim-series.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
 }
 function bind(){
  for(const id of ['charts-open','charts-menu-open'])$(id).addEventListener('click',open);
  $('charts-from-tank').addEventListener('click',()=>{$('tank-dynamics-dialog').close();open();});
  for(const id of ['charts-x','charts-y','charts-y2','charts-grid','charts-markers','charts-log','charts-zero'])$(id).addEventListener('change',render);
  $('charts-title').addEventListener('input',render);$('charts-scrub').addEventListener('input',()=>{pause();render();});
  $('charts-play').addEventListener('click',play);$('charts-export-svg').addEventListener('click',()=>SimScientificCharts.download($('charts-svg')));
  $('charts-export-csv').addEventListener('click',csv);$('charts-dialog').addEventListener('close',pause);
 }
 return Object.freeze({accept,reset,bind,open});
})();
