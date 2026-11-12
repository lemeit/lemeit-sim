/* Editor local de procesos. Las propiedades físicas proceden del servidor DWSIM. */
'use strict';
const $ = id => document.getElementById(id);
const TYPES = {
  MaterialStream: {label:'Corriente de materia', short:'Materia', icon:'material_stream', prefix:'C', w:150,h:70},
  EnergyStream: {label:'Corriente de energía', short:'Energía', icon:'energy_stream', prefix:'Q',w:130,h:65},
  Mixer: {label:'Mezclador',short:'Mezclador',icon:'mixer',prefix:'M',w:120,h:100},
  Splitter: {label:'Divisor',short:'Divisor',icon:'splitter',prefix:'D',w:120,h:100},
  Heater: {label:'Calentador',short:'Calentador',icon:'heater',prefix:'H',w:120,h:100},
  Cooler: {label:'Enfriador',short:'Enfriador',icon:'cooler',prefix:'E',w:120,h:100},
  ConversionReactor: {label:'Reactor de conversión',short:'Conversión',icon:'reactor_conversion',prefix:'R',w:130,h:110},
  EquilibriumReactor: {label:'Reactor de equilibrio',short:'Equilibrio',icon:'reactor_equilibrium',prefix:'R',w:130,h:110},
};
const isReactor=n=>['ConversionReactor','EquilibriumReactor'].includes(n.type);
let viewX=0, viewY=0, panning=null, endpointDrag=null, resizing=null, bending=null, paintFrame=0, paletteDragType=null, suppressPaletteUntil=0;
let graph, catalog, selection=null, pending=null, dragging=null, zoom=1, result=null, busy=false, revision=0;
let hasProject=false,engineOnline=false,draftCompounds=[];
let selectedEngine='windows',engineCheckGeneration=0; // Selección explícita; no se realiza failover.
let lastCalculation=null,connectionCheck=null,activity=[],resultDigits=3;
let connectionTrace=[],monitorRequest=false,monitorTimer=null,connectionPaintTimer=null;
let workspaceChannel=null,applyingWorkspace=false,workspaceId=new URLSearchParams(location.search).get('workspace')||crypto.randomUUID();
const emptyProject=()=>({version:1,title:'Ningún proyecto abierto',compounds:[],model:'',nodes:[],edges:[]});
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (value, digits=3) => Number.isFinite(value) ? (Math.abs(value)<.5*10**(-digits)?0:value).toLocaleString('es-AR',{maximumFractionDigits:digits}) : '—';
const blankResults = $('results').innerHTML;
function example(){return {version:1,title:'Mezcla de agua',compounds:['Water'],model:'Steam Tables (IAPWS-IF97)',nodes:[
  {id:'c1',type:'MaterialStream',name:'Agua fría',x:90,y:100,temperature_C:20,pressure_kPa:101.325,mass_flow:1,composition:{Water:1}},
  {id:'c2',type:'MaterialStream',name:'Agua caliente',x:90,y:310,temperature_C:80,pressure_kPa:101.325,mass_flow:1,composition:{Water:1}},
  {id:'m1',type:'Mixer',name:'Mezclador',x:435,y:190},
  {id:'c3',type:'MaterialStream',name:'Agua mezclada',x:745,y:205},
],edges:[{from:'c1',to:'m1',fromPort:'out',toPort:'in',toIndex:0},{from:'c2',to:'m1',fromPort:'out',toPort:'in',toIndex:1},{from:'m1',to:'c3',fromPort:'out',toPort:'in'}]};}

