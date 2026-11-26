import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const app=readFileSync(new URL('../../../site/app.js',import.meta.url),'utf8');
function functions(from,to){return app.slice(app.indexOf('function '+from+'('),app.indexOf('function '+to+'('));}
test('movimiento individual cruza el origen en ambos ejes y conserva extremos, codos y datos',()=>{
 const env={isStream:n=>n.type.endsWith('Stream')};runInNewContext(functions('moveNode','endpointCandidate'),env);
 const n={id:'s',type:'MaterialStream',x:20,y:30,startX:20,startY:30,endX:120,endY:30,routeX:70,routeY:30,mass_flow:1};
 env.moveNode(n,{start:{x:20,y:30},x:20,y:30,routeX:70,routeY:30,endpoints:{startX:20,startY:30,endX:120,endY:30}},{x:-80,y:-70});
 assert.equal(n.x,-80);assert.equal(n.y,-70);assert.equal(n.startX,-80);assert.equal(n.endX,20);assert.equal(n.routeX,-30);assert.equal(n.mass_flow,1);
 const pump={type:'Pump',x:30,y:40,pressure_kPa:500};env.moveNode(pump,{start:{x:30,y:40},x:30,y:40},{x:-90,y:80});assert.equal(pump.x,-90);assert.equal(pump.y,80);assert.equal(pump.pressure_kPa,500);
});
test('ajustar incluye equipos situados a izquierda y arriba del origen',()=>{
 const env={graph:{nodes:[{left:-300,right:-180,top:-200,bottom:-100},{left:100,right:220,top:30,bottom:130}]},nodeBounds:n=>n,isStream:()=>true,calloutGeometry:n=>({x:n.right,y:n.top-40,width:200}),renderDiagram:()=>{}};
 runInNewContext(functions('fitDiagram','moveNode'),env);env.fitDiagram();assert.ok(env.viewX<=-300);assert.ok(env.viewY<=-200);assert.ok(env.viewX+1000/env.zoom>=420);assert.ok(env.viewY+520/env.zoom>=130);
});
test('la carga acepta coordenadas negativas y rechaza coordenadas no finitas',()=>{
 const validation=app.slice(app.indexOf('  for(const n of data.nodes)'),app.indexOf('  for(const e of data.edges)'));
 const env={data:{nodes:[{id:'p1',type:'Pump',name:'P1',x:-120,y:-50,routeX:-80}]},TYPES:{Pump:{}},ids:new Set()};
 runInNewContext(validation,env);env.ids.clear();env.data.nodes[0].x=NaN;assert.throws(()=>runInNewContext(validation,env),/inválidos/);
});
