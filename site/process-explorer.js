/* Explorador didáctico de resultados, no un ejecutor paso a paso de DWSIM.
   No consulta /api/simulate: reproduce datos de un cálculo completo ya vigente. */
'use strict';
const SimProcessExplorer=(()=>{
  const $=id=>document.getElementById(id);
  let context=null,steps=[],position=0,visible=false,hadRecycle=false;
  const toNumber=(v,unit='',digits=5)=>Number.isFinite(v)?v.toLocaleString('es-AR',{
    maximumSignificantDigits:digits,
    notation:v!==0&&Math.abs(v)<1e-5?'scientific':'standard'
  })+(unit?' '+unit:''):'—';
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
    paragraph(parent,(Math.abs(residual)<=tolerance?'Dentro de tolerancia':'Fuera de tolerancia')+' (±'+toNumber(tolerance,unit)+').');
  }
  function explain(parent,node,graph,result,balance){
    const operation=operations[node.type];
    if(operation)for(const line of operation)paragraph(parent,line);
    const material=new Set(graph.nodes.filter(n=>n.type==='MaterialStream').map(n=>n.id));
    const inlets=graph.edges.filter(e=>e.to===node.id&&material.has(e.from)).map(e=>e.from);
    const outlets=graph.edges.filter(e=>e.from===node.id&&material.has(e.to)).map(e=>e.to);
    const hIn=enthalpyFlow(inlets,result.streams),hOut=enthalpyFlow(outlets,result.streams);
    const reactive=Boolean(balance?.reactive||['ConversionReactor','EquilibriumReactor'].includes(node.type));
    const shaft=['Pump','Compressor','Expander'].includes(node.type);
    paragraph(parent,'ΔḢ = Σ(ṁh)ₛ − Σ(ṁh)ₑ. Se desprecia la variación de energía cinética y potencial.');
    parent.append(row('ΔḢ · salida − entrada',value(hOut,'kW')+' − '+value(hIn,'kW')+' = '+value(hOut-hIn,'kW')));
    parent.append(row(shaft?'Trabajo de eje hacia el fluido deducido por entalpía':reactive?'Calor del reactor informado por DWSIM':'Potencia térmica deducida por diferencia de entalpía',value(balance?.heat_to_fluid_kW,'kW')));
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
    paragraph(parent,'Balance global estacionario · Σṁₑ − Σṁₛ');
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
  function emphasize(){
    const svg=$('diagram');if(!svg)return;
    svg.querySelectorAll('[data-node]').forEach(el=>{
      const current=visible&&steps[position]?.id===el.dataset.node;
      el.classList.toggle('explorer-current',current);
      el.classList.toggle('explorer-muted',visible&&!current);
    });
  }
  function render(){
    const panel=$('process-explorer-panel'),active=visible&&steps.length>0;
    panel.hidden=!active;
    $('process-explorer-open').disabled=!context?.isValid?.()||!steps.length;
    $('process-explorer-open').setAttribute('aria-pressed',String(active));
    const menuButton=document.querySelector('[data-toolbar-action="process-explorer-open"]');
    if(menuButton)menuButton.disabled=$('process-explorer-open').disabled;
    if(!active){emphasize();return;}
    const {graph,result}=context.getData(),step=steps[position],node=graph.nodes.find(n=>n.id===step.id);
    if(!node){close();return;}
    $('process-explorer-counter').textContent='Etapa '+(position+1)+' de '+steps.length;
    $('process-explorer-title').textContent=node.name;
    $('process-explorer-type').textContent=step.stream?'Corriente calculada':'Operación unitaria';
    const body=$('process-explorer-readings');body.replaceChildren();
    const details=$('process-explorer-connections');details.replaceChildren();
    const interpretation=$('process-explorer-interpretation');
    interpretation.hidden=step.stream;
    interpretation.open=false;
    const analysis=$('process-explorer-analysis');
    analysis.replaceChildren();
    if(step.stream){
      const state=result.streams?.[step.id];
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
    emphasize();
  }
  function open(){
    if(!context?.isValid?.())return;
    const data=context.getData();steps=createSteps(data.graph,data.result);
    if(!steps.length)return;
    visible=true;position=0;render();
  }
  function close(){visible=false;steps=[];position=0;render();}
  function invalidate(){if(visible)close();else render();}
  function next(){if(visible&&position<steps.length-1){position++;render();}}
  function back(){if(visible&&position>0){position--;render();}}
  function bind(options){
    context=options;
    $('process-explorer-open').addEventListener('click',()=>visible?close():open());
    $('process-explorer-close').addEventListener('click',close);
    $('process-explorer-back').addEventListener('click',back);
    $('process-explorer-next').addEventListener('click',next);
    render();
  }
  return {bind,open,close,invalidate,emphasize,createSteps};
})();
