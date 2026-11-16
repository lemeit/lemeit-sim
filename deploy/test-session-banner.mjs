import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site/session-banner.js',import.meta.url),'utf8');
function setup(role='student'){
 const nodes=new Map(),timers=[],listeners={};let time=0;
 const get=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:true,dataset:{}});return nodes.get(id)};
 const state={data:{authenticated:true,role,class_name:'Física <Grupo A>',expires_at:1120,class_expires_at:1120,server_time:1000}};
 vm.runInNewContext(source,{document:{hidden:false,getElementById:get,addEventListener:(t,f)=>listeners[t]=f},performance:{now:()=>time},Date,console,fetch:async()=>({ok:true,json:async()=>state.data}),setInterval:(f,ms)=>timers.push({f,ms})});
 return {get,state,timers,listeners,advance:ms=>time+=ms};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('franja muestra clase como texto y descuenta con reloj del servidor',async()=>{
 const h=setup();await settle();assert.equal(h.get('session-role').textContent,'Alumno');assert.equal(h.get('session-name').textContent,'Física <Grupo A>');assert.equal(h.get('session-countdown').textContent,'00:02:00');assert.equal(h.get('session-countdown').hidden,false);assert.equal(h.get('session-countdown-label').hidden,false);assert.equal(h.get('admin-nav-link').hidden,true);
 h.advance(61000);h.timers.find(t=>t.ms===1000).f();assert.equal(h.get('session-countdown').textContent,'00:00:59');
 h.advance(60000);h.timers.find(t=>t.ms===1000).f();assert.equal(h.get('session-countdown').textContent,'00:00:00');assert.equal(h.get('session-login').hidden,false);assert.match(h.get('session-status').textContent,/Guardá el proyecto/);
});
test('administrador ve su rol y sesión administrativa',async()=>{
 const h=setup('admin');await settle();assert.equal(h.get('session-role').textContent,'Administrador');assert.equal(h.get('session-name').textContent,'Sesión administrativa');assert.equal(h.get('admin-nav-link').hidden,false);assert.equal(h.get('session-countdown-label').hidden,true);assert.equal(h.get('session-countdown').hidden,true);assert.equal(h.get('session-countdown').textContent,'');
 h.advance(60000);h.timers.find(t=>t.ms===1000).f();assert.equal(h.get('session-countdown').textContent,'');assert.equal(h.get('session-banner').dataset.state,'active');
});
test('revalidación detecta revocación sin navegación automática',async()=>{
 const h=setup();await settle();h.state.data={authenticated:false};h.timers.find(t=>t.ms===60000).f();await settle();assert.equal(h.get('session-banner').dataset.state,'expired');assert.equal(h.get('session-login').hidden,false);assert.equal(h.get('session-name').textContent,'Física <Grupo A>');
});