function notice(message,error=false){$('notice').hidden=!message;$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function persist(){try{localStorage.setItem('lemeit-process-v1',JSON.stringify(graph));}catch{/* Guardar archivo sigue disponible. */}}
function changed({physical=true}={}){
  if(physical){revision++;result=null;$('results').innerHTML=blankResults;$('result-meta').textContent='Sin resultados vigentes';$('calculation-state').textContent='Cambios pendientes de calcular';}
  if(hasProject)persist();renderDiagram();publishWorkspace(physical);
}
function updateControls(){
  $('close-project-button').disabled=!hasProject;$('menu-calculate').disabled=busy||!engineOnline||!hasProject||graph.nodes.length<2;document.querySelectorAll('[data-export]').forEach(b=>b.disabled=!result||busy);
  $('project-title').disabled=!hasProject;$('save-button').disabled=!hasProject;$('save-project-toolbar').disabled=!hasProject;
  $('compound-button').disabled=!hasProject||!catalog;$('model-select').disabled=!hasProject||!catalog;
  if($('diagram-add'))$('diagram-add').disabled=!hasProject||busy;
  $('calculate-button').disabled=busy||!engineOnline||!hasProject||graph.nodes.length<2;
  $('engine-select').disabled=busy;
  document.querySelectorAll('.palette-item').forEach(b=>b.disabled=!hasProject||busy);
  try{$('recent-button').disabled=!localStorage.getItem('lemeit-process-v1');}catch{$('recent-button').disabled=true;}
  const panel=$('start-panel');panel.hidden=graph.nodes.length>0;
  panel.innerHTML=hasProject?'<div class="blank-diagram-icon">⌁</div><h2>Diagrama vacío</h2><p>Agregá corrientes y equipos desde la biblioteca.<br>Después conectá sus puertos y definí las condiciones.</p>':'<div class="blank-diagram-icon">▱</div><h2>Ningún proyecto abierto</h2><p>Creá un proyecto, elegí componentes y modelo,<br>y empezá a construir el proceso.</p><p class="start-shortcut">Archivo → Nuevo proyecto · Abrir proyecto</p>';
  document.body.classList.toggle('no-project',!hasProject);
}
function nodeById(id){return graph.nodes.find(n=>n.id===id);}
function isStream(n){return n.type.endsWith('Stream');}
function isFeed(n){return n.type==='MaterialStream'&&!graph.edges.some(e=>e.to===n.id);}
function basePortList(n){
  const {w,h}=TYPES[n.type], list=[];
  if(isStream(n)){
    const medium=n.type==='EnergyStream'?'energy':'material',g=streamGeometry(n);
    return [{side:'in',index:0,x:g.a.x-n.x,y:g.a.y-n.y,medium},{side:'out',index:0,x:g.b.x-n.x,y:g.b.y-n.y,medium}];
  }
  if(n.type==='Mixer')return [{side:'in',index:0,x:0,y:25,medium:'material'},{side:'in',index:1,x:0,y:75,medium:'material'},{side:'in',index:2,x:0,y:50,medium:'material'},{side:'out',index:0,x:120,y:50,medium:'material'}];
  if(n.type==='Splitter')return [{side:'in',index:0,x:0,y:50,medium:'material'},{side:'out',index:0,x:120,y:25,medium:'material'},{side:'out',index:1,x:120,y:75,medium:'material'}];
  if(isReactor(n))return [{side:'in',index:0,x:0,y:55,medium:'material'},{side:'out',index:0,x:130,y:30,medium:'material'},{side:'out',index:1,x:130,y:80,medium:'material'}];
  list.push({side:'in',index:0,x:0,y:50,medium:'material'},{side:'out',index:0,x:120,y:50,medium:'material'});
  if(n.type==='Heater')list.push({side:'energy-in',index:0,x:60,y:100,medium:'energy'});
  if(n.type==='Cooler')list.push({side:'energy-out',index:0,x:60,y:100,medium:'energy'});
  return list;
}
function symbolScale(n){return isStream(n)?1:(n.scale??1);}
function portList(n){const ports=basePortList(n);return isStream(n)?ports:ports.map(p=>({...p,x:p.x*symbolScale(n),y:p.y*symbolScale(n)}));}
function point(n,side,index=0){const p=portList(n).find(p=>p.side===side&&p.index===index);return p?{x:n.x+p.x,y:n.y+p.y,medium:p.medium}:null;}
function normalForPort(n,side){return side.startsWith('energy')?{x:0,y:1}:side.endsWith('in')?{x:-1,y:0}:{x:1,y:0};}
function streamGeometry(n){
  let source=graph.edges.find(e=>e.to===n.id),target=graph.edges.find(e=>e.from===n.id);
  const a=source?point(nodeById(source.from),source.fromPort||'out',source.fromIndex||0):{x:n.startX??n.x,y:n.startY??(n.y+TYPES[n.type].h/2)};
  const b=target?point(nodeById(target.to),target.toPort||'in',target.toIndex||0):{x:n.endX??(n.x+TYPES[n.type].w),y:n.endY??(n.y+TYPES[n.type].h/2)};
  const g={a:{x:a.x,y:a.y},b:{x:b.x,y:b.y}};
  if(endpointDrag?.node===n.id&&endpointDrag.moved)g[endpointDrag.side==='in'?'a':'b']={x:endpointDrag.preview.x,y:endpointDrag.preview.y};
  if(endpointDrag?.node===n.id&&endpointDrag.moved){if(endpointDrag.side==='in')source=null;else target=null;}
  const dx=g.b.x-g.a.x,dy=g.b.y-g.a.y;
  const travel=Math.abs(dy)>Math.abs(dx)?{x:0,y:Math.sign(dy)||1}:{x:Math.sign(dx)||1,y:0};
  const energyPort=(target?.toPort||'').startsWith('energy')||(source?.fromPort||'').startsWith('energy');
  const routeAxis=n.routeAxis||(energyPort?'y':travel.y!==0?'y':'x');
  const startNormal=source?normalForPort(nodeById(source.from),source.fromPort||'out'):travel;
  const endNormal=target?normalForPort(nodeById(target.to),target.toPort||'in'):{x:-travel.x,y:-travel.y};
  const stub=28,A={x:g.a.x+startNormal.x*stub,y:g.a.y+startNormal.y*stub},B={x:g.b.x+endNormal.x*stub,y:g.b.y+endNormal.y*stub};
  let points;
  if(routeAxis==='y'){const mid=n.routeY??(A.y+B.y)/2;g.mid=mid;g.bend={x:(A.x+B.x)/2,y:mid,axis:'y'};points=[g.a,A,{x:A.x,y:mid},{x:B.x,y:mid},B,g.b];}
  else{const mid=n.routeX??(A.x+B.x)/2;g.mid=mid;g.bend={x:mid,y:(A.y+B.y)/2,axis:'x'};points=[g.a,A,{x:mid,y:A.y},{x:mid,y:B.y},B,g.b];}
  const clean=[];
  for(const p of points){if(clean.length&&p.x===clean.at(-1).x&&p.y===clean.at(-1).y)continue;while(clean.length>1){const prev=clean.at(-2),last=clean.at(-1),aligned=(prev.x===last.x&&last.x===p.x)||(prev.y===last.y&&last.y===p.y),forward=(last.x-prev.x)*(p.x-last.x)+(last.y-prev.y)*(p.y-last.y)>=0;if(!aligned||!forward)break;clean.pop();}clean.push(p);}
  g.d=`M${clean[0].x} ${clean[0].y}`+clean.slice(1).map((p,i)=>p.x===clean[i].x?` V${p.y}`:` H${p.x}`).join('');
  let longest={length:-1};for(let i=1;i<clean.length;i++){const a=clean[i-1],b=clean[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length>longest.length)longest={a,b,length};}
  g.label=longest.a?{x:(longest.a.x+longest.b.x)/2+(longest.a.x===longest.b.x?42:0),y:(longest.a.y+longest.b.y)/2-14}:{x:g.a.x,y:g.a.y-14};return g;
}
function setStreamBend(n,axis,value){n.routeAxis=axis;n[axis==='y'?'routeY':'routeX']=Math.max(0,Math.min(4000,value));}
function equipmentLabelX(n){const energyConnected=graph.edges.some(e=>(e.to===n.id&&nodeById(e.from)?.type==='EnergyStream')||(e.from===n.id&&nodeById(e.to)?.type==='EnergyStream'));return TYPES[n.type].w*symbolScale(n)/2+(energyConnected?100:0);}
const engineHeaders=()=>({'X-SIM-Engine':selectedEngine});
async function selectCalculationEngine(id){
  if(busy||!['windows','debian'].includes(id))return;
  selectedEngine=id;engineCheckGeneration++;engineOnline=false;connectionCheck=null;
  const element=$('engine-select');element.value=id;
  result=null;$('results').innerHTML=blankResults;$('result-meta').textContent='Sin resultados vigentes';
  $('calculation-state').textContent='Comprobá el motor elegido antes de calcular';
  updateControls();paintConnection();
  await checkEngine();
}
async function readCatalogResponse(response){try{return await response.json();}catch{throw new Error(`La API del motor no devolvió una respuesta válida (HTTP ${response.status}).`);}}
function equipmentSymbol(type){
  if(type==='Mixer')return '<path d="M20 15 H60 L105 50 L60 85 H20 Z M0 25 H20 M0 75 H20 M0 50 H20 M105 50 H120"/>';
  if(type==='Splitter')return '<path d="M15 50 L60 15 H100 V85 H60 Z M0 50 H15 M100 25 H120 M100 75 H120"/>';
  if(type==='Heater'||type==='Cooler')return `<path d="M0 50 L60 5 L120 50 L60 95 Z M60 95 V100"/><text class="symbol-sign" x="60" y="57" text-anchor="middle">${type==='Heater'?'H':'C'}</text>`;
  return '<path d="M35 25 C35 5 95 5 95 25 V85 C95 105 35 105 35 85 Z M0 55 H35 M95 30 H130 M95 80 H130"/>';
}
function renderPalette(){
  $('palette').innerHTML=Object.entries(TYPES).map(([type,t],i)=>`${i===0?'<p class="palette-group">CORRIENTES</p>':i===2?'<p class="palette-group">OPERACIONES</p>':''}<button class="palette-item" data-type="${type}" draggable="true" title="Agregar ${esc(t.label.toLowerCase())}"><svg class="palette-symbol" viewBox="0 0 130 110" aria-hidden="true">${type.endsWith('Stream')?'<path d="M5 55 H120 M100 40 L120 55 L100 70"/>':equipmentSymbol(type)}</svg><span>${t.label}</span><span class="add-sign">+</span></button>`).join('');
  $('palette').addEventListener('click',e=>{if(performance.now()<suppressPaletteUntil||dragging||endpointDrag||resizing||bending)return;const b=e.target.closest('button[data-type]');if(b){suppressPaletteUntil=performance.now()+300;addNode(b.dataset.type);}});
  $('palette').addEventListener('dragstart',e=>{const b=e.target.closest('button[data-type]');if(!b||b.disabled){e.preventDefault();return;}paletteDragType=b.dataset.type;e.dataTransfer.setData('application/x-lemeit-object',paletteDragType);e.dataTransfer.effectAllowed='copy';});
  $('palette').addEventListener('dragend',()=>{paletteDragType=null;suppressPaletteUntil=performance.now()+500;});
}
function renderDiagram(){
  const svg=$('diagram');svg.setAttribute('viewBox',`${viewX} ${viewY} ${1000/zoom} ${520/zoom}`);
  let html='<defs><marker id="arrow-material" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--spx-text)"/></marker><marker id="arrow-energy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--spx-good)"/></marker></defs>';
  [...graph.nodes].sort((a,b)=>Number(isStream(a))-Number(isStream(b))).forEach(n=>{
    const t=TYPES[n.type], r=result?.streams[n.id],feed=isFeed(n),scale=symbolScale(n);
    const g=isStream(n)?streamGeometry(n):null;
    html+=`<g transform="translate(${isStream(n)?0:n.x} ${isStream(n)?0:n.y})" class="node ${isStream(n)?'stream-node':'equipment-node'} ${selection?.node===n.id?'selected':''}" data-node="${n.id}" tabindex="0" role="button" aria-label="${esc(t.label+': '+n.name)}">`;
    if(g){
      html+=`<path class="stream-hit" d="${g.d}"/><path class="stream-line ${n.type==='EnergyStream'?'energy':''}" d="${g.d}" marker-end="url(#arrow-${n.type==='EnergyStream'?'energy':'material'})"/><text class="stream-label" text-anchor="middle" x="${g.label.x}" y="${g.label.y}">${esc(n.name)}</text>`;
    }else html+=`<g class="equipment-symbol" transform="scale(${scale})">${equipmentSymbol(n.type)}</g><text text-anchor="middle" class="equipment-label" x="${equipmentLabelX(n)}" y="${t.h*scale+20}">${esc(n.name)}</text><text text-anchor="middle" class="node-kind" x="${equipmentLabelX(n)}" y="${t.h*scale+35}">${esc(t.short.toUpperCase())}</text>`;
    const readingX=g?g.label.x:t.w*scale/2,readingY=g?g.label.y+32:t.h*scale+52;
    if(r)html+=`<text class="node-reading" x="${readingX}" y="${readingY}" text-anchor="middle">${fmt(r.temperature_K-273.15,2)} °C · ${fmt(r.mass_flow_kg_s)} kg/s</text>`;
    else if(feed&&(n.flash_spec||'TP')==='TP'&&(n.flow_basis||'mass')==='mass')html+=`<text class="node-reading" x="${readingX}" y="${readingY}" text-anchor="middle">${fmt(n.temperature_C,1)} °C · ${fmt(n.mass_flow)} kg/s</text>`;
    for(const raw of portList(n)){
      const p=isStream(n)?{...raw,x:raw.x+n.x,y:raw.y+n.y}:raw;
      const label=`${p.side.endsWith('in')?'Entrada':'Salida'} ${p.medium==='energy'?'de energía':p.index+1}${isReactor(n)&&p.side==='out'?(p.index===0?' · vapor':' · líquido'):''}`;
      html+=`<g data-port="${p.side}" data-index="${p.index}" data-owner="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}: ${label}"><circle class="port-target" cx="${p.x}" cy="${p.y}" r="13"/><circle class="port ${p.medium==='energy'?'energy':''} ${pending?.node===n.id&&pending.side===p.side&&pending.index===p.index?'pending':''}" cx="${p.x}" cy="${p.y}" r="5"/><title>${label}</title></g>`;
    }
    if(selection?.node===n.id){if(g)html+=`<circle class="bend-handle" data-bend="${n.id}" data-axis="${g.bend.axis}" cx="${g.bend.x}" cy="${g.bend.y}" r="7"><title>Arrastrar para acomodar el recorrido</title></circle>`;else html+=`<rect class="resize-handle" data-resize="${n.id}" x="${t.w*scale+2}" y="${t.h*scale+2}" width="14" height="14"><title>Arrastrar para cambiar el tamaño del símbolo</title></rect>`;}
    html+='</g>';
  });
  svg.innerHTML=html;$('object-count').textContent=`${graph.nodes.length} objetos`;
  $('zoom-label').textContent=`${Math.round(zoom*100)} %`;
  $('connection-hint').textContent=pending?'Ahora seleccioná un puerto de entrada compatible. Esc cancela.':'Arrastrá un extremo de la corriente al puerto de un equipo. Seleccioná la línea para editarla.';
  $('connection-hint').classList.toggle('active',!!pending);
  updateControls();
}
function field(key,label,unit,value,options={}){
  return `<label class="field"><span class="field-label"><span>${esc(label)}</span><span>${esc(unit)}</span></span><input data-field="${key}" type="${options.text?'text':'number'}" value="${esc(value??'')}" ${options.text?'maxlength="45"':'step="any" '+(options.min!==undefined?`min="${options.min}"`:'')} required></label>`;
}
function selectField(key,label,values,value){return `<label class="field"><span class="field-label">${esc(label)}</span><select data-field="${key}">${values.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;}
const streamTabs=new Map();
const streamLabels={temperature_C:'Temperatura',pressure_kPa:'Presión absoluta',mass_flow:'Caudal másico',molar_flow:'Caudal molar',enthalpy_kJ_kg:'Entalpía específica',entropy_kJ_kgK:'Entropía específica',vapor_fraction:'Fracción molar de vapor'};
function streamField(n,key){const unit=SimproxStreams.unit(n,key),value=SimproxStreams.fromCanonical(key,n[key],unit);return `<label class="field stream-field"><span class="field-label">${streamLabels[key]}</span><span class="stream-value-unit"><input type="number" step="any" data-field="${key}" data-stream-value="true" aria-label="${streamLabels[key]}" value="${value===null?'':esc(Number(value.toPrecision(12)))}"><select data-field="unit:${key}" aria-label="Unidad de ${streamLabels[key]}">${Object.keys(SimproxStreams.units[key]).map(u=>`<option ${u===unit?'selected':''}>${esc(u)}</option>`).join('')}</select></span></label>`;}
function streamReading(n,key,value){const unit=SimproxStreams.unit(n,key),converted=SimproxStreams.fromCanonical(key,value,unit);return `<div class="reading-row"><span>${streamLabels[key]}</span><b>${converted===null?'—':fmt(converted,5)} ${esc(unit)}</b></div>`;}
function renderStreamInspector(n,r){
  const tab=streamTabs.get(n.id)||'conditions',feed=isFeed(n);
  let html=`<div class="stream-tabs" role="group" aria-label="Propiedades de la corriente">${[['conditions','Condiciones'],['composition','Composición'],['results','Resultados']].map(([key,label])=>`<button type="button" data-stream-tab="${key}" aria-pressed="${tab===key}">${label}</button>`).join('')}</div>`;
  if(tab==='conditions'){
    html+=`<p class="mini">Paquete de propiedades: <strong>${esc(graph.model)}</strong></p>`;
    if(feed){html+='<p class="mini">Datos de entrada: dos propiedades independientes, un caudal y la composición. El motor calcula las demás propiedades.</p>';
      html+=selectField('flash_spec','Especificación flash',[['TP','Temperatura y presión (TP)'],['PH','Presión y entalpía (PH)'],['PS','Presión y entropía (PS)'],['PV','Presión y fracción de vapor (PV)'],['TV','Temperatura y fracción de vapor (TV)']],n.flash_spec||'TP').replace('<option value="PS"',graph.model==='Steam Tables (IAPWS-IF97)'?'<option disabled value="PS"':'<option value="PS"');
      if(graph.model==='Steam Tables (IAPWS-IF97)')html+='<p class="mini">PS no está habilitado con IAPWS-IF97: detectamos una discrepancia del motor en esa combinación.</p>';
      for(const key of SimproxStreams.specs[n.flash_spec||'TP']||[])html+=streamField(n,key);
      if(['PH','PS'].includes(n.flash_spec))html+='<p class="mini">Usá la referencia de entalpía/entropía del paquete seleccionado. Cambiar de modelo puede cambiar esa referencia.</p>';
      html+=selectField('flow_basis','Base del caudal',[['mass','Másico'],['molar','Molar']],n.flow_basis||'mass')+streamField(n,(n.flow_basis||'mass')==='mass'?'mass_flow':'molar_flow');
      if(['PV','TV'].includes(n.flash_spec))html+='<p class="mini">Fracción molar de vapor: 0 corresponde al punto de burbuja y 1 al punto de rocío, cuando el modelo y el estado permiten ese equilibrio.</p>';
    }else html+='<p class="inspector-description">Corriente calculada por el equipo de origen. Sus condiciones se consultan en Resultados. Para especificarla como alimentación, desconectá su entrada.</p>';
  }else if(tab==='composition'){
    if(feed){html+=selectField('composition_basis','Base de las fracciones',[['mass','Másica · kg/kg'],['molar','Molar · mol/mol']],n.composition_basis||'mass')+'<p class="mini">Al cambiar de base en una mezcla se vacían las fracciones: ingresalas en la nueva base. No se reinterpretan los valores anteriores.</p>';
      for(const c of graph.compounds)html+=field(`fraction:${c}`,c,n.composition_basis==='molar'?'mol/mol':'kg/kg',n.composition?.[c]??0,{min:0});
      const sum=graph.compounds.reduce((total,c)=>total+(n.composition?.[c]||0),0);html+=`<p class="mini" role="status">Suma: ${fmt(sum,6)} / 1${Math.abs(sum-1)>1e-6?' · Completá la composición.':''}</p>`;
    }else html+='<p class="mini">La composición de esta corriente la determina el cálculo. Consultá Resultados para ver las fracciones másicas y molares.</p>';
  }else{
    if(!r)return html+'<p class="mini">Sin resultados vigentes. Ejecutá Calcular para obtener las propiedades reales de DWSIM.</p>';
    const mixture=r.phases?.find(p=>p.name==='Mixture')||r.phases?.[0];
    html+='<details class="stream-phase"><summary>Unidades de los resultados</summary>'+Object.keys(streamLabels).filter(k=>k!=='vapor_fraction').map(k=>selectField('unit:'+k,streamLabels[k],Object.keys(SimproxStreams.units[k]).map(u=>[u,u]),SimproxStreams.unit(n,k))).join('')+'</details>';
    html+='<p class="inspector-section">ESTADO GLOBAL · CALCULADO POR DWSIM</p><div class="inspector-readings">'+streamReading(n,'temperature_C',r.temperature_K-273.15)+streamReading(n,'pressure_kPa',r.pressure_Pa/1000)+streamReading(n,'mass_flow',r.mass_flow_kg_s)+streamReading(n,'molar_flow',r.molar_flow_mol_s)+streamReading(n,'vapor_fraction',r.phases?.find(p=>p.name==='Vapor')?.fraction??0)+streamReading(n,'enthalpy_kJ_kg',mixture?.enthalpy_kJ_kg)+streamReading(n,'entropy_kJ_kgK',mixture?.entropy_kJ_kgK)+`<div class="reading-row"><span>Densidad</span><b>${Number.isFinite(mixture?.density_kg_m3)&&mixture.density_kg_m3>0?fmt(mixture.density_kg_m3,5)+' kg/m³':'—'}</b></div>`+`<div class="reading-row"><span>Caudal volumétrico</span><b>${mixture?.density_kg_m3>0?fmt(r.mass_flow_kg_s/mixture.density_kg_m3,6)+' m³/s':'—'}</b></div></div>`;
    html+='<p class="inspector-section">COMPOSICIÓN Y FASES</p><p class="mini">Fracción de fase en base molar. Líquido es el agregado de las fases líquidas: no se suma nuevamente a Líquido 1/2. Las fases ausentes se omiten. El conector puede devolver cero para propiedades no informadas.</p>';
    const names={Mixture:'Mezcla global',Vapor:'Vapor',Liquid:'Líquido total',OverallLiquid:'Líquido total',Liquid1:'Líquido 1',Liquid2:'Líquido 2',Aqueous:'Acuosa',Solid:'Sólido'};
    for(const phase of r.phases||[]){if(phase!==mixture&&!(phase.fraction>1e-10))continue;html+=`<details class="stream-phase" ${phase===mixture?'open':''}><summary>${esc(names[phase.name]||phase.name)} · ${fmt(phase.fraction,6)} mol/mol</summary>`;
      if(phase!==mixture)html+=`<div class="inspector-readings">${streamReading(n,'enthalpy_kJ_kg',phase.enthalpy_kJ_kg)}${streamReading(n,'entropy_kJ_kgK',phase.entropy_kJ_kgK)}<div class="reading-row"><span>Densidad</span><b>${phase.density_kg_m3>0?fmt(phase.density_kg_m3,5)+' kg/m³':'—'}</b></div></div>`;
      html+='<table class="stream-composition"><thead><tr><th>Compuesto</th><th>kg/kg</th><th>mol/mol</th></tr></thead><tbody>'+graph.compounds.map(c=>`<tr><th>${esc(c)}</th><td>${fmt(phase.compounds?.[c]?.mass_fraction,6)}</td><td>${fmt(phase.compounds?.[c]?.mole_fraction,6)}</td></tr>`).join('')+'</tbody></table></details>';
    }
  }
  return html;
}

function renderInspector(){
  const container=$('inspector');
  if(selection?.edge!==undefined){
    const edge=graph.edges[selection.edge];if(!edge){selection=null;return renderInspector();}
    container.innerHTML=`<p class="inspector-type">CONEXIÓN</p><h3 class="inspector-title">${esc(nodeById(edge.from).name)} → ${esc(nodeById(edge.to).name)}</h3><p class="inspector-description">Esta línea conecta objetos del proceso en DWSIM. Seleccioná «Eliminar conexión» para modificar el recorrido.</p><button class="delete-button" id="delete-selected">Eliminar conexión</button>`;return;
  }
  const n=nodeById(selection?.node);if(!n){container.innerHTML='<div class="empty-inspector"><span>⌁</span>Seleccioná un objeto del diagrama.<br>Acá vas a definir sus condiciones y consultar sus resultados.</div>';return;}
  const t=TYPES[n.type],r=result?.streams[n.id];
  let html=`<p class="inspector-type">${esc(t.label.toUpperCase())}</p><h3 class="inspector-title">${esc(n.name)}</h3>${field('name','Nombre','',n.name,{text:true})}`;
  if(!isStream(n))html+=`<p class="inspector-section">DISEÑO</p><label class="field"><span class="field-label">Tamaño del símbolo · %</span><input data-field="scale" type="number" min="50" max="300" step="10" value="${Math.round(symbolScale(n)*100)}"></label><p class="mini">Tamaño gráfico; no modifica las dimensiones físicas del equipo.</p>`;
  if(n.type==='MaterialStream')html+=renderStreamInspector(n,r);
  if(n.type==='Heater'||n.type==='Cooler')html+=`<p class="inspector-description">Especificación: temperatura de salida. El motor calcula el calor transferido al fluido. Caída de presión nula.</p>${field('outlet_C','Temperatura de salida','°C',n.outlet_C,{min:-273.14})}`;
  if(n.type==='Splitter')html+=`<p class="inspector-description">Dos salidas con la misma composición. La fracción restante sale por el puerto 2.</p>${field('split','Fracción hacia salida 1','kg/kg',n.split,{min:0.000001})}<p class="mini">Salida 2: ${fmt(1-n.split,4)}</p>`;
  if(n.type==='Mixer')html+='<p class="inspector-description">Mezcla adiabática, sin trabajo de eje. Admite hasta 3 entradas; la presión de salida es la menor de las entradas.</p><p class="mini">Σ ṁ<sub>e</sub> = ṁ<sub>s</sub><br>Σ (ṁ · h)<sub>e</sub> = (ṁ · h)<sub>s</sub></p>';
  if(isReactor(n)){
    html+='<p class="inspector-description">Una reacción por reactor, con temperatura de salida especificada. Conectá las dos salidas: 1 vapor y 2 líquido. DWSIM comprueba el balance de elementos.</p>';
    html+=selectField('reactor-type','Modelo de reacción',[['ConversionReactor','Conversión especificada'],['EquilibriumReactor','Equilibrio químico']],n.type);
    html+=selectField('base_compound','Reactivo base',graph.compounds.map(c=>[c,c]),n.base_compound);
    html+=selectField('phase','Fase de reacción',[['Vapor','Vapor'],['Liquid','Líquido'],['Mixture','Mezcla']],n.phase);
    if(n.type==='ConversionReactor')html+=field('conversion','Conversión del reactivo base','%',n.conversion,{min:0});
    else html+='<p class="mini">Equilibrio por fugacidades; constante calculada por DWSIM a partir de las energías de formación. No implica equilibrio instantáneo en un reactor real.</p>';
    html+=field('outlet_C','Temperatura del reactor','°C',n.outlet_C,{min:-273.14});
    html+='<p class="inspector-section">ESTEQUIOMETRÍA MOLAR</p><p class="mini">Reactivos negativos, productos positivos; 0 para inertes.</p>';
    for(const c of graph.compounds)html+=field(`stoich:${c}`,c,'mol/mol',n.stoichiometry?.[c]??0);
  }
  if(n.type==='EnergyStream')html+='<p class="inspector-description">Representa calor transferido, sin caudal de materia. En los calentadores y enfriadores actuales se especifica la temperatura de salida: DWSIM calcula la potencia térmica, que se consulta en el balance del equipo. Las corrientes de energía también pueden representar trabajo en otros equipos.</p>';
  if(r&&n.type!=='MaterialStream')html+=`<p class="inspector-section">RESULTADOS DE DWSIM</p><div class="inspector-readings"><div class="reading-row">Temperatura <b>${fmt(r.temperature_K-273.15)} °C</b></div><div class="reading-row">Presión <b>${fmt(r.pressure_Pa/1000)} kPa</b></div><div class="reading-row">Caudal <b>${fmt(r.mass_flow_kg_s)} kg/s</b></div></div>`;
  html+='<button class="delete-button" id="delete-selected">Eliminar objeto y sus conexiones</button>';container.innerHTML=html;
}
function addNode(type,pos){
  if(busy||!hasProject||!Object.hasOwn(TYPES,type))return;
  if(graph.nodes.length>=30)return notice('Esta versión admite hasta 30 objetos.',true);
  const t=TYPES[type];let number=1;while(graph.nodes.some(n=>n.name===`${t.short} ${number}`))number++;
  const node={id:'n'+crypto.randomUUID().replaceAll('-','').slice(0,16),type,name:`${t.short} ${number}`,x:pos?.x??290+(graph.nodes.length%4)*45,y:pos?.y??90+(graph.nodes.length%5)*55};
  if(type==='MaterialStream')Object.assign(node,{temperature_C:25,pressure_kPa:101.325,mass_flow:1,composition:Object.fromEntries(graph.compounds.map((c,i)=>[c,i===0?1:0]))});
  if(type==='Heater'||type==='Cooler')node.outlet_C=type==='Heater'?70:25;
  if(type==='Splitter')node.split=.5;
  if(isReactor(node))Object.assign(node,{outlet_C:500,conversion:50,phase:'Vapor',base_compound:graph.compounds[0],stoichiometry:Object.fromEntries(graph.compounds.map(c=>[c,0]))});
  graph.nodes.push(node);selection={node:node.id};pending=null;changed();renderInspector();notice('');
}
function connect(owner,side,index){
  if(busy)return;
  const n=nodeById(owner),port=portList(n).find(p=>p.side===side&&p.index===index);
  if(!pending){if(!side.endsWith('out'))return notice('Primero seleccioná un puerto de salida.',true);pending={node:owner,side,index,medium:port.medium};renderDiagram();return;}
  if(side.endsWith('out')){pending={node:owner,side,index,medium:port.medium};renderDiagram();return;}
  const a=nodeById(pending.node);
  if(a===n||isStream(a)===isStream(n)||port.medium!==pending.medium)return notice('Conectá una salida y una entrada del mismo tipo, entre corriente y equipo.',true);
  if(graph.edges.some(e=>(e.from===a.id&&(e.fromPort||'out')===pending.side&&(e.fromIndex||0)===pending.index)||(e.to===owner&&(e.toPort||'in')===side&&(e.toIndex||0)===index)))return notice('Ese puerto ya tiene una conexión. Seleccioná la línea para eliminarla.',true);
  graph.edges.push({from:a.id,to:owner,fromPort:pending.side,fromIndex:pending.index,toPort:side,toIndex:index});pending=null;changed();renderInspector();notice('');
}
function finishEndpointDrag(drag){
  const n=nodeById(drag.node),medium=n.type==='EnergyStream'?'energy':'material',out=drag.side==='out';
  const original=drag.original||streamGeometry(n);
  const fixed=out?original.a:original.b;
  const preview={x:drag.preview.x,y:drag.preview.y};
  if(!Number.isFinite(preview.x)||!Number.isFinite(preview.y)){notice('No se pudo determinar la posición del extremo.',true);renderDiagram();return;}
  drag={...drag,preview};
  let nearest=null,distance=Infinity;
  for(const unit of graph.nodes.filter(n=>!isStream(n)))for(const p of portList(unit)){
    const q={x:unit.x+p.x,y:unit.y+p.y},d=Math.hypot(q.x-drag.preview.x,q.y-drag.preview.y);
    if(d<distance){nearest={unit,p};distance=d;}
  }
  const scale=$('diagram').getScreenCTM(),radius=22/Math.hypot(scale.a,scale.b);
  if(distance<radius){
    const {unit,p}=nearest;
    if(p.medium!==medium||p.side.endsWith('in')!==out){notice('Ese puerto no es compatible con este extremo de la corriente.',true);renderDiagram();return;}
    const occupied=graph.edges.some(e=>out?(e.to===unit.id&&(e.toPort||'in')===p.side&&(e.toIndex||0)===p.index&&e.from!==n.id):(e.from===unit.id&&(e.fromPort||'out')===p.side&&(e.fromIndex||0)===p.index&&e.to!==n.id));
    if(occupied){notice('Ese puerto ya tiene otra corriente conectada.',true);renderDiagram();return;}
    graph.edges=graph.edges.filter(e=>out?e.from!==n.id:e.to!==n.id);
    graph.edges.push(out?{from:n.id,to:unit.id,fromPort:'out',fromIndex:0,toPort:p.side,toIndex:p.index}:{from:unit.id,to:n.id,fromPort:p.side,fromIndex:p.index,toPort:'in',toIndex:0});
    notice('Corriente conectada.');
  }else{
    const minimum=24/zoom;
    if(Math.hypot(drag.preview.x-fixed.x,drag.preview.y-fixed.y)<minimum){const other=out?original.b:original.a,dx=other.x-fixed.x,dy=other.y-fixed.y,length=Math.hypot(dx,dy);drag.preview={x:fixed.x+(length?dx/length:(out?1:-1))*minimum,y:fixed.y+(length?dy/length:0)*minimum};}
    n.startX=original.a.x;n.startY=original.a.y;n.endX=original.b.x;n.endY=original.b.y;
    graph.edges=graph.edges.filter(e=>out?e.from!==n.id:e.to!==n.id);
    n[out?'endX':'startX']=Math.max(0,Math.min(4000,drag.preview.x));n[out?'endY':'startY']=Math.max(0,Math.min(4000,drag.preview.y));
    notice('Extremo libre. Arrastralo a un puerto para conectarlo.');
  }
  delete n.orientation;delete n.routeAxis;delete n.routeX;delete n.routeY;
  pending=null;changed();renderInspector();
}
function removeSelected(){
  if(busy)return;
  if(selection?.node){graph.nodes=graph.nodes.filter(n=>n.id!==selection.node);graph.edges=graph.edges.filter(e=>e.from!==selection.node&&e.to!==selection.node);}
  else if(selection?.edge!==undefined)graph.edges.splice(selection.edge,1);
  selection=null;pending=null;changed();renderInspector();
}
function svgPoint(e){const p=$('diagram').createSVGPoint();p.x=e.clientX;p.y=e.clientY;const world=p.matrixTransform($('diagram').getScreenCTM().inverse());return {x:world.x,y:world.y};}
function renderResults(){
  if(!result)return;
  const rows=Object.entries(result.streams).map(([id,r])=>`<tr><td>${esc(nodeById(id)?.name||r.name)}</td><td>${fmt(r.mass_flow_kg_s,resultDigits)}</td><td>${fmt(r.temperature_K-273.15,resultDigits)}</td><td>${fmt(r.pressure_Pa/1000,resultDigits)}</td><td>${fmt(r.phases[0].enthalpy_kJ_kg,resultDigits)}</td><td>${fmt(r.phases[0].density_kg_m3,resultDigits)}</td></tr>`).join('');
  const cards=result.balances.map(b=>`<article class="balance-card"><h3>${esc(nodeById(b.id)?.name||b.name)}</h3><p>Conservación de masa</p><p class="equation">${fmt(b.mass_in,6)} → ${fmt(b.mass_out,6)} kg/s</p><p>Residuo: <strong>${fmt(b.mass_residual,9)} kg/s</strong></p><details class="component-balances"><summary>Balance por componente</summary>${Object.entries(b.components||{}).map(([c,v])=>`<p>${esc(c)}: ${fmt(v.in_kg_s,resultDigits)} → ${fmt(v.out_kg_s,resultDigits)} kg/s<br>${b.reactive?"Consumo neto (+) / generación (−)":"Residuo"}: ${fmt(v.residual_kg_s,9)} kg/s</p>`).join('' )}</details><p>Potencia térmica neta hacia el fluido</p><p class="equation">${b.reactive?"Q̇ del motor, incluye el calor de reacción":"Q̇ = Σ (ṁh)<sub>s</sub> − Σ (ṁh)<sub>e</sub>"}</p><p class="equation">${fmt(b.heat_to_fluid_kW,resultDigits)} kW</p></article>`).join('');
  $('results').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Corriente</th><th>Caudal · kg/s</th><th>Temperatura · °C</th><th>Presión · kPa</th><th>Entalpía · kJ/kg</th><th>Densidad · kg/m³</th></tr></thead><tbody>${rows}</tbody></table></div><div class="balance-grid">${cards}</div><p class="results-note">Modelo: <strong>${esc(result.model)}</strong>. Régimen estacionario; sin variaciones de energía cinética y potencial ni trabajo de eje. Q̇ positivo: calor hacia el fluido; negativo: calor retirado. La entalpía usa la referencia del modelo. El residuo de masa se calcula con los caudales del motor. En reactores, la potencia procede de DWSIM e incluye el calor de reacción; las especies pueden consumirse o generarse.</p>`;
  $('result-meta').textContent=`${result.engine} · ${fmt(result.elapsed_s,2)} s`;
  $('calculation-state').textContent='Proceso calculado · resultados vigentes';
}
async function calculate(){
  if(!hasProject||!engineOnline)return;
  if(busy)return;
  const selectedIsReady=await checkEngine(); // Verificación inmediata sin conmutación automática.
  if(!selectedIsReady)return notice('El motor seleccionado no está disponible. No se utilizará otro automáticamente.',true);
  notice('');busy=true;document.body.classList.add('calculating');$('calculate-button').disabled=true;$('calculate-button').textContent='Calculando…';$('calculation-state').textContent='DWSIM está resolviendo el proceso…';
  result=null;$('results').innerHTML=blankResults;$('result-meta').textContent='Calculando resultados nuevos…';renderDiagram();renderInspector();
  const version=revision,payload=structuredClone(graph),started=performance.now();let calculationHttp=null;
  lastCalculation={time:new Date().toISOString(),engine:selectedEngine,ok:null,state:'running',message:'Cálculo iniciado'};recordActivity('Cálculo iniciado');traceConnection('POST /api/simulate',{kind:'calculation',time:lastCalculation.time,state:'running',message:'Cálculo iniciado · solicitud enviada al motor.'});renderServerDetails();
  try{
    const response=await fetch('/api/simulate',{method:'POST',headers:{'Content-Type':'application/json',...engineHeaders()},body:JSON.stringify(payload)});calculationHttp=response.status;const data=await response.json();
    if(!response.ok)throw new Error(data.error||'No se pudo calcular.');
    if(version!==revision)throw new Error('El proceso cambió durante el cálculo. Volvé a calcular.');
    lastCalculation={time:new Date().toISOString(),engine:selectedEngine,ok:true,state:'completed',http:calculationHttp,message:'Cálculo completado',elapsed_s:data.elapsed_s,duration_ms:Math.round(performance.now()-started)};recordActivity('Cálculo completado',`Duración de la solicitud: ${lastCalculation.duration_ms} ms`);traceConnection('POST /api/simulate',{kind:'calculation',time:lastCalculation.time,state:'online',http:calculationHttp,ms:lastCalculation.duration_ms,message:'Cálculo completado.'});result=data;renderDiagram();renderInspector();renderResults();notice('Cálculo completado con el motor DWSIM.');
  }catch(error){lastCalculation={time:new Date().toISOString(),engine:selectedEngine,ok:false,state:'failed',http:calculationHttp,message:error.message,duration_ms:Math.round(performance.now()-started)};recordActivity('Cálculo fallido',error.message);traceConnection('POST /api/simulate',{kind:'calculation',time:lastCalculation.time,state:'offline',http:calculationHttp,ms:lastCalculation.duration_ms,message:'Cálculo fallido: '+error.message});notice(error.message+' · Ver Herramientas → Diagnóstico para revisar sugerencias.',true);$('calculation-state').textContent='Revisá los datos y las conexiones';renderDiagnostics();}
  finally{busy=false;renderServerDetails();document.body.classList.remove('calculating');updateControls();$('calculate-button').innerHTML=toolIcon('run')+'<span>Calcular</span>';publishWorkspace(false);}
}
function renderCompounds(){
  $('compound-summary').textContent=graph.compounds.map(c=>c==='Water'?'Agua':c).join(' + ')||'Sin componentes';
  $('compound-summary').title=graph.compounds.join(', ');
  $('model-note').textContent=!hasProject?'Sin proyecto':graph.model==='Steam Tables (IAPWS-IF97)'?'Agua pura · tablas IAPWS-IF97':'Revisá la adecuación del modelo a la mezcla';
  $('selected-compounds').innerHTML=graph.compounds.map(c=>`<button type="button" class="compound-chip" data-remove-compound="${esc(c)}">${esc(c)} ×</button>`).join('');
  const query=$('compound-search').value.toLowerCase();
  const matches=(catalog?.compounds||[]).filter(c=>!graph.compounds.includes(c)&&c.toLowerCase().includes(query));
  $('compound-list').innerHTML=matches.slice(0,50).map(c=>`<button type="button" class="compound-option" data-add-compound="${esc(c)}">+ ${esc(c)}</button>`).join('')||'<p class="mini">Sin coincidencias.</p>';
}
function updateCompound(name,remove){
  if(busy)return;
  if(remove&&graph.compounds.length===1)return notice('El proceso necesita al menos un compuesto.',true);
  if(!remove&&graph.compounds.length>=8)return notice('Podés seleccionar hasta 8 compuestos.',true);
  graph.compounds=remove?graph.compounds.filter(c=>c!==name):[...graph.compounds,name];
  for(const r of graph.nodes.filter(isReactor)){r.stoichiometry??={};if(remove)delete r.stoichiometry[name];else r.stoichiometry[name]=0;}
  for(const n of graph.nodes.filter(n=>n.type==='MaterialStream')){
    if(!n.composition)n.composition=Object.fromEntries(graph.compounds.map((c,i)=>[c,i===0?1:0]));
    if(remove)delete n.composition[name];else n.composition[name]=0;
  }
  changed();renderCompounds();renderInspector();
}
function loadGraph(data){
  if(!data||data.version!==1||!Array.isArray(data.nodes)||data.nodes.length>30||!Array.isArray(data.edges)||data.edges.length>60||!Array.isArray(data.compounds)||!data.compounds.length||data.compounds.length>8)throw new Error('El archivo no es un proceso compatible (versión 1).');
  if(data.compounds.some(c=>typeof c!=='string'||c.length>150)||typeof data.model!=='string')throw new Error('Catálogo del archivo inválido.');
  const ids=new Set();
  for(const n of data.nodes){if(!n||!Object.hasOwn(TYPES,n.type)||typeof n.id!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(n.id)||ids.has(n.id)||typeof n.name!=='string'||!n.name.trim()||n.name.length>45||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.y<0||n.x>3000||n.y>2000)throw new Error('El archivo tiene objetos inválidos.');if(n.routeAxis!==undefined&&!['x','y'].includes(n.routeAxis))throw new Error('Recorrido de corriente inválido.');if(n.orientation!==undefined&&!['auto','right','left','up','down'].includes(n.orientation))throw new Error('Dirección de corriente inválida.');if(n.scale!==undefined&&(!Number.isFinite(n.scale)||n.scale<.5||n.scale>3))throw new Error('Tamaño de símbolo inválido.');for(const [key,allowed] of Object.entries({flash_spec:['TP','PH','PS','PV','TV'],flow_basis:['mass','molar'],composition_basis:['mass','molar']}))if(n[key]!==undefined&&!allowed.includes(n[key]))throw new Error('Especificación de corriente inválida.');for(const k of ['startX','startY','endX','endY','routeX','routeY'])if(n[k]!==undefined&&(!Number.isFinite(n[k])||n[k]<0||n[k]>4000))throw new Error('Extremo de corriente inválido.');ids.add(n.id);}
  for(const e of data.edges){if(!e||!ids.has(e.from)||!ids.has(e.to))throw new Error('El archivo tiene conexiones inválidas.');const a=data.nodes.find(n=>n.id===e.from),b=data.nodes.find(n=>n.id===e.to);if(isStream(a)===isStream(b))throw new Error('Cada conexión debe unir una corriente y un equipo.');}
  graph=structuredClone(data);hasProject=true;graph.title=String(data.title||'Proceso sin título').slice(0,70);selection=null;pending=null;zoom=1;viewX=0;viewY=0;$('project-title').value=graph.title;
  if(catalog)$('model-select').value=graph.model;changed();renderCompounds();renderInspector();
}
async function resetExample(){if(busy)return;if(hasProject&&!$('replace-example-dialog').open){$('replace-example-dialog').showModal();return;}$('replace-example-dialog').close();try{const type=$('example-select').value;const response=await fetch(`examples/${type}.json`);if(!response.ok)throw new Error('No se pudo cargar el ejemplo.');const data=await response.json();loadGraph(data);notice((data.learning?data.learning+' ':'')+'Ejemplo de modelo, no mediciones experimentales. Calculá para consultar el resultado.');}catch(error){notice(error.message,true);}}

function queueDiagramMotion(){
  if(paintFrame)return;
  paintFrame=requestAnimationFrame(()=>{paintFrame=0;updateDiagramGeometry();});
}
function updateDiagramGeometry(){
  const svg=$('diagram');svg.setAttribute('viewBox',`${viewX} ${viewY} ${1000/zoom} ${520/zoom}`);
  for(const n of graph.nodes){
    const el=svg.querySelector(`[data-node="${n.id}"]`);if(!el)continue;
    const t=TYPES[n.type],s=symbolScale(n),g=isStream(n)?streamGeometry(n):null;
    el.setAttribute('transform',`translate(${g?0:n.x} ${g?0:n.y})`);
    if(g){for(const path of el.querySelectorAll('.stream-line,.stream-hit'))path.setAttribute('d',g.d);const label=el.querySelector('.stream-label');label.setAttribute('x',g.label.x);label.setAttribute('y',g.label.y);const bend=el.querySelector('[data-bend]');if(bend){bend.setAttribute('cx',g.bend.x);bend.setAttribute('cy',g.bend.y);bend.dataset.axis=g.bend.axis;}}
    else{el.querySelector('.equipment-symbol').setAttribute('transform',`scale(${s})`);for(const [selector,y] of [['.equipment-label',20],['.node-kind',35]]){const label=el.querySelector(selector);label.setAttribute('x',equipmentLabelX(n));label.setAttribute('y',t.h*s+y);}const handle=el.querySelector('[data-resize]');if(handle){handle.setAttribute('x',t.w*s+2);handle.setAttribute('y',t.h*s+2);}}
    const reading=el.querySelector('.node-reading');if(reading){reading.setAttribute('x',g?g.label.x:t.w*s/2);reading.setAttribute('y',g?g.label.y+32:t.h*s+52);}
    for(const p of portList(n)){const port=el.querySelector(`[data-port="${p.side}"][data-index="${p.index}"]`);for(const circle of port?.querySelectorAll('circle')||[]){circle.setAttribute('cx',g?p.x+n.x:p.x);circle.setAttribute('cy',g?p.y+n.y:p.y);}}
  }
  svg.querySelectorAll('.snap-target').forEach(el=>el.classList.remove('snap-target'));
  if(endpointDrag?.snap){const {unit,p}=endpointDrag.snap;svg.querySelector(`[data-owner="${unit.id}"][data-port="${p.side}"][data-index="${p.index}"]`)?.classList.add('snap-target');}
}
function moveNode(n,start,p){
  const dx=p.x-start.start.x,dy=p.y-start.start.y;
  n.x=Math.max(15,Math.min(2700,start.x+dx));n.y=Math.max(15,Math.min(1800,start.y+dy));
  for(const [key,value] of Object.entries(start.endpoints||{}))n[key]=Math.max(0,Math.min(4000,value+(key.endsWith('X')?n.x-start.x:n.y-start.y)));
  if(isStream(n)&&start.routeX!==undefined)n.routeX=Math.max(0,Math.min(4000,start.routeX+n.x-start.x));if(isStream(n)&&start.routeY!==undefined)n.routeY=Math.max(0,Math.min(4000,start.routeY+n.y-start.y));
}
function endpointCandidate(drag){
  const n=nodeById(drag.node),medium=n.type==='EnergyStream'?'energy':'material',out=drag.side==='out',m=$('diagram').getScreenCTM();
  let best=null,distance=22/Math.hypot(m.a,m.b);
  for(const unit of graph.nodes.filter(n=>!isStream(n)))for(const p of portList(unit)){
    if(p.medium!==medium||p.side.endsWith('in')!==out)continue;
    const occupied=graph.edges.some(e=>out?(e.to===unit.id&&(e.toPort||'in')===p.side&&(e.toIndex||0)===p.index&&e.from!==n.id):(e.from===unit.id&&(e.fromPort||'out')===p.side&&(e.fromIndex||0)===p.index&&e.to!==n.id));
    const q={x:unit.x+p.x,y:unit.y+p.y},d=Math.hypot(q.x-drag.preview.x,q.y-drag.preview.y);if(!occupied&&d<distance){best={unit,p,q};distance=d;}
  }
  return best;
}
function bindEvents(){
  const svg=$('diagram');
  svg.addEventListener('pointerdown',e=>{
    if(e.button===1||(e.button===0&&e.altKey)){e.preventDefault();panning={x:e.clientX,y:e.clientY,vx:viewX,vy:viewY,matrix:svg.getScreenCTM().inverse()};svg.setPointerCapture(e.pointerId);return;}
    if(busy||e.button!==0)return;
    e.preventDefault();
    const resize=e.target.closest('[data-resize]');if(resize){const n=nodeById(resize.dataset.resize);resizing={node:n.id,start:svgPoint(e),scale:symbolScale(n)};svg.setPointerCapture(e.pointerId);return;}
    const bend=e.target.closest('[data-bend]');if(bend){bending={node:bend.dataset.bend,start:svgPoint(e),axis:null};svg.setPointerCapture(e.pointerId);return;}
    const port=e.target.closest('[data-port]');if(port){e.preventDefault();const n=nodeById(port.dataset.owner);if(isStream(n)){selection={node:n.id};endpointDrag={node:n.id,side:port.dataset.port,start:svgPoint(e),preview:svgPoint(e),original:streamGeometry(n),moved:false};svg.setPointerCapture(e.pointerId);renderDiagram();renderInspector();}else connect(port.dataset.owner,port.dataset.port,Number(port.dataset.index));return;}
    const node=e.target.closest('[data-node]');
    if(node){selection={node:node.dataset.node};const p=svgPoint(e),n=nodeById(selection.node);dragging={node:n.id,start:p,x:n.x,y:n.y,routeX:n.routeX??(isStream(n)&&graph.edges.some(e=>e.to===n.id)&&graph.edges.some(e=>e.from===n.id)&&streamGeometry(n).bend.axis==='x'?streamGeometry(n).mid:undefined),routeY:n.routeY??(isStream(n)&&graph.edges.some(e=>e.to===n.id)&&graph.edges.some(e=>e.from===n.id)&&streamGeometry(n).bend.axis==='y'?streamGeometry(n).mid:undefined),endpoints:Object.fromEntries(['startX','startY','endX','endY'].filter(k=>n[k]!==undefined).map(k=>[k,n[k]])),moved:false};svg.setPointerCapture(e.pointerId);renderDiagram();renderInspector();return;}
    const edge=e.target.closest('[data-edge]');selection=edge?{edge:Number(edge.dataset.edge)}:null;if(!edge)pending=null;renderDiagram();renderInspector();
  });
  svg.addEventListener('pointermove',e=>{
    if(resizing){const n=nodeById(resizing.node),p=svgPoint(e),t=TYPES[n.type];n.scale=Math.max(.5,Math.min(3,resizing.scale+((p.x-resizing.start.x)/t.w+(p.y-resizing.start.y)/t.h)/2));queueDiagramMotion();return;}
    if(bending){const p=svgPoint(e),dx=p.x-bending.start.x,dy=p.y-bending.start.y;if(!bending.axis&&Math.hypot(dx,dy)<3/zoom)return;bending.axis??=Math.abs(dy)>Math.abs(dx)?'y':'x';setStreamBend(nodeById(bending.node),bending.axis,bending.axis==='y'?p.y:p.x);queueDiagramMotion();return;}
    if(endpointDrag){endpointDrag.preview=svgPoint(e);if(Math.hypot(endpointDrag.preview.x-endpointDrag.start.x,endpointDrag.preview.y-endpointDrag.start.y)>3/zoom)endpointDrag.moved=true;endpointDrag.snap=endpointCandidate(endpointDrag);if(endpointDrag.snap)endpointDrag.preview=endpointDrag.snap.q;queueDiagramMotion();return;}
    if(panning){const m=panning.matrix,dx=e.clientX-panning.x,dy=e.clientY-panning.y;viewX=panning.vx-m.a*dx-m.c*dy;viewY=panning.vy-m.b*dx-m.d*dy;queueDiagramMotion();return;}
    if(!dragging)return;const p=svgPoint(e);moveNode(nodeById(dragging.node),dragging,p);dragging.moved=true;queueDiagramMotion();
  });
  const endDrag=e=>{
    const hadGesture=endpointDrag||dragging||resizing||bending||panning;
    if(endpointDrag){const drag=endpointDrag;endpointDrag=null;if(e.type!=='pointercancel'){if(drag.moved)finishEndpointDrag(drag);else connect(drag.node,drag.side,0);}}
    const visualChange=dragging?.moved||resizing||bending;dragging=null;resizing=null;bending=null;panning=null;
    if(hadGesture)suppressPaletteUntil=performance.now()+500;
    if(visualChange){changed({physical:false});renderInspector();}else renderDiagram();
  };svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
  svg.addEventListener('keydown',e=>{
    if(busy)return;
    const port=e.target.closest('[data-port]');if(port&&(e.key==='Enter'||e.key===' ')){e.preventDefault();connect(port.dataset.owner,port.dataset.port,Number(port.dataset.index));return;}
    const node=e.target.closest('[data-node]');if(node&&['Enter',' '].includes(e.key)){e.preventDefault();selection={node:node.dataset.node};renderDiagram();renderInspector();}
    if(node&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const n=nodeById(node.dataset.node);moveNode(n,{start:{x:0,y:0},x:n.x,y:n.y,routeX:n.routeX,routeY:n.routeY,endpoints:Object.fromEntries(['startX','startY','endX','endY'].filter(k=>n[k]!==undefined).map(k=>[k,n[k]]))},{x:({'ArrowLeft':-10,'ArrowRight':10}[e.key]||0),y:({'ArrowUp':-10,'ArrowDown':10}[e.key]||0)});changed({physical:false});svg.querySelector(`[data-node="${n.id}"]`)?.focus();}
    const edge=e.target.closest('[data-edge]');if(edge&&e.key==='Enter'){selection={edge:Number(edge.dataset.edge)};renderDiagram();renderInspector();}
  });
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||e.target.closest('dialog'))return;if(e.key==='Escape'){pending=null;endpointDrag=null;dragging=null;resizing=null;bending=null;renderDiagram();}if(e.key==='Delete'){e.preventDefault();removeSelected();}});
  $('canvas-wrap').addEventListener('dragover',e=>{if(paletteDragType)e.preventDefault();});$('canvas-wrap').addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('application/x-lemeit-object');if(!paletteDragType||type!==paletteDragType||!Object.hasOwn(TYPES,type))return;paletteDragType=null;suppressPaletteUntil=performance.now()+500;const p=svgPoint(e);addNode(type,{x:Math.max(15,p.x-60),y:Math.max(45,p.y-40)});});
  $('inspector').addEventListener('click',e=>{const tab=e.target.closest('[data-stream-tab]');if(tab){streamTabs.set(selection.node,tab.dataset.streamTab);renderInspector();return;}if(e.target.closest('#delete-selected'))removeSelected();});
  $('inspector').addEventListener('input',e=>{
    if(busy)return;const key=e.target.dataset.field,n=nodeById(selection?.node);
    if(!key||!n||e.target.value===''||e.target.tagName==='SELECT')return;
    if(e.target.dataset.streamValue){const value=Number(e.target.value);if(Number.isFinite(value)){n[key]=SimproxStreams.toCanonical(key,value,SimproxStreams.unit(n,key));changed();}return;}
    if(key==='scale'){const value=Number(e.target.value);if(Number.isFinite(value)&&value>=50&&value<=300){n.scale=value/100;changed({physical:false});}return;}
    if(key==='name'){const value=e.target.value.trim();if(value&&!graph.nodes.some(other=>other!==n&&other.name===value)){n.name=value;changed({physical:false});if(result)renderResults();}return;}
    const value=Number(e.target.value);if(!Number.isFinite(value))return;
    if(key.startsWith('fraction:')){n.composition??={};n.composition[key.slice(9)]=value;}else if(key.startsWith('stoich:')){n.stoichiometry??={};n.stoichiometry[key.slice(7)]=value;}else n[key]=value;
    changed();
  });
  $('inspector').addEventListener('change',e=>{
    if(busy)return;const key=e.target.dataset.field,n=nodeById(selection?.node);if(!key||!n)return;
    if(e.target.dataset.streamValue){const value=Number(e.target.value);if(e.target.value===''||!Number.isFinite(value))delete n[key];else n[key]=SimproxStreams.toCanonical(key,value,SimproxStreams.unit(n,key));changed();renderInspector();return;}
    if(key.startsWith('unit:')){n.units??={};n.units[key.slice(5)]=e.target.value;changed({physical:false});renderInspector();return;}
    if(['flash_spec','flow_basis','composition_basis'].includes(key)){const old=n[key]||(key==='flash_spec'?'TP':'mass');n[key]=e.target.value;if(key==='composition_basis'&&old!==n[key]){n.composition=Object.fromEntries(graph.compounds.map(c=>[c,graph.compounds.length===1?1:0]));notice('Cambiaste la base de composición. Ingresá las fracciones en la nueva base antes de calcular.');}changed();renderInspector();return;}
    if(key==='scale'){const value=Number(e.target.value);if(Number.isFinite(value)&&value>=50&&value<=300){n.scale=value/100;changed({physical:false});}else notice('El tamaño gráfico debe estar entre 50 y 300 %.',true);renderInspector();return;}
    if(['base_compound','phase','reactor-type'].includes(key)){if(key==='reactor-type')n.type=e.target.value;else n[key]=e.target.value;changed();renderInspector();return;}
    if(key==='name'){const value=e.target.value.trim();if(!value||graph.nodes.some(other=>other!==n&&other.name===value)){notice('Usá un nombre único y no vacío.',true);renderInspector();return;}n.name=value;changed({physical:false});if(result)renderResults();}
    else{const value=Number(e.target.value);if(e.target.value===''||!Number.isFinite(value)){notice('Ingresá un valor numérico.',true);renderInspector();return;}if(key.startsWith('fraction:')){n.composition??={};n.composition[key.slice(9)]=value;}else if(key.startsWith('stoich:')){n.stoichiometry??={};n.stoichiometry[key.slice(7)]=value;}else n[key]=value;changed();}
    renderInspector();
  });
  $('calculate-button').onclick=calculate;$('example-button').onclick=()=>{resetExample();closeMenus();};
  $('project-title').oninput=e=>{graph.title=e.target.value;persist();};
  $('model-select').onchange=e=>{graph.model=e.target.value;changed();renderCompounds();renderInspector();};
  $('compound-button').onclick=()=>{closeMenus();renderCompounds();$('compounds-dialog').showModal();};
  $('compound-search').oninput=renderCompounds;
  $('compounds-dialog').addEventListener('click',e=>{const add=e.target.closest('[data-add-compound]'),remove=e.target.closest('[data-remove-compound]');if(add)updateCompound(add.dataset.addCompound,false);if(remove)updateCompound(remove.dataset.removeCompound,true);});
  $('about-button').onclick=()=>$('about-dialog').showModal();
  const changeZoom=(next,anchor)=>{const before=anchor?svgPoint(anchor):{x:viewX+500/zoom,y:viewY+260/zoom};const old=zoom;zoom=Math.max(.2,Math.min(4,next));viewX=before.x-(before.x-viewX)*old/zoom;viewY=before.y-(before.y-viewY)*old/zoom;renderDiagram();};
  svg.addEventListener('wheel',e=>{e.preventDefault();if(dragging||panning||endpointDrag||resizing||bending)return;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?520:1);changeZoom(zoom*Math.exp(-Math.max(-200,Math.min(200,delta))*.003),e);},{passive:false});
  $('zoom-in').onclick=()=>changeZoom(zoom*1.2);$('zoom-out').onclick=()=>changeZoom(zoom/1.2);
  $('fit-button').onclick=()=>{viewX=0;viewY=0;const points=graph.nodes.flatMap(n=>{if(isStream(n)){const g=streamGeometry(n);return [g.a,g.b,g.bend];}return [{x:n.x+TYPES[n.type].w*symbolScale(n),y:n.y+TYPES[n.type].h*symbolScale(n)}];});const maxX=Math.max(1000,...points.map(p=>p.x+45)),maxY=Math.max(520,...points.map(p=>p.y+55));zoom=Math.max(.2,Math.min(1000/maxX,520/maxY));renderDiagram();};
  $('save-button').onclick=()=>{const blob=new Blob([JSON.stringify(graph,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='proceso-lemeit.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Proceso descargado. El archivo conserva el diagrama, los compuestos y las condiciones.');};
  $('open-button').onclick=()=>$('file-input').click();$('file-input').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw new Error('El archivo supera los 100 kB.');const data=JSON.parse(await file.text());loadGraph(data);notice('Proceso abierto. Calculá para obtener resultados actualizados.');}catch(error){notice(error.message,true);}e.target.value='';};
}
async function init(){
  SimproxTheme.init();graph=emptyProject();
  $('project-title').value=graph.title;renderPalette();renderDiagram();renderInspector();renderCompounds();bindEvents();bindProjectEvents();bindPanelResize();bindDiagramWindow();bindWorkspaceTools();
  $('engine-select').value=selectedEngine;
  const initialCheckStarted=performance.now();let initialHttp=null;
  try{const response=await fetch('/api/catalog',{headers:engineHeaders(),signal:AbortSignal.timeout(15000)});initialHttp=response.status;const data=await readCatalogResponse(response);if(!response.ok)throw new Error(data.error);catalog=data;engineOnline=true;$('engine-state').textContent=`DWSIM conectado · ${fmt(catalog.compound_count,0)} compuestos`;$('engine-state').className='engine-state online';connectionCheck={time:new Date().toISOString(),ok:true,state:'online',http:response.status,message:'Conexión verificada; esta consulta solo comprueba disponibilidad.',ms:Math.round(performance.now()-initialCheckStarted),compounds:data.compound_count??data.compounds.length,models:data.models.length};traceConnection('GET /api/catalog',connectionCheck);paintConnection();}
  catch(error){const occupied=initialHttp===409;engineOnline=occupied;connectionCheck={time:new Date().toISOString(),ok:occupied,state:occupied?'busy':'offline',http:initialHttp,message:error.message,ms:Math.round(performance.now()-initialCheckStarted)};traceConnection('GET /api/catalog',connectionCheck);paintConnection();try{catalog=await(await fetch('catalog-cache.json')).json();notice(occupied?'El motor está ocupado. Podés editar y volver a intentar el cálculo.':'Modo de edición: el motor no está disponible. Podés crear y guardar proyectos; el cálculo requiere conexión con DWSIM.');}catch{notice(error.message,true);}}
  if(catalog)$('model-select').innerHTML='<option value="">Sin modelo seleccionado</option>'+catalog.models.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');
  renderCompounds();updateControls();
}
function newProject(){
  if(busy)return;if(!catalog)return notice('El catálogo todavía se está cargando. Volvé a intentar.',true);
  draftCompounds=[];$('new-component-search').value='';$('new-project-error').textContent='';
  $('new-project-model').innerHTML='<option value="">Seleccioná un modelo…</option>'+catalog.models.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');
  renderNewProject();$('new-project-dialog').showModal();closeMenus();
}
function closeMenus(){document.querySelectorAll('.app-menu[open]').forEach(m=>m.removeAttribute('open'));}
function renderNewProject(){
  const query=$('new-component-search').value.toLowerCase();
  $('new-selected-compounds').innerHTML=draftCompounds.map(c=>`<button type="button" class="compound-chip" data-new-remove="${esc(c)}">${esc(c)} ×</button>`).join('');
  const matches=(catalog?.compounds||[]).filter(c=>!draftCompounds.includes(c)&&c.toLowerCase().includes(query));
  $('new-component-list').innerHTML=matches.slice(0,35).map(c=>`<button type="button" class="compound-option" data-new-add="${esc(c)}">+ ${esc(c)}</button>`).join('');
  $('create-project').disabled=!draftCompounds.length||!$('new-project-model').value;
}
function bindProjectEvents(){
  const menus=[...document.querySelectorAll('.app-menu')];
  let hoveredMenu=null;
  function openMenu(menu,hover=false){hoveredMenu=hover?menu:null;const open=menu.open;closeMenus();if(!open){menu.open=true;const panel=menu.querySelector('.menu-panel'),r=menu.querySelector('summary').getBoundingClientRect();panel.style.position='fixed';panel.style.top=(r.bottom+3)+'px';panel.style.left=Math.max(6,Math.min(r.left,innerWidth-panel.offsetWidth-6))+'px';panel.style.right='auto';panel.style.maxHeight=Math.max(80,innerHeight-r.bottom-12)+'px';}}
  for(const [index,menu] of menus.entries()){
    const summary=menu.querySelector('summary');
    summary.addEventListener('click',e=>{e.preventDefault();if(e.detail>0&&hoveredMenu===menu&&menu.open){hoveredMenu=null;return;}openMenu(menu);});
    summary.addEventListener('pointerenter',()=>{if(menus.some(m=>m.open)&&!menu.open)openMenu(menu,true);});
    summary.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowDown'){if(!menu.open)openMenu(menu);menu.querySelector('.menu-panel button:not([disabled]):not([hidden]),.menu-panel select:not([disabled]):not([hidden]),.menu-panel a')?.focus();}else{const next=menus[(index+(e.key==='ArrowRight'?1:-1)+menus.length)%menus.length];const wasOpen=menus.some(m=>m.open);closeMenus();if(wasOpen)openMenu(next);next.querySelector('summary').focus();}}});
    menu.querySelector('.menu-panel').addEventListener('click',e=>{if(e.target.closest('a'))closeMenus();});
    menu.querySelector('.menu-panel').addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key)||['SELECT','INPUT'].includes(e.target.tagName))return;e.preventDefault();const items=[...menu.querySelectorAll('button:not([disabled]):not([hidden]),a[href]')],current=items.indexOf(document.activeElement);items[(current+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();});
  }
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.app-menu'))closeMenus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const active=menus.find(menu=>menu.open);closeMenus();active?.querySelector('summary').focus();}});
  window.addEventListener('resize',closeMenus);
  $('open-project-toolbar').onclick=()=>$('open-button').click();$('save-project-toolbar').onclick=()=>$('save-button').click();
  $('new-project-button').onclick=newProject;$('new-project-toolbar').onclick=newProject;
  $('cancel-project').onclick=()=>$('new-project-dialog').close();$('cancel-project-bottom').onclick=()=>$('new-project-dialog').close();
  $('new-component-search').oninput=renderNewProject;$('new-project-model').onchange=renderNewProject;
  $('new-project-dialog').addEventListener('click',e=>{const add=e.target.closest('[data-new-add]'),remove=e.target.closest('[data-new-remove]');if(add&&draftCompounds.length<8)draftCompounds.push(add.dataset.newAdd);if(remove)draftCompounds=draftCompounds.filter(c=>c!==remove.dataset.newRemove);renderNewProject();});
  $('new-project-form').onsubmit=e=>{e.preventDefault();const model=$('new-project-model').value;if(!draftCompounds.length||!model)return;if(model==='Steam Tables (IAPWS-IF97)'&&(draftCompounds.length!==1||draftCompounds[0]!=='Water')){$('new-project-error').textContent='IAPWS-IF97 es para agua pura. Elegí otro modelo para esta mezcla.';return;}loadGraph({...emptyProject(),title:$('new-project-name').value.trim()||'Proceso sin título',compounds:[...draftCompounds],model});$('new-project-dialog').close();notice('');$('calculation-state').textContent='Proyecto nuevo · diagrama vacío';};
  $('start-panel').onclick=e=>{const action=e.target.closest('[data-start]')?.dataset.start;if(action==='new')newProject();if(action==='open')$('file-input').click();};
  $('recent-button').onclick=()=>{try{const saved=localStorage.getItem('lemeit-process-v1');if(saved)loadGraph(JSON.parse(saved));closeMenus();}catch(error){notice(error.message,true);}};
  $('confirm-example').onclick=()=>{resetExample();closeMenus();};
  document.querySelectorAll('.menu-panel>button').forEach(b=>b.addEventListener('click',()=>{if(b.id!=='example-button')closeMenus();}));
}
init();

