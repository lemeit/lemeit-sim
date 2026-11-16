import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../site/guided-hx.js',import.meta.url),'utf8');
const context={};
runInNewContext(source,context);
const guide=context.SimGuidedHx;
const graph=JSON.parse(readFileSync(new URL('../site/examples/HeatExchangerWater.json',import.meta.url),'utf8'));
const results={streams:{
  hot_feed:{temperature_K:353.15,mass_flow_kg_s:1},
  cold_feed:{temperature_K:293.15,mass_flow_kg_s:1},
  hot_out:{temperature_K:343.606556,mass_flow_kg_s:1},
  cold_out:{temperature_K:302.715765,mass_flow_kg_s:1}
}};

test('reconoce el ejemplo 13 por tipos y conexión de los cuatro puertos',()=>{
  const state=guide.extract(graph,results);
  assert.ok(state);
  assert.ok(Math.abs(state.hot_C-70.456556)<1e-6);
  assert.ok(Math.abs(state.cold_C-29.565765)<1e-6);
  assert.equal(state.heat_kW,40);
});
test('sin cálculo no presenta temperaturas calculadas',()=>{
  const state=guide.extract(graph,null);
  assert.ok(state);
  assert.equal(state.hot_C,null);
  assert.equal(guide.evaluate(state,{hot:'70',cold:'30'}).available,false);
});
test('la comparación usa la respuesta del motor, no la referencia histórica',()=>{
  const shifted={streams:{...results.streams,hot_out:{...results.streams.hot_out,temperature_K:340.15}}};
  const actual=guide.evaluate(guide.extract(graph,shifted),{hot:'70',cold:'30'});
  assert.ok(actual.available);
  assert.ok(Math.abs(actual.hot-67)<1e-8);
  assert.ok(Math.abs(actual.hotError-3)<1e-8);
  assert.ok(Math.abs(actual.coldError-0.434235)<1e-5);
  assert.equal(actual.hotBalance,0);
  assert.equal(actual.coldBalance,0);
});
test('diagrama de forma parecida pero conectado a puertos intercambiados no es ejemplo 13',()=>{
  const changed=structuredClone(graph);
  changed.edges.find(e=>e.from==='hot_feed').toIndex=1;
  assert.equal(guide.extract(changed,results),null);
});
test('no admite un resultado de otro proyecto sin la estructura esperada',()=>{
  assert.equal(guide.extract({nodes:[],edges:[]},results),null);
});
test('interfaz carga el módulo antes de app.js y no ejecuta scripts inline',()=>{
  const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('guided-hx.js')>=0&&html.indexOf('guided-hx.js')<html.indexOf('app.js'));
  assert.ok(html.includes('id="guided-hx-dialog"'));
  assert.ok(!html.includes('id="guided-hx-menu"'));
  const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
  assert.ok(app.includes('id="guided-hx-start"'));
  assert.ok(app.includes("if(type==='HeatExchangerWater'){selection={node:'hx'}"));
  assert.ok(source.includes("closest('#guided-hx-start')"));
  assert.ok(!html.includes('onclick="this.closest(\'dialog\')'));
});
