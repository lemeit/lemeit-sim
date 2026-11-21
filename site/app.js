/* Editor local de procesos. Las propiedades físicas proceden del servidor DWSIM. */
'use strict';
const $ = id => document.getElementById(id);
const TYPES = {
  MaterialStream: {label:'Corriente de materia', short:'Materia', icon:'material_stream', prefix:'C', w:150,h:70},
  EnergyStream: {label:'Corriente de energía', short:'Energía', icon:'energy_stream', prefix:'Q',w:130,h:65},
  Mixer: {label:'Mezclador',short:'Mezclador',icon:'mixer',prefix:'M',w:80,h:80},
  Splitter: {label:'Divisor',short:'Divisor',icon:'splitter',prefix:'D',w:80,h:80},
  Separator: {label:'Separador flash',short:'Flash',icon:'separator',prefix:'V',w:140,h:140},
  Tank: {label:'Tanque',short:'Tanque',icon:'tank',prefix:'TK',w:80,h:80},
  Expander: {label:'Expansor',short:'Expansor',icon:'expander',prefix:'X',w:80,h:80},
  Compressor: {label:'Compresor',short:'Compresor',icon:'compressor',prefix:'K',w:80,h:80},
  Pump: {label:'Bomba',short:'Bomba',icon:'pump',prefix:'P',w:80,h:80},
  HeatExchanger: {label:'Intercambiador',short:'Intercambiador',icon:'heat-exchanger',prefix:'HX',w:95,h:95},
  Valve: {label:'Válvula',short:'Válvula',icon:'valve',prefix:'V',w:68,h:68},
  Heater: {label:'Calentador',short:'Calentador',icon:'heater',prefix:'H',w:80,h:80},
  Cooler: {label:'Enfriador',short:'Enfriador',icon:'cooler',prefix:'E',w:80,h:80},
  ConversionReactor: {label:'Reactor de conversión',short:'Conversión',icon:'reactor_conversion',prefix:'R',w:100,h:100},
  EquilibriumReactor: {label:'Reactor de equilibrio',short:'Equilibrio',icon:'reactor_equilibrium',prefix:'R',w:100,h:100},
  CSTR: {label:'Reactor de tanque agitado',short:'CSTR',prefix:'CSTR-',w:100,h:100,diagramOnly:true},
  Polymerization: {label:'Reactor de polimerización',short:'Polimerización',prefix:'POLY-',w:100,h:100,diagramOnly:true},
  PFR: {label:'Reactor tubular',short:'PFR',prefix:'PFR-',w:140,h:40,diagramOnly:true},
  RigorousColumn: {label:'Columna de destilación',short:'Destilación',prefix:'DCOL-',w:180,h:225,diagramOnly:true},
  AbsorptionColumn: {label:'Columna de absorción',short:'Absorción',prefix:'ABS-',w:67.5,h:225,diagramOnly:true},
  ReliefValve: {label:'Válvula de seguridad',short:'PSV',prefix:'PSV-',w:80,h:80,diagramOnly:true},
};
const isReactor=n=>['ConversionReactor','EquilibriumReactor'].includes(n.type);
function diagramHasRecirculation(g){
  const links=new Map(g.nodes.map(n=>[n.id,[]]));
  for(const e of g.edges)if(links.has(e.from))links.get(e.from).push(e.to);
  const active=new Set(),done=new Set();
  function visit(id){if(active.has(id))return true;if(done.has(id))return false;active.add(id);for(const next of links.get(id)||[])if(visit(next))return true;active.delete(id);done.add(id);return false;}
  return [...links.keys()].some(id=>visit(id));
}

let viewX=0, viewY=0, panning=null, endpointDrag=null, resizing=null, bending=null, paintFrame=0, suppressPaletteUntil=0;
let marquee=null;
let gridVisible=false,gridSnap=false;
const GRID_STEP=20;
const snapCoordinate=value=>gridSnap&&Number.isFinite(value)?Math.round(value/GRID_STEP)*GRID_STEP:value;
function saveCanvasPreferences(){try{localStorage.setItem('sim-canvas-preferences',JSON.stringify({gridVisible,gridSnap}));}catch{}}
function showGrid(){return `<defs><pattern id="canvas-grid-pattern" width="${GRID_STEP}" height="${GRID_STEP}" patternUnits="userSpaceOnUse"><path d="M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-width=".7"/></pattern></defs><rect x="-100000" y="-100000" width="200000" height="200000" fill="url(#canvas-grid-pattern)" pointer-events="none" aria-hidden="true"/>`;}
function refreshCanvasButtons(){for(const [id,on] of [['view-grid',gridVisible],['view-snap',gridSnap],['diagram-grid',gridVisible]]){const button=$(id);if(button)button.setAttribute('aria-pressed',String(on));}}

let graph, catalog, selection=null, pending=null, dragging=null, zoom=1, result=null, busy=false, revision=0;
let hasProject=false,engineOnline=false,draftCompounds=[];
let resultValidity='none'; // none | stale | valid; solo resultados calculados pueden quedar obsoletos.
let unitSystem='engineering';
let selectedEngine='windows',engineMode='auto',engineCheckGeneration=0; // Selección automática predeterminada.
let lastCalculation=null,connectionCheck=null,gatewayCheck=null,activity=[],resultDigits=3;
let connectionTrace=[],monitorRequest=false,monitorTimer=null,connectionPaintTimer=null;
const diagnosticEvents=[];
function debugEvent(level,event,fields={}){
  SimDiagnostics.add(diagnosticEvents,{time:new Date().toISOString(),level,event,...fields});
  if($('diagnostics-dialog')?.open)renderDiagnosticLog();
}
function renderDiagnosticLog(){
  const output=$('diagnostics-log');if(!output)return;
  const filter=$('diagnostics-filter')?.value||'all';
  const events=SimDiagnostics.show(diagnosticEvents,filter);
  output.textContent=events.length?events.map(SimDiagnostics.line).join('\n'):'Sin eventos para este filtro.';
  output.scrollTop=output.scrollHeight;
}
function diagnosticReport(){return SimDiagnostics.exportReport({project:graph.title,model:graph.model,engine:selectedEngine,portalVersion:document.documentElement.dataset.portalVersion,review:reviewGraph(),lastCalculation,connectionCheck,gatewayCheck,events:diagnosticEvents});}

