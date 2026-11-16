import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site/acceso.js',import.meta.url),'utf8');
function setup(next,role='student'){
 const nodes=new Map(),events={},destinations=[];
 const el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,value:'fixture',textContent:'',elements:{role:{value:role}},addEventListener:(name,fn)=>events[id+':'+name]=fn});return nodes.get(id)};
 const location={search:'?next='+encodeURIComponent(next),assign:p=>destinations.push(p),replace:p=>destinations.push(p)};
 vm.runInNewContext(source,{document:{getElementById:el},location,URLSearchParams,Map,encodeURIComponent,fetch:async url=>({ok:true,json:async()=>url.endsWith('/me')?{authenticated:true,role}:{role}})});
 return {el,events,destinations};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('ingreso y continuar vuelven a ejemplos con aviso claro',async()=>{
 const h=setup('/ejemplos.html');await settle();assert.equal(h.el('access-notice').hidden,false);assert.match(h.el('access-notice').textContent,/ver los ejemplos/);assert.equal(h.el('access-continue').href,'/ejemplos.html');await h.events['access-form:submit']({preventDefault(){}});assert.deepEqual(h.destinations,['/ejemplos.html']);
});
test('destinos externos, scripts, API y administración no se aceptan como retorno',async()=>{
 for(const path of ['https://evil.test/','//evil.test/','/\\evil.test/','/api/auth/me','/admin.html','/app.js']){
  const h=setup(path);await settle();assert.equal(h.el('access-notice').hidden,true,path);await h.events['access-form:submit']({preventDefault(){}});assert.deepEqual(h.destinations,['/'],path);
 }
});
