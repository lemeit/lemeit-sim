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
let graph, catalog, selection=null, pending=null, dragging=null, zoom=1, result=null, busy=false, revision=0;
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
  persist();renderDiagram();
}
function nodeById(id){return graph.nodes.find(n=>n.id===id);}
function isStream(n){return n.type.endsWith('Stream');}
function isFeed(n){return n.type==='MaterialStream'&&!graph.edges.some(e=>e.to===n.id);}
function portList(n){
  const {w,h}=TYPES[n.type], list=[];
  if(isStream(n)){
    const medium=n.type==='EnergyStream'?'energy':'material';
    return [{side:'in',index:0,x:0,y:h/2,medium},{side:'out',index:0,x:w,y:h/2,medium}];
  }
  const ins=n.type==='Mixer'?3:1, outs=n.type==='Splitter'||isReactor(n)?2:1;
  for(let i=0;i<ins;i++)list.push({side:'in',index:i,x:0,y:h*(i+1)/(ins+1),medium:'material'});
  for(let i=0;i<outs;i++)list.push({side:'out',index:i,x:w,y:h*(i+1)/(outs+1),medium:'material'});
  if(n.type==='Heater')list.push({side:'energy-in',index:0,x:w/2,y:h,medium:'energy'});
  if(n.type==='Cooler')list.push({side:'energy-out',index:0,x:w/2,y:h,medium:'energy'});
  return list;
}
function point(n,side,index=0){const p=portList(n).find(p=>p.side===side&&p.index===index);return p?{x:n.x+p.x,y:n.y+p.y,medium:p.medium}:null;}
function renderPalette(){
  $('palette').innerHTML=Object.entries(TYPES).map(([type,t],i)=>`${i===0?'<p class="palette-group">CORRIENTES</p>':i===2?'<p class="palette-group">OPERACIONES</p>':''}<button class="palette-item" data-type="${type}" draggable="true" title="Agregar ${esc(t.label.toLowerCase())}"><img src="assets/dwsim/${t.icon}.png" alt=""><span>${t.label}</span><span class="add-sign">+</span></button>`).join('');
  $('palette').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(b)addNode(b.dataset.type);});
  $('palette').addEventListener('dragstart',e=>{const b=e.target.closest('[data-type]');if(b)e.dataTransfer.setData('text/plain',b.dataset.type);});
}
function renderDiagram(){
  const svg=$('diagram');svg.setAttribute('viewBox',`0 0 ${1000/zoom} ${520/zoom}`);
  let html='<defs><marker id="arrow-material" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--lm-accent)"/></marker><marker id="arrow-energy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--lm-good)"/></marker></defs>';
  graph.edges.forEach((edge,i)=>{
    const a=nodeById(edge.from),b=nodeById(edge.to);if(!a||!b)return;
    const p=point(a,edge.fromPort||'out',edge.fromIndex||0),q=point(b,edge.toPort||'in',edge.toIndex||0);if(!p||!q)return;
    const mid=(p.x+q.x)/2,d=p.medium==='energy'?`M${p.x},${p.y} V${Math.max(p.y,q.y)+38} H${q.x} V${q.y}`:`M${p.x},${p.y} H${mid} V${q.y} H${q.x}`;
    html+=`<g class="edge ${selection?.edge===i?'selected':''}" data-edge="${i}" tabindex="0" role="button" aria-label="Conexión de ${esc(a.name)} a ${esc(b.name)}"><path class="edge-hit" d="${d}"/><path class="edge-line ${p.medium==='energy'?'energy':''}" d="${d}" marker-end="url(#arrow-${p.medium})"/></g>`;
  });
  graph.nodes.forEach(n=>{
    const t=TYPES[n.type], r=result?.streams[n.id],feed=isFeed(n);
    html+=`<g transform="translate(${n.x} ${n.y})" class="node ${selection?.node===n.id?'selected':''}" data-node="${n.id}" tabindex="0" role="button" aria-label="${esc(t.label+': '+n.name)}"><rect class="body" x="0" y="0" width="${t.w}" height="${t.h}" rx="${isStream(n)?10:8}"/><image href="assets/dwsim/${t.icon}.png" x="${isStream(n)?12:40}" y="${isStream(n)?13:13}" width="${isStream(n)?25:40}" height="${isStream(n)?25:40}"/>`;
    if(isStream(n)){
      html+=`<text x="46" y="26" class="node-kind">${n.type==='EnergyStream'?'ENERGÍA':feed?'ALIMENTACIÓN':'CORRIENTE'}</text><text x="12" y="53">${esc(n.name.length>20?n.name.slice(0,19)+'…':n.name)}</text>`;
    }else html+=`<text text-anchor="middle" x="60" y="72">${esc(n.name.length>17?n.name.slice(0,16)+'…':n.name)}</text><text text-anchor="middle" class="node-kind" x="60" y="87">${esc(t.short.toUpperCase())}</text>`;
    if(r)html+=`<text class="node-reading" x="${t.w/2}" y="${t.h+19}" text-anchor="middle">${fmt(r.temperature_K-273.15,2)} °C · ${fmt(r.mass_flow_kg_s)} kg/s</text>`;
    else if(feed)html+=`<text class="node-reading" x="${t.w/2}" y="${t.h+19}" text-anchor="middle">${fmt(n.temperature_C,1)} °C · ${fmt(n.mass_flow)} kg/s</text>`;
    for(const p of portList(n)){
      const label=`${p.side.endsWith('in')?'Entrada':'Salida'} ${p.medium==='energy'?'de energía':p.index+1}${isReactor(n)&&p.side==='out'?(p.index===0?' · vapor':' · líquido'):''}`;
      html+=`<g data-port="${p.side}" data-index="${p.index}" data-owner="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}: ${label}"><circle class="port-target" cx="${p.x}" cy="${p.y}" r="13"/><circle class="port ${p.medium==='energy'?'energy':''} ${pending?.node===n.id&&pending.side===p.side&&pending.index===p.index?'pending':''}" cx="${p.x}" cy="${p.y}" r="5"/><title>${label}</title></g>`;
    }
    html+='</g>';
  });
  svg.innerHTML=html;$('object-count').textContent=`${graph.nodes.length} objetos`;
  $('zoom-label').textContent=`${Math.round(zoom*100)} %`;
  $('connection-hint').textContent=pending?'Ahora seleccioná un puerto de entrada compatible. Esc cancela.':'Seleccioná un equipo o una corriente para editar sus propiedades.';
  $('connection-hint').classList.toggle('active',!!pending);
}
function field(key,label,unit,value,options={}){
  return `<label class="field"><span class="field-label"><span>${esc(label)}</span><span>${esc(unit)}</span></span><input data-field="${key}" type="${options.text?'text':'number'}" value="${esc(value??'')}" ${options.text?'maxlength="45"':'step="any" '+(options.min!==undefined?`min="${options.min}"`:'')} required></label>`;
}
function selectField(key,label,values,value){return `<label class="field"><span class="field-label">${esc(label)}</span><select data-field="${key}">${values.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;}
function renderInspector(){
  const container=$('inspector');
  if(selection?.edge!==undefined){
    const edge=graph.edges[selection.edge];if(!edge){selection=null;return renderInspector();}
    container.innerHTML=`<p class="inspector-type">CONEXIÓN</p><h3 class="inspector-title">${esc(nodeById(edge.from).name)} → ${esc(nodeById(edge.to).name)}</h3><p class="inspector-description">Esta línea conecta objetos del proceso en DWSIM. Seleccioná «Eliminar conexión» para modificar el recorrido.</p><button class="delete-button" id="delete-selected">Eliminar conexión</button>`;return;
  }
  const n=nodeById(selection?.node);if(!n){container.innerHTML='<div class="empty-inspector"><span>⌁</span>Seleccioná un objeto del diagrama.<br>Acá vas a definir sus condiciones y consultar sus resultados.</div>';return;}
  const t=TYPES[n.type],r=result?.streams[n.id];
  let html=`<p class="inspector-type">${esc(t.label.toUpperCase())}</p><h3 class="inspector-title">${esc(n.name)}</h3>${field('name','Nombre','',n.name,{text:true})}`;
  if(isFeed(n)){
    html+='<p class="inspector-description">Condiciones de alimentación. La composición se expresa en fracciones másicas.</p>';
    html+=field('temperature_C','Temperatura','°C',n.temperature_C,{min:-273.14})+field('pressure_kPa','Presión absoluta','kPa',n.pressure_kPa,{min:0.001})+field('mass_flow','Caudal másico','kg/s',n.mass_flow,{min:0.000001});
    html+='<p class="inspector-section">COMPOSICIÓN MÁSICA</p>';
    for(const c of graph.compounds)html+=field(`fraction:${c}`,c,'kg/kg',n.composition?.[c]??0,{min:0});
    const sum=graph.compounds.reduce((s,c)=>s+(n.composition?.[c]||0),0);
    html+=`<p class="mini">Suma: ${fmt(sum,6)} / 1${Math.abs(sum-1)>1e-6?' · Ajustá la composición antes de calcular.':''}</p>`;
  }else if(n.type==='MaterialStream')html+='<p class="inspector-description">DWSIM calcula sus condiciones a partir del equipo de origen. Para convertirla en alimentación, quitá su conexión de entrada.</p>';
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
  if(n.type==='EnergyStream')html+='<p class="inspector-description">Representa la transferencia de energía de un calentador o enfriador. La potencia neta se consulta en el balance del equipo.</p>';
  if(r)html+=`<p class="inspector-section">RESULTADOS DE DWSIM</p><div class="inspector-readings"><div class="reading-row">Temperatura <b>${fmt(r.temperature_K-273.15)} °C</b></div><div class="reading-row">Presión <b>${fmt(r.pressure_Pa/1000)} kPa</b></div><div class="reading-row">Caudal <b>${fmt(r.mass_flow_kg_s)} kg/s</b></div></div>`;
  html+='<button class="delete-button" id="delete-selected">Eliminar objeto y sus conexiones</button>';container.innerHTML=html;
}
function addNode(type,pos){
  if(busy||!Object.hasOwn(TYPES,type))return;
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
function removeSelected(){
  if(busy)return;
  if(selection?.node){graph.nodes=graph.nodes.filter(n=>n.id!==selection.node);graph.edges=graph.edges.filter(e=>e.from!==selection.node&&e.to!==selection.node);}
  else if(selection?.edge!==undefined)graph.edges.splice(selection.edge,1);
  selection=null;pending=null;changed();renderInspector();
}
function svgPoint(e){const p=$('diagram').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('diagram').getScreenCTM().inverse());}
function renderResults(){
  if(!result)return;
  const rows=Object.entries(result.streams).map(([id,r])=>`<tr><td>${esc(nodeById(id)?.name||r.name)}</td><td>${fmt(r.mass_flow_kg_s,5)}</td><td>${fmt(r.temperature_K-273.15,3)}</td><td>${fmt(r.pressure_Pa/1000,3)}</td><td>${fmt(r.phases[0].enthalpy_kJ_kg,3)}</td><td>${fmt(r.phases[0].density_kg_m3,3)}</td></tr>`).join('');
  const cards=result.balances.map(b=>`<article class="balance-card"><h3>${esc(nodeById(b.id)?.name||b.name)}</h3><p>Conservación de masa</p><p class="equation">${fmt(b.mass_in,6)} → ${fmt(b.mass_out,6)} kg/s</p><p>Residuo: <strong>${fmt(b.mass_residual,9)} kg/s</strong></p><details class="component-balances"><summary>Balance por componente</summary>${Object.entries(b.components||{}).map(([c,v])=>`<p>${esc(c)}: ${fmt(v.in_kg_s,5)} → ${fmt(v.out_kg_s,5)} kg/s<br>${b.reactive?"Consumo neto (+) / generación (−)":"Residuo"}: ${fmt(v.residual_kg_s,9)} kg/s</p>`).join('' )}</details><p>Potencia térmica neta hacia el fluido</p><p class="equation">${b.reactive?"Q̇ del motor, incluye el calor de reacción":"Q̇ = Σ (ṁh)<sub>s</sub> − Σ (ṁh)<sub>e</sub>"}</p><p class="equation">${fmt(b.heat_to_fluid_kW,5)} kW</p></article>`).join('');
  $('results').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Corriente</th><th>Caudal · kg/s</th><th>Temperatura · °C</th><th>Presión · kPa</th><th>Entalpía · kJ/kg</th><th>Densidad · kg/m³</th></tr></thead><tbody>${rows}</tbody></table></div><div class="balance-grid">${cards}</div><p class="results-note">Modelo: <strong>${esc(result.model)}</strong>. Régimen estacionario; sin variaciones de energía cinética y potencial ni trabajo de eje. Q̇ positivo: calor hacia el fluido; negativo: calor retirado. La entalpía usa la referencia del modelo. El residuo de masa se calcula con los caudales del motor. En reactores, la potencia procede de DWSIM e incluye el calor de reacción; las especies pueden consumirse o generarse.</p>`;
  $('result-meta').textContent=`${result.engine} · ${fmt(result.elapsed_s,2)} s`;
  $('calculation-state').textContent='Proceso calculado · resultados vigentes';
}
async function calculate(){
  if(busy)return;notice('');busy=true;document.body.classList.add('calculating');$('calculate-button').disabled=true;$('calculate-button').textContent='Calculando…';$('calculation-state').textContent='DWSIM está resolviendo el proceso…';
  result=null;$('results').innerHTML=blankResults;$('result-meta').textContent='Calculando resultados nuevos…';renderDiagram();renderInspector();
  const version=revision,payload=structuredClone(graph);
  try{
    const response=await fetch('/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await response.json();
    if(!response.ok)throw new Error(data.error||'No se pudo calcular.');
    if(version!==revision)throw new Error('El proceso cambió durante el cálculo. Volvé a calcular.');
    result=data;renderDiagram();renderInspector();renderResults();notice('Cálculo completado con el motor DWSIM.');
  }catch(error){notice(error.message,true);$('calculation-state').textContent='Revisá los datos y las conexiones';}
  finally{busy=false;document.body.classList.remove('calculating');$('calculate-button').disabled=!catalog;$('calculate-button').innerHTML='<span aria-hidden="true">▷</span> Calcular proceso';}
}
function renderCompounds(){
  $('compound-summary').textContent=graph.compounds.map(c=>c==='Water'?'Agua':c).join(' + ');
  $('compound-summary').title=graph.compounds.join(', ');
  $('model-note').textContent=graph.model==='Steam Tables (IAPWS-IF97)'?'Agua pura · tablas IAPWS-IF97':'Revisá la adecuación del modelo a la mezcla';
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
  for(const n of data.nodes){if(!n||!Object.hasOwn(TYPES,n.type)||typeof n.id!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(n.id)||ids.has(n.id)||typeof n.name!=='string'||!n.name.trim()||n.name.length>45||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.y<0||n.x>3000||n.y>2000)throw new Error('El archivo tiene objetos inválidos.');ids.add(n.id);}
  for(const e of data.edges){if(!e||!ids.has(e.from)||!ids.has(e.to))throw new Error('El archivo tiene conexiones inválidas.');}
  graph=structuredClone(data);graph.title=String(data.title||'Proceso sin título').slice(0,70);selection=null;pending=null;zoom=1;$('project-title').value=graph.title;
  if(catalog)$('model-select').value=graph.model;changed();renderCompounds();renderInspector();
}
async function resetExample(){if(busy)return;if(!confirm('¿Cargar el ejemplo? Los cambios actuales se reemplazarán. Podés guardarlos antes.'))return;try{const type=$('example-select').value;const data=type==='mix'?example():await (await fetch(`examples/${type}.json`)).json();loadGraph(data);notice('Ejemplo cargado. Son condiciones de un modelo, no datos experimentales. Calculá para consultar el resultado.');}catch(error){notice(error.message,true);}}

function bindEvents(){
  const svg=$('diagram');
  svg.addEventListener('pointerdown',e=>{
    if(busy||e.button!==0)return;
    const port=e.target.closest('[data-port]');if(port){e.preventDefault();connect(port.dataset.owner,port.dataset.port,Number(port.dataset.index));return;}
    const node=e.target.closest('[data-node]');
    if(node){selection={node:node.dataset.node};const p=svgPoint(e),n=nodeById(selection.node);dragging={node:n.id,start:p,x:n.x,y:n.y,moved:false};svg.setPointerCapture(e.pointerId);renderDiagram();renderInspector();return;}
    const edge=e.target.closest('[data-edge]');selection=edge?{edge:Number(edge.dataset.edge)}:null;if(!edge)pending=null;renderDiagram();renderInspector();
  });
  svg.addEventListener('pointermove',e=>{if(!dragging)return;const p=svgPoint(e),n=nodeById(dragging.node);n.x=Math.max(15,Math.min(2700,dragging.x+p.x-dragging.start.x));n.y=Math.max(45,Math.min(1800,dragging.y+p.y-dragging.start.y));dragging.moved=true;renderDiagram();});
  const endDrag=()=>{if(dragging?.moved)changed({physical:false});dragging=null;};svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
  svg.addEventListener('keydown',e=>{
    if(busy)return;
    const port=e.target.closest('[data-port]');if(port&&(e.key==='Enter'||e.key===' ')){e.preventDefault();connect(port.dataset.owner,port.dataset.port,Number(port.dataset.index));return;}
    const node=e.target.closest('[data-node]');if(node&&['Enter',' '].includes(e.key)){e.preventDefault();selection={node:node.dataset.node};renderDiagram();renderInspector();}
    if(node&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const n=nodeById(node.dataset.node);n.x=Math.max(15,n.x+({'ArrowLeft':-10,'ArrowRight':10}[e.key]||0));n.y=Math.max(45,n.y+({'ArrowUp':-10,'ArrowDown':10}[e.key]||0));changed({physical:false});svg.querySelector(`[data-node="${n.id}"]`)?.focus();}
    const edge=e.target.closest('[data-edge]');if(edge&&e.key==='Enter'){selection={edge:Number(edge.dataset.edge)};renderDiagram();renderInspector();}
  });
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||e.target.closest('dialog'))return;if(e.key==='Escape'){pending=null;renderDiagram();}if(e.key==='Delete'){e.preventDefault();removeSelected();}});
  $('canvas-wrap').addEventListener('dragover',e=>e.preventDefault());$('canvas-wrap').addEventListener('drop',e=>{e.preventDefault();const p=svgPoint(e);addNode(e.dataTransfer.getData('text/plain'),{x:Math.max(15,p.x-60),y:Math.max(45,p.y-40)});});
  $('inspector').addEventListener('click',e=>{if(e.target.closest('#delete-selected'))removeSelected();});
  $('inspector').addEventListener('input',e=>{
    if(busy)return;const key=e.target.dataset.field,n=nodeById(selection?.node);
    if(!key||!n||e.target.value===''||e.target.tagName==='SELECT')return;
    if(key==='name'){const value=e.target.value.trim();if(value&&!graph.nodes.some(other=>other!==n&&other.name===value)){n.name=value;changed({physical:false});if(result)renderResults();}return;}
    const value=Number(e.target.value);if(!Number.isFinite(value))return;
    if(key.startsWith('fraction:')){n.composition??={};n.composition[key.slice(9)]=value;}else if(key.startsWith('stoich:')){n.stoichiometry??={};n.stoichiometry[key.slice(7)]=value;}else n[key]=value;
    changed();
  });
  $('inspector').addEventListener('change',e=>{
    if(busy)return;const key=e.target.dataset.field,n=nodeById(selection?.node);if(!key||!n)return;
    if(['base_compound','phase','reactor-type'].includes(key)){if(key==='reactor-type')n.type=e.target.value;else n[key]=e.target.value;changed();renderInspector();return;}
    if(key==='name'){const value=e.target.value.trim();if(!value||graph.nodes.some(other=>other!==n&&other.name===value)){notice('Usá un nombre único y no vacío.',true);renderInspector();return;}n.name=value;changed({physical:false});if(result)renderResults();}
    else{const value=Number(e.target.value);if(e.target.value===''||!Number.isFinite(value)){notice('Ingresá un valor numérico.',true);renderInspector();return;}if(key.startsWith('fraction:')){n.composition??={};n.composition[key.slice(9)]=value;}else if(key.startsWith('stoich:')){n.stoichiometry??={};n.stoichiometry[key.slice(7)]=value;}else n[key]=value;changed();}
    renderInspector();
  });
  $('calculate-button').onclick=calculate;$('example-button').onclick=resetExample;
  $('project-title').oninput=e=>{graph.title=e.target.value;persist();};
  $('model-select').onchange=e=>{graph.model=e.target.value;changed();renderCompounds();renderInspector();};
  $('compound-button').onclick=()=>{renderCompounds();$('compounds-dialog').showModal();};
  $('compound-search').oninput=renderCompounds;
  $('compounds-dialog').addEventListener('click',e=>{const add=e.target.closest('[data-add-compound]'),remove=e.target.closest('[data-remove-compound]');if(add)updateCompound(add.dataset.addCompound,false);if(remove)updateCompound(remove.dataset.removeCompound,true);});
  $('about-button').onclick=()=>$('about-dialog').showModal();
  $('zoom-in').onclick=()=>{zoom=Math.min(1.8,zoom+.15);renderDiagram();};$('zoom-out').onclick=()=>{zoom=Math.max(.45,zoom-.15);renderDiagram();};
  $('fit-button').onclick=()=>{const maxX=Math.max(1000,...graph.nodes.map(n=>n.x+TYPES[n.type].w+45)),maxY=Math.max(520,...graph.nodes.map(n=>n.y+TYPES[n.type].h+55));zoom=Math.max(.3,Math.min(1000/maxX,520/maxY));renderDiagram();};
  $('save-button').onclick=()=>{const blob=new Blob([JSON.stringify(graph,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='proceso-lemeit.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Proceso descargado. El archivo conserva el diagrama, los compuestos y las condiciones.');};
  $('open-button').onclick=()=>$('file-input').click();$('file-input').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw new Error('El archivo supera los 100 kB.');const data=JSON.parse(await file.text());loadGraph(data);notice('Proceso abierto. Calculá para obtener resultados actualizados.');}catch(error){notice(error.message,true);}e.target.value='';};
}
async function init(){
  TexTheme.init();graph=example();
  try{const saved=localStorage.getItem('lemeit-process-v1');if(saved)loadGraph(JSON.parse(saved));}catch{graph=example();notice('No se pudo recuperar la copia local. Se cargó el ejemplo.',true);}
  $('project-title').value=graph.title;renderPalette();renderDiagram();renderInspector();renderCompounds();bindEvents();
  try{const response=await fetch('/api/catalog');const data=await response.json();if(!response.ok)throw new Error(data.error);catalog=data;$('model-select').innerHTML=catalog.models.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');$('model-select').value=graph.model;$('model-select').disabled=false;$('calculate-button').disabled=false;$('engine-state').textContent=`DWSIM conectado · ${fmt(catalog.compound_count,0)} compuestos`;$('engine-state').className='engine-state online';renderCompounds();}
  catch(error){$('engine-state').textContent='Motor sin conexión';$('engine-state').className='engine-state offline';notice(error.message+' Recargá la página después de iniciar el motor.',true);}
}
init();
