import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const script=readFileSync(new URL('../../../site/engines-monitor.js',import.meta.url),'utf8');
const admin=readFileSync(new URL('../../../site/admin.html',import.meta.url),'utf8');
const extract=(start,end)=>script.slice(script.indexOf(start),script.indexOf(end));
test('la versión del portal utilizada por el monitor está sincronizada',()=>{
  const pkg=JSON.parse(readFileSync(new URL('../../../package.json',import.meta.url),'utf8'));
  assert.ok(admin.includes('data-portal-version="'+pkg.version+'"'));
  assert.match(script,/dataset\?\.portalVersion|dataset\.portalVersion/);
});
test('el comparador reconoce gateways viejos sin confundir versiones mayores',()=>{
  const compare=vm.runInNewContext(extract('function olderVersion(','function field(')+'\nolderVersion');
  assert.equal(compare('0.17.3','0.17.4'),true);
  assert.equal(compare('0.16.99','0.17.4'),true);
  assert.equal(compare('0.17.4','0.17.4'),false);
  assert.equal(compare('0.18.0','0.17.4'),false);
  assert.equal(compare('invalida','0.17.4'),false);
});
test('el historial agrega solo transiciones y cuenta fallos consecutivos',()=>{
  const events={children:[],replaceChildren(){this.children=[];},append(child){this.children.push(child);}};
  const context={
    logs:[],history:new Map(),names:{windows:'Windows',debian:'Debian'},
    byId:id=>{assert.equal(id,'events');return events;},
    document:{createElement:()=>({textContent:''})},
    Date
  };
  vm.createContext(context);
  vm.runInContext(extract('function transition(','async function check('),context);
  const at=1763310000000;
  context.transition('debian','ready','gateway 0.17.4',at);
  context.transition('debian','ready','gateway 0.17.4',at+30000);
  assert.equal(context.logs.length,1);
  assert.equal(context.history.get('debian').since,at);
  context.transition('debian','unconfirmed','Sin respuesta',at+60000);
  context.transition('debian','unconfirmed','Sin respuesta',at+90000);
  assert.equal(context.logs.length,2);
  assert.equal(context.history.get('debian').failures,2);
  context.transition('debian','busy','gateway 0.17.4',at+120000);
  assert.equal(context.logs.length,3);
  assert.equal(context.history.get('debian').failures,0);
  assert.equal(events.children.length,3);
});
test('sigue siendo exclusivamente de lectura, sin cambios en los motores',()=>{
  assert.match(script,/fetch\('\/api\/status'/);
  assert.doesNotMatch(script,/fetch\([^\n]*method\s*:\s*['"]POST/);
  assert.doesNotMatch(script,/\/api\/admin\/restart|\/api\/admin\/stop/);
});
