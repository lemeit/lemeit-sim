import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from './worker.mjs';
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