function bindPanelResize(){
  const workspace=document.querySelector('.workspace');
  for(const [selector,variable,direction,min,max] of [['.equipment-panel','--equipment-width',1,140,360],['.inspector-panel','--inspector-width',-1,210,480]]){
    const panel=document.querySelector(selector),handle=document.createElement('div');
    handle.className='panel-resizer';handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label',direction===1?'Ancho de equipos y corrientes':'Ancho de propiedades');panel.append(handle);
    const setWidth=value=>{const width=Math.max(min,Math.min(max,value));workspace.style.setProperty(variable,width+'px');handle.setAttribute('aria-valuenow',Math.round(width));};
    handle.setAttribute('aria-valuemin',min);handle.setAttribute('aria-valuemax',max);handle.setAttribute('aria-valuenow',Math.round(panel.getBoundingClientRect().width));
    let start=null;
    handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();start={x:e.clientX,width:panel.getBoundingClientRect().width};handle.setPointerCapture(e.pointerId);});
    handle.addEventListener('pointermove',e=>{if(start)setWidth(start.width+direction*(e.clientX-start.x));});
    for(const event of ['pointerup','pointercancel'])handle.addEventListener(event,()=>start=null);
    handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();setWidth(e.key==='Home'?min:e.key==='End'?max:panel.getBoundingClientRect().width+direction*(e.key==='ArrowRight'?10:-10));});
    handle.addEventListener('dblclick',()=>workspace.style.removeProperty(variable));
  }
}

