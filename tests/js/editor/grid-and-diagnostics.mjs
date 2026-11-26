import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../../../site/diagram-interactions.js',import.meta.url),'utf8');
const env={};runInNewContext(source,env);
const interactions=env.SimDiagramInteractions;
const html=readFileSync(new URL('../../../site/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../../../site/app.js',import.meta.url),'utf8');

test('cuadrícula: ajuste simétrico, negativos y modo desactivado',()=>{
  for(const [value,expected] of [[0,0],[8,0],[11,20],[38,40],[-11,-20],[-38,-40]])assert.equal(interactions.snap(value,true,20),expected);
  assert.equal(interactions.snap(11,false,20),11);
});
test('Shift restringe delta al eje dominante y no cambia el gesto normal',()=>{
  assert.deepEqual({...interactions.constrainDelta(50,12,true)},{dx:50,dy:0});
  assert.deepEqual({...interactions.constrainDelta(12,-50,true)},{dx:0,dy:-50});
  assert.deepEqual({...interactions.constrainDelta(12,-50,false)},{dx:12,dy:-50});
});
test('las corrientes priorizan recorridos ortogonales sin serrucho',()=>{
  const line=[{x:0,y:0},{x:100,y:0},{x:100,y:60},{x:200,y:60}];
  const saw=[{x:0,y:0},{x:100,y:0},{x:100,y:60},{x:80,y:60},{x:80,y:65},{x:200,y:65}];
  assert.equal(interactions.routePenalty(line),0);
  assert.ok(interactions.routePenalty(saw)>interactions.routePenalty(line));
  assert.throws(()=>interactions.routePenalty([{x:0,y:0},{x:10,y:10}]),/ortogonal/);
});
test('controles de cuadrícula y copiar diagnóstico están accesibles y no se exportan',()=>{
  for(const id of ['diagram-grid','view-grid','view-snap','diagnostics-copy','diagnostics-copy-status'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.ok(app.includes("gridVisible?showGrid():''"));
  assert.ok(app.includes('navigator.clipboard?.writeText'));
  assert.ok(app.includes('SimDiagramInteractions.routePenalty'));
  assert.ok(app.includes('moveNode(nodeById(dragging.node),dragging,p,e.shiftKey)'));
});
