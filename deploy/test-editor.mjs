import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const source=readFileSync(new URL('../site/app.js',import.meta.url),'utf8').replace(/^init\(\);$/m,'');
function editor(){
 const context=vm.createContext({URLSearchParams,location:{search:''},crypto:webcrypto,document:{getElementById:id=>({innerHTML:'',getScreenCTM:()=>({a:1,b:0})})},console});
 vm.runInContext(source,context);
 vm.runInContext(`graph=example();changed=()=>{};renderInspector=()=>{};renderDiagram=()=>{};notice=()=>{};`,context);
 return code=>JSON.parse(vm.runInContext(`JSON.stringify((()=>{${code}})())`,context));
}
test('una corriente conectada termina en el puerto del equipo y sigue su movimiento',()=>{
 const run=editor();const actual=run(`const n=nodeById('c1');const before=streamGeometry(n);nodeById('m1').x+=100;const after=streamGeometry(n);return {before:before.b,after:after.b,a:after.a};`);
 assert.equal(actual.after.x-actual.before.x,100);assert.equal(actual.after.y,actual.before.y);assert.deepEqual(actual.a,{x:90,y:135});
});
test('arrastrar un extremo libre conserva la corriente y desconecta solo ese extremo',()=>{
 const run=editor();const actual=run(`finishEndpointDrag({node:'c1',side:'out',preview:{x:300,y:400}});return {edges:graph.edges.length,ends:streamGeometry(nodeById('c1')),count:graph.nodes.length};`);
 assert.equal(actual.edges,2);assert.equal(actual.count,4);assert.deepEqual(actual.ends.b,{x:300,y:400});
});
test('un extremo se reconecta al puerto libre y conserva el otro extremo',()=>{
 const run=editor();const actual=run(`finishEndpointDrag({node:'c1',side:'out',preview:{x:435,y:240}});return {edges:graph.edges,ends:streamGeometry(nodeById('c1'))};`);
 assert.equal(actual.edges.length,3);assert.equal(actual.edges.find(e=>e.from==='c1').toIndex,2);assert.deepEqual(actual.ends.b,{x:435,y:240});
});
test('un puerto ocupado o del sentido incorrecto no destruye la conexión previa',()=>{
 for(const preview of [{x:435,y:265},{x:555,y:240}]){
 const run=editor();const actual=run(`const before=JSON.stringify(graph.edges);finishEndpointDrag({node:'c1',side:'out',preview:${JSON.stringify(preview)}});return before===JSON.stringify(graph.edges);`);assert.equal(actual,true);
 }
});
test('la salida libre puede conectarse desde el extremo inicial al equipo',()=>{
 const run=editor();const actual=run(`graph.edges=graph.edges.filter(e=>e.to!=='c3');finishEndpointDrag({node:'c3',side:'in',preview:{x:555,y:240}});return graph.edges.find(e=>e.to==='c3');`);
 assert.equal(actual.from,'m1');assert.equal(actual.to,'c3');
});
test('redimensionar un símbolo mueve los puertos y las corrientes conectadas sin alterar topología',()=>{
 const run=editor();const actual=run(`const before=JSON.stringify(graph.edges);nodeById('m1').scale=2;return {end:streamGeometry(nodeById('c3')).a,edges:before===JSON.stringify(graph.edges),nodes:graph.nodes.length};`);
 assert.equal(actual.end.x,675);assert.equal(actual.end.y,290);assert.equal(actual.edges,true);assert.equal(actual.nodes,4);
});
test('el movimiento de una corriente libre respeta ambos extremos explícitos',()=>{
 const run=editor();const actual=run(`const n=nodeById('c1');graph.edges=graph.edges.filter(e=>e.from!=='c1');Object.assign(n,{startX:80,startY:90,endX:250,endY:120});moveNode(n,{start:{x:0,y:0},x:n.x,y:n.y,endpoints:{startX:80,startY:90,endX:250,endY:120}},{x:30,y:40});return streamGeometry(n);`);
 assert.deepEqual(actual.a,{x:110,y:130});assert.deepEqual(actual.b,{x:280,y:160});
});
test('acomodar el recorrido no agrega objetos ni cambia la conexión',()=>{
 const run=editor();const actual=run(`const before=JSON.stringify(graph.edges);nodeById('c1').routeX=300;return {path:streamGeometry(nodeById('c1')).d,edges:before===JSON.stringify(graph.edges),nodes:graph.nodes.length};`);
 assert.match(actual.path,/H300/);assert.equal(actual.edges,true);assert.equal(actual.nodes,4);
});

