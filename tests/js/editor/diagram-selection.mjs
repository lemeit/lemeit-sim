import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});vm.runInContext(readFileSync(new URL('../../../site/diagram-interactions.js',import.meta.url),'utf8'),ctx);const g=ctx.SimDiagramInteractions;
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

test('contacto parcial selecciona el equipo completo, incluidos bordes',()=>{
 const r={left:50,right:80,top:30,bottom:60};
 assert.ok(g.intersects(r,{left:75,right:195,top:40,bottom:140}));
 assert.ok(g.intersects(r,{left:80,right:200,top:60,bottom:160}));
 assert.equal(g.intersects(r,{left:81,right:200,top:61,bottom:160}),false);
});
test('corrientes se seleccionan por un tramo real y no por el espacio vacío entre codos',()=>{
 const line=[{x:0,y:0},{x:100,y:0},{x:100,y:100}];
 assert.ok(g.polylineIntersects({left:40,right:60,top:-5,bottom:5},line));
 assert.ok(g.polylineIntersects({left:95,right:105,top:40,bottom:60},line));
 assert.equal(g.polylineIntersects({left:20,right:40,top:20,bottom:40},line),false);
 assert.ok(g.polylineIntersects({left:40,right:60,top:2,bottom:3},line,3));
 assert.equal(g.polylineIntersects({left:40,right:60,top:4,bottom:5},line,3),false);
});

test('arrastrar un puerto de una selección mueve el conjunto sin conectar ni editar extremos',()=>{
 const app=readFileSync(new URL('../../../site/app.js',import.meta.url),'utf8');
 const handlers={};const nodes=[{id:'p',type:'Pump',x:100,y:100},{id:'s',type:'MaterialStream',x:200,y:100,startX:200,startY:100,endX:300,endY:100}];
 const svg={addEventListener:(name,fn)=>handlers[name]=fn,setPointerCapture:()=>{},focus:()=>{},classList:{add:()=>{}}};
 const env=vm.createContext({structuredClone,graph:{nodes},selection:{nodes:['p','s']},busy:false,marquee:null,dragging:null,$:()=>svg,svgPoint:e=>({x:e.clientX,y:e.clientY}),SimDiagramInteractions:g,queueDiagramMotion:()=>{}});
 const start=app.indexOf('function bindEvents(){'),move=app.indexOf("  svg.addEventListener('pointermove'",start),end=app.indexOf('    if(resizing)',move);
 vm.runInContext(app.slice(start,move)+app.slice(move,end)+'  });\n};bindEvents();',env);
 const target={closest:selector=>selector==='[data-node]'?{dataset:{node:'s'}}:selector==='[data-port]'?{dataset:{owner:'s',port:'out'}}:null};
 handlers.pointerdown({button:0,isPrimary:true,target,clientX:250,clientY:100,pointerId:1,preventDefault:()=>{}});
 assert.equal(env.dragging.group.length,2);
 handlers.pointermove({clientX:210,clientY:130});assert.equal(nodes[0].x,60);assert.equal(nodes[1].x,160);assert.equal(nodes[1].endX,260);assert.equal(nodes[1].endY,130);
 assert.deepEqual(env.selection.nodes,['p','s']);
});
