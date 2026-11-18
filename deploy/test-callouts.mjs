import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
const context={viewX:-1000,viewY:-1000,zoom:.25,graph:{nodes:[]},TYPES:{Pump:{w:80,h:80,short:'Bomba'},MaterialStream:{short:'Materia'}},isStream:n=>n.type.endsWith('Stream'),symbolScale:n=>n.scale??1};
runInNewContext(app.slice(app.indexOf('function calloutGeometry('),app.indexOf('function renderCallout(')),context);
test('llamadas siguen el tramo real y el tamaño del equipo sin modificar el proyecto',()=>{
 const n={type:'MaterialStream',name:'Alimentación',mass_flow:1},g={points:[{x:-80,y:40},{x:120,y:40},{x:120,y:80}]};
 const before=JSON.stringify({n,g}),a=context.calloutGeometry(n,g);assert.equal(a.anchor.x,20);assert.equal(a.anchor.y,40);
 const moved=context.calloutGeometry(n,{points:g.points.map(p=>({x:p.x+60,y:p.y-20}))});assert.equal(moved.x,a.x+60);assert.equal(moved.y,a.y-20);assert.equal(JSON.stringify({n,g}),before);
 const pump={type:'Pump',name:'P1',scale:1};const small=context.calloutGeometry(pump,null);pump.scale=2;const large=context.calloutGeometry(pump,null);assert.equal(large.anchor.x,small.anchor.x*2);assert.equal(large.anchor.y,small.anchor.y*2);
});

test('elige izquierda junto al borde derecho y cambia ante obstáculos',()=>{
 context.viewX=0;context.viewY=0;context.zoom=1;
 const n={id:'feed',type:'MaterialStream',name:'Entrada'};
 const g={points:[{x:850,y:240},{x:950,y:240}]};
 const right=context.calloutGeometry(n,g);assert.equal(right.side,-1);assert.ok(right.x+right.width<=1000);
 const left=context.calloutGeometry(n,{points:[{x:20,y:240},{x:120,y:240}]});assert.equal(left.side,1);
 context.nodeBounds=n=>n.bounds;context.graph.nodes=[{id:'obstacle',type:'Pump',bounds:{left:90,right:400,top:160,bottom:300}}];
 const blocked=context.calloutGeometry(n,{points:[{x:20,y:240},{x:120,y:240}]});assert.ok(blocked.y>300||blocked.y<160);
 context.graph.nodes=[];
});

test('invertir un tramo vertical cambia la orientación de su llamada',()=>{
 context.graph.nodes=[];context.viewX=-1000;context.viewY=-1000;context.zoom=.25;
 const n={id:'s',type:'MaterialStream',name:'S'};
 const down=context.calloutGeometry(n,{points:[{x:200,y:100},{x:200,y:300}]});
 const up=context.calloutGeometry(n,{points:[{x:200,y:300},{x:200,y:100}]});
 assert.notEqual(down.side,up.side);assert.notEqual(down.vertical,up.vertical);
});