test('el extremo permanece dibujable con coordenadas de acceso como DOMPoint',()=>{
 const run=editor();const actual=run(`const preview=Object.create({get x(){return 300;},get y(){return 400;}});endpointDrag={node:'c1',side:'out',moved:true,preview};return streamGeometry(nodeById('c1'));`);
 assert.deepEqual(actual.b,{x:300,y:400});assert.doesNotMatch(actual.d,/undefined|NaN/);
});
test('desconectar conserva el extremo fijo real aunque la posición histórica sea distinta',()=>{
 const run=editor();const actual=run(`const n=nodeById('c3');nodeById('m1').x=500;const original=streamGeometry(n);finishEndpointDrag({node:n.id,side:'out',original,preview:{x:900,y:400}});return streamGeometry(n);`);
 assert.deepEqual(actual.a,{x:620,y:240});assert.deepEqual(actual.b,{x:900,y:400});
});
test('soltar el extremo sobre el otro no colapsa la corriente en un punto',()=>{
 const run=editor();const actual=run(`const n=nodeById('c1'),original=streamGeometry(n);finishEndpointDrag({node:n.id,side:'out',original,preview:{...original.a}});const g=streamGeometry(n);return Math.hypot(g.b.x-g.a.x,g.b.y-g.a.y);`);
 assert.ok(actual>=23.99);
});
test('una corriente vertical libre termina con segmento vertical, sin tramo cero horizontal',()=>{
 const run=editor();const g=run(`graph.edges=[];const n=nodeById('c1');n.endX=n.x;n.endY=n.y+250;return streamGeometry(n);`);assert.match(g.d,/ V350$/);assert.doesNotMatch(g.d,/undefined|NaN/);
});
test('la energía entra al conector inferior del calentador apuntando hacia arriba',()=>{
 const run=editor();const g=run(`graph.nodes=[{id:'q',name:'Calor',type:'EnergyStream',x:80,y:350},{id:'h',name:'Calentador',type:'Heater',x:300,y:100}];graph.edges=[{from:'q',to:'h',fromPort:'out',toPort:'energy-in'}];return streamGeometry(nodeById('q'));`);assert.match(g.d,/ V200$/);assert.ok(g.bend.axis==='y');
});
test('la energía sale hacia abajo del conector inferior del enfriador',()=>{
 const run=editor();const g=run(`graph.nodes=[{id:'c',name:'Enfriador',type:'Cooler',x:300,y:100},{id:'q',name:'Calor',type:'EnergyStream',x:340,y:350,endX:360,endY:450}];graph.edges=[{from:'c',to:'q',fromPort:'energy-out',toPort:'in'}];return streamGeometry(nodeById('q'));`);assert.match(g.d,/^M360 200 V/);assert.match(g.d,/ V450$/);
});
test('orientar una corriente libre no modifica conexiones ni agrega objetos',()=>{
 const run=editor();const actual=run(`graph.edges=[];const n=nodeById('c1');orientStream(n,'up');const g=streamGeometry(n);return {g,count:graph.nodes.length,edges:graph.edges.length};`);assert.equal(actual.count,4);assert.equal(actual.edges,0);assert.ok(actual.g.b.y<actual.g.a.y);assert.match(actual.g.d,/ V/);
});
