import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../../site/ejemplos.html',import.meta.url),'utf8');
const ids=['mix','HeaterWater','CoolerWater','SplitterWater','WaterEthanol','MulticomponentBalance','ConversionReactor','EquilibriumReactor','ThermalNetwork','AmmoniaBypass','FlashDrum','PumpValve','HeatExchangerWater'];
test('trece fichas con la misma secuencia didactica',()=>{
  for(const id of ids){
    const start=html.indexOf('<section id="'+id+'">');
    assert.ok(start>0,id+' no aparece');
    const end=html.indexOf('</details></section>',start);
    const content=html.slice(start,end);
    const order=['Objetivo:', 'Datos y enunciado','Resolución paso a paso','Resultados','Actividades para practicar','Alcance y validación','Descargar para ΣIM'];
    const positions=order.map(s=>content.indexOf(s));
    assert.ok(positions.every(n=>n>=0),id+' sin secciones: '+order.filter((_,i)=>positions[i]<0).join(','));
    assert.deepEqual(positions,[...positions].sort((a,b)=>a-b),id+' tiene secciones desordenadas');
    assert.match(content,/<table>/,id+' carece de tabla de resultados');
  }
});
test('no se presenta tabla exclusiva de primeros cinco ejemplos',()=>{
  assert.doesNotMatch(html,/Casos 01–05 · Referencias numéricas previamente verificadas/);
  assert.match(html,/Informe de verificación 01–05/);
});
test('el monitor del motor sigue accesible desde el pie, sin repetirse en herramientas',()=>{
  const index=readFileSync(new URL('../../../site/index.html',import.meta.url),'utf8');
  const tools=index.slice(index.indexOf('<summary>Herramientas</summary>'),index.indexOf('</details>',index.indexOf('<summary>Herramientas</summary>')));
  assert.match(index,/<div class="header-actions"><a id="admin-nav-link"[^>]* hidden>Administración/);
  assert.match(tools,/Diagnóstico del proyecto/);
  assert.doesNotMatch(tools,/Estado del motor/);
  assert.match(index,/id="connection-monitor-button"/);
});