function publishWorkspace(physical=true){
  if(!workspaceChannel||applyingWorkspace||!hasProject)return;
  workspaceChannel.postMessage({type:'state',graph:structuredClone(graph),physical,result:physical?null:result,lastCalculation});
}
function toolIcon(name){
  const paths={new:'M6 3h8l4 4v14H6z M14 3v5h5 M9 14h6 M12 11v6',open:'M3 7h7l2 3h9l-3 10H3z M3 7V4h7l2 3h6v3',save:'M4 3h14l3 3v15H3V3z M7 3v6h10V3 M7 21v-8h10v8',library:'M4 5h3v15H4z M10 5h3v15h-3z M16 5l3-1 4 15-3 1z',focus:'M9 3H3v6 M15 3h6v6 M21 15v6h-6 M9 21H3v-6',panels:'M3 4h18v16H3z M8 4v16 M16 4v16',popout:'M14 3h7v7 M21 3l-11 11 M10 5H4v15h15v-6',fullscreen:'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5',fit:'M3 3h6 M3 3v6 M15 3h6v6 M21 15v6h-6 M9 21H3v-6 M8 8h8v8H8z',run:'M7 4l14 8-14 8z'};
  return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]}"/></svg>`;
}
function bindDiagramWindow(){
  const focus=$('diagram-focus');
  for(const [id,icon,label] of [['diagram-focus','focus','Solo diagrama'],['diagram-library','library','Biblioteca'],['diagram-popout','popout','Separar diagrama'],['fit-button','fit','Ajustar diagrama'],['diagram-fullscreen','fullscreen','Pantalla completa'],['new-project-toolbar','new','Nuevo proyecto'],['open-project-toolbar','open','Abrir proyecto'],['save-project-toolbar','save','Guardar proyecto']]){const button=$(id);button.innerHTML=toolIcon(icon);button.setAttribute('aria-label',label);button.title=label;}
  $('calculate-button').innerHTML=toolIcon('run')+'<span>Calcular</span>';
  const setFocus=enabled=>{document.body.classList.toggle('diagram-focus',enabled);focus.innerHTML=toolIcon(enabled?'panels':'focus');focus.setAttribute('aria-label',enabled?'Volver a paneles':'Solo diagrama');focus.title=enabled?'Volver a paneles':'Solo diagrama';focus.setAttribute('aria-pressed',String(enabled));};
  $('diagram-library').onclick=()=>{const visible=document.body.classList.toggle('diagram-library');$('diagram-library').setAttribute('aria-pressed',String(visible));};
  $('view-focus').onclick=()=>focus.click();$('view-library').onclick=()=>{setFocus(true);$('diagram-library').click();};$('view-popout').onclick=()=>$('diagram-popout').click();$('view-fullscreen').onclick=()=>$('diagram-fullscreen').click();
  focus.onclick=()=>setFocus(!document.body.classList.contains('diagram-focus'));
  $('diagram-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{setFocus(true);await document.documentElement.requestFullscreen();}}catch{notice('El navegador no permitió pantalla completa. Podés usar Solo diagrama.');}};
  if(typeof BroadcastChannel==='undefined'){$('diagram-popout').disabled=true;return;}
  workspaceChannel=new BroadcastChannel('lemeit-diagram-'+workspaceId);
  workspaceChannel.onmessage=e=>{
    if(e.data?.type==='request'){publishWorkspace(false);return;}
    if(e.data?.type!=='state'||dragging||endpointDrag||resizing||bending)return;
    const previous={viewX,viewY,zoom,selection,result};applyingWorkspace=true;
    try{loadGraph(e.data.graph);viewX=previous.viewX;viewY=previous.viewY;zoom=previous.zoom;selection=previous.selection&&nodeById(previous.selection.node)?previous.selection:null;if(!e.data.physical){result=e.data.result??null;lastCalculation=e.data.lastCalculation??lastCalculation;if(result)renderResults();else{$('results').innerHTML=blankResults;$('result-meta').textContent='Sin resultados vigentes';}}renderDiagram();renderInspector();}catch{notice('No se pudo sincronizar el diagrama recibido.',true);}finally{applyingWorkspace=false;}
  };
  $('diagram-add').innerHTML='<option value="">Agregar…</option>'+Object.entries(TYPES).map(([type,t])=>`<option value="${type}">${esc(t.label)}</option>`).join('');$('diagram-add').onchange=e=>{if(e.target.value)addNode(e.target.value,{x:viewX+300/zoom,y:viewY+180/zoom});e.target.value='';};
  const separateURL=new URL(location.href);separateURL.search='';separateURL.searchParams.set('diagram','1');separateURL.searchParams.set('workspace',workspaceId);$('diagram-popout').href=separateURL.href;
  $('diagram-popout').onclick=e=>{e.preventDefault();const opened=window.open(separateURL.href,'lemeit-diagram-'+workspaceId,'popup,width=1280,height=850,resizable=yes,scrollbars=yes');if(!opened)notice('Permití la ventana emergente para separar el diagrama.');};
  if(new URLSearchParams(location.search).get('results')==='1'){document.body.classList.add('results-window');workspaceChannel.postMessage({type:'request'});}
  if(new URLSearchParams(location.search).get('diagram')==='1'){setFocus(true);document.body.classList.add('diagram-library');$('diagram-library').setAttribute('aria-pressed','true');workspaceChannel.postMessage({type:'request'});}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))setFocus(false);});
}
function recordActivity(message,detail=''){activity.unshift({time:new Date().toISOString(),message,detail});activity=activity.slice(0,30);}
function downloadLocal(filename,body,type){const blob=new Blob([body],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportResults(kind){
  if(!result||busy){notice('Calculá el proyecto para exportar resultados vigentes.',true);return;}
  const sheets=SimproxFiles.tables(graph,result),stem=(graph.title||'simprox').replace(/[^\p{L}\p{N}._-]+/gu,'-').slice(0,60);
  if(kind==='xlsx')downloadLocal(stem+'.xlsx',SimproxFiles.xlsx(sheets),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  else{const sheet=sheets[kind==='balances'?1:0];downloadLocal(stem+'-'+sheet.name.toLowerCase()+'.csv',SimproxFiles.csv(sheet.rows),'text/csv;charset=utf-8');}
  recordActivity('Resultados exportados',kind);closeMenus();
}
function reviewGraph(){
  if(!hasProject)return ['Abrí o creá un proyecto.'];
  const issues=[];
  if(!graph.nodes.length)issues.push('El diagrama está vacío.');
  if(!graph.model)issues.push('Elegí un modelo de propiedades en Simulación.');
  for(const n of graph.nodes){
    if(isFeed(n)){issues.push(...SimproxStreams.issues(n,graph.compounds).map(issue=>`${n.name}: ${issue}`));if(n.flash_spec==='PS'&&graph.model==='Steam Tables (IAPWS-IF97)')issues.push(`${n.name}: PS no está habilitado con IAPWS-IF97; usá TP o PH.`);}
    if(!isStream(n)){const feeds=graph.edges.filter(e=>e.to===n.id&&nodeById(e.from)?.type==='MaterialStream'),products=graph.edges.filter(e=>e.from===n.id&&nodeById(e.to)?.type==='MaterialStream');if(!feeds.length)issues.push(`${n.name}: falta una alimentación de materia.`);if(!products.length)issues.push(`${n.name}: falta una salida de materia.`);if((n.type==='Splitter'||isReactor(n))&&products.length<2)issues.push(`${n.name}: conectá las dos salidas de materia.`);}
  }
  return [...new Set(issues)];
}
function failureHints(message){
  const hints=[];
  if(/timeout|tiempo|45 s|timed out/i.test(message))hints.push('El cálculo o la conexión excedió el tiempo disponible. Probá un caso más pequeño y comprobá el estado del motor.');
  if(/conexi|connection|fetch|unavailable|no está disponible|HTTP 5|network/i.test(message))hints.push('Comprobá el motor desde Herramientas → Estado del motor. La PC y su conexión deben estar activas.');
  if(/compos|fracci|fraction/i.test(message))hints.push('Revisá la base de composición y la suma de fracciones en cada alimentación.');
  if(/compound|componente|model|propiedad|package|IAPWS|flash|equilib/i.test(message))hints.push('Revisá que el modelo admita los compuestos y las condiciones. Las tablas IAPWS de esta interfaz se usan para agua pura.');
  if(/caudal|flow|presi|pressure|temperat|número entre/i.test(message))hints.push('Comprobá el valor, la unidad y el rango que indica el mensaje. La presión es absoluta y los caudales de alimentación deben ser positivos.');
  if(/reaction|reacci|stoich|element|átomo/i.test(message))hints.push('Revisá la estequiometría, el reactivo base, la fase y las dos salidas del reactor.');
  if(!hints.length)hints.push('Revisá las conexiones, las condiciones de alimentación y las especificaciones de cada equipo. El mensaje original del motor aparece abajo.');
  return hints;
}
function renderDiagnostics(){
  const issues=reviewGraph(),failed=lastCalculation?.ok===false;
  $('diagnostics-content').innerHTML=`<h3>Revisión del proyecto</h3>${issues.length?'<ul>'+issues.map(v=>`<li>${esc(v)}</li>`).join('')+'</ul>':'<p>No se detectaron problemas básicos de conexiones o alimentación. Esta revisión no sustituye al solver.</p>'}<h3>Último cálculo</h3>${lastCalculation?`<p>${esc(lastCalculation.time)} · ${calculationLabel(lastCalculation)}${calculationDuration(lastCalculation)}</p><pre class="diagnostic-message">${esc(lastCalculation.message)}</pre>`:'<p>Todavía no se ejecutó un cálculo en esta sesión.</p>'}${failed?'<h3>Sugerencias para revisar</h3><ul>'+failureHints(lastCalculation.message).map(v=>`<li>${esc(v)}</li>`).join('')+'</ul><p class="mini">Son orientaciones basadas en el mensaje, no un diagnóstico confirmado de la causa.</p>':''}<h3>Actividad de esta sesión</h3>${activity.length?'<ol>'+activity.map(v=>`<li><time>${esc(v.time)}</time> · ${esc(v.message)}${v.detail?'<br>'+esc(v.detail):''}</li>`).join('')+'</ol>':'<p>Sin actividad registrada.</p>'}`;
}
function calculationLabel(entry){return entry?.state==='running'?'En curso':entry?.ok?'Completado':'Fallido';}
function calculationDuration(entry){return Number.isFinite(entry?.duration_ms)?` · ${fmt(entry.duration_ms/1000,2)} s (solicitud completa)`:'';}
function traceConnection(operation,entry){
  connectionTrace.push({operation,engine:selectedEngine,...entry});connectionTrace=connectionTrace.slice(-40);renderConnectionTrace();
}
function renderConnectionTrace(){
  const consoleView=$('connection-console');if(!consoleView)return;
  const atBottom=consoleView.scrollHeight-consoleView.scrollTop-consoleView.clientHeight<35;
  // Banner inicial dentro del historial: se desplaza junto con los eventos, no es una cabecera fija.
  const asciiLogo=String.raw` _____   _____   __  __
\\  ___| |_   _| |  \\/  |
 \\ \\      | |   | |\\/| |
 / /__   _| |_  | |  | |
/_____| |_____| |_|  |_|`;
  const banner=`<div class="console-boot" aria-label="ΣIM · Simulación de procesos"><pre class="boot-classic boot-logo" aria-hidden="true">${esc(asciiLogo)}</pre><div class="boot-title">Simulación de procesos</div><div>Desarrollado por Ing. Luciano Lamaita</div><div>Motor de cálculo: DWSIM 10.2.15 · Daniel Wagner Oliveira de Medeiros y colaboradores</div><div>GNU GPL v3 · Créditos y licencias en «Acerca de»</div><div class="boot-ready">----------------------------------------------------</div></div>`;
  const events=connectionTrace.map(v=>{const calculation=v.kind==='calculation';const status=v.http?' · HTTP '+v.http:calculation?(v.state==='running'?' · En curso':' · Sin respuesta HTTP'):' · Sin respuesta HTTP';const duration=Number.isFinite(v.ms)?(calculation?' · Duración '+fmt(v.ms/1000,2)+' s':' · '+v.ms+' ms'):'';return `<div class="trace-${v.state}"><time>${esc(new Date(v.time).toLocaleTimeString('es-AR'))}</time> ${calculation?'CÁLCULO':'CONEXIÓN'} · ${esc(v.engine==='debian'?'Debian':'Windows')} · ${esc(v.operation)}${esc(status+duration)}<br><span>${esc(v.message)}</span></div>`;}).join('');
  consoleView.innerHTML=banner+events;
  if(atBottom&&connectionTrace.length>2)consoleView.scrollTop=consoleView.scrollHeight;
}
function paintConnection(){
  const age=connectionCheck?Math.max(0,Math.round((Date.now()-Date.parse(connectionCheck.time))/1000)):null;
  let state=connectionCheck?.state||(engineOnline?'online':'checking');if((state==='online'||state==='busy')&&age>75)state='stale';
  const labels={online:'DWSIM · servicio disponible',busy:'DWSIM · motor ocupado',offline:'DWSIM · sin conexión',checking:'DWSIM · comprobando',stale:'DWSIM · señal sin actualizar'};
  $('engine-state').textContent=labels[state];$('engine-state').className='engine-state '+state;
  $('engine-metrics').textContent=connectionCheck?`${connectionCheck.http?'HTTP '+connectionCheck.http:'sin HTTP'} · ${connectionCheck.ms} ms · hace ${age} s`:'';
  $('connection-monitor-button').title=`Abrir monitor de conexión · ${labels[state]}`;
}
function renderServerDetails(){
  renderConnectionTrace();
  const engineName=selectedEngine==='debian'?'Notebook · Debian':'PC remota · Windows';
  const state=connectionCheck?.state||(engineOnline?'online':'checking');
  const labels={online:'Servicio accesible',busy:'Motor ocupado',offline:'Sin conexión verificada',checking:'Comprobando conexión'};
  const status=labels[state]||state;
  const meaning=state==='online'?'El servidor seleccionado respondió a la consulta del catálogo. No equivale a ejecutar una simulación.':state==='busy'?'El servidor respondió, pero está ocupado con otra tarea.':state==='offline'?'No se pudo confirmar el servicio seleccionado. La PC puede estar apagada, el túnel desconectado o el servicio detenido.':'Todavía no hay una comprobación vigente de este motor.';
  const checked=connectionCheck?new Date(connectionCheck.time).toLocaleString('es-AR'):'Todavía no realizada';
  const elapsed=connectionCheck?`${connectionCheck.http??'Sin respuesta'} · ${connectionCheck.ms} ms`:'Sin respuesta';
  const catalogInfo=connectionCheck?.compounds?`<dt>Catálogo</dt><dd>${connectionCheck.compounds} compuestos · ${connectionCheck.models} modelos</dd>`:'';
  const latest=lastCalculation?`${calculationLabel(lastCalculation)}${calculationDuration(lastCalculation)}${lastCalculation.engine?' · '+(lastCalculation.engine==='debian'?'Debian':'Windows'):''}`:'Sin cálculos';
  $('server-details').innerHTML=`<section class="monitor-summary"><div><span class="monitor-kicker">Motor seleccionado</span><strong>${esc(engineName)}</strong></div><span class="monitor-status monitor-status-${esc(state)}">${esc(status)}</span></section><p class="monitor-explanation">${esc(meaning)} <strong>No se cambia de motor automáticamente.</strong></p><dl><dt>Última comprobación</dt><dd>${esc(checked)}</dd><dt>Respuesta HTTP y latencia</dt><dd>${esc(elapsed)}</dd><dt>Detalle</dt><dd>${connectionCheck?esc(connectionCheck.message):'Usá Comprobar conexión para actualizar.'}</dd>${catalogInfo}<dt>Último cálculo de esta sesión</dt><dd>${esc(latest)}</dd></dl>`;
}
async function checkEngine({silent=false}={}){
  const generation=++engineCheckGeneration,engine=selectedEngine;
  monitorRequest=true;$('server-refresh').disabled=true;const start=performance.now();let http=null;
  try{
    const response=await fetch('/api/catalog',{headers:{'X-SIM-Engine':engine},signal:AbortSignal.timeout(15000)});http=response.status;
    if(generation!==engineCheckGeneration)return;const data=await readCatalogResponse(response);
    if(response.status===409){engineOnline=true;connectionCheck={time:new Date().toISOString(),ok:true,state:'busy',http,message:'El servicio responde; DWSIM está resolviendo otra tarea.',ms:Math.round(performance.now()-start)};}
    else{if(!response.ok)throw new Error(data.error||'El motor no respondió correctamente.');engineOnline=true;catalog=data;connectionCheck={time:new Date().toISOString(),ok:true,state:'online',http,message:'Conexión verificada; esta consulta solo comprueba disponibilidad.',ms:Math.round(performance.now()-start),compounds:data.compound_count??data.compounds?.length,models:data.models?.length};}
    if(!silent)recordActivity('Comprobación de conexión: '+connectionCheck.state);
  }catch(error){if(generation!==engineCheckGeneration)return;engineOnline=false;connectionCheck={time:new Date().toISOString(),ok:false,state:'offline',http,message:error.message,ms:Math.round(performance.now()-start)};if(!silent)recordActivity('Comprobación de conexión fallida',error.message);}
  finally{if(generation===engineCheckGeneration){monitorRequest=false;$('server-refresh').disabled=false;traceConnection('GET /api/catalog',connectionCheck);paintConnection();renderServerDetails();updateControls();}}
  return generation===engineCheckGeneration&&engineOnline&&selectedEngine===engine;
}
function bindWorkspaceTools(){
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>exportResults(b.dataset.export));
  document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{$('example-select').value=b.dataset.example;resetExample();closeMenus();});
  $('menu-calculate').onclick=calculate;$('menu-validate').onclick=$('diagnostics-button').onclick=()=>{renderDiagnostics();$('diagnostics-dialog').showModal();closeMenus();};
  $('engine-select').onchange=event=>selectCalculationEngine(event.target.value);
  $('server-status-button').onclick=()=>{renderServerDetails();$('server-dialog').showModal();closeMenus();};$('connection-monitor-button').onclick=()=>$('server-status-button').click();$('server-refresh').onclick=()=>checkEngine();
  const auxiliaryView=new URLSearchParams(location.search).has('diagram')||new URLSearchParams(location.search).has('results');$('monitor-auto').checked=!auxiliaryView;
  monitorTimer=setInterval(()=>{if($('monitor-auto').checked&&!document.hidden)checkEngine({silent:true});},30000);connectionPaintTimer=setInterval(()=>{if(!document.hidden)paintConnection();},1000);
  $('diagnostics-download').onclick=()=>downloadLocal('sim-diagnostico.txt',JSON.stringify({project:graph.title,model:graph.model,review:reviewGraph(),lastCalculation,connectionCheck,connectionTrace,activity},null,2),'text/plain;charset=utf-8');
  try{const p=JSON.parse(localStorage.getItem('simprox-ui')||'{}');if(Number.isInteger(p.digits)&&p.digits>=0&&p.digits<=8)resultDigits=p.digits;document.body.classList.toggle('hide-canvas-hints',p.hints===false);}catch{}
  $('settings-button').onclick=()=>{$('settings-digits').value=resultDigits;$('settings-hints').checked=!document.body.classList.contains('hide-canvas-hints');$('settings-dialog').showModal();closeMenus();};
  const saveSettings=()=>{const digits=Number($('settings-digits').value);if(!Number.isInteger(digits)||digits<0||digits>8)return;resultDigits=digits;const hints=$('settings-hints').checked;document.body.classList.toggle('hide-canvas-hints',!hints);try{localStorage.setItem('simprox-ui',JSON.stringify({digits,hints}));}catch{}if(result)renderResults();};$('settings-digits').onchange=saveSettings;$('settings-hints').onchange=saveSettings;
  $('close-project-button').onclick=()=>$('close-project-dialog').showModal();$('confirm-close-project').onclick=()=>{$('close-project-dialog').close();graph=emptyProject();hasProject=false;selection=pending=result=null;$('project-title').value=graph.title;$('results').innerHTML=blankResults;$('result-meta').textContent='Sin resultados';renderDiagram();renderInspector();renderCompounds();closeMenus();};
  const dock=$('results-panel');$('results-close').onclick=()=>{if(document.body.classList.contains('results-window'))window.close();else dock.hidden=true;};$('view-results').onclick=()=>{dock.hidden=false;closeMenus();};
  const resultURL=new URL(location.href);resultURL.search='';resultURL.searchParams.set('results','1');resultURL.searchParams.set('workspace',workspaceId);$('results-popout').href=resultURL.href;
  $('results-popout').onclick=e=>{e.preventDefault();const opened=window.open(resultURL.href,'simprox-results-'+workspaceId,'popup,width=1100,height=650,resizable=yes,scrollbars=yes');if(!opened)notice('Permití la ventana emergente para separar los resultados.');};$('view-results-popout').onclick=()=>$('results-popout').click();
  let resizingResults=null;const handle=$('results-resizer'),setHeight=h=>{const value=Math.max(90,Math.min(innerHeight*.65,Math.max(90,document.querySelector('main').clientHeight-280),h));dock.style.setProperty('--results-height',value+'px');handle.setAttribute('aria-valuenow',Math.round(value));};handle.setAttribute('aria-valuemin','90');handle.setAttribute('aria-valuemax',Math.round(innerHeight*.65));handle.setAttribute('aria-valuenow',Math.round(dock.getBoundingClientRect().height));
  handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();resizingResults={y:e.clientY,height:dock.getBoundingClientRect().height};handle.setPointerCapture(e.pointerId);};handle.onpointermove=e=>{if(resizingResults)setHeight(resizingResults.height+resizingResults.y-e.clientY);};handle.onpointerup=handle.onpointercancel=()=>resizingResults=null;handle.onkeydown=e=>{if(['ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();setHeight(e.key==='Home'?160:dock.getBoundingClientRect().height+(e.key==='ArrowUp'?20:-20));}};handle.ondblclick=()=>dock.style.removeProperty('--results-height');
  document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if((e.ctrlKey||e.metaKey)&&!e.altKey){const action={s:'save-button',o:'open-button',n:'new-project-button'}[e.key.toLowerCase()];if(action){e.preventDefault();if(!$(action).disabled)$(action).click();}}});
  updateControls();
}
