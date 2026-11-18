import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../site/style.css',import.meta.url),'utf8');
const start=app.indexOf('function updateResultValidity(){');
const end=app.indexOf('function updateControls(){',start);
assert.ok(start>0&&end>start);
function setup(){
  const elements=Object.fromEntries(['result-validity','results','result-meta','calculation-state'].map(id=>[id,{dataset:{},textContent:'',innerHTML:''}]));
  const ctx=vm.createContext({
    result:null,resultValidity:'none',hasProject:true,busy:false,revision:0,
    blankResults:'<p>Sin resultados</p>',$:id=>elements[id],
    persist:()=>{},renderDiagram:()=>{},publishWorkspace:()=>{}
  });
  vm.runInContext(app.slice(start,end),ctx);
  return {ctx,elements};
}
test('el pie muestra el estado correcto, con texto y descripción accesible',()=>{
 const {ctx,elements}=setup(),indicator=elements['result-validity'];
 ctx.updateResultValidity();assert.equal(indicator.textContent,'Sin resultados');
 ctx.result={streams:{}};ctx.resultValidity='valid';ctx.updateResultValidity();
 assert.equal(indicator.textContent,'Resultados vigentes');assert.equal(indicator.dataset.state,'valid');
 ctx.busy=true;ctx.updateResultValidity();assert.equal(indicator.textContent,'Calculando…');
 ctx.busy=false;ctx.result=null;ctx.resultValidity='stale';ctx.updateResultValidity();
 assert.equal(indicator.textContent,'Recalcular');assert.equal(indicator.dataset.state,'stale');
 ctx.hasProject=false;ctx.updateResultValidity();assert.equal(indicator.textContent,'Sin resultados');
});
test('cambios visuales conservan vigencia y datos; cambios físicos la invalidan',()=>{
 const {ctx,elements}=setup();
 ctx.resultValidity='valid';ctx.result={streams:{s:{mass_flow_kg_s:1}}};
 ctx.changed({physical:false});
 assert.equal(ctx.resultValidity,'valid');
 assert.equal(ctx.revision,0);
 assert.ok(ctx.result);
 ctx.changed({physical:true});
 assert.equal(ctx.resultValidity,'stale');
 assert.equal(ctx.result,null);
 assert.equal(ctx.revision,1);
 assert.equal(elements['result-validity'].textContent,'Recalcular');
});
test('editar un proyecto sin cálculo previo sigue siendo Sin resultados',()=>{
 const {ctx,elements}=setup();
 ctx.changed({physical:true});
 assert.equal(ctx.resultValidity,'none');
 assert.equal(elements['result-validity'].textContent,'Sin resultados');
});
test('los cambios físicos, el cambio de motor y la ventana separada conservan las reglas de vigencia',()=>{
 assert.match(app,/if\(resultValidity==='valid'\)resultValidity='stale'/);
 assert.match(app,/result=data;resultValidity='valid'/);
 assert.match(app,/resultValidity='none';lastCalculation=null;/);
 assert.match(app,/resultValidity:e\.data\.resultValidity|lastCalculation,resultValidity/);
 assert.match(app,/resultValidity=e\.data\.resultValidity==='stale'/);
 assert.match(html,/id="result-validity"[^>]*role="status"/);
 assert.doesNotMatch(html,/Los cambios invalidan los resultados anteriores\./);
 assert.match(css,/#result-validity\[data-state='valid'\]/);
 assert.match(css,/#result-validity\[data-state='stale'\]/);
});
