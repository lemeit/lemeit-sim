/* Interfaz aislada de la física del tanque: no toca DWSIM ni el estado calculado. */
'use strict';
globalThis.SimTankDynamicsUI=(()=>{
 let current=null,interval=null;
 const $=id=>document.getElementById(id);
 const read=id=>Number($(id).value);
 const escape=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const num=(v,d=3)=>Number.isFinite(v)?v.toLocaleString('es-AR',{maximumFractionDigits:d}):'—';
 const pause=()=>{if(interval!==null){clearInterval(interval);interval=null;}$('tank-dynamic-play').textContent='▶ Reproducir';};
 function availableDensity(result,id){
   const stream=result?.streams?.[id];
   return stream?.phases?.find(p=>p.name==='Mixture')?.density_kg_m3??stream?.phases?.[0]?.density_kg_m3;
 }
 function open({node,graph,result,valid}){
   pause();current=null;
   const inlet=graph.edges.find(e=>e.to===node.id&&graph.nodes.some(n=>n.id===e.from&&n.type==='MaterialStream'))?.from;
   const outlet=graph.edges.find(e=>e.from===node.id&&graph.nodes.some(n=>n.id===e.to&&n.type==='MaterialStream'))?.to;
   const volume=Number(node.volume_m3)>0?Number(node.volume_m3):5;
   const rho=valid?availableDensity(result,inlet):null;
   const input=valid?result?.streams?.[inlet]?.mass_flow_kg_s:null;
   const output=valid?result?.streams?.[outlet]?.mass_flow_kg_s:null;
   $('tank-dynamic-title').textContent='Dinámica · '+String(node.name||'Tanque');
   $('tank-dynamic-capacity').value=String(volume);
   $('tank-dynamic-area').value=String(Math.max(0.01,volume/2));
   $('tank-dynamic-initial').value=String(volume*0.1);
   $('tank-dynamic-density').value=String(Number.isFinite(rho)&&rho>0?rho:997);
   $('tank-dynamic-inlet').value=String(Number.isFinite(input)&&input>=0?input:1);
   $('tank-dynamic-outlet').value='0';
   $('tank-dynamic-mode').value='constant';
   $('tank-dynamic-coefficient').value='0.62';
   $('tank-dynamic-orifice').value='0.0005';
   $('tank-dynamic-duration').value='6000';
   $('tank-dynamic-step').value='20';
   $('tank-dynamic-chart-select').value='volume';
   $('tank-dynamic-hint').textContent='Modelo simplificado independiente de DWSIM. '+(Number.isFinite(rho)&&rho>0&&Number.isFinite(input)?'Densidad y caudal inicial tomados de la última corrida estacionaria; el caudal de salida se fija inicialmente en cero para estudiar el llenado.':'No hay propiedades calculadas válidas para esta entrada: densidad y caudal son valores iniciales orientativos editables.')+(Number.isFinite(output)?' Salida estacionaria: '+num(output)+' kg/s.':'');
   $('tank-dynamic-error').hidden=true;
   $('tank-dynamic-result').hidden=true;
   $('tank-dynamic-empty').hidden=false;
   $('tank-dynamic-download').disabled=true;
   $('tank-dynamic-play').disabled=true;
   $('tank-dynamic-scrub').disabled=true;
   updateOutlet();
   $('tank-dynamics-dialog').showModal();
   globalThis.SimTankDwsimMode?.onOpen();
 }
 function updateOutlet(){
   const gravity=$('tank-dynamic-mode').value==='gravity';
   $('tank-dynamic-outlet-container').hidden=gravity;
   $('tank-dynamic-gravity-parameters').hidden=!gravity;
 }
 const values=()=>({
   capacityM3:read('tank-dynamic-capacity'),areaM2:read('tank-dynamic-area'),
   densityKgM3:read('tank-dynamic-density'),initialVolumeM3:read('tank-dynamic-initial'),
   inflowKgS:read('tank-dynamic-inlet'),outflowKgS:read('tank-dynamic-outlet'),
   outletMode:$('tank-dynamic-mode').value,dischargeCoefficient:read('tank-dynamic-coefficient'),
   outletAreaM2:read('tank-dynamic-orifice'),durationS:read('tank-dynamic-duration'),
   stepS:read('tank-dynamic-step')
 });
 function calculate(){
   pause();
   try{
     current=SimTankDynamics.simulate(values());
     $('tank-dynamic-error').hidden=true;
     $('tank-dynamic-result').hidden=false;
     $('tank-dynamic-empty').hidden=true;
     $('tank-dynamic-download').disabled=false;
     $('tank-dynamic-play').disabled=false;
     const slider=$('tank-dynamic-scrub');slider.min='0';slider.max=String(current.points.length-1);slider.value='0';slider.disabled=false;
     const event=current.event==='lleno'?'Alcanzó el volumen máximo':current.event==='vacío'?'Tanque vacío':'Duración completada';
     $('tank-dynamic-status').textContent=event+' · '+current.points.length+' puntos · Residuo de masa '+num(current.massResidualKg,8)+' kg';
     render();
   }catch(error){
     current=null;$('tank-dynamic-result').hidden=true;$('tank-dynamic-empty').hidden=false;$('tank-dynamic-play').disabled=true;$('tank-dynamic-download').disabled=true;
     $('tank-dynamic-error').textContent=error.message;$('tank-dynamic-error').hidden=false;
   }
 }
 function render(){
   if(!current)return;
   const points=current.points,at=Math.min(points.length-1,Number($('tank-dynamic-scrub').value)),point=points[at];
   $('tank-dynamic-reading').textContent='t = '+num(point.time_s,2)+' s · V = '+num(point.volume_m3,4)+' m³ · h = '+num(point.level_m,4)+' m · '+num(point.fill_pct,2)+' %';
   const variable=$('tank-dynamic-chart-select').value;
   const chartSeries=variable==='level'?[{key:'level_m',name:'Nivel [m]',color:'#2368a2'}]:
     variable==='flows'?[{key:'inlet_m3_s',name:'Entrada [m³/s]',color:'#2465a3'},{key:'outlet_m3_s',name:'Salida [m³/s]',color:'#b14d44'}]:
     [{key:'volume_m3',name:'Volumen [m³]',color:'#2465a3'}];
   const left=58,right=746,top=22,bottom=216,w=right-left,h=bottom-top,end=points[points.length-1].time_s||1;
   const maxVal=Math.max(1e-12,...chartSeries.flatMap(s=>points.map(p=>p[s.key])))*1.08;
   const xx=t=>left+w*t/end, yy=v=>bottom-h*v/maxVal;
   const lines=chartSeries.map(s=>{
     const d=points.map((p,i)=>(i?'L':'M')+xx(p.time_s).toFixed(2)+' '+yy(p[s.key]).toFixed(2)).join(' ');
     const marker='<circle cx="'+xx(point.time_s).toFixed(2)+'" cy="'+yy(point[s.key]).toFixed(2)+'" r="4" fill="'+s.color+'"/>';
     return '<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2" stroke-linejoin="round"/>'+marker;
   }).join('');
   const axisTicks=[0,.25,.5,.75,1].map(k=>'<line x1="'+left+'" x2="'+right+'" y1="'+yy(k*maxVal).toFixed(2)+'" y2="'+yy(k*maxVal).toFixed(2)+'" stroke="currentColor" opacity=".1"/><text x="'+(left-8)+'" y="'+(yy(k*maxVal)+4).toFixed(2)+'" text-anchor="end">'+escape(num(k*maxVal,4))+'</text>').join('');
   const xticks=[0,.25,.5,.75,1].map(k=>'<text x="'+xx(k*end).toFixed(2)+'" y="240" text-anchor="middle">'+escape(num(k*end,1))+'</text>').join('');
   const legend=chartSeries.map((s,i)=>'<rect x="'+(left+i*180)+'" y="2" width="10" height="3" fill="'+s.color+'"/><text x="'+(left+15+i*180)+'" y="8">'+escape(s.name)+'</text>').join('');
   $('tank-dynamic-chart').innerHTML='<g class="tank-chart-axis" fill="currentColor" font-size="11">'+axisTicks+xticks+legend+'<text x="400" y="257" text-anchor="middle">Tiempo [s]</text></g>'+lines;
 }
 function download(){
   if(!current)return;
   const csv=SimTankDynamics.csv(current),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
   const link=document.createElement('a');link.href=url;link.download='sim-tanque-dinamico-modelo-didactico.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
 }
 function play(){
   if(!current)return;
   if(interval!==null){pause();return;}
   const slider=$('tank-dynamic-scrub');
   if(Number(slider.value)>=current.points.length-1)slider.value='0';
   $('tank-dynamic-play').textContent='⏸ Pausar';
   interval=setInterval(()=>{
     const next=Math.min(current.points.length-1,Number(slider.value)+Math.max(1,Math.ceil(current.points.length/100)));
     slider.value=String(next);render();
     if(next===current.points.length-1)pause();
   },80);
 }
 function bind(){
   if(!$('tank-dynamics-dialog'))return;
   $('tank-dynamic-mode').addEventListener('change',updateOutlet);
   $('tank-dynamic-calculate').addEventListener('click',calculate);
   $('tank-dynamic-play').addEventListener('click',play);
   $('tank-dynamic-chart-select').addEventListener('change',render);
   $('tank-dynamic-scrub').addEventListener('input',()=>{pause();render();});
   $('tank-dynamic-download').addEventListener('click',download);
   $('tank-dynamics-dialog').addEventListener('close',()=>{pause();current=null;});
 }
 function showExternal(data){
   if(data?.source!=='dwsim-mcp-dynamics'||!Array.isArray(data.points)||data.points.length<2)
     throw Error('Los datos de DWSIM no contienen una serie de nivel válida.');
   pause();current=data;
   $('tank-dynamic-error').hidden=true;
   $('tank-dynamic-result').hidden=false;
   $('tank-dynamic-empty').hidden=true;
   $('tank-dynamic-download').disabled=false;
   $('tank-dynamic-play').disabled=false;
   const slider=$('tank-dynamic-scrub');slider.min='0';slider.max=String(data.points.length-1);slider.value='0';slider.disabled=false;
   $('tank-dynamic-status').textContent='DWSIM · '+data.points.length+' puntos · nivel del motor, volumen derivado de geometría';
   render();
 }
 return {open,bind,showExternal};
})();
