import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from './worker.mjs';
test('interfaz disponible sin motor',async()=>{
  const r=await handle(new Request('https://sim.lemeit.ar/'),{}, {'/index.html':{type:'text/html',data:btoa('Editor')}});
  assert.equal(r.status,200);assert.equal(await r.text(),'Editor');
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
