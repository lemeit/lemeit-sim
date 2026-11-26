import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../../site/engines-monitor.js',import.meta.url),'utf8');
function setup(){
 const nodes=new Map(),calls=[],timers=[],listeners={};
 function node(id){if(!nodes.has(id))nodes.set(id,{checked:true,open:false,disabled:false,dataset:{},children:[],addEventListener(t,f){this[t]=f},showModal(){this.open=true},querySelector(s){return node(id+s)},replaceChildren(){this.children=[]},append(...items){this.children.push(...items)}});return nodes.get(id)}
 const document={documentElement:{dataset:{portalVersion:'0.17.4'}},hidden:false,getElementById:node,querySelectorAll:()=>[],createElement:()=>({}),addEventListener:(t,f)=>listeners[t]=f};
 vm.runInNewContext(source,{document,performance,Date,AbortSignal,setInterval:(f,ms)=>timers.push({f,ms}),fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({gateway_version:'0.17.4',state:options.headers['X-SIM-Engine']==='windows'?'ready':'busy',supported_equipment:['Mixer'],started_at:'2026-11-16T00:00:00Z',uptime_s:3600})}}});
 return {node,calls,timers,document,listeners};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('diálogo consulta ambos motores al abrir, refresca y pausa cerrado/oculto',async()=>{
 const h=setup();assert.equal(h.calls.length,0);assert.equal(h.timers[0].ms,30000);
 h.node('services-button').click();await settle();assert.equal(h.node('services-dialog').open,true);
 assert.deepEqual(h.calls.map(c=>c.options.headers['X-SIM-Engine']),['windows','debian']);
 assert.equal(h.node('windows.summary').textContent,'Disponible');assert.equal(h.node('debian.summary').textContent,'Ocupado');
 h.timers[0].f();await settle();assert.equal(h.calls.length,4);
 h.node('services-dialog').open=false;h.timers[0].f();assert.equal(h.calls.length,4);
 h.node('services-button').click();await settle();assert.equal(h.calls.length,6);
 h.document.hidden=true;h.timers[0].f();assert.equal(h.calls.length,6);
 h.document.hidden=false;h.node('automatic').checked=false;h.timers[0].f();assert.equal(h.calls.length,6);
 h.node('refresh').click();await settle();assert.equal(h.calls.length,8);
 assert.ok(h.calls.every(c=>c.url==='/api/status'&&!c.options.method));
});
test('diálogo no incorpora administración de clases ni recuperación local',()=>{
 const html=readFileSync(new URL('../../../site/index.html',import.meta.url),'utf8');
 const dialog=html.match(/<dialog id="services-dialog"[\s\S]*?<\/dialog>/)[0];
 assert.doesNotMatch(dialog,/class-management|class-create-form|admin-classes|systemctl|start-online|<form(?! method="dialog")/);
 assert.match(html,/id="admin-nav-link"[^>]*hidden/);
});
