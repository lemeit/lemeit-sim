import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const src=readFileSync(new URL('../site/dock-layout.js',import.meta.url),'utf8');
const env={document:{addEventListener(){}}};
runInNewContext(src,env);
const dock=env.SimDockLayout;

test('el layout inicial acopla biblioteca a izquierda, inspector a derecha, resultados a derecha',()=>{
 const state=dock.recover(null,1280,800);
 assert.equal(state.equipment.mode,'left');
 assert.equal(state.inspector.mode,'right');
 assert.equal(state.results.mode,'right');
 assert.equal(state.equipment.lastDock,'left');
});
test('reconoce posiciones previas válidas sin permitir geometrías fuera de pantalla',()=>{
 const state=dock.recover({
  equipment:{mode:'float',lastDock:'top',box:{x:5000,y:-100,w:350,h:380}},
  inspector:{mode:'bogus',lastDock:'invalid',box:{x:10,y:20,w:100000,h:100000}}
 },1000,720);
 assert.equal(state.equipment.mode,'float');
 assert.equal(state.equipment.lastDock,'top');
 assert.equal(state.equipment.box.x,642);
 assert.equal(state.equipment.box.y,8);
 assert.equal(state.inspector.mode,'right');
 assert.ok(state.inspector.box.w<=984);
 assert.ok(state.inspector.box.h<=704);
});
test('guías de acople detectan los cuatro bordes del área de dibujo',()=>{
 const area={left:100,top:100,right:900,bottom:650};
 assert.equal(dock.targetEdge(105,350,area),'left');
 assert.equal(dock.targetEdge(895,350,area),'right');
 assert.equal(dock.targetEdge(460,105,area),'top');
 assert.equal(dock.targetEdge(460,645,area),'bottom');
 assert.equal(dock.targetEdge(460,350,area),null);
 assert.equal(dock.targetEdge(999,350,area),null);
});
test('la interfaz tiene una franja de agarre explícita y un selector de acople',()=>{
 assert.match(src,/sim-cad-move/);
 assert.match(src,/sim-cad-position/);
 assert.match(src,/sim-cad-size-grip/);
 assert.match(src,/window\.addEventListener\('pointermove',onGestureMove,true\)/);
 const css=readFileSync(new URL('../site/style.css',import.meta.url),'utf8');
 assert.match(css,/sim-cad-heading>span:not/);
 assert.match(css,/sim-cad-heading \.sim-cad-index/);
 assert.match(css,/sim-cad-heading \.sim-cad-position/);
 assert.match(css,/width:22px!important/);
 assert.match(src,/select\.title='Cambiar posición o restaurar panel'/);
 assert.match(css,/sim-cad-slot\[data-edge="bottom"\]/);
});
test('el menú Ver mantiene solo la opción de restaurar, sin instrucciones enormes',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert.ok(!html.includes('Paneles: arrastrá su cabecera'));
 assert.ok(src.includes("reset.id='view-reset-layout'"));
});
test('la ayuda usa el manual central de la wiki',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('dock-layout.js'));
 assert.ok(html.includes('https://wiki.lemeit.ar/sim/manual-de-uso/'));
 assert.ok(!html.includes('href="ayuda.html"'));
});
