import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});vm.runInContext(readFileSync(new URL('../site/diagram-interactions.js',import.meta.url),'utf8'),ctx);const g=ctx.SimDiagramInteractions;
test('encerrar funciona en ambos sentidos y exige incluir el cuerpo completo',()=>{
 const a=g.selectionRect({x:100,y:200},{x:20,y:30});assert.equal(a.left,20);assert.equal(a.top,30);assert.equal(a.right,100);assert.equal(a.bottom,200);
 assert.ok(g.encloses(a,{left:20,right:100,top:30,bottom:200}));assert.equal(g.encloses(a,{left:10,right:100,top:30,bottom:200}),false);
 const reverse=g.selectionRect({x:20,y:30},{x:100,y:200});assert.equal(JSON.stringify(reverse),JSON.stringify(a));
});
test('mover conjunto conserva distancias, extremos, codos y datos físicos',()=>{
 const nodes=[{id:'pump',x:100,y:70,pressure_kPa:500},{id:'s',x:40,y:90,startX:40,startY:90,endX:100,endY:110,routeX:65,routeY:95,mass_flow:1},{id:'other',x:500,y:300}];const before=structuredClone(nodes.slice(0,2));
 g.translateNodes(nodes,before,30,-20);assert.equal(nodes[0].x,130);assert.equal(nodes[1].startX,70);assert.equal(nodes[1].endY,90);assert.equal(nodes[1].routeX,95);assert.equal(nodes[1].routeY,75);assert.equal(nodes[0].x-nodes[1].x,60);assert.equal(nodes[0].pressure_kPa,500);assert.equal(nodes[1].mass_flow,1);assert.equal(nodes[2].x,500);
 g.translateNodes(nodes,before,40,-10);assert.equal(nodes[0].x,140);assert.equal(nodes[1].startX,80);
});
