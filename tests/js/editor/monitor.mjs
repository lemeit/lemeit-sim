import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';

const source=readFileSync(new URL('../../../site/app.js',import.meta.url),'utf8').replace(/^init\(\);$/m,'');
const routing=readFileSync(new URL('../../../site/engine-routing.js',import.meta.url),'utf8');
const supported=['MaterialStream','EnergyStream','Mixer','Splitter','Heater','Cooler','Separator','Pump','Compressor','Expander','Tank','Valve','HeatExchanger','ConversionReactor','EquilibriumReactor'];
const status=(features=['simple_material_recycle'])=>({gateway_version:'0.35.0',state:'ready',supported_equipment:supported,supported_features:features,started_at:'2026-11-18T16:00:00Z',uptime_s:100});
const response=(statusCode,data)=>({status:statusCode,ok:statusCode>=200&&statusCode<300,json:async()=>data});
function monitor(routes={}){
 const elements=new Map(),calls=[];
 const document={body:{dataset:{sessionRole:'admin'},classList:{add(){},remove(){}}},getElementById:id=>{
   if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',options:[{value:''}],classList:{add(){},remove(){},toggle(){}},scrollHeight:0,scrollTop:0,clientHeight:0});
   return elements.get(id);
 }};
 const fetch=async(url,opt={})=>{
   const engine=opt.headers?.['X-SIM-Engine']||'windows';calls.push({url,engine,method:opt.method||'GET'});
   const handler=routes[engine]?.[url];
   return handler||((url==='/api/status')?response(200,status()):response(200,{compound_count:2,compounds:['Water','Ethanol'],models:['NRTL']}));
 };
 const context=vm.createContext({structuredClone,performance,AbortSignal,URLSearchParams,location:{search:''},crypto:webcrypto,fetch,document});
 vm.runInContext(routing,context);vm.runInContext(readFileSync(new URL('../../../site/dynamics-workspace.js',import.meta.url),'utf8'),context);vm.runInContext(readFileSync(new URL('../../../site/diagnostics-console.js',import.meta.url),'utf8'),context);vm.runInContext(source,context);
 vm.runInContext('graph=emptyProject();updateControls=()=>{};recordActivity=()=>{};',context);
 return {context,elements,calls};
}
const readState=context=>JSON.parse(vm.runInContext('JSON.stringify({selectedEngine,engineOnline,engineMode,connectionCheck,lastCalculation,resultValidity})',context));
test('selección automática mantiene Windows cuando responde y tiene capacidades',async()=>{
 const {context,calls,elements}=monitor();assert.equal(await vm.runInContext('checkEngine({silent:true})',context),true);
 assert.equal(readState(context).selectedEngine,'windows',JSON.stringify(vm.runInContext('diagnosticEvents',context)));
 assert.match(elements.get('engine-current').textContent,/Automático · Windows/);
 assert.equal(calls[0].url,'/api/status');assert.equal(calls[0].engine,'windows');
});
test('caída del gateway Windows: Debian queda seleccionado automáticamente antes del cálculo',async()=>{
 const {context,calls,elements}=monitor({windows:{'/api/status':response(503,{error:'Sin conexión'})}});
 await vm.runInContext('checkEngine({silent:true})',context);
 assert.equal(readState(context).selectedEngine,'debian');assert.equal(readState(context).engineOnline,true);
 assert.match(elements.get('engine-current').textContent,/Automático · Debian/);
 assert.deepEqual(calls.map(x=>x.engine),['windows','debian','debian']);
});
test('si Windows no admite recirculación, busca Debian con la función anunciada',async()=>{
 const {context}=monitor({windows:{'/api/status':response(200,status([]))}});
 vm.runInContext("graph={nodes:[{id:'a',type:'MaterialStream'},{id:'m',type:'Mixer'},{id:'b',type:'MaterialStream'},{id:'s',type:'Splitter'},{id:'r',type:'MaterialStream'}],edges:[{from:'a',to:'m'},{from:'m',to:'b'},{from:'b',to:'s'},{from:'s',to:'r'},{from:'r',to:'m'}]};",context);
 await vm.runInContext('checkEngine({silent:true})',context);assert.equal(readState(context).selectedEngine,'debian');
});
test('modo manual mantiene Windows aunque esté caído y no prueba Debian',async()=>{
 const {context,calls}=monitor({windows:{'/api/status':response(503,{error:'Caído'})}});
 vm.runInContext("engineMode='windows';",context);
 assert.equal(await vm.runInContext('checkEngine({silent:true})',context),false);
 assert.equal(readState(context).selectedEngine,'windows');assert.ok(calls.every(x=>x.engine==='windows'));
});
test('una consulta periódica no borra un resultado ya calculado',async()=>{
 const {context}=monitor();
 vm.runInContext("result={streams:{}};resultValidity='valid';lastCalculation={ok:true,state:'completed',duration_ms:1500};",context);
 await vm.runInContext('checkEngine({silent:true})',context);
 assert.equal(vm.runInContext('resultValidity',context),'valid');
 assert.equal(vm.runInContext('result!==null',context),true);
});
test('dos clics durante la preparación envían un solo cálculo al motor preseleccionado',async()=>{
 const routes={windows:{'/api/simulate':response(200,{elapsed_s:0.5,streams:{},equipment:{},balances:[],model:'NRTL'})}};
 const {context,calls}=monitor(routes);
 vm.runInContext("hasProject=true;graph={nodes:[],edges:[],model:'NRTL',compounds:['Water']};renderDiagram=()=>{};renderInspector=()=>{};renderResults=()=>{};renderDiagnostics=()=>{};notice=()=>{};publishWorkspace=()=>{};toolIcon=()=>'';",context);
 await vm.runInContext('Promise.all([calculate(),calculate()])',context);
 assert.equal(vm.runInContext('lastCalculation.ok',context),true);
 assert.equal(calls.filter(x=>x.url==='/api/simulate').length,1);
});
test('un POST HTTP 503 no se reenvía al motor alternativo',async()=>{
 const routes={windows:{'/api/simulate':response(503,{error:'Conexión interrumpida'})}};
 const {context,calls}=monitor(routes);
 vm.runInContext("hasProject=true;graph={nodes:[],edges:[],model:'NRTL',compounds:['Water']};renderDiagram=()=>{};renderInspector=()=>{};renderResults=()=>{};renderDiagnostics=()=>{};notice=()=>{};publishWorkspace=()=>{};toolIcon=()=>'';",context);
 await vm.runInContext('calculate()',context);
 assert.equal(vm.runInContext('lastCalculation.ok',context),false);
 assert.equal(calls.filter(x=>x.url==='/api/simulate').length,1);
 // El chequeo de respaldo tras el fallo es independiente del POST ya enviado.
});
test('el monitor y Acerca de siguen mostrando diagnóstico y datos técnicos',async()=>{
 const {context,elements}=monitor();await vm.runInContext('checkEngine({silent:true})',context);
 assert.match(elements.get('server-details').innerHTML,/Motor principal/);
 assert.match(elements.get('connection-console').innerHTML,/class="console-boot"/);
 const html=readFileSync(new URL('../../../site/index.html',import.meta.url),'utf8');
 const about=html.split('<dialog id="about-dialog">')[1]?.split('</dialog>')[0]||'';
 assert.match(about,/DWSIM 10.2.15/);assert.match(about,/https:\/\/dwsim.org\//);
});
