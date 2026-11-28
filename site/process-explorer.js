/* Explorador didáctico de resultados, no un ejecutor paso a paso de DWSIM.
   No consulta /api/simulate: reproduce datos de un cálculo completo ya vigente. */
'use strict';
const SimProcessExplorer=(()=>{
  const $=id=>document.getElementById(id);
  let context=null,steps=[],position=0,visible=false,hadRecycle=false,timer=null,view="summary",frame=0,controls=null,leader=null,expanded=false;
  const toNumber=(v,unit='',digits=5)=>Number.isFinite(v)?v.toLocaleString('es-AR',{
    maximumSignificantDigits:digits,
    notation:v!==0&&Math.abs(v)<1e-5?'scientific':'standard'
  }).replace(/[eE]([+-]?\d+)/g,(_,exponent)=>' × 10'+String(Number(exponent)).replace(/[-0-9]/g,ch=>({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'})[ch]))+(unit?' '+unit:''):'—';
  const isStream=n=>n.type==='MaterialStream'||n.type==='EnergyStream';
  function order(graph){
    const nodes=graph.nodes.filter(n=>!n.diagramOnly);
    const byId=new Map(nodes.map((node,i)=>[node.id,{node,i}]));
    const indegree=new Map(nodes.map(n=>[n.id,0])),adj=new Map(nodes.map(n=>[n.id,new Set()]));
    for(const e of graph.edges){
      if(!adj.has(e.from)||!adj.has(e.to)||adj.get(e.from).has(e.to))continue;
      adj.get(e.from).add(e.to);indegree.set(e.to,indegree.get(e.to)+1);
    }
    const ready=nodes.filter(n=>indegree.get(n.id)===0).map(n=>n.id),result=[];
    while(ready.length){
      const id=ready.shift();result.push(byId.get(id).node);
      for(const next of adj.get(id)){
        indegree.set(next,indegree.get(next)-1);
        if(indegree.get(next)===0){ready.push(next);ready.sort((a,b)=>byId.get(a).i-byId.get(b).i);}
      }
    }
    hadRecycle=result.length<nodes.length;
    const used=new Set(result.map(n=>n.id));
    return [...result,...nodes.filter(n=>!used.has(n.id))];
  }
  function createSteps(graph,result){
    const nodes=order(graph);
    return nodes.filter(n=>isStream(n)?!!result.streams?.[n.id]:!!result.equipment?.[n.id]||!!result.balances?.some(b=>b.id===n.id))
      .map(n=>({id:n.id,name:n.name,type:n.type,stream:isStream(n)}));
  }
  function row(label,value){
    const element=document.createElement('div');element.className='explorer-reading';
    const name=document.createElement('span');name.textContent=label;
    const output=document.createElement('strong');output.textContent=value;
    element.append(name,output);return element;
  }
  const operations={
    Mixer:['Σ(ṁh)ₑ = ṁₛhₛ','Mezcla adiabática en régimen estacionario. La entalpía de las alimentaciones se suma ponderada por sus caudales.'],
    Splitter:['ṁⱼ = fⱼ · ṁₑ','Cada salida lleva su fracción fⱼ del caudal de entrada y conserva la composición de la alimentación.'],
    Separator:['ṁₑwₖ,ₑ = Σⱼ ṁⱼwₖ,ⱼ','El equilibrio de fases determina la composición de cada salida del flash.'],
    Heater:['Q̇ = ΔḢ','El calor aportado aumenta el flujo de entalpía.'],
    Cooler:['Q̇ = ΔḢ','El calor retirado se expresa con signo negativo hacia el fluido.'],
    HeatExchanger:['ΔḢ caliente + ΔḢ fría ≈ 0','El calor se intercambia entre las dos corrientes. El cierre global supone un equipo sin intercambio térmico con el ambiente.'],
    Valve:['hₛ ≈ hₑ','El estrangulamiento es isoentálpico si se desprecian calor, trabajo y cambios de energía cinética y potencial.'],
    Tank:['τ = Vρₑ / ṁₑ','El tiempo de residencia del líquido relaciona el inventario másico con el caudal de alimentación. El balance es estacionario.'],
    Pump:['Ẇ hacia el fluido ≈ ΔḢ','La bomba aporta trabajo de eje al líquido, bajo la aproximación adiabática.'],
    Compressor:['Ẇ hacia el fluido ≈ ΔḢ','La compresión adiabática consume trabajo de eje.'],
    Expander:['Ẇ generado ≈ −ΔḢ','La expansión adiabática produce trabajo de eje al disminuir el flujo de entalpía.'],
    ConversionReactor:['ṅₖ,ₛ − ṅₖ,ₑ = Σᵣ νₖ,ᵣ ξ̇ᵣ','La estequiometría y la conversión especificada determinan el cambio de caudal molar por especie.'],
    EquilibriumReactor:['ṅₖ,ₛ − ṅₖ,ₑ = Σᵣ νₖ,ᵣ ξ̇ᵣ','La estequiometría y el equilibrio químico determinan el cambio de caudal molar por especie.']
  };
  const unavailable='Sin dato de DWSIM';
  const value=(v,unit)=>Number.isFinite(v)?toNumber(v,unit,8):unavailable;
  const mixture=stream=>stream?.phases?.find(phase=>phase.name==='Mixture');
  function enthalpyFlow(ids,streams){
    const terms=ids.map(id=>{
      const state=streams?.[id], h=mixture(state)?.enthalpy_kJ_kg;
      return Number.isFinite(h)&&Number.isFinite(state.mass_flow_kg_s)?state.mass_flow_kg_s*h:NaN;
    });
    return terms.length?terms.reduce((sum,term)=>sum+term,0):NaN;
  }
  function paragraph(parent,text){
    const p=document.createElement('p');
    p.textContent=text;
    parent.append(p);
  }
  function appendClosure(parent,label,inlet,outlet,residual,unit,floor){
    parent.append(row(label,value(residual,unit)));
    if(![inlet,outlet,residual].every(Number.isFinite))return;
    const tolerance=Math.max(floor,1e-6*Math.max(Math.abs(inlet),Math.abs(outlet)));
    const status=document.createElement('p');const ok=Math.abs(residual)<=tolerance;status.className='explorer-closure';status.dataset.ok=String(ok);status.textContent=(ok?'✓ Dentro de tolerancia':'Fuera de tolerancia')+' (±'+toNumber(tolerance,unit)+').';parent.append(status);
  }
  function explain(parent,node,graph,result,balance){
    const root=parent;const group=kind=>{const el=document.createElement('section');el.dataset.explorerSection=kind;root.append(el);return el;};
    parent=group('equations');const operation=operations[node.type];
    const general=document.createElement('div');general.className='explorer-equation';general.textContent='Σṁₑ = Σṁₛ';parent.append(general);paragraph(parent,'Conservación de masa total en régimen estacionario.');
    const enthalpy=document.createElement('div');enthalpy.className='explorer-equation';enthalpy.textContent='ΔḢ = Σ(ṁh)ₛ − Σ(ṁh)ₑ';parent.append(enthalpy);paragraph(parent,'ṁ: caudal másico (kg/s); h: entalpía específica (kJ/kg); Ḣ: flujo de entalpía (kW).');
    if(operation){const equation=document.createElement('div');equation.className='explorer-equation';equation.textContent=operation[0];parent.append(equation);paragraph(parent,operation[1]);}
    parent=group('energy');const heading=document.createElement('h3');heading.textContent='Balance de energía';parent.append(heading);
    const material=new Set(graph.nodes.filter(n=>n.type==='MaterialStream').map(n=>n.id));
    const inlets=graph.edges.filter(e=>e.to===node.id&&material.has(e.from)).map(e=>e.from);
    const outlets=graph.edges.filter(e=>e.from===node.id&&material.has(e.to)).map(e=>e.to);
    const hIn=enthalpyFlow(inlets,result.streams),hOut=enthalpyFlow(outlets,result.streams);
    const reactive=Boolean(balance?.reactive||['ConversionReactor','EquilibriumReactor'].includes(node.type));
    const shaft=['Pump','Compressor','Expander'].includes(node.type);
    const energyEquation=document.createElement('div');energyEquation.className='explorer-equation';energyEquation.textContent='ΔḢ = Σ(ṁh)ₛ − Σ(ṁh)ₑ';parent.append(energyEquation);paragraph(parent,'Se desprecia la variación de energía cinética y potencial.');
    parent.append(row('ΔḢ · salida − entrada',value(hOut,'kW')+' − '+value(hIn,'kW')+' = '+value(hOut-hIn,'kW')));
    parent.append(row(node.type==='HeatExchanger'?'Cambio neto de entalpía · no calor transferido entre lados':shaft?'Trabajo de eje hacia el fluido deducido por entalpía':reactive?'Calor del reactor informado por DWSIM':'Potencia térmica deducida por diferencia de entalpía',value(balance?.heat_to_fluid_kW,'kW')));
    if(node.type==='HeatExchanger'){
      const hx=SimproxFiles.thermalExchange(graph,result,node.id);
      if(hx){
        parent.append(row('Potencia cedida por lado caliente',value(hx.ceded_kW,'kW')));
        parent.append(row('Potencia recibida por lado frío',value(hx.received_kW,'kW')));
        parent.append(row('Potencia intercambiada aproximada',value(hx.exchanged_kW,'kW')));
        parent.append(row('Residuo energético entre los lados',value(hx.residual_kW,'kW')));
        paragraph(parent,'Potencias deducidas de los caudales y entalpías de las cuatro corrientes calculadas por DWSIM; valor intercambiado = promedio de las magnitudes cedida y recibida, no calor neto al exterior.');
      }else paragraph(parent,'No se puede determinar la potencia entre lados: faltan corrientes o entalpías válidas de DWSIM.');
    }
    if(node.type==='Expander')parent.append(row('Potencia de eje generada por DWSIM',value(result.equipment?.[node.id]?.shaft_power_generated_kW,'kW')));
    if(node.type==='Tank')parent.append(row('Tiempo de residencia de DWSIM',value(result.equipment?.[node.id]?.residence_time_s,'s')));
    if(node.type==='Valve'){
      parent.append(row('hₑ → hₛ',value(mixture(result.streams?.[inlets[0]])?.enthalpy_kJ_kg,'kJ/kg')+' → '+value(mixture(result.streams?.[outlets[0]])?.enthalpy_kJ_kg,'kJ/kg')));
    }
    if(node.type==='Splitter'){
      const feed=result.streams?.[inlets[0]]?.mass_flow_kg_s;
      for(const id of outlets){
        const discharge=result.streams?.[id]?.mass_flow_kg_s;
        const fraction=Number.isFinite(feed)&&feed>0&&Number.isFinite(discharge)?discharge/feed:NaN;
        parent.append(row(graph.nodes.find(n=>n.id===id).name+' · fⱼ = ṁⱼ / ṁₑ',value(discharge,'kg/s')+' / '+value(feed,'kg/s')+' = '+value(fraction)));
      }
    }
    if(reactive)paragraph(parent,'El calor informado incluye el efecto de la reacción; ΔḢ se muestra por separado.');
    if(['Mixer','HeatExchanger','Valve'].includes(node.type)){
      appendClosure(parent,'Residuo energético bajo el supuesto adiabático',hIn,hOut,hOut-hIn,'kW',1e-4);
    }
    parent=group('mass');const massTitle=document.createElement('h3');massTitle.textContent='Balance global de masa';parent.append(massTitle);const massEquation=document.createElement('div');massEquation.className='explorer-equation';massEquation.textContent='Σṁₑ − Σṁₛ';parent.append(massEquation);
    parent.append(row('Entrada − salida',value(balance?.mass_in,'kg/s')+' − '+value(balance?.mass_out,'kg/s')));
    appendClosure(parent,'Residuo global',balance?.mass_in,balance?.mass_out,balance?.mass_residual,'kg/s',1e-8);
    paragraph(parent,'Por componente · ṁₖ = ṁ · wₖ, donde wₖ es la fracción másica global.');
    if(reactive)paragraph(parent,'La diferencia entrada − salida indica consumo (+) o generación neta (−).');
    const compounds=graph.compounds??Object.keys(balance?.components??{});
    if(!compounds.length)paragraph(parent,unavailable);
    for(const compound of compounds){
      const values=balance?.components?.[compound];
      parent.append(row(compound+' · entrada − salida',value(values?.in_kg_s,'kg/s')+' − '+value(values?.out_kg_s,'kg/s')));
      if(reactive)parent.append(row('Consumo o generación neta',value(values?.residual_kg_s,'kg/s')));
      else appendClosure(parent,'Residuo del componente',values?.in_kg_s,values?.out_kg_s,values?.residual_kg_s,'kg/s',1e-8);
    }
    paragraph(parent,'Tolerancia didáctica de cierre: el mayor valor entre 10⁻⁶ veces el mayor flujo absoluto y un mínimo de 10⁻⁸ kg/s para materia o 10⁻⁴ kW para energía.');
  }
  function positionCard(){
    if(!visible)return;
    const canvas=$('canvas-wrap'),panel=$('process-explorer-panel'),svg=$('diagram');
    const target=[...svg.querySelectorAll('[data-node]')].find(el=>el.dataset.node===steps[position]?.id);
    if(!target||!canvas.clientWidth||!canvas.clientHeight){leader.hidden=true;return;}
    const bounds=canvas.getBoundingClientRect(),r=target.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight;
    const left=r.left-bounds.left,top=r.top-bounds.top,right=r.right-bounds.left,bottom=r.bottom-bounds.top;
    const cx=(left+right)/2,cy=(top+bottom)/2;
    const clamp=(v,a,b)=>Math.max(a,Math.min(v,Math.max(a,b)));
    const xMax=canvas.clientWidth-w-8,yMax=canvas.clientHeight-h-8;
    const candidates=[[right+20,cy-h/2],[left-w-20,cy-h/2],[cx-w/2,top-h-20],[cx-w/2,bottom+20]];
    const rects=[...svg.querySelectorAll('[data-node]')].map(el=>{const q=el.getBoundingClientRect();return {left:q.left-bounds.left,right:q.right-bounds.left,top:q.top-bounds.top,bottom:q.bottom-bounds.top,weight:el===target?12:1};});
    let best=null;
    for(const [rawX,rawY] of candidates){const x=clamp(rawX,8,xMax),y=clamp(rawY,8,yMax);
      let cost=Math.abs(x-rawX)+Math.abs(y-rawY);
      for(const q of rects)cost+=q.weight*Math.max(0,Math.min(x+w,q.right)-Math.max(x,q.left))*Math.max(0,Math.min(y+h,q.bottom)-Math.max(y,q.top))/40;
      if(!best||cost<best.cost)best={x,y,cost};}
    const {x,y}=best;panel.style.left=x+'px';panel.style.top=y+'px';
    const ax=clamp(cx,8,canvas.clientWidth-8),ay=clamp(cy,8,canvas.clientHeight-8),bx=clamp(ax,x,x+w),by=clamp(ay,y,y+h);
    leader.hidden=false;Object.assign(leader.style,{left:ax+'px',top:ay+'px',width:Math.hypot(bx-ax,by-ay)+'px',transform:'rotate('+Math.atan2(by-ay,bx-ax)+'rad)'});
  }
  function follow(){if(!visible)return;positionCard();frame=requestAnimationFrame(follow);}
  function emphasize(){
    const svg=$('diagram');if(!svg)return;
    svg.querySelectorAll('[data-node]').forEach(el=>{
      const current=visible&&steps[position]?.id===el.dataset.node;
      el.classList.toggle('explorer-current',current);
      el.classList.toggle('explorer-muted',visible&&!current);
    });
  }
  function pause(){clearInterval(timer);timer=null;const b=$('process-explorer-play');b.textContent='▶';b.setAttribute('aria-label','Reproducir');b.setAttribute('aria-pressed','false');}
  function play(){if(timer!==null){pause();return;}if(!visible)return;if(position===steps.length-1)position=0;render();if(steps.length<2)return;const b=$('process-explorer-play');b.textContent='Ⅱ';b.setAttribute('aria-label','Pausar');b.setAttribute('aria-pressed','true');timer=setInterval(()=>{next();if(position===steps.length-1)pause();},Number($('process-explorer-speed').value)||4000);}
  function setView(nextView){view=nextView;const panel=$('process-explorer-panel');panel.dataset.view=view;panel.querySelectorAll('[data-explorer-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.explorerView===view)));if(['mass','energy','equations','all'].includes(view))$('process-explorer-interpretation').open=true;}
  function render(){
    const panel=$('process-explorer-panel'),active=visible&&steps.length>0;
    panel.hidden=!active;if(controls)controls.hidden=!active;if(!active&&leader)leader.hidden=true;
    $('process-explorer-open').disabled=!context?.isValid?.();
    $('process-explorer-open').setAttribute('aria-pressed',String(active));
    const menuButton=document.querySelector('[data-toolbar-action="process-explorer-open"]');
    if(menuButton)menuButton.disabled=$('process-explorer-open').disabled;
    if(!active){emphasize();return;}
    const {graph,result,dynamicResult}=context.getData(),step=steps[position],node=graph.nodes.find(n=>n.id===step.id);
    if(!node){close();return;}
    const dynamic=step.dynamic===true;panel.dataset.dynamic=String(dynamic);
    $('process-explorer-counter').textContent=(dynamic?'Muestra ':'Etapa ')+(position+1)+' de '+steps.length;
    $('process-explorer-title').textContent=node.name;
    $('process-explorer-type').textContent=dynamic?'Integración temporal · resultado registrado':step.stream?'Corriente calculada':'Operación unitaria';
    const body=$('process-explorer-readings');body.replaceChildren();
    const details=$('process-explorer-connections');details.replaceChildren();
    const interpretation=$('process-explorer-interpretation');
    const wasExpanded=interpretation.open;
    interpretation.hidden=false;
    interpretation.open=wasExpanded;
    panel.querySelector('.explorer-scroll').scrollTop=0;
    const progress=$('process-explorer-progress');progress.max=steps.length;progress.value=position+1;
    const analysis=$('process-explorer-analysis');
    analysis.replaceChildren();
    if(dynamic){
      const p=dynamicResult.points[step.sample];
      for(const [key,label,unit] of [['time_s','Tiempo de simulación','s'],['level_m','Nivel calculado','m'],['volume_m3','Volumen derivado','m³'],['fill_pct','Llenado derivado','%'],['mass_kg','Masa estimada','kg'],['outlet_kg_s','Caudal de descarga','kg/s']])if(Number.isFinite(p[key]))body.append(row(label,value(p[key],unit)));
      details.append(row('Tiempo registrado',value(p.time_s,'s')));paragraph(details,'Reproducción de muestras existentes; no integra nuevamente el proceso.');
      const mass=document.createElement('section');mass.dataset.explorerSection='mass';analysis.append(mass);paragraph(mass,'Balance dinámico de masa: dM/dt = ṁₑ − ṁₛ. El inventario puede cambiar con el tiempo.');
      if(Number.isFinite(p.mass_kg))mass.append(row('Inventario másico estimado',value(p.mass_kg,'kg')));
      if(Number.isFinite(p.outlet_kg_s))mass.append(row('Descarga registrada',value(p.outlet_kg_s,'kg/s')));
      const equations=document.createElement('section');equations.dataset.explorerSection='equations';analysis.append(equations);const eq=document.createElement('div');eq.className='explorer-equation';eq.textContent='dM/dt = ṁₑ − ṁₛ';equations.append(eq);paragraph(equations,'Ecuación general de acumulación sin reacción. No es una verificación numérica del integrador.');
      const energy=document.createElement('section');energy.dataset.explorerSection='energy';analysis.append(energy);paragraph(energy,'No se dispone de un balance energético temporal completo en estas muestras.');
    }else if(step.stream){
      const state=result.streams?.[step.id];
      const group=kind=>{const el=document.createElement('section');el.dataset.explorerSection=kind;analysis.append(el);return el;};
      const eq=(parent,text)=>{const el=document.createElement('div');el.className='explorer-equation';el.textContent=text;parent.append(el);};
      const mass=group('mass'),energy=group('energy'),equations=group('equations');
      if(node.type==='MaterialStream'){eq(mass,'ṁₖ = ṁ · wₖ');paragraph(mass,'Caudal de cada componente = caudal total por fracción másica.');mass.append(row('Caudal total',value(state?.mass_flow_kg_s,'kg/s')));eq(energy,'Ḣ = ṁ · h');const h=mixture(state)?.enthalpy_kJ_kg;energy.append(row('Flujo de entalpía',value(state?.mass_flow_kg_s*h,'kW')));eq(equations,'ṁ = ṅ · M');eq(equations,'ṁₖ = ṁ · wₖ');eq(equations,'Ḣ = ṁ · h');paragraph(equations,'M: masa molar media; wₖ: fracción másica; h: entalpía específica. Una corriente no es una operación unitaria.');}else{paragraph(mass,'Una corriente de energía no transporta materia.');paragraph(energy,'Transferencia de energía: potencia térmica o mecánica según las conexiones.');paragraph(equations,'No corresponde un balance de materia para una corriente de energía.');}
      if(state){
        body.append(row('Caudal másico',value(state.mass_flow_kg_s,'kg/s')),
          row('Temperatura',value(Number.isFinite(state.temperature_K)?state.temperature_K-273.15:NaN,'°C')),
          row('Presión absoluta',value(Number.isFinite(state.pressure_Pa)?state.pressure_Pa/1000:NaN,'kPa')),
          row('Caudal molar',value(state.molar_flow_mol_s,'mol/s')),
          row('Entalpía específica',value(mixture(state)?.enthalpy_kJ_kg,'kJ/kg')));
      }
    }else{
      const bal=result.balances?.find(b=>b.id===step.id),equipment=result.equipment?.[step.id];
      explain(analysis,node,graph,result,bal);
      if(equipment&&typeof equipment==='object'){
        const preferred=[['residence_time_s','Tiempo de residencia','s'],['shaft_power_generated_kW','Potencia generada','kW'],['outlet_temperature_C','Temperatura de descarga','°C'],['pressure_drop_kPa','Pérdida de presión','kPa']];
        for(const [key,label,unit] of preferred)if(Number.isFinite(equipment[key]))body.append(row(label,toNumber(equipment[key],unit)));
      }
    }
    for(const [kind,edgeKey] of [['Entradas','to'],['Salidas','from']]){
      const linked=graph.edges.filter(e=>e[edgeKey]===node.id)
        .map(e=>graph.nodes.find(n=>n.id===e[edgeKey==='to'?'from':'to'])?.name).filter(Boolean);
      if(linked.length)details.append(row(kind,linked.join(' · ')));
    }
    $('process-explorer-back').disabled=position===0;
    $('process-explorer-next').disabled=position===steps.length-1;
    $('process-explorer-cycles').hidden=!hadRecycle;
    const summary=document.createElement('div');summary.className='explorer-inline-summary';
    if(dynamic){const p=dynamicResult.points[step.sample];summary.append(row('Tiempo',value(p.time_s,'s')),row('Nivel',value(p.level_m,'m')),row('Descarga',value(p.outlet_kg_s,'kg/s')));}
    else if(step.stream){const s=result.streams?.[step.id];if(node.type==='MaterialStream')summary.append(row('Caudal',value(s?.mass_flow_kg_s,'kg/s')),row('Temperatura',value(Number.isFinite(s?.temperature_K)?s.temperature_K-273.15:NaN,'°C')),row('Presión',value(Number.isFinite(s?.pressure_Pa)?s.pressure_Pa/1000:NaN,'kPa')));else paragraph(summary,'Corriente de energía');}
    else{const b=result.balances?.find(b=>b.id===step.id);summary.append(row('Entrada',value(b?.mass_in,'kg/s')),row('Salida',value(b?.mass_out,'kg/s')),row('Residuo',value(b?.mass_residual,'kg/s')));}
    const formula=document.createElement('div');formula.className='explorer-equation';formula.textContent=dynamic?'dM/dt = ṁₑ − ṁₛ':step.stream?(node.type==='MaterialStream'?'Ḣ = ṁ · h':''):(operations[node.type]?.[0]||'Σṁₑ = Σṁₛ');if(formula.textContent)summary.append(formula);
    panel.querySelector('.explorer-inline-summary')?.remove();panel.querySelector('.explorer-heading').after(summary);
    setView(view);emphasize();positionCard();
  }
  function open(){
    if(!context?.isValid?.())return;
    const data=context.getData();hadRecycle=false;const tank=data.graph.nodes.find(n=>n.type==='Tank');steps=data.dynamicResult?.points?.length&&tank?data.dynamicResult.points.map((_,sample)=>({id:tank.id,dynamic:true,sample})):data.result?createSteps(data.graph,data.result):[];
    if(!steps.length)return;
    visible=true;position=0;expanded=false;view='summary';$('process-explorer-panel').classList.remove('explorer-detail');$('process-explorer-expand').textContent='+';$('process-explorer-expand').setAttribute('aria-pressed','false');render();cancelAnimationFrame(frame);frame=requestAnimationFrame(follow);
  }
  function close(){pause();cancelAnimationFrame(frame);$('process-explorer-panel').classList.remove('explorer-expanded');visible=false;steps=[];position=0;render();}
  function invalidate(){if(visible)close();else render();}
  function next(){if(visible&&position<steps.length-1){position++;render();}}
  function back(){if(visible&&position>0){position--;render();}}
  function bind(options){
    context=options;
    const panel=$('process-explorer-panel'),canvas=$('canvas-wrap');canvas.append(panel);panel.classList.add('explorer-inline');
    leader=document.createElement('div');leader.className='explorer-leader';leader.hidden=true;canvas.append(leader);
    controls=document.createElement('div');controls.className='explorer-inline-controls';controls.hidden=true;controls.append(panel.querySelector('.explorer-actions'),$('process-explorer-progress'));document.querySelector('.diagram-toolbar').append(controls);
    $('process-explorer-open').addEventListener('click',()=>visible?close():open());
    $('process-explorer-close').addEventListener('click',close);
    $('process-explorer-back').addEventListener('click',back);
    $('process-explorer-next').addEventListener('click',next);
    $('process-explorer-play').addEventListener('click',play);
    $('process-explorer-stop').addEventListener('click',()=>{pause();position=0;render();});
    $('process-explorer-speed').addEventListener('change',()=>{if(timer!==null){pause();play();}});
    $('process-explorer-expand').addEventListener('click',()=>{expanded=!expanded;panel.classList.toggle('explorer-detail',expanded);$('process-explorer-expand').textContent=expanded?'−':'+';$('process-explorer-expand').setAttribute('aria-pressed',String(expanded));if(!expanded)setView('summary');else setView('all');positionCard();});
    document.querySelectorAll('[data-explorer-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.explorerView)));
    render();
  }
  return {bind,open,close,invalidate,emphasize,createSteps};
})();