let workspaceChannel=null,applyingWorkspace=false,workspaceId=new URLSearchParams(location.search).get('workspace')||crypto.randomUUID();
const emptyProject=()=>({version:1,unit_system:unitSystem,title:'Ningún proyecto abierto',compounds:[],model:'',nodes:[],edges:[]});
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
function updateResultValidity(){
  const element=$('result-validity');if(!element||!element.dataset)return;
  const state=busy?'calculating':!hasProject?'none':result&&resultValidity==='valid'?'valid':resultValidity==='stale'?'stale':lastCalculation?.state==='failed'?'failed':'none';
  const labels={none:'Sin resultados',valid:'Cálculo correcto',stale:'Recalcular',calculating:'Calculando…',failed:'Cálculo fallido'};
  const descriptions={none:'Todavía no se calculó este proyecto.',valid:'DWSIM terminó correctamente. Los resultados corresponden a las condiciones actuales.',stale:'Las condiciones físicas cambiaron desde el último cálculo correcto.',calculating:'El motor seleccionado está resolviendo el proceso.',failed:lastCalculation?.message||'No se pudo resolver el proceso.'};
  element.dataset.state=state;element.textContent=labels[state];element.title=descriptions[state];
  const button=$('calculate-button');if(button){button.dataset.state=state;button.title='Resolver con DWSIM · '+descriptions[state];
    const label=button.querySelector('.calculate-label');if(label)label.textContent=busy?'Calculando…':'Calcular';
    button.setAttribute('aria-busy',String(busy));}
}
function changed({physical=true}={}){
  if(physical){if(typeof SimProcessExplorer!=='undefined')SimProcessExplorer.invalidate();revision++;if(resultValidity==='valid')resultValidity='stale';lastCalculation=null;result=null;$('results').innerHTML=blankResults;$('result-meta').textContent='Sin resultados vigentes';$('calculation-state').textContent=resultValidity==='stale'?'Condiciones modificadas · recalcular':'Proyecto listo para calcular';}
  updateResultValidity();
  if(hasProject)persist();renderDiagram();publishWorkspace(physical);if(typeof SimCloudProjects!=='undefined')SimCloudProjects.onChange();
}
function updateControls(){
  updateResultValidity();
  $('close-project-button').disabled=!hasProject;$('menu-calculate').disabled=busy||!engineOnline||!hasProject||graph.nodes.length<2;document.querySelectorAll('[data-export]').forEach(b=>b.disabled=!result||busy);
  document.querySelectorAll('[data-diagram-export]').forEach(b=>b.disabled=!hasProject||!graph.nodes.length);
  $('project-title').disabled=!hasProject;$('exercise-open').disabled=!hasProject;$('project-editor-menu').disabled=!hasProject;$('project-report-menu').disabled=!hasProject||!graph.nodes.length;$('local-projects-save').disabled=!hasProject;$('cloud-save-menu').disabled=!hasProject;$('cloud-save-toolbar').disabled=!hasProject;$('save-button').disabled=!hasProject;$('report-pdf-menu').disabled=!hasProject||!graph.nodes.length;$('save-project-toolbar').disabled=!hasProject;
  $('compound-button').disabled=!hasProject||!catalog;$('model-select').disabled=!hasProject||!catalog;
  $('diagram-add').disabled=!hasProject||busy;
  document.querySelectorAll('[data-insert-type]').forEach(button=>button.disabled=!hasProject||busy);
  $('report-label-tool').disabled=!hasProject;
  $('diagram-note-insert').disabled=!hasProject||busy;
  $('calculate-button').disabled=busy||!engineOnline||!hasProject||graph.nodes.length<2;
  $('process-explorer-open').disabled=busy||!hasProject||!result||resultValidity!=='valid';
  $('engine-select').disabled=busy;
  document.querySelectorAll('[data-toolbar-action]').forEach(button=>{
    button.disabled=$(button.dataset.toolbarAction).disabled;
  });
  const model=$('canvas-model'),duration=$('canvas-run-time');
  model.hidden=!hasProject||!graph.model;
  model.textContent=graph.model?'Modelo '+graph.model:'';
  duration.hidden=!result||!Number.isFinite(result.elapsed_s);
  duration.textContent=duration.hidden?'':'Último cálculo '+fmt(result.elapsed_s,2)+' s';
  document.querySelectorAll('.palette-item').forEach(b=>b.disabled=!hasProject||busy);
  try{$('recent-button').disabled=!localStorage.getItem('lemeit-process-v1');}catch{$('recent-button').disabled=true;}
  const panel=$('start-panel');panel.hidden=graph.nodes.length>0;
  panel.innerHTML=hasProject?'<div class="blank-diagram-icon">⌁</div><h2>Diagrama vacío</h2><p>Agregá corrientes y equipos desde la biblioteca.<br>Después conectá sus puertos y definí las condiciones.</p>':'<div class="blank-diagram-icon">▱</div><h2>Ningún proyecto abierto</h2><p>Creá un proyecto, elegí componentes y modelo,<br>y empezá a construir el proceso.</p><p class="start-shortcut">Archivo → Nuevo proyecto · Abrir proyecto</p>';
  document.body.classList.toggle('no-project',!hasProject);
}
function nodeById(id){return graph.nodes.find(n=>n.id===id);}
function isStream(n){return n.type.endsWith('Stream');}
function isFeed(n){return n.type==='MaterialStream'&&!graph.edges.some(e=>e.to===n.id);}
// Fractions of the DWSIM graphic bounds. Edge indices remain those of ΣIM projects.
const equipmentPorts = {
  Mixer: [[0,.2],[0,.5],[0,.8],[1,.5]],
  Splitter: [[0,.5],[1,.2],[1,.8]],
  Separator: [[.25,.2],[.5,0,'up'],[.75,5/7]],
  Tank: [[0,.5],[1,.5]],
  Expander: [[0,.5],[1,.5],[1,.85,'right']],
  Compressor: [[0,.5],[1,.5],[0,.85,'left']],
  Pump: [[-.05,.5],[1,.125]],
  HeatExchanger: [[0,.5],[.5,0,'up'],[1,.5],[.5,1,'down']],
  Valve: [[0,.5],[1,.5]],
  Heater: [[0,.5],[1,.5],[.5,1,'down']],
  Cooler: [[0,.5],[1,.5],[.5,1,'down']],
  ConversionReactor: [[.11,.5],[.89,.17],[.89,.83]],
  EquilibriumReactor: [[.11,.5],[.89,.17],[.89,.83]],
  CSTR: [[0,.5],[1,.5],[.5,0,'up']],
  Polymerization: [[0,.5],[1,.5],[.5,0,'up']],
  PFR: [[0,.5],[1,.5],[.75,0,'up']],
  RigorousColumn: [[.0625,.26],[1,.3],[1,.98]],
  AbsorptionColumn: [[.0625,.5],[1,.02],[1,.98]],
  ReliefValve: [[.5,1,'down'],[1,.5]],
};
const inputCount = {Mixer:3,HeatExchanger:2};
const energyPortSide = {Compressor:'energy-in',Heater:'energy-in',Expander:'energy-out',Cooler:'energy-out'};
const portDirections = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
function basePortList(n){
  const {w,h}=TYPES[n.type];
  if(isStream(n)){
    const medium=n.type==='EnergyStream'?'energy':'material',g=streamGeometry(n);
    return [{side:'in',index:0,x:g.a.x-n.x,y:g.a.y-n.y,medium},{side:'out',index:0,x:g.b.x-n.x,y:g.b.y-n.y,medium}];
  }
  const inputs=inputCount[n.type]??1, energy=energyPortSide[n.type];
  const ports=equipmentPorts[n.type];
  return ports.map(([x,y,direction],i)=>{
    const isEnergy=energy&&i===ports.length-1;
    const side=isEnergy?energy:i<inputs?'in':'out';
    return {side,index:isEnergy?0:i<inputs?i:i-inputs,
      x:x*w,y:y*h,medium:isEnergy?'energy':'material',direction};
  });
}
function symbolScale(n){return isStream(n)?1:(n.scale??1);}
function portList(n){const ports=basePortList(n);return isStream(n)?ports:ports.map(p=>({...p,x:p.x*symbolScale(n),y:p.y*symbolScale(n)}));}
function point(n,side,index=0){const p=portList(n).find(p=>p.side===side&&p.index===index);return p?{x:n.x+p.x,y:n.y+p.y,medium:p.medium}:null;}
function normalForPort(n,side,index){
  const port=portList(n).find(p=>p.side===side&&p.index===index);
  return portDirections[port?.direction]??portDirections[side.endsWith('in')?'left':'right'];
}
function streamGeometry(n){
  let source=graph.edges.find(e=>e.to===n.id),target=graph.edges.find(e=>e.from===n.id);
  const a=source?point(nodeById(source.from),source.fromPort||'out',source.fromIndex||0):{x:n.startX??n.x,y:n.startY??(n.y+TYPES[n.type].h/2)};
  const b=target?point(nodeById(target.to),target.toPort||'in',target.toIndex||0):{x:n.endX??(n.x+TYPES[n.type].w),y:n.endY??(n.y+TYPES[n.type].h/2)};
  const g={a:{x:a.x,y:a.y},b:{x:b.x,y:b.y}};
  if(endpointDrag?.node===n.id&&endpointDrag.moved)g[endpointDrag.side==='in'?'a':'b']={x:endpointDrag.preview.x,y:endpointDrag.preview.y};
  if(endpointDrag?.node===n.id&&endpointDrag.moved){if(endpointDrag.side==='in')source=null;else target=null;}
  const dx=g.b.x-g.a.x,dy=g.b.y-g.a.y;
  const travel=Math.abs(dy)>Math.abs(dx)?{x:0,y:Math.sign(dy)||1}:{x:Math.sign(dx)||1,y:0};
  const startNormal=source?normalForPort(nodeById(source.from),source.fromPort||'out',source.fromIndex||0):travel;
  const endNormal=target?normalForPort(nodeById(target.to),target.toPort||'in',target.toIndex||0):{x:-travel.x,y:-travel.y};
  const routeAxis=n.routeAxis||(startNormal.y&&endNormal.y?'y':'x');
  const stub=28,A={x:g.a.x+startNormal.x*stub,y:g.a.y+startNormal.y*stub},B={x:g.b.x+endNormal.x*stub,y:g.b.y+endNormal.y*stub};
  const obstacles=graph.nodes.filter(n=>!isStream(n)).map(n=>{const t=TYPES[n.type],s=symbolScale(n);return {left:n.x-10,right:n.x+t.w*s+10,top:n.y-10,bottom:n.y+t.h*s+10};});
  const clear=pts=>pts.slice(1).every((b,i)=>{const a=pts[i];return obstacles.every(o=>a.x===b.x?!(a.x>o.left&&a.x<o.right&&Math.max(a.y,b.y)>o.top&&Math.min(a.y,b.y)<o.bottom):!(a.y>o.top&&a.y<o.bottom&&Math.max(a.x,b.x)>o.left&&Math.min(a.x,b.x)<o.right));});
  const candidates=[];
  for(const axis of [routeAxis,routeAxis==='x'?'y':'x']){
    const requested=axis==='x'?n.routeX??(A.x+B.x)/2:n.routeY??(A.y+B.y)/2;
    const mids=[requested,...obstacles.flatMap(o=>axis==='x'?[o.left-8,o.right+8]:[o.top-8,o.bottom+8])];
    for(const mid of mids){
      const inner=axis==='x'?[A,{x:mid,y:A.y},{x:mid,y:B.y},B]:[A,{x:A.x,y:mid},{x:B.x,y:mid},B];
      if(!clear(inner))continue;
      const length=inner.slice(1).reduce((v,p,i)=>v+Math.abs(p.x-inner[i].x)+Math.abs(p.y-inner[i].y),0);
      const quality=typeof SimDiagramInteractions==='undefined'?0:SimDiagramInteractions.routePenalty([g.a,...inner,g.b]);
      candidates.push({axis,mid,inner,score:length+quality+(axis===routeAxis?0:30)+Math.abs(mid-requested)*.1-(axis===routeAxis&&mid===requested&&(n.routeX!==undefined||n.routeY!==undefined)?10000:0)});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);
  const chosen=candidates[0];
  let points;
  if(chosen){g.mid=chosen.mid;g.bend=chosen.axis==='x'?{x:chosen.mid,y:(A.y+B.y)/2,axis:'x'}:{x:(A.x+B.x)/2,y:chosen.mid,axis:'y'};points=[g.a,...chosen.inner,g.b];}
  else if(routeAxis==='y'){const mid=n.routeY??(A.y+B.y)/2;g.mid=mid;g.bend={x:(A.x+B.x)/2,y:mid,axis:'y'};points=[g.a,A,{x:A.x,y:mid},{x:B.x,y:mid},B,g.b];}
  else{const mid=n.routeX??(A.x+B.x)/2;g.mid=mid;g.bend={x:mid,y:(A.y+B.y)/2,axis:'x'};points=[g.a,A,{x:mid,y:A.y},{x:mid,y:B.y},B,g.b];}
  const clean=[];
  for(const p of points){if(clean.length&&p.x===clean.at(-1).x&&p.y===clean.at(-1).y)continue;while(clean.length>1){const prev=clean.at(-2),last=clean.at(-1),aligned=(prev.x===last.x&&last.x===p.x)||(prev.y===last.y&&last.y===p.y),forward=(last.x-prev.x)*(p.x-last.x)+(last.y-prev.y)*(p.y-last.y)>=0;if(!aligned||!forward)break;clean.pop();}clean.push(p);}
  g.d=`M${clean[0].x} ${clean[0].y}`+clean.slice(1).map((p,i)=>p.x===clean[i].x?` V${p.y}`:` H${p.x}`).join('');
  let longest={length:-1};for(let i=1;i<clean.length;i++){const a=clean[i-1],b=clean[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length>longest.length)longest={a,b,length};}
  const segment=!source&&target?{a:clean[0],b:clean[1]}:source&&!target?{a:clean.at(-2),b:clean.at(-1)}:longest;
  if(segment.a&&segment.b){
    const length=Math.hypot(segment.b.x-segment.a.x,segment.b.y-segment.a.y);
    const position=!source&&target?'in':source&&!target?'out':'center';
    g.arrow=DwsimSymbols.arrowTransform({...segment,length},position);
    const ux=length?(segment.b.x-segment.a.x)/length:1,uy=length?(segment.b.y-segment.a.y)/length:0,size=Math.min(length,40);
    const center=position==='in'?{x:segment.a.x+ux*size/2,y:segment.a.y+uy*size/2}:position==='out'?{x:segment.b.x-ux*size/2,y:segment.b.y-uy*size/2}:{x:(segment.a.x+segment.b.x)/2,y:(segment.a.y+segment.b.y)/2};
    // Borde del cuerpo de la misma flecha SVG (x=50, y=35 en su escala 0–100).
    g.arrowAnchor={x:center.x+uy*size*.15,y:center.y-ux*size*.15};
    g.arrowDirection={x:ux,y:uy};
  }
  g.label=longest.a?{x:(longest.a.x+longest.b.x)/2+(longest.a.x===longest.b.x?42:0),y:(longest.a.y+longest.b.y)/2-14}:{x:g.a.x,y:g.a.y-14};g.points=clean;return g;
}
function setStreamBend(n,axis,value){n.routeAxis=axis;n[axis==='y'?'routeY':'routeX']=snapCoordinate(value);}
function equipmentLabelX(n){const energyConnected=graph.edges.some(e=>(e.to===n.id&&nodeById(e.from)?.type==='EnergyStream')||(e.from===n.id&&nodeById(e.to)?.type==='EnergyStream'));return TYPES[n.type].w*symbolScale(n)/2+(energyConnected?100:0);}
const engineHeaders=()=>({'X-SIM-Engine':selectedEngine});
async function selectCalculationEngine(mode){
  if(busy||!['auto','windows','debian'].includes(mode))return;
  if(mode!=='auto'&&document.body.dataset.sessionRole!=='admin')return;
  engineMode=mode;$('engine-select').value=mode;
  // En modo fijo, el destino solicitado es el motor seleccionado aunque esté apagado.
  // No conservar el identificador del motor anterior después de cambiar el selector.
  if(mode!=='auto')selectedEngine=mode;
  engineCheckGeneration++;engineOnline=false;connectionCheck=null;gatewayCheck=null;
  if(resultValidity==='valid')resultValidity='stale';
  result=null;$('results').innerHTML=blankResults;$('result-meta').textContent='Sin resultados vigentes';
  $('calculation-state').textContent='Comprobando motor de cálculo';
  updateControls();paintConnection();await checkEngine();
}
async function readCatalogResponse(response){try{return await response.json();}catch{throw new Error(`La API del motor no devolvió una respuesta válida (HTTP ${response.status}).`);}}
function renderPalette(){
  $('palette').innerHTML=Object.entries(TYPES).map(([type,t],i)=>`${i===0?'<p class="palette-group">CORRIENTES</p>':i===2?'<p class="palette-group">OPERACIONES</p>':''}<button class="palette-item" data-type="${type}" title="Agregar ${esc(t.label.toLowerCase())}">${DwsimSymbols.thumbnail(type,t)}<span>${t.label}</span></button>`).join('');
  if($('palette').dataset.bound)return;
  $('palette').dataset.bound='true';
  $('palette').addEventListener('click',e=>{if(performance.now()<suppressPaletteUntil||dragging||endpointDrag||resizing||bending)return;const b=e.target.closest('button[data-type]');if(b){suppressPaletteUntil=performance.now()+300;addNode(b.dataset.type);}});
  // Firefox y el acoplamiento de paneles pueden interferir con el drag HTML5 de botones.
  // Seguimiento de puntero desde la paleta: el clic sigue agregando como antes.
  const palette=$('palette'),canvas=$('canvas-wrap');
  let paletteGesture=null;
  const cleanup=()=>{
    canvas.classList.remove('palette-drop-ready');
    paletteGesture?.ghost?.remove();
    paletteGesture=null;
    window.removeEventListener('pointermove',movePalette,true);
    window.removeEventListener('pointerup',endPalette,true);
    window.removeEventListener('pointercancel',cancelPalette,true);
  };
  function movePalette(e){
    const g=paletteGesture;if(!g||e.pointerId!==g.pointer)return;
    if(!g.moved&&Math.hypot(e.clientX-g.startX,e.clientY-g.startY)<7)return;
    if(!g.moved){
      g.moved=true;
      suppressPaletteUntil=performance.now()+1000;
      const ghost=document.createElement('div');
      ghost.className='palette-drag-preview';
      ghost.textContent=TYPES[g.type].label;
      ghost.setAttribute('aria-hidden','true');
      document.body.append(ghost);g.ghost=ghost;
    }
    e.preventDefault();
    g.ghost.style.left=(e.clientX+14)+'px';
    g.ghost.style.top=(e.clientY+14)+'px';
    canvas.classList.toggle('palette-drop-ready',SimDiagramInteractions.insideCanvas(e.clientX,e.clientY,canvas.getBoundingClientRect()));
  }
  function endPalette(e){
    const g=paletteGesture;if(!g||e.pointerId!==g.pointer)return;
    const place=g.moved&&SimDiagramInteractions.insideCanvas(e.clientX,e.clientY,canvas.getBoundingClientRect());
    if(g.moved){e.preventDefault();suppressPaletteUntil=performance.now()+700;}
    const type=g.type;cleanup();
    if(place&&!busy&&hasProject){
      const p=svgPoint(e);
      addNode(type,{x:p.x-60,y:p.y-40});
    }
  }
  function cancelPalette(e){if(paletteGesture?.pointer===e.pointerId)cleanup();}
  palette.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.pointerType==='touch'||busy||!hasProject)return;
    const b=e.target.closest('button[data-type]');
    if(!b||b.disabled)return;
    paletteGesture={pointer:e.pointerId,type:b.dataset.type,startX:e.clientX,startY:e.clientY,moved:false};
    window.addEventListener('pointermove',movePalette,true);
    window.addEventListener('pointerup',endPalette,true);
    window.addEventListener('pointercancel',cancelPalette,true);
  });
}
// Las llamadas son decoración del objeto: no agregan puertos ni conexiones.
function calloutGeometry(n,g=isStream(n)?streamGeometry(n):null,exportRoutes=null){
  let anchor,tangent={x:1,y:0};
  if(g){
    let longest={length:-1};
    for(let i=1;i<g.points.length;i++){const a=g.points[i-1],b=g.points[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length>longest.length)longest={a,b,length};}
    if(longest.a)tangent={x:longest.b.x-longest.a.x,y:longest.b.y-longest.a.y};
    anchor=g.arrowAnchor??(longest.a?{x:(longest.a.x+longest.b.x)/2,y:(longest.a.y+longest.b.y)/2}:g.a);
    tangent=g.arrowDirection??tangent;
  }else{const t=TYPES[n.type],scale=symbolScale(n);anchor={x:t.w*scale*.8,y:t.h*scale*.2};}
  const width=145,dx=g?0:n.x,dy=g?0:n.y;
  const viewport={left:viewX-dx,top:viewY-dy,right:viewX+1000/zoom-dx,bottom:viewY+520/zoom-dy};
  const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  const obstacles=[];
  for(const other of graph.nodes){
    if(other.id===n.id)continue;
    if(isStream(other)){
      const points=(exportRoutes?.get(other.id)??streamGeometry(other)).points;
      for(let i=1;i<points.length;i++)obstacles.push({left:Math.min(points[i-1].x,points[i].x)-dx-5,right:Math.max(points[i-1].x,points[i].x)-dx+5,top:Math.min(points[i-1].y,points[i].y)-dy-5,bottom:Math.max(points[i-1].y,points[i].y)-dy+5,weight:3});
    }else{const b=nodeBounds(other);obstacles.push({left:b.left-dx-10,right:b.right-dx+10,top:b.top-dy-10,bottom:b.bottom-dy+10,weight:8});}
  }
  // Examinar ambos lados y alturas: el resultado depende del espacio real del lienzo.
  let best;
  for(const distance of [20,40,80])for(const side of [1,-1])for(const vertical of [-1,1]){
    const elbow={x:anchor.x+side*18,y:anchor.y+vertical*distance},end=elbow.x+side*width;
    const x=Math.min(elbow.x,end)+6,y=elbow.y-8;
    const box={left:x-4,right:x+width,top:y-14,bottom:y+5};
    const area=(box.right-box.left)*(box.bottom-box.top);
    let score=(exportRoutes?0:(area-overlap(box,viewport))*20)+(distance-20)*2;
    // Al cambiar el sentido u orientación del tramo, girar hacia su zona exterior.
    const preferredSide=Math.abs(tangent.y)>Math.abs(tangent.x)?(tangent.y>0?1:-1):(tangent.x>=0?1:-1);
    const preferredVertical=Math.abs(tangent.y)>Math.abs(tangent.x)?(tangent.y>0?-1:1):-1;
    score+=(side===preferredSide?0:20)+(vertical===preferredVertical?0:80);
    for(const obstacle of obstacles)score+=overlap(box,obstacle)*obstacle.weight;
    // Favorecer el interior del área visible y evitar el rótulo simple sobre la corriente.
    if(vertical<0)score+=overlap(box,{left:anchor.x-90,right:anchor.x+90,top:anchor.y-28,bottom:anchor.y-6})*4;
    if(!exportRoutes)score+=Math.abs((box.left+box.right)/2-(viewport.left+viewport.right)/2)*.01;
    const candidate={x,y,width,anchor,side,vertical,score,line:`M${anchor.x} ${anchor.y} L${elbow.x} ${elbow.y} H${end}`};
    if(!best||score<best.score)best=candidate;
  }
  return best;
}
function renderCallout(n,g,r,feed,exportRoutes){
  const t=TYPES[n.type],scale=symbolScale(n);
  const x=g?g.label.x:equipmentLabelX(n),y=g?g.label.y:t.h*scale+20;
  let html=`<text class="${g?'stream-label':'equipment-label'}" text-anchor="middle" x="${x}" y="${y}">${esc(n.name)}</text>`;

  const reading=r?`${shown('temperature_C',r.temperature_K-273.15,n,2)} · ${shown('pressure_kPa',r.pressure_Pa/1000,n,2)} · ${shown('mass_flow',r.mass_flow_kg_s,n)}`:feed&&(n.flash_spec||'TP')==='TP'&&(n.flow_basis||'mass')==='mass'?`${shown('temperature_C',n.temperature_C,n,1)} · ${shown('pressure_kPa',n.pressure_kPa,n,2)} · ${shown('mass_flow',n.mass_flow,n)}`:'';
  if(reading){
    const c=calloutGeometry(n,g,exportRoutes);
    html+=`<g class="diagram-callout"><path class="callout-leader" d="${c.line}"/><circle class="callout-tip" cx="${c.anchor.x}" cy="${c.anchor.y}" r="3"/><g class="callout-text" transform="translate(${c.x} ${c.y})"><text class="node-reading" x="0" y="0">${reading}</text></g></g>`;
  }
  return html;
}
function diagramMarkup(nodes=graph.nodes,exporting=false){
  const exportRoutes=exporting?new Map(graph.nodes.filter(isStream).map(n=>[n.id,streamGeometry(n)])):null;
  let html='';
  [...nodes].sort((a,b)=>Number(isStream(a))-Number(isStream(b))).forEach(n=>{
    const t=TYPES[n.type], r=result?.streams[n.id],feed=isFeed(n),scale=symbolScale(n);
    const g=isStream(n)?(exportRoutes?.get(n.id)??streamGeometry(n)):null;
    const selected=!exporting&&(selection?.node===n.id||selection?.nodes?.includes(n.id));
    html+=`<g transform="translate(${isStream(n)?0:n.x} ${isStream(n)?0:n.y})" class="node dwsim ${result?'dwsim-calculated':''} ${n.type==='EnergyStream'?'dwsim-energy':''} ${isStream(n)?'stream-node':'equipment-node'} ${selected?'selected':''}" ${exporting?'':`data-node="${esc(n.id)}" tabindex="0" role="button" aria-label="${esc(t.label+': '+n.name)}"`}>`;
    if(g){
      html+=`${exporting?'':`<path class="stream-hit" d="${g.d}"/>`}<path class="stream-line" d="${g.d}" stroke-dasharray="${n.type==='EnergyStream'?'7 4':'none'}"/>${DwsimSymbols.arrow(g.arrow??'scale(0)')}`;
    }else html+=`<g class="equipment-symbol" transform="scale(${scale})">${selected?`<rect class="equipment-selection" x="-12" y="-12" width="${t.w+24}" height="${t.h+24}" rx="6"/>`:''}${DwsimSymbols.equipment(n.type,t.w,t.h)}</g>`;
    html+=renderCallout(n,g,r,feed,exportRoutes);
    for(const raw of portList(n)){
      const p=isStream(n)?{...raw,x:raw.x+n.x,y:raw.y+n.y}:raw;
      const label=`${p.side.endsWith('in')?'Entrada':'Salida'} ${p.medium==='energy'?'de energía':p.index+1}${n.type==='HeatExchanger'?(p.index===0?' · lado caliente':' · lado frío'):(isReactor(n)||n.type==='Separator')&&p.side==='out'?(p.index===0?' · vapor':' · líquido'):''}`;
      const connected=graph.edges.some(e=>p.side.endsWith('in')?e.to===n.id&&(e.toPort||'in')===p.side&&(e.toIndex||0)===p.index:e.from===n.id&&(e.fromPort||'out')===p.side&&(e.fromIndex||0)===p.index);
      if(exporting){
        if(!connected&&!isStream(n))html+=`<circle class="port export-port ${p.medium==='energy'?'energy':''}" cx="${p.x}" cy="${p.y}" r="3"><title>${label}</title></circle>`;
        continue;
      }
      const flashLabel=n.type==='Separator'?(p.side==='in'?'Alimentación':p.index===0?'Vapor':'Líquido'):'';
      const flashText=flashLabel?`<text class="flash-port-label" x="${p.x}" y="${p.y}" dx="${p.side==='in'?-12:12}" dy=".35em" text-anchor="${p.side==='in'?'end':'start'}" aria-hidden="true">${flashLabel}</text>`:'';
      html+=`<g class="${connected?'connected-port':''}" data-port="${p.side}" data-index="${p.index}" data-owner="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}: ${flashLabel||label}, ${connected?'conectado':'libre'}"><circle class="port-target" cx="${p.x}" cy="${p.y}" r="13"/><circle class="port ${p.medium==='energy'?'energy':''} ${pending?.node===n.id&&pending.side===p.side&&pending.index===p.index?'pending':''}" cx="${p.x}" cy="${p.y}" r="5"/><title>${flashLabel||label}${connected?' · conectado':' · libre'}</title>${flashText}</g>`;
    }
    if(!exporting&&selection?.node===n.id){if(g)html+=`<rect class="bend-handle" data-bend="${n.id}" data-axis="${g.bend.axis}" x="${g.bend.x-3}" y="${g.bend.y-3}" width="6" height="6"><title>Arrastrar para acomodar el recorrido</title></rect>`;else html+=`<rect class="resize-handle" data-resize="${n.id}" x="${t.w*scale+2}" y="${t.h*scale+2}" width="14" height="14"><title>Arrastrar para cambiar el tamaño del símbolo</title></rect>`;}
    html+='</g>';
  });
  html+=SimExerciseEditor.markup(graph,exporting);
  if(!exporting&&marquee){const r=SimDiagramInteractions.selectionRect(marquee.start,marquee.end);html+=`<rect class="selection-marquee" x="${r.left}" y="${r.top}" width="${r.right-r.left}" height="${r.bottom-r.top}"/>`;}
  return html;
}
function renderDiagram(){
  const svg=$('diagram');
  svg.setAttribute('viewBox',`${viewX} ${viewY} ${1000/zoom} ${520/zoom}`);
  svg.innerHTML=(gridVisible?showGrid():'')+diagramMarkup();refreshCanvasButtons();if($('recycle-caption'))$('recycle-caption').textContent=diagramHasRecirculation(graph)?'CON RECIRCULACIÓN':'SIN RECIRCULACIÓN';$('object-count').textContent=`${graph.nodes.length} objetos`;
  $('zoom-label').textContent=`${Math.round(zoom*100)} %`;
  $('connection-hint').textContent=pending?'Ahora seleccioná un puerto de entrada compatible. Esc cancela.':'Arrastrá el extremo de una corriente a un punto de conexión. Los puertos libres tienen un borde marcado.';
  $('connection-hint').classList.toggle('active',!!pending);
  updateControls();if(typeof SimProcessExplorer!=='undefined')SimProcessExplorer.emphasize();
}
function field(key,label,unit,value,options={}){
  return `<label class="field"><span class="field-label"><span>${esc(label)}</span><span>${esc(unit)}</span></span><input data-field="${key}" type="${options.text?'text':'number'}" value="${esc(value??'')}" ${options.text?'maxlength="45"':'step="any" '+(options.min!==undefined?`min="${options.min}"`:'')} required></label>`;
}
function selectField(key,label,values,value){return `<label class="field"><span class="field-label">${esc(label)}</span><select data-field="${key}">${values.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;}
const streamTabs=new Map();
const streamLabels={temperature_C:'Temperatura',pressure_kPa:'Presión absoluta',mass_flow:'Caudal másico',molar_flow:'Caudal molar',enthalpy_kJ_kg:'Entalpía específica',entropy_kJ_kgK:'Entropía específica',vapor_fraction:'Fracción molar de vapor'};
function streamField(n,key){const unit=SimproxStreams.unit(n,key),value=SimproxStreams.fromCanonical(key,n[key],unit),label=streamLabels[key]||'Temperatura de salida';return `<label class="field stream-field"><span class="field-label">${label}</span><span class="stream-value-unit"><input type="number" step="any" data-field="${key}" data-stream-value="true" aria-label="${label}" value="${value===null?'':esc(Number(value.toPrecision(12)))}"><select data-field="unit:${key}" aria-label="Unidad de ${label}">${Object.keys(SimproxStreams.units[key]).map(u=>`<option ${u===unit?'selected':''}>${esc(u)}</option>`).join('')}</select></span></label>`;}
function shown(key,value,n=null,digits=resultDigits){const unit=n?SimproxStreams.unit(n,key):SimproxStreams.defaultUnit(key),v=SimproxStreams.fromCanonical(key,value,unit);return `${v===null?'—':fmt(v,digits)} ${esc(unit)}`;}
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
    if(feed){html+=selectField('composition_basis','Base de las fracciones',[['mass','Másica · kg/kg'],['molar','Molar · mol/mol']],n.composition_basis||'mass')+selectField('fraction_display','Expresar fracciones',[['fraction','Fracción · 0 a 1'],['percent','Porcentaje · 0 a 100']],n.fraction_display||'fraction')+'<p class="mini">Cambiar de base convierte la mezcla usando masas molares exportadas de DWSIM. La suma debe ser 1 o 100 %.</p>';
      for(const c of graph.compounds)html+=field(`fraction:${c}`,c,n.fraction_display==='percent'?'%':n.composition_basis==='molar'?'mol/mol':'kg/kg',(n.composition?.[c]??0)*(n.fraction_display==='percent'?100:1),{min:0});
      const sum=graph.compounds.reduce((total,c)=>total+(n.composition?.[c]||0),0);html+=`<p class="mini" role="status">Suma: ${fmt(sum,6)} / 1${Math.abs(sum-1)>1e-6?' · Completá la composición.':''}</p>`;
    }else html+='<p class="mini">La composición de esta corriente la determina el cálculo. Consultá Resultados para ver las fracciones másicas y molares.</p>';
  }else{
    if(!r)return html+'<p class="mini">Sin resultados vigentes. Ejecutá Calcular para obtener las propiedades reales de DWSIM.</p>';
    const mixture=r.phases?.find(p=>p.name==='Mixture')||r.phases?.[0];
    html+='<details class="stream-phase"><summary>Unidades de los resultados</summary>'+Object.keys(streamLabels).filter(k=>k!=='vapor_fraction').map(k=>selectField('unit:'+k,streamLabels[k],Object.keys(SimproxStreams.units[k]).map(u=>[u,u]),SimproxStreams.unit(n,k))).join('')+'</details>';
    html+='<p class="inspector-section">ESTADO GLOBAL · CALCULADO POR DWSIM</p><div class="inspector-readings">'+streamReading(n,'temperature_C',r.temperature_K-273.15)+streamReading(n,'pressure_kPa',r.pressure_Pa/1000)+streamReading(n,'mass_flow',r.mass_flow_kg_s)+streamReading(n,'molar_flow',r.molar_flow_mol_s)+streamReading(n,'vapor_fraction',r.phases?.find(p=>p.name==='Vapor')?.fraction??0)+streamReading(n,'enthalpy_kJ_kg',mixture?.enthalpy_kJ_kg)+streamReading(n,'entropy_kJ_kgK',mixture?.entropy_kJ_kgK)+`<div class="reading-row"><span>Densidad</span><b>${Number.isFinite(mixture?.density_kg_m3)&&mixture.density_kg_m3>0?shown('density_kg_m3',mixture.density_kg_m3,n,5):'—'}</b></div>`+`<div class="reading-row"><span>Caudal volumétrico</span><b>${mixture?.density_kg_m3>0?shown('volume_flow',r.mass_flow_kg_s/mixture.density_kg_m3,n,6):'—'}</b></div></div>`;
    html+='<p class="inspector-section">COMPOSICIÓN Y FASES</p><p class="mini">Fracción de fase en base molar. Líquido es el agregado de las fases líquidas: no se suma nuevamente a Líquido 1/2. Las fases ausentes se omiten. El conector puede devolver cero para propiedades no informadas.</p>';
    const names={Mixture:'Mezcla global',Vapor:'Vapor',Liquid:'Líquido total',OverallLiquid:'Líquido total',Liquid1:'Líquido 1',Liquid2:'Líquido 2',Aqueous:'Acuosa',Solid:'Sólido'};
    for(const phase of r.phases||[]){if(phase!==mixture&&!(phase.fraction>1e-10))continue;html+=`<details class="stream-phase" ${phase===mixture?'open':''}><summary>${esc(names[phase.name]||phase.name)}${phase===mixture?'':' · '+fmt(phase.fraction,6)+' mol/mol'}</summary>`;
      if(phase!==mixture)html+=`<div class="inspector-readings">${streamReading(n,'enthalpy_kJ_kg',phase.enthalpy_kJ_kg)}${streamReading(n,'entropy_kJ_kgK',phase.entropy_kJ_kgK)}<div class="reading-row"><span>Densidad</span><b>${phase.density_kg_m3>0?shown('density_kg_m3',phase.density_kg_m3,n,5):'—'}</b></div></div>`;
      html+=`<table class="stream-composition"><thead><tr><th>Compuesto</th><th>kg/kg</th><th>mol/mol</th>${phase.name==='Vapor'?'<th>Presión parcial</th>':''}</tr></thead><tbody>`+graph.compounds.map(c=>`<tr><th>${esc(c)}</th><td>${fmt(phase.compounds?.[c]?.mass_fraction,6)}</td><td>${fmt(phase.compounds?.[c]?.mole_fraction,6)}</td>${phase.name==='Vapor'?`<td>${shown('pressure_kPa',(phase.compounds?.[c]?.mole_fraction??NaN)*r.pressure_Pa/1000,n,5)}</td>`:''}</tr>`).join('')+'</tbody></table>'+(phase.name==='Vapor'?'<p class="mini">pᵢ = yᵢ P absoluta. No es la fugacidad φᵢ yᵢ P de un gas no ideal.</p>':'')+'</details>';
    }
  }
  return html;
}

function renderInspector(){
  const container=$('inspector');
  if(selection?.nodes){const nodes=graph.nodes.filter(n=>selection.nodes.includes(n.id));container.innerHTML=`<p class="inspector-type">SELECCIÓN MÚLTIPLE</p><h3 class="inspector-title">${nodes.length} objetos seleccionados</h3><p class="mini">${nodes.filter(n=>!isStream(n)).length} equipo(s) · ${nodes.filter(isStream).length} corriente(s)</p><p class="mini">Arrastrá un objeto seleccionado para mover el conjunto. Esc o un clic en el fondo quita la selección. Las conexiones se conservan.</p><button type="button" class="delete-button" id="delete-selected">Eliminar selección</button>`;return;}
  if(selection?.edge!==undefined){
    const edge=graph.edges[selection.edge];if(!edge){selection=null;return renderInspector();}
    container.innerHTML=`<p class="inspector-type">CONEXIÓN</p><h3 class="inspector-title">${esc(nodeById(edge.from).name)} → ${esc(nodeById(edge.to).name)}</h3><p class="inspector-description">Esta línea conecta objetos del proceso en DWSIM. Seleccioná «Eliminar conexión» para modificar el recorrido.</p><button class="delete-button" id="delete-selected">Eliminar conexión</button>`;return;
  }
  const n=nodeById(selection?.node);if(!n){container.innerHTML='<div class="empty-inspector"><span>⌁</span>Seleccioná un objeto del diagrama.<br>Acá vas a definir sus condiciones y consultar sus resultados.</div>';return;}
  const t=TYPES[n.type],r=result?.streams[n.id];
  let html=`<p class="inspector-type">${esc(t.label.toUpperCase())}</p><h3 class="inspector-title">${esc(n.name)}</h3>${field('name','Nombre','',n.name,{text:true})}`;
  html+=SimContextHelp.link(n.type);
  if(!isStream(n))html+=`<p class="inspector-section">DISEÑO</p><label class="field"><span class="field-label">Tamaño del símbolo · %</span><input data-field="scale" type="number" min="50" max="300" step="10" value="${Math.round(symbolScale(n)*100)}"></label><p class="mini">Tamaño gráfico; no modifica las dimensiones físicas del equipo.</p>`;
  if(n.type==='MaterialStream')html+=renderStreamInspector(n,r);
  if(n.type==='Heater'||n.type==='Cooler')html+=`<p class="inspector-description">Especificación: temperatura de salida. El motor calcula el calor transferido al fluido. Caída de presión nula.</p>${streamField(n,'outlet_C')}`;
  if(n.type==='HeatExchanger')html+=`<p class="inspector-description">Intercambiador de dos corrientes sin mezcla. Puerto 1: caliente, puerto 2: frío. Se especifica únicamente la potencia térmica transferida del caliente al frío (kW); DWSIM calcula ambas temperaturas de salida. El modelo inicial no incluye pérdidas externas ni caídas de presión.</p>${field('heat_duty_kW','Calor transferido','kW',n.heat_duty_kW,{min:0.000001})}`;
  if(TYPES[n.type].diagramOnly)html+='<p class="inspector-description">Disponible para dibujar y conectar en el PFD. Cálculo sin implementar en ΣIM.</p>';
  if(n.type==='Tank')html+=`<p class="inspector-description">Tanque de líquido en régimen estacionario. Especificá volumen útil y pérdida de presión. DWSIM calcula el tiempo de residencia V/Q y el estado de salida. No simula nivel, llenado, vaciado ni separación de fases.</p>${field('volume_m3','Volumen útil','m³',n.volume_m3,{min:0.000001})}${field('pressure_drop_kPa','Pérdida de presión','kPa',n.pressure_drop_kPa,{min:0})}${Number.isFinite(result?.equipment[n.id]?.residence_time_s)?`<p class="reading-row">Tiempo de residencia: <strong>${fmt(result.equipment[n.id].residence_time_s/60,3)} min</strong></p>`:''}`;
  if(n.type==='Expander')html+=`<p class="inspector-description">Expansión adiabática de gas con producción de trabajo de eje. Especificá una presión absoluta de descarga menor que la entrada y la eficiencia isentrópica. Solo alimentación vapor; sin curvas ni modo politrópico.</p>${field('outlet_pressure_kPa','Presión de descarga','kPa abs',n.outlet_pressure_kPa,{min:0.001})}${field('efficiency_pct','Eficiencia isentrópica','%',n.efficiency_pct,{min:0.01})}${Number.isFinite(result?.equipment[n.id]?.shaft_power_generated_kW)?`<p class="reading-row">Potencia de eje producida: <strong>${fmt(result.equipment[n.id].shaft_power_generated_kW,3)} kW</strong></p>`:''}`;
  if(n.type==='Compressor')html+=`<p class="inspector-description">Compresión adiabática de gas: especificá presión absoluta de descarga y eficiencia isentrópica. DWSIM calcula temperatura y potencia de eje. Solo alimentación completamente vapor; sin curvas ni modo politrópico.</p>${field('outlet_pressure_kPa','Presión de descarga','kPa abs',n.outlet_pressure_kPa,{min:0.001})}${field('efficiency_pct','Eficiencia isentrópica','%',n.efficiency_pct,{min:0.01})}`;
  if(n.type==='Pump')html+=`<p class="inspector-description">Bomba de líquido con presión absoluta de salida y eficiencia. El motor calcula potencia y temperatura. No usar para alimentar con vapor.</p>${field('outlet_pressure_kPa','Presión de descarga','kPa abs',n.outlet_pressure_kPa,{min:0.001})}${field('efficiency_pct','Eficiencia','%',n.efficiency_pct,{min:0.01})}`;
  if(n.type==='Valve')html+=`<p class="inspector-description">Válvula de expansión por estrangulamiento: presión absoluta de salida. La presión debe ser menor que la de entrada; DWSIM calcula temperatura y fases.</p>${field('outlet_pressure_kPa','Presión de salida','kPa abs',n.outlet_pressure_kPa,{min:0.001})}`;
  if(n.type==='Separator')html+='<p class="inspector-description">Separación de equilibrio vapor–líquido, sin reparto fijo. Puerto 1: vapor. Puerto 2: líquido. En la primera versión opera adiabáticamente con la alimentación ya acondicionada.</p>';
  if(n.type==='Splitter')html+=`<p class="inspector-description">Dos salidas con la misma composición. La fracción restante sale por el puerto 2.</p>${field('split','Fracción hacia salida 1','kg/kg',n.split,{min:0.000001})}<p class="mini">Salida 2: ${fmt(1-n.split,4)}</p>`;
  if(n.type==='Mixer')html+='<p class="inspector-description">Mezcla adiabática, sin trabajo de eje. Admite hasta 3 entradas; la presión de salida es la menor de las entradas.</p><p class="mini">Σ ṁ<sub>e</sub> = ṁ<sub>s</sub><br>Σ (ṁ · h)<sub>e</sub> = (ṁ · h)<sub>s</sub></p>';
  if(isReactor(n)){
    html+='<p class="inspector-description">Una reacción por reactor, con temperatura de salida especificada. Conectá las dos salidas: 1 vapor y 2 líquido. DWSIM comprueba el balance de elementos.</p>';
    html+=selectField('reactor-type','Modelo de reacción',[['ConversionReactor','Conversión especificada'],['EquilibriumReactor','Equilibrio químico']],n.type);
    html+=selectField('base_compound','Reactivo base',graph.compounds.map(c=>[c,c]),n.base_compound);
    html+=selectField('phase','Fase de reacción',[['Vapor','Vapor'],['Liquid','Líquido'],['Mixture','Mezcla']],n.phase);
    if(n.type==='ConversionReactor')html+=field('conversion','Conversión del reactivo base','%',n.conversion,{min:0});
    else html+='<p class="mini">Equilibrio por fugacidades; constante calculada por DWSIM a partir de las energías de formación. No implica equilibrio instantáneo en un reactor real.</p>';
    html+=streamField(n,'outlet_C');
    html+='<p class="inspector-section">ESTEQUIOMETRÍA MOLAR</p><p class="mini">Reactivos negativos, productos positivos; 0 para inertes.</p>';
    for(const c of graph.compounds)html+=field(`stoich:${c}`,c,'mol/mol',n.stoichiometry?.[c]??0);
  }
  if(n.type==='EnergyStream')html+='<p class="inspector-description">Representa calor transferido, sin caudal de materia. En los calentadores y enfriadores actuales se especifica la temperatura de salida: DWSIM calcula la potencia térmica, que se consulta en el balance del equipo. Las corrientes de energía también pueden representar trabajo en otros equipos.</p>';
  if(r&&n.type!=='MaterialStream')html+=`<p class="inspector-section">RESULTADOS DE DWSIM</p><div class="inspector-readings"><div class="reading-row">Temperatura <b>${fmt(r.temperature_K-273.15)} °C</b></div><div class="reading-row">Presión <b>${fmt(r.pressure_Pa/1000)} kPa</b></div><div class="reading-row">Caudal <b>${fmt(r.mass_flow_kg_s)} kg/s</b></div></div>`;
  if(n.type==='HeatExchanger'&&SimGuidedHx.extract(graph,null))html+='<div class="guided-hx-entry"><p class="inspector-section">PRÁCTICA DEL EJEMPLO 13</p><p class="mini">Explorá el intercambio de calor, anticipá las temperaturas y comparalas con DWSIM.</p><button type="button" id="guided-hx-start" class="outline-button">Iniciar actividad guiada</button></div>';
  html+='<button class="delete-button" id="delete-selected">Eliminar objeto y sus conexiones</button>';container.innerHTML=html;
}
function addNode(type,pos){
  if(busy||!hasProject||!Object.hasOwn(TYPES,type))return;
  if(graph.nodes.length>=30)return notice('Esta versión admite hasta 30 objetos.',true);
  const t=TYPES[type];let number=1;while(graph.nodes.some(n=>n.name===`${t.short} ${number}`))number++;
  const node={id:'n'+crypto.randomUUID().replaceAll('-','').slice(0,16),type,name:`${t.short} ${number}`,x:snapCoordinate(pos?.x??290+(graph.nodes.length%4)*45),y:snapCoordinate(pos?.y??90+(graph.nodes.length%5)*55)};
  if(type==='MaterialStream')Object.assign(node,{temperature_C:25,pressure_kPa:101.325,mass_flow:1,composition:Object.fromEntries(graph.compounds.map((c,i)=>[c,i===0?1:0]))});
  if(type==='Heater'||type==='Cooler')node.outlet_C=type==='Heater'?70:25;
  if(type==='Splitter')node.split=.5;
  if(type==='HeatExchanger')node.heat_duty_kW=40;
  if(type==='Tank')Object.assign(node,{volume_m3:5,pressure_drop_kPa:10});
  if(type==='Expander')Object.assign(node,{outlet_pressure_kPa:100,efficiency_pct:80});
  if(type==='Compressor')Object.assign(node,{outlet_pressure_kPa:300,efficiency_pct:75});
  if(type==='Pump')Object.assign(node,{outlet_pressure_kPa:500,efficiency_pct:75});
  if(type==='Valve')node.outlet_pressure_kPa=200;
  if(isReactor(node))Object.assign(node,{outlet_C:500,conversion:50,phase:'Vapor',base_compound:graph.compounds[0],stoichiometry:Object.fromEntries(graph.compounds.map(c=>[c,0]))});
  graph.nodes.push(node);selection={node:node.id};pending=null;changed();renderInspector();notice('');$('diagram').focus({preventScroll:true});
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
    n[out?'endX':'startX']=drag.preview.x;n[out?'endY':'startY']=drag.preview.y;
    notice('Extremo libre. Arrastralo a un puerto para conectarlo.');
  }
  delete n.orientation;delete n.routeAxis;delete n.routeX;delete n.routeY;
  pending=null;changed();renderInspector();
}
function removeSelected(){
  if(busy||!hasProject||!selection)return;
  if(selection?.nodes){const ids=new Set(selection.nodes);graph.nodes=graph.nodes.filter(n=>!ids.has(n.id));graph.edges=graph.edges.filter(e=>!ids.has(e.from)&&!ids.has(e.to));}
  else if(selection?.node){graph.nodes=graph.nodes.filter(n=>n.id!==selection.node);graph.edges=graph.edges.filter(e=>e.from!==selection.node&&e.to!==selection.node);}
  else if(selection?.edge!==undefined)graph.edges.splice(selection.edge,1);
  selection=null;pending=null;changed();renderInspector();
}
function svgPoint(e){const p=$('diagram').createSVGPoint();p.x=e.clientX;p.y=e.clientY;const world=p.matrixTransform($('diagram').getScreenCTM().inverse());return {x:world.x,y:world.y};}
let resultsView='balances';
function selectResultsView(view){
  resultsView=view;
  for(const button of document.querySelectorAll('[data-results-view]')){
    button.setAttribute('aria-pressed',String(button.dataset.resultsView===view));
  }
  for(const section of $('results').querySelectorAll('[data-results-content]')){
    section.hidden=section.dataset.resultsContent!==view;
  }
}
function renderResults(){
  if(!result)return;
  const reading=(label,value)=>`<div><dt>${label}</dt><dd>${value}</dd></div>`;
  const mass=value=>shown('mass_flow',value,null,6);
  const residual=value=>shown('mass_flow',value,null,9);
  const streamCards=Object.entries(result.streams).map(([id,r])=>{
    const mixture=r.phases?.find(p=>p.name==='Mixture')??r.phases?.[0];
    const properties=[
      ['Caudal másico','mass_flow',r.mass_flow_kg_s],
      ['Caudal molar','molar_flow',r.molar_flow_mol_s],
      ['Temperatura','temperature_C',r.temperature_K==null?null:r.temperature_K-273.15],
      ['Presión absoluta','pressure_kPa',r.pressure_Pa==null?null:r.pressure_Pa/1000],
      ['Entalpía','enthalpy_kJ_kg',mixture?.enthalpy_kJ_kg],
      ['Densidad','density_kg_m3',mixture?.density_kg_m3]
    ];
    const value=(key,number)=>Number.isFinite(number)?shown(key,number,null,resultDigits):'—';
    return `<details class="results-card stream-result">
      <summary><span>${esc(nodeById(id)?.name||r.name)}</span><strong>${value('mass_flow',r.mass_flow_kg_s)}</strong></summary>
      <dl>${properties.map(([label,key,number])=>reading(label,value(key,number))).join('')}</dl>
    </details>`;
  }).join('');
  const balances=result.balances.map(b=>{
    const powerLabel=b.reactive?'Calor del reactor (DWSIM)':b.energy_kind==='shaft'?'Trabajo de eje al fluido':'Calor neto al fluido';
    const compounds=Object.entries(b.components||{}).map(([name,v])=>`<div class="component-result">
      <h4>${esc(name)}</h4><dl>
      ${reading('Entrada',mass(v.in_kg_s))}
      ${reading('Salida',mass(v.out_kg_s))}
      ${reading(b.reactive?'Consumo (+) / generación (−)':'Residuo',residual(v.residual_kg_s))}
      </dl>
    </div>`).join('');
    return `<article class="results-card">
      <h3>${esc(nodeById(b.id)?.name||b.name)}</h3>
      <dl>${reading('Entrada másica',mass(b.mass_in))}
      ${reading('Salida másica',mass(b.mass_out))}
      ${reading('Residuo másico',residual(b.mass_residual))}
      ${reading(powerLabel,shown('power_kW',b.heat_to_fluid_kW))}</dl>
      ${compounds?`<details class="component-balances"><summary>Por componente</summary>${compounds}</details>`:''}
    </article>`;
  }).join('');
  const recycleNote=result.recycle?`<p class="results-note"><strong>Recirculación estacionaria:</strong> ${esc(result.recycle.iterations)} iteraciones · residuo del caudal de retorno: ${shown('mass_flow',result.recycle.mass_residual_kg_s,null,9)} · residuo de temperatura: ${fmt(result.recycle.temperature_residual_K,4)} K · residuo de presión: ${fmt(result.recycle.pressure_residual_kPa,4)} kPa. El método usa una alimentación virtual de corte, que no forma parte del proyecto.</p>`:'';
  $('results').innerHTML=`<section class="balance-grid" data-results-content="balances">${balances||'<p class="results-note">Sin balances de equipos.</p>'}${recycleNote}
    <p class="results-note">Régimen estacionario. El trabajo de eje negativo indica potencia producida.</p></section>
    <section class="stream-results" data-results-content="streams">${streamCards||'<p class="results-note">Sin corrientes calculadas.</p>'}</section>`;
  selectResultsView(resultsView);
  $('result-meta').textContent='DWSIM 10.2.15 · '+fmt(result.elapsed_s,2)+' s';
}
async function convertCompositionBase(n,next){
 const old=n.composition_basis||'mass';if(old===next)return;
 try{const db=await SimUnitCalculator.getMasses();if(nodeById(n.id)!==n||busy)return;const mixed=SimUnits.mixture(graph.compounds.map(c=>n.composition?.[c]??0),graph.compounds.map(c=>db[c]),old);
 n.composition=Object.fromEntries(graph.compounds.map((c,i)=>[c,next==='molar'?mixed.y[i]:mixed.w[i]]));n.composition_basis=next;changed();renderInspector();notice('Composición convertida con masas molares de DWSIM; no se reinterpretaron los mismos números.');
 }catch(error){renderInspector();notice('No se pudo convertir la composición: '+error.message,true);}
}
async function convertFlowBase(n,next){
 const old=n.flow_basis||'mass';if(old===next)return;
 try{const db=await SimUnitCalculator.getMasses();if(nodeById(n.id)!==n||busy)return;const mixed=SimUnits.mixture(graph.compounds.map(c=>n.composition?.[c]??0),graph.compounds.map(c=>db[c]),n.composition_basis||'mass');const known=n[old==='mass'?'mass_flow':'molar_flow'];if(!(known>0))throw Error('Completá un caudal positivo antes de cambiar su base.');if(next==='molar')n.molar_flow=known*1000/mixed.M;else n.mass_flow=known*mixed.M/1000;n.flow_basis=next;changed();renderInspector();notice('Caudal convertido con la masa molar de la mezcla.');}catch(error){renderInspector();notice('No se pudo convertir el caudal: '+error.message,true);}
}
async function calculate(){
  if(!hasProject||busy)return;
  const drawingOnly=graph.nodes.find(n=>TYPES[n.type].diagramOnly);
  if(drawingOnly)return notice(`«${drawingOnly.name}» está disponible para dibujar el PFD. Quitalo para calcular este proyecto.`,true);

  debugEvent('INFO','Validación previa',{engine:selectedEngine,objects:graph.nodes.length,connections:graph.edges.length,model:graph.model});
  const selectedIsReady=await checkEngine(); // Selección previa al POST; sin reenvío ambiguo.
  if(!selectedIsReady){debugEvent('ERROR','Motor no disponible · cálculo no enviado',{engine:selectedEngine,stage:'preflight'});return notice(engineMode==='auto'?'No hay un motor disponible y compatible con el proceso.':'El motor fijado no está disponible o no es compatible; elegí Automático.',true);}
  if(typeof SimProcessExplorer!=='undefined')SimProcessExplorer.invalidate();
  notice('');busy=true;updateResultValidity();document.body.classList.add('calculating');$('calculate-button').disabled=true;$('calculation-state').textContent='DWSIM está resolviendo el proceso…';
  if(resultValidity==='valid')resultValidity='stale';
  result=null;$('results').innerHTML=blankResults;$('result-meta').textContent='Calculando resultados nuevos…';renderDiagram();renderInspector();
  const version=revision,payload=structuredClone(graph),started=performance.now(),calculationEngine=selectedEngine;
   // El backend recibe solo el modelo físico; los metadatos didácticos son locales.
   delete payload.learning;delete payload.exercise;delete payload.annotations;let calculationHttp=null,simulationRequested=false,transportFailed=false;
  lastCalculation={time:new Date().toISOString(),engine:calculationEngine,ok:null,state:'running',message:'Cálculo iniciado'};recordActivity('Cálculo iniciado');debugEvent('INFO','Preparación del cálculo',{engine:selectedEngine,stage:'preflight'});renderServerDetails();
  try{
    const newEquipment=payload.nodes.filter(n=>['Compressor','Expander','Tank'].includes(n.type));
    const hasRecirculation=diagramHasRecirculation(payload);
    if(newEquipment.length||hasRecirculation){
      debugEvent('INFO','Verificación de capacidades',{engine:selectedEngine,stage:'preflight',equipment:newEquipment.length,feature:hasRecirculation?'simple_material_recycle':'equipos'});
      const statusResponse=await fetch('/api/status',{headers:engineHeaders(),signal:AbortSignal.timeout(10000)});
      if(!statusResponse.ok)throw new Error('No se pudo comprobar las operaciones admitidas por el motor seleccionado. Revisá su conexión.');
      const status=await statusResponse.json();
      debugEvent('OK','Respuesta de capacidades',{engine:selectedEngine,http:statusResponse.status,version:status.gateway_version,available:!hasRecirculation||status.supported_features?.includes('simple_material_recycle'),feature:hasRecirculation?'simple_material_recycle':'equipos'});
      const unsupported=newEquipment.find(n=>!status.supported_equipment?.includes(n.type));
      if(unsupported)throw new Error(`El gateway del motor seleccionado todavía no admite ${TYPES[unsupported.type].label.toLowerCase()}. Actualizalo o elegí un motor actualizado; no se cambia de motor automáticamente.`);
      if(hasRecirculation&&!status.supported_features?.includes('simple_material_recycle'))throw new Error('El gateway seleccionado todavía no admite el reciclado simple. Actualizá y reiniciá el backend de ese motor; no se cambia automáticamente.');
    }
    simulationRequested=true;
    debugEvent('INFO','Solicitud iniciada',{engine:selectedEngine,stage:'POST /api/simulate',objects:payload.nodes.length,connections:payload.edges.length});
    traceConnection('POST /api/simulate',{kind:'calculation',time:new Date().toISOString(),state:'running',message:'Solicitud iniciada hacia el gateway; todavía sin respuesta HTTP.'});
    const response=await fetch('/api/simulate',{method:'POST',headers:{'Content-Type':'application/json',...engineHeaders()},body:JSON.stringify(payload)});calculationHttp=response.status;const data=await response.json();
    debugEvent(response.ok?'OK':'ERROR','Respuesta del cálculo',{engine:selectedEngine,stage:'POST /api/simulate',http:response.status,ms:Math.round(performance.now()-started),message:response.ok?'Motor devolvió resultados':'La API rechazó la simulación'});
    if(!response.ok)throw new Error(data.error||'No se pudo calcular.');
    if(version!==revision)throw new Error('El proceso cambió durante el cálculo. Volvé a calcular.');
    debugEvent('OK','Resultados verificados',{engine:selectedEngine,streams:Object.keys(data.streams||{}).length,equipment:Object.keys(data.equipment||{}).length,ms:Math.round(performance.now()-started)});
    lastCalculation={time:new Date().toISOString(),engine:calculationEngine,ok:true,state:'completed',http:calculationHttp,message:'Cálculo completado',elapsed_s:data.elapsed_s,duration_ms:Math.round(performance.now()-started)};recordActivity('Cálculo completado',`Duración de la solicitud: ${lastCalculation.duration_ms} ms`);traceConnection('POST /api/simulate',{kind:'calculation',time:lastCalculation.time,state:'online',http:calculationHttp,ms:lastCalculation.duration_ms,message:'Cálculo completado.'});result=data;resultValidity='valid';$('calculation-state').textContent='Resultados vigentes';renderDiagram();renderInspector();renderResults();notice('Cálculo completado con el motor DWSIM.');
  }catch(error){transportFailed=simulationRequested&&(calculationHttp===503||/fetch|NetworkError|Failed to fetch|timeout/i.test(error.message));debugEvent('ERROR','Cálculo fallido',{engine:selectedEngine,stage:simulationRequested?'POST enviado o conexión interrumpida':'validación local antes de POST',http:calculationHttp,message:error.message});lastCalculation={time:new Date().toISOString(),engine:calculationEngine,ok:false,state:'failed',http:calculationHttp,message:error.message,duration_ms:Math.round(performance.now()-started)};recordActivity('Cálculo fallido',error.message);traceConnection(simulationRequested?'POST /api/simulate':'Preflight /api/status',{kind:'calculation',time:lastCalculation.time,state:'offline',http:calculationHttp,ms:lastCalculation.duration_ms,message:'Cálculo fallido: '+error.message});notice(error.message+' · Ver Herramientas → Diagnóstico para revisar sugerencias.',true);$('calculation-state').textContent='Revisá los datos y las conexiones';renderDiagnostics();}
  finally{busy=false;updateResultValidity();renderServerDetails();document.body.classList.remove('calculating');updateControls();publishWorkspace(false);if(transportFailed&&engineMode==='auto')void checkEngine({silent:true,exclude:[calculationEngine]});}
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
  if(typeof SimProcessExplorer!=='undefined')SimProcessExplorer.invalidate();
  if(!data||data.version!==1||!Array.isArray(data.nodes)||data.nodes.length>30||!Array.isArray(data.edges)||data.edges.length>60||!Array.isArray(data.compounds)||!data.compounds.length||data.compounds.length>8)throw new Error('El archivo no es un proceso compatible (versión 1).');
  if(data.compounds.some(c=>typeof c!=='string'||c.length>150)||typeof data.model!=='string')throw new Error('Catálogo del archivo inválido.');
  const ids=new Set();
  for(const n of data.nodes){if(!n||!Object.hasOwn(TYPES,n.type)||typeof n.id!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(n.id)||ids.has(n.id)||typeof n.name!=='string'||!n.name.trim()||n.name.length>45||!Number.isFinite(n.x)||!Number.isFinite(n.y))throw new Error('El archivo tiene objetos inválidos.');if(n.routeAxis!==undefined&&!['x','y'].includes(n.routeAxis))throw new Error('Recorrido de corriente inválido.');if(n.orientation!==undefined&&!['auto','right','left','up','down'].includes(n.orientation))throw new Error('Dirección de corriente inválida.');if(n.scale!==undefined&&(!Number.isFinite(n.scale)||n.scale<.5||n.scale>3))throw new Error('Tamaño de símbolo inválido.');for(const [key,allowed] of Object.entries({flash_spec:['TP','PH','PS','PV','TV'],flow_basis:['mass','molar'],composition_basis:['mass','molar']}))if(n[key]!==undefined&&!allowed.includes(n[key]))throw new Error('Especificación de corriente inválida.');for(const k of ['startX','startY','endX','endY','routeX','routeY'])if(n[k]!==undefined&&(!Number.isFinite(n[k])))throw new Error('Extremo de corriente inválido.');ids.add(n.id);}
  for(const e of data.edges){if(!e||!ids.has(e.from)||!ids.has(e.to))throw new Error('El archivo tiene conexiones inválidas.');const a=data.nodes.find(n=>n.id===e.from),b=data.nodes.find(n=>n.id===e.to);if(isStream(a)===isStream(b))throw new Error('Cada conexión debe unir una corriente y un equipo.');}
  SimExerciseEditor.validate(data);SimProjectReport.valid(data.report);
  SimProjectLibrary.resetActive();if(typeof SimCloudProjects!=='undefined')SimCloudProjects.resetActive();
  resultValidity='none';lastCalculation=null;
  SimExerciseEditor.reset();
  graph=structuredClone(data);if(graph.exercise&&typeof graph.exercise==='object')delete graph.exercise.title;if(Object.hasOwn(SimproxStreams.systems,graph.unit_system))unitSystem=graph.unit_system;SimproxStreams.setSystem(unitSystem);hasProject=true;graph.title=String(data.title||'Proceso sin título').slice(0,70);selection=null;pending=null;zoom=1;viewX=0;viewY=0;$('project-title').value=graph.title;
  if(catalog)$('model-select').value=graph.model;changed();renderCompounds();renderInspector();
}
async function resetExample(){if(busy)return;if(hasProject&&!$('replace-example-dialog').open){$('replace-example-dialog').showModal();return;}$('replace-example-dialog').close();try{const type=$('example-select').value;const response=await fetch(`examples/${type}.json`);if(!response.ok)throw new Error('No se pudo cargar el ejemplo.');const data=await response.json();loadGraph(data);$('fit-button').click();if(type==='HeatExchangerWater'){selection={node:'hx'};renderDiagram();renderInspector();}notice((data.learning?data.learning+' ':'')+'Ejemplo de modelo, no mediciones experimentales. Calculá para consultar el resultado.');}catch(error){notice(error.message,true);}}

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
    if(g){for(const path of el.querySelectorAll('.stream-line,.stream-hit'))path.setAttribute('d',g.d);const arrow=el.querySelector('.dwsim-stream-arrow');if(arrow)arrow.setAttribute('transform',g.arrow??'scale(0)');const bend=el.querySelector('[data-bend]');if(bend){bend.setAttribute('x',g.bend.x-3);bend.setAttribute('y',g.bend.y-3);bend.dataset.axis=g.bend.axis;}}
    else{el.querySelector('.equipment-symbol').setAttribute('transform',`scale(${s})`);const handle=el.querySelector('[data-resize]');if(handle){handle.setAttribute('x',t.w*s+2);handle.setAttribute('y',t.h*s+2);}}
    const c=calloutGeometry(n,g),callout=el.querySelector('.diagram-callout');
    if(callout){callout.querySelector('.callout-leader').setAttribute('d',c.line);const tip=callout.querySelector('.callout-tip');tip.setAttribute('cx',c.anchor.x);tip.setAttribute('cy',c.anchor.y);callout.querySelector('.callout-text').setAttribute('transform',`translate(${c.x} ${c.y})`);}
    const labelX=g?g.label.x:equipmentLabelX(n),labelY=g?g.label.y:t.h*s+20;
    for(const [selector,offset] of [['.stream-label',0],['.equipment-label',0],['.node-kind',15]]){const label=el.querySelector(selector);if(label){label.setAttribute('x',labelX);label.setAttribute('y',labelY+offset);}}
    for(const p of portList(n)){const port=el.querySelector(`[data-port="${p.side}"][data-index="${p.index}"]`);for(const circle of port?.querySelectorAll('circle')||[]){circle.setAttribute('cx',g?p.x+n.x:p.x);circle.setAttribute('cy',g?p.y+n.y:p.y);}
      const label=port?.querySelector('.flash-port-label');
      if(label){label.setAttribute('x',p.x);label.setAttribute('y',p.y);}
    }
  }
  svg.querySelectorAll('.snap-target').forEach(el=>el.classList.remove('snap-target'));
  if(endpointDrag?.snap){const {unit,p}=endpointDrag.snap;svg.querySelector(`[data-owner="${unit.id}"][data-port="${p.side}"][data-index="${p.index}"]`)?.classList.add('snap-target');}
}
function selectAllDiagram(){
  if(busy||!hasProject||!graph.nodes.length)return;
  selection={nodes:graph.nodes.map(n=>n.id)};pending=null;renderDiagram();renderInspector();$('diagram').focus({preventScroll:true});
}
function selectNodes(ids){const unique=[...new Set(ids)];selection=unique.length>1?{nodes:unique}:unique.length?{node:unique[0]}:null;}
function nodeBounds(n){if(isStream(n)){const pts=streamGeometry(n).points;return {left:Math.min(...pts.map(p=>p.x)),right:Math.max(...pts.map(p=>p.x)),top:Math.min(...pts.map(p=>p.y)),bottom:Math.max(...pts.map(p=>p.y))};}const t=TYPES[n.type],scale=symbolScale(n);return {left:n.x,right:n.x+t.w*scale,top:n.y,bottom:n.y+t.h*scale};}
function touchesSelection(rect,n){
  return isStream(n)?SimDiagramInteractions.polylineIntersects(rect,streamGeometry(n).points,3/zoom):SimDiagramInteractions.intersects(rect,nodeBounds(n));
}
function fitDiagram(){
  const bounds=graph.nodes.map(n=>{const b=nodeBounds(n),c=calloutGeometry(n),dx=isStream(n)?0:n.x,dy=isStream(n)?0:n.y;return {left:Math.min(b.left,c.x+dx),right:Math.max(b.right,c.x+c.width+dx),top:Math.min(b.top,c.y-16+dy),bottom:Math.max(b.bottom,c.y+40+dy)};});
  viewX=Math.min(0,...bounds.map(b=>b.left-45));
  viewY=Math.min(0,...bounds.map(b=>b.top-45));
  const width=Math.max(1000,...bounds.map(b=>b.right+45-viewX));
  const height=Math.max(520,...bounds.map(b=>b.bottom+55-viewY));
  zoom=Math.min(1,1000/width,520/height);
  renderDiagram();
}
function moveNode(n,start,p,constrain=false){
  let dx=p.x-start.start.x,dy=p.y-start.start.y;
  if(constrain){if(Math.abs(dx)>=Math.abs(dy))dy=0;else dx=0;}
  const snap=v=>typeof snapCoordinate==='function'?snapCoordinate(v):v;
  n.x=snap(start.x+dx);n.y=snap(start.y+dy);
  for(const [key,value] of Object.entries(start.endpoints||{}))n[key]=value+(key.endsWith('X')?n.x-start.x:n.y-start.y);
  if(isStream(n)&&start.routeX!==undefined)n.routeX=start.routeX+n.x-start.x;if(isStream(n)&&start.routeY!==undefined)n.routeY=start.routeY+n.y-start.y;
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
  let spaceHeld=false;
  const setSpaceHeld=held=>{
    spaceHeld=held;
    svg.classList.toggle('pan-mode',held);
    if(!held&&panning?.viaSpace)endPan();
  };
  $('canvas-wrap').addEventListener('pointerdown',e=>{
    if(!svg.contains(e.target)||!e.isPrimary||panning||dragging||marquee||resizing||bending||endpointDrag)return;
    if(e.button!==1&&!(e.button===0&&(e.altKey||spaceHeld)))return;
    const matrix=svg.getScreenCTM();
    if(!matrix)return;
    e.preventDefault();
    e.stopPropagation();
    panning={pointerId:e.pointerId,viaSpace:e.button===0&&!e.altKey&&spaceHeld,x:e.clientX,y:e.clientY,vx:viewX,vy:viewY,matrix:matrix.inverse()};
    svg.setPointerCapture(e.pointerId);
    svg.classList.add('panning');
    svg.focus({preventScroll:true});
  },true);
  function endPan(){
    if(!panning)return;
    const {pointerId}=panning;
    panning=null;
    svg.classList.remove('panning');
    if(svg.hasPointerCapture(pointerId))svg.releasePointerCapture(pointerId);
  }
  svg.addEventListener('lostpointercapture',e=>{
    if(panning?.pointerId===e.pointerId)endPan();
  });
  svg.addEventListener('pointerdown',e=>{
    if(busy||e.button!==0)return;
    e.preventDefault();
    // Una selección múltiple se arrastra desde cualquier parte de sus objetos,
    // incluidos puertos y controles; Shift conserva su función de sumar/quitar.
    const groupOwner=e.target.closest('[data-node]')?.dataset.node||e.target.closest('[data-owner]')?.dataset.owner;
    if(!e.shiftKey&&selection?.nodes?.includes(groupOwner)){
      dragging={group:structuredClone(graph.nodes.filter(n=>selection.nodes.includes(n.id))),start:svgPoint(e),moved:false};
      svg.setPointerCapture(e.pointerId);svg.focus({preventScroll:true});return;
    }
    const resize=e.target.closest('[data-resize]');if(resize){const n=nodeById(resize.dataset.resize);resizing={node:n.id,start:svgPoint(e),scale:symbolScale(n)};svg.setPointerCapture(e.pointerId);return;}
    const bend=e.target.closest('[data-bend]');if(bend){bending={node:bend.dataset.bend,start:svgPoint(e),axis:null};svg.setPointerCapture(e.pointerId);return;}
    const port=e.target.closest('[data-port]');if(port){e.preventDefault();const n=nodeById(port.dataset.owner);if(isStream(n)){selection={node:n.id};endpointDrag={node:n.id,side:port.dataset.port,start:svgPoint(e),preview:svgPoint(e),original:streamGeometry(n),moved:false};svg.setPointerCapture(e.pointerId);renderDiagram();renderInspector();}else connect(port.dataset.owner,port.dataset.port,Number(port.dataset.index));return;}
    const node=e.target.closest('[data-node]');
    if(node){const id=node.dataset.node,existing=selection?.nodes||[selection?.node].filter(Boolean);
      if(e.shiftKey){selectNodes(existing.includes(id)?existing.filter(v=>v!==id):[...existing,id]);pending=null;renderDiagram();renderInspector();svg.focus({preventScroll:true});return;}
      if(selection?.nodes?.includes(id)){dragging={group:structuredClone(graph.nodes.filter(n=>selection.nodes.includes(n.id))),start:svgPoint(e),moved:false};svg.setPointerCapture(e.pointerId);svg.focus({preventScroll:true});return;}
      selection={node:id};const p=svgPoint(e),n=nodeById(selection.node);dragging={node:n.id,start:p,clientX:e.clientX,clientY:e.clientY,outside:false,x:n.x,y:n.y,routeX:n.routeX??(isStream(n)&&graph.edges.some(e=>e.to===n.id)&&graph.edges.some(e=>e.from===n.id)&&streamGeometry(n).bend.axis==='x'?streamGeometry(n).mid:undefined),routeY:n.routeY??(isStream(n)&&graph.edges.some(e=>e.to===n.id)&&graph.edges.some(e=>e.from===n.id)&&streamGeometry(n).bend.axis==='y'?streamGeometry(n).mid:undefined),endpoints:Object.fromEntries(['startX','startY','endX','endY'].filter(k=>n[k]!==undefined).map(k=>[k,n[k]])),moved:false};svg.setPointerCapture(e.pointerId);renderDiagram();renderInspector();svg.focus({preventScroll:true});return;}
    const edge=e.target.closest('[data-edge]');if(edge){selection={edge:Number(edge.dataset.edge)};renderDiagram();renderInspector();svg.focus({preventScroll:true});return;}
    const original=selection;marquee={start:svgPoint(e),end:svgPoint(e),base:e.shiftKey?(selection?.nodes||[selection?.node].filter(Boolean)):[],original};if(!e.shiftKey)selection=null;pending=null;svg.setPointerCapture(e.pointerId);renderDiagram();renderInspector();svg.focus({preventScroll:true});
  });
  svg.addEventListener('pointermove',e=>{
    if(marquee){marquee.end=svgPoint(e);const r=SimDiagramInteractions.selectionRect(marquee.start,marquee.end);selectNodes([...marquee.base,...graph.nodes.filter(n=>touchesSelection(r,n)).map(n=>n.id)]);renderDiagram();renderInspector();return;}
    if(dragging?.group){const p=svgPoint(e),delta=SimDiagramInteractions.constrainDelta(p.x-dragging.start.x,p.y-dragging.start.y,e.shiftKey),first=dragging.group[0];if(first){if(typeof snapCoordinate==='function'){delta.dx=snapCoordinate(first.x+delta.dx)-first.x;delta.dy=snapCoordinate(first.y+delta.dy)-first.y;}}SimDiagramInteractions.translateNodes(graph.nodes,dragging.group,delta.dx,delta.dy);dragging.moved=true;queueDiagramMotion();return;}

    if(resizing){const n=nodeById(resizing.node),p=svgPoint(e),t=TYPES[n.type];n.scale=Math.max(.5,Math.min(3,resizing.scale+((p.x-resizing.start.x)/t.w+(p.y-resizing.start.y)/t.h)/2));queueDiagramMotion();return;}
    if(bending){const p=svgPoint(e),dx=p.x-bending.start.x,dy=p.y-bending.start.y;if(!bending.axis&&Math.hypot(dx,dy)<3/zoom)return;bending.axis??=Math.abs(dy)>Math.abs(dx)?'y':'x';setStreamBend(nodeById(bending.node),bending.axis,bending.axis==='y'?p.y:p.x);queueDiagramMotion();return;}
    if(endpointDrag){endpointDrag.preview=svgPoint(e);if(Math.hypot(endpointDrag.preview.x-endpointDrag.start.x,endpointDrag.preview.y-endpointDrag.start.y)>3/zoom)endpointDrag.moved=true;endpointDrag.snap=endpointCandidate(endpointDrag);if(endpointDrag.snap)endpointDrag.preview=endpointDrag.snap.q;else{const delta=SimDiagramInteractions.constrainDelta(endpointDrag.preview.x-endpointDrag.start.x,endpointDrag.preview.y-endpointDrag.start.y,e.shiftKey);endpointDrag.preview={x:snapCoordinate(endpointDrag.start.x+delta.dx),y:snapCoordinate(endpointDrag.start.y+delta.dy)};}queueDiagramMotion();return;}
    if(panning){
      if(panning.pointerId!==e.pointerId)return;
      const m=panning.matrix,dx=e.clientX-panning.x,dy=e.clientY-panning.y;
      viewX=panning.vx-m.a*dx-m.c*dy;
      viewY=panning.vy-m.b*dx-m.d*dy;
      svg.setAttribute('viewBox',`${viewX} ${viewY} ${1000/zoom} ${520/zoom}`);
      return;
    }
    if(!dragging)return;const p=svgPoint(e);moveNode(nodeById(dragging.node),dragging,p,e.shiftKey);dragging.moved=true;
    dragging.outside=SimDiagramInteractions.shouldRemoveAfterDrag({startX:dragging.clientX,startY:dragging.clientY,x:e.clientX,y:e.clientY,rect:$('canvas-wrap').getBoundingClientRect()});
    $('canvas-wrap').classList.toggle('object-drop-delete',dragging.outside);
    $('diagram-trash-zone').hidden=!dragging.outside;
    queueDiagramMotion();
  });
  const endDrag=e=>{
    if(panning){if(panning.pointerId===e.pointerId)endPan();return;}
    const hadGesture=endpointDrag||dragging||resizing||bending;
    if(marquee){if(e.type==='pointercancel')selection=marquee.original;marquee=null;renderDiagram();renderInspector();return;}
    if(endpointDrag){const drag=endpointDrag;endpointDrag=null;if(e.type!=='pointercancel'){if(drag.moved)finishEndpointDrag(drag);else connect(drag.node,drag.side,0);}}
    const deleteDrag=!!dragging?.outside&&e.type==='pointerup'&&SimDiagramInteractions.shouldRemoveAfterDrag({startX:dragging.clientX,startY:dragging.clientY,x:e.clientX,y:e.clientY,rect:$('canvas-wrap').getBoundingClientRect()});
    const visualChange=dragging?.moved||resizing||bending;
    dragging=null;resizing=null;bending=null;
    $('canvas-wrap').classList.remove('object-drop-delete');$('diagram-trash-zone').hidden=true;
    if(deleteDrag){removeSelected();notice('Objeto eliminado del diagrama. También podés seleccionar y pulsar Supr.');return;}
    if(hadGesture)suppressPaletteUntil=performance.now()+500;
    if(visualChange){changed({physical:false});renderInspector();}else renderDiagram();
  };svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
  document.addEventListener('keydown',e=>{
    if(e.code!=='Space'||e.altKey||e.ctrlKey||e.metaKey)return;
    const control=e.target.closest?.('button,summary,a[href],[data-port],[data-node]');
    if(e.target.closest?.('dialog'))return;
    if(control?!control.closest('.command-bar'):SimDiagramInteractions.isEditable(e.target))return;
    // Un botón enfocado conserva la activación por teclado. Al iniciar el arrastre,
    // el lienzo toma el foco antes de que se suelte Espacio.
    if(!control)e.preventDefault();
    if(!e.repeat)setSpaceHeld(true);
  });
  window.addEventListener('keyup',e=>{if(e.code==='Space')setSpaceHeld(false);});
  window.addEventListener('blur',()=>setSpaceHeld(false));
  svg.addEventListener('keydown',e=>{
    if(busy)return;
    if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='a'){e.preventDefault();selectAllDiagram();return;}
    if(selection?.nodes&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();SimDiagramInteractions.translateNodes(graph.nodes,structuredClone(graph.nodes.filter(n=>selection.nodes.includes(n.id))),({'ArrowLeft':-10,'ArrowRight':10}[e.key]||0),({'ArrowUp':-10,'ArrowDown':10}[e.key]||0));changed({physical:false});svg.focus({preventScroll:true});return;}
    const port=e.target.closest('[data-port]');if(port&&(e.key==='Enter'||e.key===' ')){e.preventDefault();connect(port.dataset.owner,port.dataset.port,Number(port.dataset.index));return;}
    const node=e.target.closest('[data-node]');if(node&&['Enter',' '].includes(e.key)){e.preventDefault();selection={node:node.dataset.node};renderDiagram();renderInspector();}
    if(node&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const n=nodeById(node.dataset.node);moveNode(n,{start:{x:0,y:0},x:n.x,y:n.y,routeX:n.routeX,routeY:n.routeY,endpoints:Object.fromEntries(['startX','startY','endX','endY'].filter(k=>n[k]!==undefined).map(k=>[k,n[k]]))},{x:({'ArrowLeft':-10,'ArrowRight':10}[e.key]||0),y:({'ArrowUp':-10,'ArrowDown':10}[e.key]||0)});changed({physical:false});svg.querySelector(`[data-node="${n.id}"]`)?.focus();}
    const edge=e.target.closest('[data-edge]');if(edge&&e.key==='Enter'){selection={edge:Number(edge.dataset.edge)};renderDiagram();renderInspector();}
  });
  document.addEventListener('keydown',e=>{
    if(SimDiagramInteractions.isEditable(e.target)||e.target.closest?.('dialog'))return;
    if(e.key==='Escape'&&(panning||spaceHeld)){endPan();setSpaceHeld(false);return;}
    if(e.key==='Escape'){selection=null;marquee=null;pending=null;endpointDrag=null;dragging=null;resizing=null;bending=null;$('canvas-wrap').classList.remove('object-drop-delete');$('diagram-trash-zone').hidden=true;renderDiagram();renderInspector();}
    if(SimDiagramInteractions.isDeleteShortcut(e)&&hasProject&&selection&&!busy){e.preventDefault();removeSelected();}
  });
  $('inspector').addEventListener('click',e=>{const tab=e.target.closest('[data-stream-tab]');if(tab){streamTabs.set(selection.node,tab.dataset.streamTab);renderInspector();return;}if(e.target.closest('#delete-selected'))removeSelected();});
  $('inspector').addEventListener('input',e=>{
    if(busy)return;const key=e.target.dataset.field,n=nodeById(selection?.node);
    if(!key||!n||e.target.value===''||e.target.tagName==='SELECT')return;
    if(e.target.dataset.streamValue){const value=Number(e.target.value);if(Number.isFinite(value)){n[key]=SimproxStreams.toCanonical(key,value,SimproxStreams.unit(n,key));changed();}return;}
    if(key==='scale'){const value=Number(e.target.value);if(Number.isFinite(value)&&value>=50&&value<=300){n.scale=value/100;changed({physical:false});}return;}
    if(key==='name'){const value=e.target.value.trim();if(value&&!graph.nodes.some(other=>other!==n&&other.name===value)){n.name=value;changed({physical:false});if(result)renderResults();}return;}
    const value=Number(e.target.value);if(!Number.isFinite(value))return;
    if(key.startsWith('fraction:')){n.composition??={};n.composition[key.slice(9)]=value/(n.fraction_display==='percent'?100:1);}else if(key.startsWith('stoich:')){n.stoichiometry??={};n.stoichiometry[key.slice(7)]=value;}else n[key]=value;
    changed();
  });
  $('inspector').addEventListener('change',e=>{
    if(busy)return;const key=e.target.dataset.field,n=nodeById(selection?.node);if(!key||!n)return;
    if(e.target.dataset.streamValue){const value=Number(e.target.value);if(e.target.value===''||!Number.isFinite(value))delete n[key];else n[key]=SimproxStreams.toCanonical(key,value,SimproxStreams.unit(n,key));changed();renderInspector();return;}
    if(key.startsWith('unit:')){n.units??={};n.units[key.slice(5)]=e.target.value;changed({physical:false});renderInspector();return;}
    if(key==='fraction_display'){n.fraction_display=e.target.value;changed({physical:false});renderInspector();return;}
    if(key==='composition_basis'){convertCompositionBase(n,e.target.value);return;}
    if(key==='flow_basis'){convertFlowBase(n,e.target.value);return;}
    if(key==='flash_spec'){n.flash_spec=e.target.value;changed();renderInspector();return;}
    if(key==='scale'){const value=Number(e.target.value);if(Number.isFinite(value)&&value>=50&&value<=300){n.scale=value/100;changed({physical:false});}else notice('El tamaño gráfico debe estar entre 50 y 300 %.',true);renderInspector();return;}
    if(['base_compound','phase','reactor-type'].includes(key)){if(key==='reactor-type')n.type=e.target.value;else n[key]=e.target.value;changed();renderInspector();return;}
    if(key==='name'){const value=e.target.value.trim();if(!value||graph.nodes.some(other=>other!==n&&other.name===value)){notice('Usá un nombre único y no vacío.',true);renderInspector();return;}n.name=value;changed({physical:false});if(result)renderResults();}
    else{const value=Number(e.target.value);if(e.target.value===''||!Number.isFinite(value)){notice('Ingresá un valor numérico.',true);renderInspector();return;}if(key.startsWith('fraction:')){n.composition??={};n.composition[key.slice(9)]=value/(n.fraction_display==='percent'?100:1);}else if(key.startsWith('stoich:')){n.stoichiometry??={};n.stoichiometry[key.slice(7)]=value;}else n[key]=value;changed();}
    renderInspector();
  });
  $('calculate-button').onclick=calculate;$('example-button').onclick=()=>{resetExample();closeMenus();};
  $('project-title').oninput=e=>{graph.title=e.target.value;persist();if(typeof SimCloudProjects!=='undefined')SimCloudProjects.onChange();};
  $('model-select').onchange=e=>{graph.model=e.target.value;changed();renderCompounds();renderInspector();};
  $('compound-button').onclick=()=>{closeMenus();renderCompounds();$('compounds-dialog').showModal();};
  $('compound-search').oninput=renderCompounds;
  $('compounds-dialog').addEventListener('click',e=>{const add=e.target.closest('[data-add-compound]'),remove=e.target.closest('[data-remove-compound]');if(add)updateCompound(add.dataset.addCompound,false);if(remove)updateCompound(remove.dataset.removeCompound,true);});
  $('about-button').onclick=()=>$('about-dialog').showModal();
  const changeZoom=(next,anchor)=>{const before=anchor?svgPoint(anchor):{x:viewX+500/zoom,y:viewY+260/zoom};const old=zoom;zoom=Math.max(.2,Math.min(4,next));viewX=before.x-(before.x-viewX)*old/zoom;viewY=before.y-(before.y-viewY)*old/zoom;renderDiagram();};
  svg.addEventListener('wheel',e=>{e.preventDefault();if(dragging||panning||endpointDrag||resizing||bending)return;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?520:1);changeZoom(zoom*Math.exp(-Math.max(-200,Math.min(200,delta))*.003),e);},{passive:false});
  $('zoom-in').onclick=()=>changeZoom(zoom*1.2);$('zoom-out').onclick=()=>changeZoom(zoom/1.2);
  $('fit-button').onclick=fitDiagram;
  $('save-button').onclick=()=>{const blob=new Blob([JSON.stringify(graph,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='proceso-lemeit.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Proceso descargado. El archivo conserva el diagrama, los compuestos y las condiciones.');};
  $('open-button').onclick=()=>$('file-input').click();$('file-input').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw new Error('El archivo supera los 100 kB.');const data=JSON.parse(await file.text());loadGraph(data);notice('Proceso abierto. Calculá para obtener resultados actualizados.');}catch(error){notice(error.message,true);}e.target.value='';};
}
async function init(){
  SimproxTheme.init();graph=emptyProject();
  SimExerciseEditor.bind({getGraph:()=>graph,nonPhysical:()=>changed({physical:false}),getSVG:()=>$('diagram'),getPoint:svgPoint,render:renderDiagram,canEdit:()=>hasProject&&!busy});
  SimProjectLibrary.bind({getGraph:()=>graph,hasProject:()=>hasProject,loadGraph,notice,closeMenus});
  SimCloudProjects.bind({getGraph:()=>graph,hasProject:()=>hasProject,loadGraph,clearWorkspace:()=>clearLoadedProject(true),notice,closeMenus});
  SimProjectReport.bind({getGraph:()=>graph,getIdentity:()=>SimCloudProjects.identity()});
  $('project-title').value=graph.title;try{localStorage.removeItem('lemeit-visual-palette-v1');}catch{/* Preferencia obsoleta. */}SimProcessExplorer.bind({isValid:()=>hasProject&&!busy&&resultValidity==='valid'&&!!result,getData:()=>({graph,result})});renderPalette();renderDiagram();renderInspector();renderCompounds();bindEvents();bindProjectEvents();bindPanelResize();bindDiagramWindow();bindWorkspaceTools();
  $('engine-select').value=engineMode;
  if(!await checkEngine()){
    try{catalog=await(await fetch('catalog-cache.json')).json();notice('Modo de edición: los motores están desconectados o no son compatibles. Podés guardar y reintentar.');}
    catch(error){notice(error.message,true);}
  }
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
function clearLoadedProject(clearLocalDraft=false){
  if(typeof SimProcessExplorer!=='undefined')SimProcessExplorer.invalidate();
  SimExerciseEditor.reset();
  graph=emptyProject();
  SimProjectLibrary.resetActive();
  SimCloudProjects.resetActive();
  hasProject=false;resultValidity='none';lastCalculation=null;selection=pending=result=null;
  $('project-title').value=graph.title;
  $('results').innerHTML=blankResults;
  $('result-meta').textContent='Sin resultados';
  if(clearLocalDraft){try{localStorage.removeItem('lemeit-process-v1');}catch{}}
  renderDiagram();renderInspector();renderCompounds();updateControls();closeMenus();
}
function bindProjectEvents(){
  const menus=[...document.querySelectorAll('.app-menu')];
  let hoveredMenu=null,menuAnchor=null;
  function openMenu(menu,hover=false,anchor=menu.querySelector('summary')){
    hoveredMenu=hover?menu:null;
    const close=menu.open&&menuAnchor===anchor;
    closeMenus();
    if(close)return;
    menuAnchor=anchor;
    menu.open=true;
    const panel=menu.querySelector('.menu-panel'),r=anchor.getBoundingClientRect();
    panel.style.position='fixed';
    panel.style.top=(r.bottom+3)+'px';
    panel.style.left=Math.max(6,Math.min(r.left,innerWidth-panel.offsetWidth-6))+'px';
    panel.style.right='auto';
    panel.style.maxHeight=Math.max(80,innerHeight-r.bottom-12)+'px';
  }
  for(const trigger of document.querySelectorAll('[data-toolbar-menu]')){
    const menu=$(trigger.dataset.toolbarMenu);
    trigger.addEventListener('click',()=>{
      openMenu(menu,false,trigger);
      if(menu.open)menu.querySelector('button:not([disabled]):not([hidden]),select:not([disabled]),a[href]')?.focus();
    });
    new MutationObserver(()=>{
      trigger.setAttribute('aria-expanded',String(menu.open&&menuAnchor===trigger));
    }).observe(menu,{attributeFilter:['open']});
  }
  for(const [index,menu] of menus.entries()){
    const summary=menu.querySelector('summary');
    summary.addEventListener('click',e=>{e.preventDefault();if(e.detail>0&&hoveredMenu===menu&&menu.open){hoveredMenu=null;return;}openMenu(menu);});
    summary.addEventListener('pointerenter',()=>{if(menus.some(m=>m.open)&&!menu.open)openMenu(menu,true);});
    summary.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowDown'){if(!menu.open)openMenu(menu);menu.querySelector('.menu-panel button:not([disabled]):not([hidden]),.menu-panel select:not([disabled]):not([hidden]),.menu-panel a')?.focus();}else{const next=menus[(index+(e.key==='ArrowRight'?1:-1)+menus.length)%menus.length];const wasOpen=menus.some(m=>m.open);closeMenus();if(wasOpen)openMenu(next);next.querySelector('summary').focus();}}});
    menu.querySelector('.menu-panel').addEventListener('click',e=>{if(e.target.closest('a'))closeMenus();});
    menu.querySelector('.menu-panel').addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key)||['SELECT','INPUT'].includes(e.target.tagName))return;e.preventDefault();const items=[...menu.querySelectorAll('button:not([disabled]):not([hidden]),a[href]')],current=items.indexOf(document.activeElement);items[(current+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();});
  }
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.app-menu,[data-toolbar-menu]'))closeMenus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const active=menus.find(menu=>menu.open);closeMenus();if(active)menuAnchor?.focus();}});
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
  workspaceChannel.postMessage({type:'state',graph:structuredClone(graph),physical,result:physical?null:result,lastCalculation,resultValidity});
}
function toolIcon(name){
  const paths={chevron:'M7 10l5 5 5-5',
    equipment:'M7 3h10v3l2 3v6l-2 3v3H7v-3l-2-3V9l2-3z M7 6h10 M7 18h10 M2 12h3 M19 12h3',
    streams:'M3 8h17 M16 4l4 4-4 4 M3 16h17 M16 12l4 4-4 4',
    settings:'M4 6h16 M4 12h16 M4 18h16 M8 4v4 M15 10v4 M10 16v4',
    help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4 M12 17h.01',
    examples:'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z M12 6v13',
    theme:'M20 15a8 8 0 1 1-11-11 8 8 0 0 0 11 11z',
    grid:'M4 4h16v16H4z M4 9h16 M4 15h16 M9 4v16 M15 4v16',
    text:'M4 7V4h16v3 M12 4v16 M8 20h8',
    label:'M3 4h18v16H3z M3 14h18 M11 14v6 M14 17h4',
    edit:'M4 4h12v5 M4 4v16h8 M8 9h4 M8 13h2 M12 18l6-6 3 3-6 6h-3z',
    export:'M12 3v12 M8 11l4 4 4-4 M4 15v5h16v-5',
    zoomIn:'M15 15l5 5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z M7 10h6 M10 7v6',
    zoomOut:'M15 15l5 5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z M7 10h6',
    new:'M6 3h8l4 4v14H6z M14 3v5h5 M9 14h6 M12 11v6',open:'M3 7h7l2 3h9l-3 10H3z M3 7V4h7l2 3h6v3',save:'M4 3h14l3 3v15H3V3z M7 3v6h10V3 M7 21v-8h10v8',library:'M4 5h3v15H4z M10 5h3v15h-3z M16 5l3-1 4 15-3 1z',focus:'M3 5h18v14H3z M6 8h12v8H6z',panels:'M3 4h18v16H3z M8 4v16 M16 4v16',popout:'M14 3h7v7 M21 3l-11 11 M10 5H4v15h15v-6',fullscreen:'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5',fit:'M4 4h16v16H4z M7 9h4V7 M11 9l-4-4 M17 15h-4v4 M13 15l4 4',run:'M7 4l14 8-14 8z'};
  return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]}"/></svg>`;
}
function bindDiagramWindow(){
  const focus=$('diagram-focus');
  for(const [id,icon,label] of [['diagram-focus','focus','Solo diagrama'],['diagram-library','library','Biblioteca'],['diagram-popout','popout','Abrir diagrama en otra ventana'],['fit-button','fit','Encuadrar todo el proceso'],['diagram-grid','grid','Mostrar cuadrícula'],['diagram-note-insert','text','Insertar texto en el diagrama'],['report-label-tool','label','Datos del rótulo'],['exercise-open','edit','Editar ficha y actividad'],['zoom-in','zoomIn','Acercar'],['zoom-out','zoomOut','Alejar'],['diagram-fullscreen','fullscreen','Pantalla completa'],['new-project-toolbar','new','Nuevo proyecto'],['open-project-toolbar','open','Abrir proyecto'],['save-project-toolbar','save','Guardar proyecto']]){const button=$(id);button.innerHTML=toolIcon(icon);button.setAttribute('aria-label',label);button.title=label;}
  for(const control of document.querySelectorAll('[data-tool-icon]'))control.innerHTML=toolIcon(control.dataset.toolIcon);
  const exportButton=document.querySelector('.command-bar .diagram-export-tool');
  exportButton.innerHTML=toolIcon('export');
  exportButton.setAttribute('aria-label','Exportar diagrama');
  exportButton.title='Exportar diagrama';
  $('report-label-tool').onclick=()=>SimExerciseEditor.open('report');
  updateResultValidity();
  const setFocus=enabled=>{document.body.classList.toggle('diagram-focus',enabled);focus.innerHTML=toolIcon(enabled?'panels':'focus');focus.setAttribute('aria-label',enabled?'Volver a paneles':'Solo diagrama');focus.title=enabled?'Volver a paneles':'Solo diagrama';focus.setAttribute('aria-pressed',String(enabled));$('view-focus').setAttribute('aria-pressed',String(enabled));};
  const equipment=document.querySelector('.equipment-panel');
  const inspector=document.querySelector('.inspector-panel');
  const isFocus=()=>document.body.classList.contains('diagram-focus');
  const syncLibrary=()=>{
    const visible=isFocus()?document.body.classList.contains('diagram-library'):!equipment.hidden;
    for(const id of ['diagram-library','view-library'])$(id).setAttribute('aria-pressed',String(visible));
  };
  $('diagram-library').onclick=()=>{
    if(isFocus()){document.body.classList.toggle('diagram-library');if(document.body.classList.contains('diagram-library'))equipment.hidden=false;}
    else equipment.hidden=!equipment.hidden;
    syncLibrary();
  };
  new MutationObserver(syncLibrary).observe(document.body,{attributes:true,attributeFilter:['class']});
  syncLibrary();
  $('view-library').onclick=()=>$('diagram-library').click();
  $('view-inspector').onclick=()=>{
    if(isFocus())setFocus(false);
    inspector.hidden=!inspector.hidden;
    $('view-inspector').setAttribute('aria-pressed',String(!inspector.hidden));
  };
  $('view-focus').onclick=()=>focus.click();
  $('view-popout').onclick=()=>$('diagram-popout').click();
  $('view-fullscreen').onclick=()=>$('diagram-fullscreen').click();
  focus.onclick=()=>setFocus(!document.body.classList.contains('diagram-focus'));
  $('diagram-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{setFocus(true);await document.documentElement.requestFullscreen();}}catch{notice('El navegador no permitió pantalla completa. Podés usar Solo diagrama.');}};
  if(typeof BroadcastChannel==='undefined'){$('diagram-popout').disabled=true;return;}
  workspaceChannel=new BroadcastChannel('lemeit-diagram-'+workspaceId);
  workspaceChannel.onmessage=e=>{
    if(e.data?.type==='request'){publishWorkspace(false);return;}
    if(e.data?.type!=='state'||dragging||endpointDrag||resizing||bending)return;
    const previous={viewX,viewY,zoom,selection,result};applyingWorkspace=true;
    try{loadGraph(e.data.graph);viewX=previous.viewX;viewY=previous.viewY;zoom=previous.zoom;selection=previous.selection&&nodeById(previous.selection.node)?previous.selection:null;resultValidity=e.data.resultValidity==='stale'?'stale':e.data.resultValidity==='valid'&&e.data.result?'valid':'none';if(!e.data.physical){result=e.data.result??null;lastCalculation=e.data.lastCalculation??lastCalculation;if(result)renderResults();else{$('results').innerHTML=blankResults;$('result-meta').textContent='Sin resultados vigentes';}}updateResultValidity();renderDiagram();renderInspector();}catch{notice('No se pudo sincronizar el diagrama recibido.',true);}finally{applyingWorkspace=false;}
  };
  const insertAtView=type=>{
    if(type)addNode(type,{x:viewX+300/zoom,y:viewY+180/zoom});
    closeMenus();
  };
  const select=$('diagram-add');
  select.insertAdjacentHTML('beforeend',Object.entries(TYPES).map(([type,t])=>`<option value="${type}">${esc(t.label)}</option>`).join(''));
  select.onchange=()=>{insertAtView(select.value);select.value='';};
  for(const panel of document.querySelectorAll('[data-insert-group]')){
    const streams=panel.dataset.insertGroup==='streams';
    panel.innerHTML=Object.entries(TYPES).filter(([type])=>type.endsWith('Stream')===streams)
      .map(([type,t])=>`<button type="button" data-insert-type="${type}">${DwsimSymbols.thumbnail(type,t)}<span>${esc(t.label)}</span></button>`).join('');
    panel.addEventListener('click',e=>{
      const button=e.target.closest('[data-insert-type]');
      if(button&&!button.disabled){insertAtView(button.dataset.insertType);$('diagram').focus({preventScroll:true});}
    });
  }
  const separateURL=new URL(location.href);separateURL.search='';separateURL.searchParams.set('diagram','1');separateURL.searchParams.set('workspace',workspaceId);$('diagram-popout').href=separateURL.href;
  $('diagram-popout').onclick=e=>{e.preventDefault();const opened=window.open(separateURL.href,'lemeit-diagram-'+workspaceId,'popup,width=1280,height=850,resizable=yes,scrollbars=yes');if(!opened)notice('Permití la ventana emergente para separar el diagrama.');};
  if(new URLSearchParams(location.search).get('results')==='1'){document.body.classList.add('results-window');workspaceChannel.postMessage({type:'request'});}
  if(new URLSearchParams(location.search).get('diagram')==='1'){setFocus(true);document.body.classList.add('diagram-library');$('diagram-library').setAttribute('aria-pressed','true');workspaceChannel.postMessage({type:'request'});}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))setFocus(false);});
}
function recordActivity(message,detail=''){activity.unshift({time:new Date().toISOString(),message,detail});activity=activity.slice(0,30);}
function downloadLocal(filename,body,type){const blob=new Blob([body],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportStem(){return (graph.title||'sim').replace(/[^\p{L}\p{N}._-]+/gu,'-').slice(0,60);}
function exportResults(kind,locale='es-AR'){
  if(!result||busy){notice('Calculá el proyecto para exportar resultados vigentes.',true);return;}
  const sheets=SimproxFiles.tables(graph,result),stem=exportStem();
  if(kind==='xlsx')downloadLocal(stem+'.xlsx',SimproxFiles.xlsx(sheets),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  else{
    const sheet=kind==='all'?{name:'Resultados',rows:SimproxFiles.unified(sheets)}:sheets[kind==='balances'?1:0];
    downloadLocal(`${stem}-${sheet.name.toLowerCase()}-${locale==='es-AR'?'coma':'punto'}.csv`,SimproxFiles.csv(sheet.rows,locale),'text/csv;charset=utf-8');
  }
  recordActivity('Resultados exportados',kind);closeMenus();
}
function bindDataExport(){
  const dialog=$('data-export-dialog'),form=$('data-export-form'),format=form.elements.format,scope=form.elements.scope,decimal=form.elements.decimal;
  try{decimal.value=localStorage.getItem('lemeit-export-decimal')==='point'?'point':'comma';}catch{}
  function update(){
    const excel=format.value==='xlsx';
    for(const option of scope.options)option.disabled=excel&&option.value!=='all';
    if(excel)scope.value='all';
    decimal.disabled=excel;
    $('data-export-hint').textContent=excel?'Excel incluye pestañas de corrientes, balances, componentes y datos. Conserva números; el separador visible depende de Excel.':decimal.value==='comma'?'Decimal con coma; columnas separadas por punto y coma (;).':'Decimal con punto; columnas separadas por coma (,).';
    if(!excel&&scope.value==='all')$('data-export-hint').textContent+=' Tabla única con sección, registro, objeto, campo y valor.';
  }
  scope.onchange=update;format.onchange=update;decimal.onchange=()=>{try{localStorage.setItem('lemeit-export-decimal',decimal.value);}catch{}update();};
  document.querySelectorAll('[data-export]').forEach(button=>button.onclick=()=>{
    if(!result||busy){notice('Calculá el proyecto para exportar resultados vigentes.',true);return;}
    format.value=['xlsx','all'].includes(button.dataset.export)?'xlsx':'csv';scope.value='all';update();closeMenus();dialog.showModal();
  });
  form.onsubmit=event=>{event.preventDefault();exportResults(format.value==='xlsx'?'xlsx':scope.value,decimal.value==='comma'?'es-AR':'international');dialog.close();};
}
function bindDiagramExport(){
  const dialog=$('diagram-export-dialog'),form=$('diagram-export-form');
  const format=form.elements.format,scope=form.elements.scope;
  const status=$('diagram-export-status'),submit=$('diagram-export-submit');
  const previewBox=$('diagram-print-preview'),previewImg=$('diagram-preview-image'),previewCaption=$('diagram-preview-caption');
  const selectedNodes=()=>{
    const ids=new Set(selection?.nodes??(selection?.node?[selection.node]:[]));
    return graph.nodes.filter(node=>ids.has(node.id));
  };
  const nodesForExport=()=>scope.value==='selection'?selectedNodes():graph.nodes;
  function updateOptions(){
    for(const group of form.querySelectorAll('[data-format]')){
      group.hidden=!group.dataset.format.split(' ').includes(format.value);
      group.disabled=group.hidden;
    }
    previewBox.hidden=true;previewImg.removeAttribute('src');
  }
  function equipmentRows(){
    const table=[['Equipo','Tipo','Entradas','Salidas']];
    for(const node of graph.nodes.filter(n=>!['MaterialStream','EnergyStream'].includes(n.type))){
      const ins=graph.edges.filter(e=>e.to===node.id).length;
      const outs=graph.edges.filter(e=>e.from===node.id).length;
      table.push([node.name,node.type,ins,outs]);
    }
    return table;
  }
  function optionsForExport(){
    const isPdf=format.value==='pdf';
    const requested={equipment:isPdf&&form.elements.equipment.checked,balances:isPdf&&form.elements.balances.checked,streams:isPdf&&form.elements.streams.checked,components:isPdf&&form.elements.components.checked};
    const wantsResults=requested.balances||requested.streams||requested.components;
    if(wantsResults&&resultValidity!=='valid')throw new Error('Para incluir tablas de resultados, primero calculá el proyecto y verificá que los resultados estén vigentes.');
    const tables=[];
    if(requested.equipment)tables.push({name:'Equipos',rows:equipmentRows()});
    if(wantsResults){
      const sheets=SimproxFiles.tables(graph,result);
      if(requested.streams)tables.push(sheets[0]);
      if(requested.balances)tables.push(sheets[1]);
      if(requested.components)tables.push(sheets[2]);
    }
    return {format:format.value,background:form.elements.background.value,
      titleBlock:form.elements.titleBlock.checked,tables,includeActivity:isPdf&&form.elements.activity.checked,
      report:graph.report||{},exercise:graph.exercise||{},identity:SimCloudProjects.identity(),model:(resultValidity==='valid'&&result?.model)||graph.model||'',
      scale:Number(form.elements.scale.value),paper:form.elements.paper.value,
      orientation:form.elements.orientation.value,margin:Number(form.elements.margin.value),
      fit:form.elements.fit.value};
  }
  function openExport(report=false){
    scope.options[1].disabled=!selectedNodes().length;
    if(report||scope.options[1].disabled)scope.value='all';
    format.value=report?'pdf':'svg';
    if(report){
      form.elements.titleBlock.checked=true;
      form.elements.activity.checked=true;
      form.elements.equipment.checked=true;
      form.elements.balances.checked=true;
      form.elements.streams.checked=true;
    }
    $('diagram-export-title').textContent=report?'Reporte PDF · diagrama y tablas':'Exportar diagrama';
    status.textContent='';closeMenus();updateOptions();
    if(!dialog.open)dialog.showModal();
  }
  format.onchange=updateOptions;
  for(const element of form.querySelectorAll('select,input'))element.addEventListener('change',()=>{previewBox.hidden=true;previewImg.removeAttribute('src');});
  document.querySelectorAll('[data-diagram-export]').forEach(button=>button.onclick=()=>openExport());
  $('report-pdf-menu').onclick=()=>openExport(true);
  $('diagram-export-preview').onclick=()=>{
    const nodes=nodesForExport();
    if(!nodes.length){status.textContent='Seleccioná al menos un objeto para exportar.';return;}
    try{
      const options=optionsForExport();
      const svg=SimDiagramFiles.preview(diagramMarkup(nodes,true),graph.title,options);
      previewImg.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      const sections=options.tables?.filter(t=>t.rows.length>1).map(t=>t.name)||[];
      const annex=options.format==='pdf'&&svg.includes('data-activity-annex="true"');
      previewCaption.textContent=options.format==='pdf'?'Vista previa de la lámina ('+options.paper.toUpperCase()+'). '+(sections.length?'Tablas incluidas: '+sections.join(', ')+'. ':'Sin tablas adicionales. ')+(annex?'El enunciado, las consignas y las observaciones se incluirán completos en un anexo del PDF.':'La actividad seleccionada queda integrada cuando hay espacio.'):'Vista previa de la imagen ('+options.format.toUpperCase()+').';
      previewBox.hidden=false;status.textContent='';
      previewBox.scrollIntoView({block:'nearest',behavior:'smooth'});
    }catch(error){status.textContent=error.message;}
  };
  form.onsubmit=async event=>{
    event.preventDefault();if(submit.disabled)return;
    const nodes=nodesForExport();
    if(!nodes.length){status.textContent='Seleccioná al menos un objeto para exportar.';return;}
    let options;try{options=optionsForExport();}catch(error){status.textContent=error.message;return;}
    submit.disabled=true;status.textContent='Preparando archivo…';
    try{
      const stem=exportStem()+(scope.value==='selection'?'-seleccion':'');
      const blob=await SimDiagramFiles.file(diagramMarkup(nodes,true),graph.title,options);
      downloadLocal(stem+'.'+options.format,blob,blob.type);
      recordActivity('Diagrama exportado',options.format);
      dialog.close();
    }catch(error){status.textContent=error.message||'No se pudo exportar el archivo.';}
    finally{submit.disabled=false;}
  };
}
// Revisión de especificaciones antes de enviar el proceso a DWSIM.
// Es una verificación estructural, no un cálculo algebraico completo de grados de libertad.
function equipmentSpecificationIssues(node){
  const issues=[];
  const valid=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
  const requireNumber=(key,label,min,max)=>{
    if(!valid(node[key],min,max))issues.push(`especificá ${label} (entre ${min} y ${max}).`);
  };
  switch(node.type){
    case 'Heater':
    case 'Cooler':
      requireNumber('outlet_C','la temperatura objetivo de salida en °C',-273.14,3000);
      break;
    case 'Splitter':
      // Intervalo abierto, igual que la validación del servidor.
      if(!valid(node.split,0.000001,0.999999))issues.push('especificá la fracción de la salida 1 (mayor que 0 y menor que 1).');
      break;
    case 'Pump':
    case 'Compressor':
    case 'Expander':
    case 'Valve':
      requireNumber('outlet_pressure_kPa','la presión absoluta de salida en kPa',0.001,1000000);
      if(['Pump','Compressor','Expander'].includes(node.type))requireNumber('efficiency_pct','la eficiencia isentrópica en %',0.01,100);
      break;
    case 'Tank':
      requireNumber('volume_m3','el volumen útil en m³',0.000001,1000000);
      requireNumber('pressure_drop_kPa','la pérdida de presión en kPa',0,1000000);
      break;
    case 'HeatExchanger':
      requireNumber('heat_duty_kW','la potencia térmica transferida en kW',0.000001,1000000);
      break;
    case 'ConversionReactor':
    case 'EquilibriumReactor':
      requireNumber('outlet_C','la temperatura de reacción en °C',-273.14,3000);
      if(node.type==='ConversionReactor')requireNumber('conversion','la conversión en %',0,100);
      if(!['Vapor','Liquid','Mixture'].includes(node.phase))issues.push('seleccioná una fase de reacción.');
      if(typeof node.base_compound!=='string'||!node.base_compound)issues.push('seleccioná el reactivo base.');
      if(!node.stoichiometry||typeof node.stoichiometry!=='object'||Array.isArray(node.stoichiometry)||!Object.values(node.stoichiometry).some(x=>typeof x==='number'&&x<0)||!Object.values(node.stoichiometry).some(x=>typeof x==='number'&&x>0))issues.push('completá una estequiometría con reactivos negativos y productos positivos.');
      break;
  }
  return issues;
}
function reviewGraph(){
  if(!hasProject)return ['Abrí o creá un proyecto.'];
  const issues=[];
  if(!graph.nodes.length)issues.push('El diagrama está vacío.');
  if(!graph.model)issues.push('Elegí un modelo de propiedades en Simulación.');
  for(const n of graph.nodes){
    if(isFeed(n)){
      issues.push(...SimproxStreams.issues(n,graph.compounds).map(issue=>`${n.name}: ${issue}`));
      if(n.flash_spec==='PS'&&graph.model==='Steam Tables (IAPWS-IF97)')issues.push(`${n.name}: PS no está habilitado con IAPWS-IF97; usá TP o PH.`);
    }
    if(!isStream(n)){
      const feeds=graph.edges.filter(e=>e.to===n.id&&nodeById(e.from)?.type==='MaterialStream');
      const products=graph.edges.filter(e=>e.from===n.id&&nodeById(e.to)?.type==='MaterialStream');
      // Reflejar las cantidades exigidas por validate_graph() en el gateway.
      // El mezclador admite de una a tres entradas; el resto tiene aridad fija.
      const expectedFeeds=n.type==='HeatExchanger'?2:1;
      const expectedProducts=['Splitter','Separator','HeatExchanger'].includes(n.type)||isReactor(n)?2:1;
      if(n.type==='Mixer'){
        if(feeds.length<1||feeds.length>3)issues.push(`${n.name}: conectá entre una y tres alimentaciones de materia.`);
      }else if(feeds.length!==expectedFeeds){
        issues.push(`${n.name}: conectá ${expectedFeeds===2?'dos alimentaciones de materia (caliente y fría)':'una alimentación de materia'}.`);
      }
      if(products.length!==expectedProducts){
        issues.push(`${n.name}: conectá ${expectedProducts===2?'las dos salidas de materia':'una salida de materia'}.`);
      }
      issues.push(...equipmentSpecificationIssues(n).map(issue=>`${n.name}: ${issue}`));
    }
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
  const status=lastCalculation?calculationLabel(lastCalculation):'Sin cálculos';
  const http=lastCalculation?.http?(' · HTTP '+lastCalculation.http):'';
  const duration=calculationDuration(lastCalculation);
  $('diagnostics-content').innerHTML=`<p class="diagnostics-status"><strong>Proyecto:</strong> ${esc(graph.title)} · <strong>Motor:</strong> ${selectedEngine==='debian'?'Debian':'Windows'} · <strong>Último cálculo:</strong> ${esc(status+http+duration)}</p><p class="diagnostics-status"><strong>Conexión:</strong> ${esc(connectionCheck?.state||'No comprobada')} · <strong>Gateway:</strong> ${esc(gatewayCheck?.version||'Versión no confirmada')} · <strong>Resultado:</strong> ${resultValidity==='valid'?'Vigente':resultValidity==='stale'?'Recalcular':'Sin resultados'}</p><details ${issues.length?'open':''}><summary>Validación del proyecto · ${issues.length?issues.length+' observaciones':'sin problemas básicos'}</summary>${issues.length?'<ul>'+issues.map(v=>`<li>${esc(v)}</li>`).join('')+'</ul>':'<p>Los puertos y parámetros básicos no presentan observaciones. No garantiza convergencia en DWSIM.</p>'}</details>${failed?`<p class="diagnostics-status"><strong>Error:</strong> ${esc(lastCalculation.message)}</p><details><summary>Posibles causas</summary><ul>${failureHints(lastCalculation.message).map(v=>`<li>${esc(v)}</li>`).join('')}</ul></details>`:''}`;
  renderDiagnosticLog();
}
function calculationLabel(entry){return entry?.state==='running'?'En curso':entry?.ok?'Completado':'Fallido';}
function calculationDuration(entry){return Number.isFinite(entry?.duration_ms)?` · ${fmt(entry.duration_ms/1000,2)} s (solicitud completa)`:'';}
function traceConnection(operation,entry){
  debugEvent(entry?.state==='offline'?'ERROR':entry?.state==='busy'?'WARN':entry?.state==='running'?'INFO':'OK',entry?.kind==='calculation'?'Cálculo · '+operation:'Conexión · '+operation,{engine:entry?.engine||selectedEngine,http:entry?.http,ms:entry?.ms,stage:entry?.state,message:entry?.message});
  connectionTrace.push({operation,engine:selectedEngine,...entry});connectionTrace=connectionTrace.slice(-40);renderConnectionTrace();
}
function renderConnectionTrace(){
  const consoleView=$('connection-console');if(!consoleView)return;
  const atBottom=consoleView.scrollHeight-consoleView.scrollTop-consoleView.clientHeight<35;
  // Banner inicial dentro del historial: se desplaza junto con los eventos, no es una cabecera fija.
  const asciiLogo=String.raw` _____   _____   __  __
\  ___| |_   _| |  \/  |
 \ \      | |   | |\/| |
 / /__   _| |_  | |  | |
/_____| |_____| |_|  |_|`;
  const banner=`<div class="console-boot" aria-label="ΣIM · Simulación de procesos"><pre class="boot-classic boot-logo" aria-hidden="true">${esc(asciiLogo)}</pre><div class="boot-title">Simulación de procesos</div><div>Desarrollado por Ing. Luciano Lamaita</div><div>Motor de cálculo: DWSIM 10.2.15 · Daniel Wagner Oliveira de Medeiros y colaboradores</div><div>GNU GPL v3 · Créditos y licencias en «Acerca de»</div><div class="boot-ready">----------------------------------------------------</div></div>`;
  const events=connectionTrace.map(v=>{const calculation=v.kind==='calculation';const status=v.http?' · HTTP '+v.http:calculation?(v.state==='running'?' · En curso':' · Sin respuesta HTTP'):' · Sin respuesta HTTP';const duration=Number.isFinite(v.ms)?(calculation?' · Duración '+fmt(v.ms/1000,2)+' s':' · '+v.ms+' ms'):'';return `<div class="trace-${v.state}"><time>${esc(new Date(v.time).toLocaleTimeString('es-AR'))}</time> ${calculation?'CÁLCULO':'CONEXIÓN'} · ${esc(v.engine==='debian'?'Motor alternativo':'Motor principal')} · ${esc(v.operation)}${esc(status+duration)}<br><span>${esc(v.message)}</span></div>`;}).join('');
  consoleView.innerHTML=banner+events;
  if(atBottom&&connectionTrace.length>2)consoleView.scrollTop=consoleView.scrollHeight;
}
function paintConnection(){
  const age=connectionCheck?Math.max(0,Math.round((Date.now()-Date.parse(connectionCheck.time))/1000)):null;
  let state=connectionCheck?.state||(engineOnline?'online':'checking');if((state==='online'||state==='busy')&&age>75)state='stale';
  const labels={online:'DWSIM · servicio disponible',busy:'DWSIM · motor ocupado',offline:'DWSIM · sin conexión',checking:'DWSIM · comprobando',stale:'DWSIM · señal sin actualizar'};
  $('engine-state').textContent=labels[state];$('engine-state').className='engine-state '+state;
  $('engine-current').textContent=engineMode==='auto'?'Automático · '+(engineOnline?(selectedEngine==='debian'?'Debian':'Windows'):'sin motor'):'Fijado · '+(selectedEngine==='debian'?'Debian':'Windows');
  $('engine-metrics').textContent=connectionCheck?`${connectionCheck.http?'HTTP '+connectionCheck.http:'sin HTTP'} · ${connectionCheck.ms} ms · hace ${age} s`:'';
  $('connection-monitor-button').title=`Abrir monitor de conexión · ${labels[state]}`;
}
function renderServerDetails(){
  renderConnectionTrace();
  const engineName=selectedEngine==='debian'?'Motor alternativo':'Motor principal';
  const state=connectionCheck?.state||(engineOnline?'online':'checking');
  const labels={online:'Servicio accesible',busy:'Motor ocupado',offline:'Sin conexión verificada',checking:'Comprobando conexión'};
  const status=labels[state]||state;
  const meaning=state==='online'?'El servidor seleccionado respondió a la consulta del catálogo. No equivale a ejecutar una simulación.':state==='busy'?'El servidor respondió, pero está ocupado con otra tarea.':state==='offline'?'No se pudo confirmar el servicio seleccionado. La PC puede estar apagada, el túnel desconectado o el servicio detenido.':'Todavía no hay una comprobación vigente de este motor.';
  const checked=connectionCheck?new Date(connectionCheck.time).toLocaleString('es-AR'):'Todavía no realizada';
  const elapsed=connectionCheck?`${connectionCheck.http??'Sin respuesta'} · ${connectionCheck.ms} ms`:'Sin respuesta';
  const catalogInfo=connectionCheck?.compounds?`<dt>Catálogo</dt><dd>${connectionCheck.compounds} compuestos · ${connectionCheck.models} modelos</dd>`:'';
  const latest=lastCalculation?`${calculationLabel(lastCalculation)}${calculationDuration(lastCalculation)}${lastCalculation.engine?' · '+(lastCalculation.engine==='debian'?'Motor alternativo':'Motor principal'):''}`:'Sin cálculos';
  const gatewayInfo=gatewayCheck?.ok
    ?`<dt>Versión del gateway</dt><dd>${esc(gatewayCheck.version)}</dd><dt>Inicio del proceso</dt><dd>${esc(gatewayCheck.startedAt)}</dd><dt>Tiempo activo</dt><dd>${esc(gatewayCheck.uptime)}</dd><dt>Estado del gateway</dt><dd>${esc(gatewayCheck.state)}</dd><dt>Equipos reconocidos</dt><dd>${esc(gatewayCheck.equipment)}</dd>`
    :`<dt>Versión del gateway</dt><dd>No confirmada${gatewayCheck?.reason?' · '+esc(gatewayCheck.reason):''}</dd>`;
  $('server-details').innerHTML=`<section class="monitor-summary"><div><span class="monitor-kicker">Motor seleccionado</span><strong>${esc(engineName)}</strong></div><span class="monitor-status monitor-status-${esc(state)}">${esc(status)}</span></section><p class="monitor-explanation">${esc(meaning)} <strong>${engineMode==='auto'?'Selección automática antes del cálculo; no se reenvían cálculos ambiguos.':'Motor fijado por administración; sin conmutación automática.'}</strong></p><dl><dt>Última comprobación</dt><dd>${esc(checked)}</dd><dt>Respuesta HTTP y latencia</dt><dd>${esc(elapsed)}</dd><dt>Detalle</dt><dd>${connectionCheck?esc(connectionCheck.message):'Usá Comprobar conexión para actualizar.'}</dd>${catalogInfo}${gatewayInfo}<dt>Último cálculo de esta sesión</dt><dd>${esc(latest)}</dd></dl>`;
}
async function readGatewayStatus(engine,generation){
  // Endpoint independiente: una respuesta 404 de un gateway antiguo no invalida el catálogo.
  try{
    const response=await fetch('/api/status',{headers:{'X-SIM-Engine':engine},signal:AbortSignal.timeout(12000)});
    if(generation!==engineCheckGeneration)return;
    if(!response.ok)throw new Error(response.status===404?'El gateway necesita actualizarse y reiniciarse.':'HTTP '+response.status);
    const data=await readCatalogResponse(response);
    if(!/^\\d+\\.\\d+\\.\\d+$/.test(data.gateway_version)||!Array.isArray(data.supported_equipment)||!['ready','busy'].includes(data.state))throw new Error('Datos de estado incompletos.');
    const date=Date.parse(data.started_at);
    if(!Number.isFinite(date)||!Number.isFinite(data.uptime_s))throw new Error('Fecha de inicio inválida.');
    gatewayCheck={ok:true,version:data.gateway_version,startedAt:new Date(date).toLocaleString('es-AR'),uptime:fmt(data.uptime_s/3600,1)+' h',state:data.state==='busy'?'Ocupado':'Disponible',equipment:data.supported_equipment.join(', ')};
  }catch(error){if(generation!==engineCheckGeneration)return;gatewayCheck={ok:false,reason:error.message};}
}
async function checkEngine({silent=false,exclude=[]}={}){
  if(busy)return engineOnline;
  const generation=++engineCheckGeneration,order=SimEngineRouting.order(engineMode,selectedEngine).filter(id=>!exclude.includes(id));
  monitorRequest=true;$('server-refresh').disabled=true;
  let lastError='Sin motores disponibles',lastHttp=null,successful=false;
  for(const engine of order){
    if(generation!==engineCheckGeneration)break;
    const started=performance.now();
    try{
      const statusResponse=await fetch('/api/status',{headers:{'X-SIM-Engine':engine},signal:AbortSignal.timeout(7000),cache:'no-store'});
      const status=await readCatalogResponse(statusResponse);
      lastHttp=statusResponse.status;
      if(!statusResponse.ok)throw Error(status.error||'Gateway sin conexión');
      if(status.state!=='ready')throw Error('Gateway ocupado');
      const compatibility=SimEngineRouting.check(status,graph);
      if(!compatibility.compatible)throw Error(compatibility.reason||'Gateway incompatible con el proceso');
      const response=await fetch('/api/catalog',{headers:{'X-SIM-Engine':engine},signal:AbortSignal.timeout(12000),cache:'no-store'});
      lastHttp=response.status;
      const data=await readCatalogResponse(response);
      if(!response.ok)throw Error(data.error||'Catálogo no disponible');
      if(generation!==engineCheckGeneration)return false;
      const changedMotor=selectedEngine!==engine;
      selectedEngine=engine;engineOnline=true;catalog=data;successful=true;
      const date=Date.parse(status.started_at);
      gatewayCheck={ok:true,version:status.gateway_version,startedAt:Number.isFinite(date)?new Date(date).toLocaleString('es-AR'):'Sin datos',uptime:fmt(status.uptime_s/3600,1)+' h',state:'Disponible',equipment:status.supported_equipment.join(', ')};
      connectionCheck={time:new Date().toISOString(),ok:true,state:'online',http:response.status,message:(engineMode==='auto'?'Selección automática':'Motor fijado')+' · '+(engine==='debian'?'Debian':'Windows')+' · compatible con el proceso.',ms:Math.round(performance.now()-started),compounds:data.compound_count??data.compounds?.length,models:data.models?.length};
      if(changedMotor&&!silent)recordActivity('Motor elegido: '+(engine==='debian'?'Debian':'Windows'));
      const modelSelect=$('model-select'),savedModel=modelSelect.value||graph.model;
      if(data.models?.length&&(!modelSelect.options.length||modelSelect.options.length<=1)){
        modelSelect.innerHTML='<option value="">Sin modelo seleccionado</option>'+data.models.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');
        modelSelect.value=savedModel;
      }
      break;
    }catch(error){lastError=(engine==='debian'?'Debian':'Windows')+': '+error.message;debugEvent('WARN','Motor descartado en selección automática',{engine,stage:'preflight',message:error.message});}
  }
  if(generation!==engineCheckGeneration)return false;
  if(!successful){
    engineOnline=false;gatewayCheck=null;
    connectionCheck={time:new Date().toISOString(),ok:false,state:'offline',http:lastHttp,message:lastError,ms:0};
    if(!silent)recordActivity('No hay motor compatible',lastError);
  }
  monitorRequest=false;$('server-refresh').disabled=false;
  traceConnection('GET /api/status + /api/catalog',connectionCheck);paintConnection();renderServerDetails();updateControls();
  return successful;
}
function bindWorkspaceTools(){
  bindDataExport();
  bindDiagramExport();
  document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{if(busy)return;$('examples-dialog').close();$('example-select').value=b.dataset.example;resetExample();closeMenus();});
  SimExamplesBrowser.mount({openGuide:id=>{closeMenus();SimGuide.open($('guide-dialog'),$('guide-host'),id);}});
  $('examples-browser-button').onclick=()=>{closeMenus();$('examples-dialog').showModal();$('examples-search').focus();};
  SimGuidedHx.mount({
    getProject:()=>({graph,result}),
    openExample:type=>{$('example-select').value=type;resetExample();closeMenus();}
  });
  $('diagram-select-all').onclick=()=>{closeMenus();selectAllDiagram();};
  for(const button of document.querySelectorAll('[data-toolbar-action]')){
    const tool=$(button.dataset.toolbarAction);
    button.onclick=()=>tool.click();
    if(button.hasAttribute('aria-pressed')){
      const sync=()=>button.setAttribute('aria-pressed',tool.getAttribute('aria-pressed'));
      new MutationObserver(sync).observe(tool,{attributes:true,attributeFilter:['aria-pressed']});
    }
  }
  try{const prefs=JSON.parse(localStorage.getItem('sim-canvas-preferences')||'{}');gridVisible=prefs.gridVisible===true;gridSnap=prefs.gridSnap===true;}catch{}
  $('view-grid').onclick=()=>{gridVisible=!gridVisible;saveCanvasPreferences();renderDiagram();refreshCanvasButtons();closeMenus();};
  $('diagram-grid').onclick=()=>$('view-grid').click();
  $('view-snap').onclick=()=>{gridSnap=!gridSnap;saveCanvasPreferences();refreshCanvasButtons();closeMenus();};
  refreshCanvasButtons();
  $('menu-calculate').onclick=calculate;$('diagnostics-button').onclick=()=>{$('diagnostics-dialog').showModal();renderDiagnostics();closeMenus();};
  $('engine-select').onchange=event=>selectCalculationEngine(event.target.value);
  document.addEventListener('sim-session-role',event=>{const admin=event.detail?.role==='admin';document.body.dataset.sessionRole=admin?'admin':'student';$('engine-select').hidden=!admin;document.querySelector('label[for="engine-select"]').hidden=!admin;if(!admin&&engineMode!=='auto')void selectCalculationEngine('auto');});
  $('connection-monitor-button').onclick=()=>{renderServerDetails();$('server-dialog').showModal();closeMenus();};$('server-refresh').onclick=()=>checkEngine();
  const auxiliaryView=new URLSearchParams(location.search).has('diagram')||new URLSearchParams(location.search).has('results');$('monitor-auto').checked=!auxiliaryView;
  monitorTimer=setInterval(()=>{if(!busy&&$('monitor-auto').checked&&!document.hidden)checkEngine({silent:true});},30000);connectionPaintTimer=setInterval(()=>{if(!document.hidden)paintConnection();},1000);
  $('diagnostics-filter').onchange=renderDiagnosticLog;
  $('diagnostics-clear').onclick=()=>{diagnosticEvents.length=0;renderDiagnosticLog();$('diagnostics-copy-status').textContent='Eventos locales limpiados';};
  $('diagnostics-copy').onclick=async()=>{const button=$('diagnostics-copy'),status=$('diagnostics-copy-status'),content=diagnosticReport();try{if(!navigator.clipboard?.writeText)throw Error('Clipboard API no disponible');await navigator.clipboard.writeText(content);status.textContent='Copiado';button.title='Diagnóstico copiado';}catch{status.textContent='No se pudo copiar. Usá Descargar diagnóstico.';button.title='Copiar diagnóstico';}};
  $('diagnostics-download').onclick=()=>downloadLocal('sim-diagnostico.json',diagnosticReport(),'application/json;charset=utf-8');
  try{const p=JSON.parse(localStorage.getItem('simprox-ui')||'{}');if(Object.hasOwn(SimproxStreams.systems,p.units)){unitSystem=p.units;SimproxStreams.setSystem(unitSystem);}if(Number.isInteger(p.digits)&&p.digits>=0&&p.digits<=8)resultDigits=p.digits;document.body.classList.toggle('hide-canvas-hints',p.hints===false);}catch{}
  $('settings-button').onclick=()=>{$('settings-unit-system').value=unitSystem;$('settings-digits').value=resultDigits;$('settings-hints').checked=!document.body.classList.contains('hide-canvas-hints');$('settings-dialog').showModal();closeMenus();};
  const saveSettings=()=>{const chosen=$('settings-unit-system').value;if(chosen!==unitSystem&&Object.hasOwn(SimproxStreams.systems,chosen)){unitSystem=chosen;SimproxStreams.setSystem(chosen);graph.unit_system=chosen;for(const n of graph.nodes)n.units={};changed({physical:false});renderInspector();renderDiagram();}const digits=Number($('settings-digits').value);if(!Number.isInteger(digits)||digits<0||digits>8)return;resultDigits=digits;const hints=$('settings-hints').checked;document.body.classList.toggle('hide-canvas-hints',!hints);try{localStorage.setItem('simprox-ui',JSON.stringify({digits,hints,units:unitSystem}));}catch{}if(result)renderResults();};$('settings-unit-system').onchange=saveSettings;$('settings-digits').onchange=saveSettings;$('settings-hints').onchange=saveSettings;
  $('unit-calculator-button').onclick=()=>{closeMenus();SimUnitCalculator.open(graph);};
  document.querySelectorAll('a[href="ejemplos.html"]').forEach(link=>link.onclick=e=>{e.preventDefault();closeMenus();document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());SimGuide.open($('guide-dialog'),$('guide-host'));});
  $('close-project-button').onclick=()=>$('close-project-dialog').showModal();$('confirm-close-project').onclick=()=>{$('close-project-dialog').close();clearLoadedProject(false);};
  const dock=$('results-panel');
  for(const button of dock.querySelectorAll('[data-results-view]')){
    button.onclick=()=>{selectResultsView(button.dataset.resultsView);$('results').scrollTop=0;};
  }
  const showResults=visible=>{dock.hidden=!visible;$('view-results').setAttribute('aria-pressed',String(visible));};
  $('results-close').onclick=()=>{if(document.body.classList.contains('results-window'))window.close();else showResults(false);};
  $('view-results').onclick=()=>{
    if(document.body.classList.contains('diagram-focus')){$('diagram-focus').click();showResults(true);}
    else showResults(dock.hidden);
    closeMenus();
  };
  const resultURL=new URL(location.href);resultURL.search='';resultURL.searchParams.set('results','1');resultURL.searchParams.set('workspace',workspaceId);$('results-popout').href=resultURL.href;
  $('results-popout').onclick=e=>{e.preventDefault();const opened=window.open(resultURL.href,'simprox-results-'+workspaceId,'popup,width=1100,height=650,resizable=yes,scrollbars=yes');if(!opened)notice('Permití la ventana emergente para separar los resultados.');};$('view-results-popout').onclick=()=>$('results-popout').click();
  let resizingResults=null;const handle=$('results-resizer'),setHeight=h=>{const value=Math.max(90,Math.min(innerHeight*.65,Math.max(90,document.querySelector('main').clientHeight-280),h));dock.style.setProperty('--results-height',value+'px');handle.setAttribute('aria-valuenow',Math.round(value));};handle.setAttribute('aria-valuemin','90');handle.setAttribute('aria-valuemax',Math.round(innerHeight*.65));handle.setAttribute('aria-valuenow',Math.round(dock.getBoundingClientRect().height));
  handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();resizingResults={y:e.clientY,height:dock.getBoundingClientRect().height};handle.setPointerCapture(e.pointerId);};handle.onpointermove=e=>{if(resizingResults)setHeight(resizingResults.height+resizingResults.y-e.clientY);};handle.onpointerup=handle.onpointercancel=()=>resizingResults=null;handle.onkeydown=e=>{if(['ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();setHeight(e.key==='Home'?160:dock.getBoundingClientRect().height+(e.key==='ArrowUp'?20:-20));}};handle.ondblclick=()=>dock.style.removeProperty('--results-height');
  document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if((e.ctrlKey||e.metaKey)&&!e.altKey){const action={s:'save-button',o:'open-button',n:'new-project-button'}[e.key.toLowerCase()];if(action){e.preventDefault();if(!$(action).disabled)$(action).click();}}});
  updateControls();
}

// La preferencia visual pertenece al navegador; nunca al proyecto ni a su cálculo.
