/* Actividad guiada optativa del Ejemplo 13. No ejecuta ni altera cálculos DWSIM. */
'use strict';
globalThis.SimGuidedHx=(()=>{
  const reference=Object.freeze({hot_C:70.456556,cold_C:29.565765,heat_kW:40});
  const wiki='https://wiki.lemeit.ar/sim/energia-operaciones-termicas/';
  const id='HeatExchangerWater';
  function extract(graph,results){
    if(!graph||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))return null;
    const hx=graph.nodes.find(n=>n.id==='hx'&&n.type==='HeatExchanger');
    const named=['hot_feed','cold_feed','hot_out','cold_out'];
    if(!hx||!named.every(key=>graph.nodes.some(n=>n.id===key&&n.type==='MaterialStream')))return null;
    const inEdges=graph.edges.filter(e=>e.to==='hx');
    const outEdges=graph.edges.filter(e=>e.from==='hx');
    const byPort=(edges,index,field,other)=>edges.find(e=>(e[field]??0)===index)?.[other];
    if(byPort(inEdges,0,'toIndex','from')!=='hot_feed'||byPort(inEdges,1,'toIndex','from')!=='cold_feed'||byPort(outEdges,0,'fromIndex','to')!=='hot_out'||byPort(outEdges,1,'fromIndex','to')!=='cold_out')return null;
    const r=results?.streams;
    const number=id=>Number.isFinite(r?.[id]?.temperature_K)?r[id].temperature_K-273.15:null;
    return {
      heat_kW:hx.heat_duty_kW,
      feed_hot_C:graph.nodes.find(n=>n.id==='hot_feed').temperature_C,
      feed_cold_C:graph.nodes.find(n=>n.id==='cold_feed').temperature_C,
      hot_C:number('hot_out'),cold_C:number('cold_out'),
      hot_in_flow:r?.hot_feed?.mass_flow_kg_s,
      hot_out_flow:r?.hot_out?.mass_flow_kg_s,
      cold_in_flow:r?.cold_feed?.mass_flow_kg_s,
      cold_out_flow:r?.cold_out?.mass_flow_kg_s,
    };
  }
  function evaluate(state,predictions){
    if(!state||state.hot_C===null||state.cold_C===null)return {available:false};
    const parsed=(value)=>value===''||value===null||value===undefined?null:Number(value);
    const h=parsed(predictions.hot),c=parsed(predictions.cold);
    return {available:true,hot:state.hot_C,cold:state.cold_C,
      predictedHot:Number.isFinite(h)?h:null,predictedCold:Number.isFinite(c)?c:null,
      hotError:Number.isFinite(h)?Math.abs(h-state.hot_C):null,
      coldError:Number.isFinite(c)?Math.abs(c-state.cold_C):null,
      hotBalance:Number.isFinite(state.hot_in_flow)&&Number.isFinite(state.hot_out_flow)?state.hot_in_flow-state.hot_out_flow:null,
      coldBalance:Number.isFinite(state.cold_in_flow)&&Number.isFinite(state.cold_out_flow)?state.cold_in_flow-state.cold_out_flow:null};
  }
  function mount({getProject,openExample}){
    const dialog=document.getElementById('guided-hx-dialog');
    const body=document.getElementById('guided-hx-body');
    const predictions={hot:'',cold:''};
    const fmt=value=>Number.isFinite(value)?value.toLocaleString('es-AR',{maximumFractionDigits:6}):'—';
    const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    function render(){
      const {graph,result}=getProject();
      const state=extract(graph,result);
      const actual=evaluate(state,predictions);
      const recognized=!!state;
      const hotFeed=graph.nodes?.find(n=>n.id==='hot_feed'),coldFeed=graph.nodes?.find(n=>n.id==='cold_feed');
      const baseline=recognized&&graph.compounds?.length===1&&graph.compounds[0]==='Water'&&graph.model==='Steam Tables (IAPWS-IF97)'&&state.heat_kW===40&&state.feed_hot_C===80&&state.feed_cold_C===20&&hotFeed?.mass_flow===1&&coldFeed?.mass_flow===1&&hotFeed?.pressure_kPa===300&&coldFeed?.pressure_kPa===300;
      body.innerHTML=`
        <p>Actividad optativa: analizá un intercambiador de dos corrientes de agua sin mezcla. La referencia anterior de DWSIM no reemplaza un cálculo nuevo.</p>
        <h3>1 · Preparar y reconocer</h3>
        <p>Ingresá desde <strong>Ejemplos → 13 · Intercambiador</strong>. Revisá las alimentaciones: 1 kg/s a 80 °C y 1 kg/s a 20 °C, ambas a 300 kPa absolutos, y una potencia transferida especificada de 40 kW.</p>
        <button type="button" id="guided-hx-open" class="outline-button">Abrir ejemplo 13 en el editor</button>
        <p class="mini">${recognized?'Se identificó el diagrama del Ejemplo 13.':'El diagrama actual no corresponde a la estructura del Ejemplo 13.'}</p>
        <h3>2 · Formular una predicción</h3>
        <p>Antes de calcular, explicá el sentido del calor. Estimá la temperatura de salida de cada lado. El agua caliente debe enfriarse y la fría calentarse, sin intercambiar masa.</p>
        <div class="guided-hx-predictions">
          <label>Salida caliente · °C<input id="guided-hx-hot" type="number" step="any" value="${escape(predictions.hot)}" placeholder="Tu estimación"></label>
          <label>Salida fría · °C<input id="guided-hx-cold" type="number" step="any" value="${escape(predictions.cold)}" placeholder="Tu estimación"></label>
        </div>
        <h3>3 · Ejecutar DWSIM</h3>
        <p>Cerrá esta ventana, seleccioná manualmente Windows o Debian y pulsá <strong>Calcular</strong>. Revisá también las dos salidas y los balances del equipo. Volvé a abrir esta actividad para comparar.</p>
        <h3>4 · Comparar e interpretar</h3>
        ${actual.available?
          `<table class="guided-hx-table"><thead><tr><th>Variable</th><th>Predicción</th><th>DWSIM actual</th><th>Diferencia absoluta</th></tr></thead><tbody>
          <tr><th>Salida caliente</th><td>${fmt(actual.predictedHot)} °C</td><td>${fmt(actual.hot)} °C</td><td>${fmt(actual.hotError)} °C</td></tr>
          <tr><th>Salida fría</th><td>${fmt(actual.predictedCold)} °C</td><td>${fmt(actual.cold)} °C</td><td>${fmt(actual.coldError)} °C</td></tr></tbody></table>
          <p>Residuo de masa en lado caliente: <strong>${fmt(actual.hotBalance)} kg/s</strong>. Lado frío: <strong>${fmt(actual.coldBalance)} kg/s</strong>.</p>
          <p class="mini">Estas temperaturas provienen del último cálculo vigente del motor seleccionado, no de una respuesta precargada.</p>`:
          '<p class="mini" role="status">Todavía no hay resultados actuales para este diagrama. No se comparan predicciones contra cifras históricas como si fueran un cálculo nuevo.</p>'}
        ${baseline?`<details><summary>Ver valores de referencia previamente documentados</summary><p>Para el caso base del Ejemplo 13: salida caliente ${fmt(reference.hot_C)} °C; salida fría ${fmt(reference.cold_C)} °C; intercambio térmico ${fmt(reference.heat_kW)} kW. Referencia histórica contrastada entre motores Windows y Debian, no medición experimental.</p></details>`:''}
        <p>Interpretá: ¿se conserva el caudal en cada lado?, ¿por qué no deben mezclarse las composiciones?, ¿qué condiciones impiden garantizar la exactitud física solo por convergencia?</p>
        <p><a href="${wiki}" target="_blank" rel="noopener noreferrer">Leer capítulo de energía e intercambiadores en la wiki ↗</a></p>`;
      document.getElementById('guided-hx-open').onclick=()=>{dialog.close();openExample(id);};
      for(const [element,key] of [['guided-hx-hot','hot'],['guided-hx-cold','cold']]){
        document.getElementById(element).oninput=e=>{predictions[key]=e.target.value;};
        document.getElementById(element).onchange=render;
      }
    }
    document.getElementById('inspector').addEventListener('click',event=>{if(event.target.closest('#guided-hx-start')){render();dialog.showModal();}});
    document.getElementById('guided-hx-refresh').onclick=render;
    document.getElementById('guided-hx-close').onclick=()=>dialog.close();
    document.getElementById('guided-hx-back').onclick=()=>dialog.close();
    return {render};
  }
  return Object.freeze({id,reference,extract,evaluate,mount});
})();
