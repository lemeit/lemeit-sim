import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle as workerHandle} from './worker.mjs';
import {authorize,configured} from './auth.mjs';
const db={prepare(){return {bind(){return {async first(){return {role:'admin',class_id:null,expires_at:Math.floor(Date.now()/1000)+3600}}}}}}};
function handle(request,env={},assets={}){
  const headers=new Headers(request.headers);
  headers.set('Cookie','sim_session='+('a'.repeat(64)));
  const sessionRequest=new Request(request,{headers});
  return workerHandle(sessionRequest,{
    SIM_AUTH_DB:db,SIM_SESSION_SECRET:'test-only-session-secret-at-least-32-char',SIM_ADMIN_PASSWORD:'test-only-admin-passphrase-at-least-20-chars',...env
  },assets);
}
test('la sesión simulada usa la cookie y los bindings configurados',async()=>{
 const env={SIM_AUTH_DB:db,SIM_SESSION_SECRET:'test-only-session-secret-at-least-32-char',SIM_ADMIN_PASSWORD:'test-only-admin-passphrase-at-least-20-chars'};
 assert.equal(configured(env),true);
 const headers=new Headers({'Cookie':'sim_session='+('a'.repeat(64))});
 const request=new Request('https://sim.lemeit.ar/',{headers});
 assert.equal(request.headers.get('Cookie')?.length,76);
 const gate=await authorize(request,env);
 assert.equal(gate.ok,true,gate.response?await gate.response.text():'sin detalles');
});
test('deniega cálculos sin configuración de acceso',async()=>{
 const r=await workerHandle(new Request('https://sim.lemeit.ar/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),{});
 assert.equal(r.status,503);
});
test('el editor redirige a acceso si no existe sesión',async()=>{
 const r=await workerHandle(new Request('https://sim.lemeit.ar/'),{});
 assert.equal(r.status,302);
 assert.equal(r.headers.get('Location'),'https://sim.lemeit.ar/acceso.html');
});

test('interfaz disponible sin motor',async()=>{
  const r=await handle(new Request('https://sim.lemeit.ar/'),{}, {'/index.html':{type:'text/html',data:btoa('Editor')}});
  assert.equal(r.status,200);assert.equal(await r.text(),'Editor');
  assert.match(r.headers.get('Cache-Control'),/no-transform/);
  assert.match(r.headers.get('Content-Security-Policy'),/script-src 'self';/);
});
test('un origen ajeno no puede calcular',async()=>{
  const r=await handle(new Request('https://sim.lemeit.ar/api/simulate',{method:'POST',headers:{Origin:'https://example.com'}}),{});
  assert.equal(r.status,403);
});
test('no hay proxy MCP genérico',async()=>assert.equal((await handle(new Request('https://sim.lemeit.ar/api/mcp'),{})).status,404));
test('falta de motor devuelve explicación',async()=>assert.equal((await handle(new Request('https://sim.lemeit.ar/api/catalog'),{})).status,503));
test('cuerpo mayor de 100kB rechazado',async()=>{
  const r=await handle(new Request('https://sim.lemeit.ar/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:' '.repeat(100001)}),{});
  assert.equal(r.status,413);
});
test('proxy compatible con Workers, sin reenviar secretos al navegador',async t=>{
  t.mock.method(globalThis,'fetch',async (url,options)=>{
    assert.equal(url,'https://engine.example/api/catalog');
    assert.equal(options.redirect,'manual');
    assert.equal(options.headers['X-Origin-Key'],'test-only-key');
    return Response.json({compound_count:2});
  });
  const response=await handle(new Request('https://sim.lemeit.ar/api/catalog'),{ENGINE_URL:'https://engine.example',ORIGIN_KEY:'test-only-key'});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('X-Origin-Key'),null);
  assert.equal((await response.json()).compound_count,2);
});

test('motor Debian seleccionado usa solo su destino y su propia clave',async t=>{
  t.mock.method(globalThis,'fetch',async (url,options)=>{
    assert.equal(url,'https://debian.example/api/catalog');
    assert.equal(options.headers['X-Origin-Key'],'debian-secret');
    return Response.json({compound_count:2});
  });
  const response=await handle(new Request('https://sim.lemeit.ar/api/catalog',{headers:{'X-SIM-Engine':'debian'}}),{
    ENGINE_URL:'https://windows.example',ORIGIN_KEY:'windows-secret',
    DEBIAN_ENGINE_URL:'https://debian.example',DEBIAN_ORIGIN_KEY:'debian-secret'
  });
  assert.equal(response.status,200);
});
test('si Debian no está configurado no usa Windows como respaldo',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw Error('No debería llamar al origen');});
  const response=await handle(new Request('https://sim.lemeit.ar/api/catalog',{headers:{'X-SIM-Engine':'debian'}}),{
    ENGINE_URL:'https://windows.example',ORIGIN_KEY:'windows-secret'
  });
  assert.equal(response.status,503);
});
test('rechaza motores no autorizados',async()=>{
  const response=await handle(new Request('https://sim.lemeit.ar/api/catalog',{headers:{'X-SIM-Engine':'https://external.example'}}),{});
  assert.equal(response.status,400);
});

test('estado Debian consulta solo su gateway, sin exponer claves',async t=>{
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'https://debian.example/api/status');
    assert.equal(options.headers['X-Origin-Key'],'debian-secret');
    assert.equal(options.redirect,'manual');
    return Response.json({gateway_version:'0.13.0',started_at:'2026-11-15T21:00:00Z',uptime_s:120,state:'ready',supported_equipment:['Mixer','HeatExchanger']});
  });
  const response=await handle(new Request('https://sim.lemeit.ar/api/status',{headers:{'X-SIM-Engine':'debian'}}),{
    ENGINE_URL:'https://windows.example',ORIGIN_KEY:'windows-secret',
    DEBIAN_ENGINE_URL:'https://debian.example',DEBIAN_ORIGIN_KEY:'debian-secret'
  });
  assert.equal(response.status,200);
  assert.equal(response.headers.get('X-Origin-Key'),null);
  assert.equal((await response.json()).gateway_version,'0.13.0');
});
test('estado de gateway rechaza consultas POST y motores no admitidos',async()=>{
  assert.equal((await handle(new Request('https://sim.lemeit.ar/api/status',{method:'POST'}),{})).status,404);
  assert.equal((await handle(new Request('https://sim.lemeit.ar/api/status',{headers:{'X-SIM-Engine':'external'}}),{})).status,400);
});
test('estado inaccesible nunca cambia a Windows como respaldo',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw Error('connection refused');});
  const response=await handle(new Request('https://sim.lemeit.ar/api/status',{headers:{'X-SIM-Engine':'debian'}}),{
    DEBIAN_ENGINE_URL:'https://debian.example',DEBIAN_ORIGIN_KEY:'debian-secret',
    ENGINE_URL:'https://windows.example',ORIGIN_KEY:'windows-secret'
  });
  assert.equal(response.status,503);
});
