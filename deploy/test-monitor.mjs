import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const source=readFileSync(new URL('../site/app.js',import.meta.url),'utf8').replace(/^init\(\);$/m,'');
function monitor(response){const elements=new Map(),context=vm.createContext({structuredClone,performance,AbortSignal,URLSearchParams,location:{search:''},crypto:webcrypto,fetch:async()=>response,document:{body:{classList:{add(){},remove(){}}},getElementById:id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',scrollHeight:0,scrollTop:0,clientHeight:0});return elements.get(id);}}});vm.runInContext(source,context);vm.runInContext('updateControls=()=>{};recordActivity=()=>{};',context);return {context,elements};}
test('HTTP 409 se presenta como ocupado y accesible, no como desconectado',async()=>{const {context}=monitor({status:409,ok:false,json:async()=>({error:'Motor ocupado'})});await vm.runInContext('checkEngine({silent:true})',context);const state=JSON.parse(vm.runInContext('JSON.stringify({engineOnline,connectionCheck})',context));assert.equal(state.engineOnline,true);assert.equal(state.connectionCheck.state,'busy');assert.equal(state.connectionCheck.http,409);});
test('HTTP 503 conserva el fallo y registra la comprobación',async()=>{const {context}=monitor({status:503,ok:false,json:async()=>({error:'Servicio no disponible'})});await vm.runInContext('checkEngine({silent:true})',context);const state=JSON.parse(vm.runInContext('JSON.stringify({engineOnline,connectionCheck,connectionTrace})',context));assert.equal(state.engineOnline,false);assert.equal(state.connectionCheck.state,'offline');assert.equal(state.connectionTrace.length,1);});
test('el monitor muestra latencia y catálogo cuando la API responde',async()=>{const {context,elements}=monitor({status:200,ok:true,json:async()=>({compound_count:2,compounds:['Water','Ethanol'],models:['NRTL']})});await vm.runInContext('checkEngine({silent:true})',context);assert.equal(vm.runInContext('connectionCheck.models',context),1);assert.match(elements.get('engine-metrics').textContent,/HTTP 200.*ms/);});
test('una señal antigua se marca desactualizada, sin afirmar conexión reciente',()=>{const {context,elements}=monitor(null);vm.runInContext("connectionCheck={state:'online',http:200,ms:10,time:new Date(Date.now()-90000).toISOString()};paintConnection();",context);assert.match(elements.get('engine-state').className,/stale/);});

function calculation(response){
  const m=monitor(response);
  m.context.fetch=async (url,options)=>{
    assert.equal(options.headers['X-SIM-Engine'],'windows');
    if(url==='/api/catalog')return {status:200,ok:true,json:async()=>({compound_count:2,compounds:['Water','Ethanol'],models:['NRTL']})};
    if(url==='/api/simulate')return response;
    throw Error('URL inesperada: '+url);
  };
  vm.runInContext("hasProject=true;engineOnline=true;graph={nodes:[],edges:[]};renderDiagram=()=>{};renderInspector=()=>{};renderResults=()=>{};renderDiagnostics=()=>{};notice=()=>{};publishWorkspace=()=>{};toolIcon=()=>'';",m.context);
  return m;
}
test('una comprobación de catálogo no borra un cálculo completado',async()=>{const {context,elements}=monitor({status:200,ok:true,json:async()=>({compounds:[],models:[]})});vm.runInContext("lastCalculation={ok:true,state:'completed',duration_ms:1500};",context);await vm.runInContext('checkEngine({silent:true})',context);assert.match(elements.get('server-details').innerHTML,/Completado/);assert.match(elements.get('server-details').innerHTML,/1,5 s/);assert.doesNotMatch(elements.get('server-details').innerHTML,/no se ejecutó una simulación/);});
test('un cálculo registra inicio y finalización con duración separada del catálogo',async()=>{const {context,elements}=calculation({status:200,ok:true,json:async()=>({elapsed_s:1})});await vm.runInContext('calculate()',context);const events=JSON.parse(vm.runInContext('JSON.stringify(connectionTrace)',context));assert.equal(events.length,3);assert.equal(events[0].operation,'GET /api/catalog');assert.equal(events[1].state,'running');assert.equal(events[2].http,200);assert.ok(Number.isFinite(events[2].ms));assert.match(elements.get('connection-console').innerHTML,/CÁLCULO/);assert.match(elements.get('connection-console').innerHTML,/Cálculo completado/);assert.match(elements.get('server-details').innerHTML,/Completado/);});
test('un cálculo fallido conserva HTTP y mensaje sin afirmar que la conexión cayó',async()=>{const {context,elements}=calculation({status:400,ok:false,json:async()=>({error:'Composición inválida <detalle>'})});await vm.runInContext('calculate()',context);assert.equal(vm.runInContext('lastCalculation.ok',context),false);assert.equal(vm.runInContext('engineOnline',context),true);assert.match(elements.get('connection-console').innerHTML,/HTTP 400/);assert.match(elements.get('connection-console').innerHTML,/&lt;detalle&gt;/);assert.match(elements.get('server-details').innerHTML,/Fallido/);});

test('el monitor identifica el motor activo y conserva el estado de cálculo',async()=>{
  const {context,elements}=monitor({status:200,ok:true,json:async()=>({compound_count:2,compounds:['Water','Ethanol'],models:['NRTL']})});
  vm.runInContext("selectedEngine='debian';",context);
  await vm.runInContext('checkEngine({silent:true})',context);
  assert.match(elements.get('server-details').innerHTML,/Notebook · Debian/);
  assert.match(elements.get('server-details').innerHTML,/Servicio accesible/);
  assert.match(elements.get('server-details').innerHTML,/No se cambia de motor automáticamente/);
  assert.ok(elements.get('connection-console').innerHTML.includes('Debian · GET /api/catalog'));
});
test('el monitor no confunde HTTP 503 con una causa confirmada',async()=>{
  const {context,elements}=monitor({status:503,ok:false,json:async()=>({error:'Servicio no disponible'})});
  await vm.runInContext('checkEngine({silent:true})',context);
  assert.match(elements.get('server-details').innerHTML,/Sin conexión verificada/);
  assert.match(elements.get('server-details').innerHTML,/puede estar apagada/);
  assert.match(elements.get('connection-console').innerHTML,/Windows/);
});
test('el monitor incluye un encabezado ASCII sin alterar la barra inferior',()=>{
  const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
  const dialog=html.split('<dialog id="server-dialog">')[1]?.split('</dialog>')[0]||'';
  const footer=html.split('<footer class="site-footer">')[1]?.split('</footer>')[0]||'';
  assert.match(dialog,/class="monitor-brand"/);
  assert.match(dialog,/<pre aria-hidden="true">/);
  assert.ok(dialog.includes('ΣIM / MONITOR DWSIM'));
  assert.ok(dialog.includes('Desarrollado por Ing. Luciano Lamaita'));
  assert.ok(dialog.includes('https://dwsim.org/'));
  assert.ok(dialog.includes('licenses/DWSIM-GPL-3.txt'));
  assert.ok(dialog.includes('licenses/NOTICE.md'));
  assert.doesNotMatch(footer,/monitor-brand/);
});
