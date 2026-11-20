/* Explorador didáctico de resultados, no un ejecutor paso a paso de DWSIM.
   No consulta /api/simulate: reproduce datos de un cálculo completo ya vigente. */
'use strict';
const SimProcessExplorer=(()=>{
  const $=id=>document.getElementById(id);
  let context=null,steps=[],position=0,visible=false,hadRecycle=false;
  const toNumber=(v,unit='',digits=5)=>Number.isFinite(v)?Number(v.toPrecision(digits)).toLocaleString('es-AR',{maximumSignificantDigits:digits})+(unit?' '+unit:''):'—';
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
    if(!active){emphasize();return;}
    const {graph,result}=context.getData(),step=steps[position],node=graph.nodes.find(n=>n.id===step.id);
    if(!node){close();return;}
    $('process-explorer-counter').textContent='Etapa '+(position+1)+' de '+steps.length;
    $('process-explorer-title').textContent=node.name;
    $('process-explorer-type').textContent=step.stream?'Corriente calculada':'Operación unitaria';
    const body=$('process-explorer-readings');body.replaceChildren();
    const details=$('process-explorer-connections');details.replaceChildren();
    if(step.stream){
      const state=result.streams?.[step.id],mixture=state?.phases?.find(p=>p.name==='Mixture')||state?.phases?.[0];
      if(state){
        body.append(row('Caudal másico',toNumber(state.mass_flow_kg_s,'kg/s')),
          row('Temperatura',toNumber(state.temperature_K-273.15,'°C')),
          row('Presión absoluta',toNumber(state.pressure_Pa/1000,'kPa')),
          row('Caudal molar',toNumber(state.molar_flow_mol_s,'mol/s')),
          row('Entalpía específica',toNumber(mixture?.enthalpy_kJ_kg,'kJ/kg')));
      }
    }else{
      const bal=result.balances?.find(b=>b.id===step.id),equipment=result.equipment?.[step.id];
      if(bal){
        body.append(row('Entrada de materia',toNumber(bal.mass_in,'kg/s')),
          row('Salida de materia',toNumber(bal.mass_out,'kg/s')),
          row('Residuo másico',toNumber(bal.mass_residual,'kg/s')),
          row(bal.energy_kind==='shaft'?'Trabajo de eje al fluido':'Potencia térmica neta',toNumber(bal.heat_to_fluid_kW,'kW')));
      }
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
