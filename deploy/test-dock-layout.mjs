import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const src=readFileSync(new URL('../site/dock-layout.js',import.meta.url),'utf8');
const sandbox={document:{addEventListener(){}}};
runInNewContext(src,sandbox);
const dock=sandbox.SimDockLayout;

test('distribución inicial: equipo a izquierda y propiedades a derecha',()=>{
 const normal=dock.normalise(null);
 assert.equal(normal.swapped,false);
 assert.equal(dock.slots(normal).equipment,1);
 assert.equal(dock.slots(normal).inspector,3);
});
test('intercambiar lados conserva posición central del diagrama',()=>{
 const state=dock.normalise({swapped:true});
 assert.equal(dock.slots(state).equipment,3);
 assert.equal(dock.slots(state).inspector,1);
});
test('no aceptar coordenadas no finitas ni tamaños exagerados de almacenamiento',()=>{
 const s=dock.normalise({swapped:'yes',floating:{equipment:true,unknown:true},positions:{equipment:{left:1,top:1,width:99999,height:300},results:{left:20,top:100,width:720,height:400}}});
 assert.equal(s.swapped,false);
 assert.equal(s.floating.equipment,true);
 assert.equal(s.floating.inspector,false);
 assert.equal(s.positions.equipment,undefined);
 assert.equal(s.positions.results.width,720);
});
test('portal enlaza a wiki y carga disposición de paneles',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('dock-layout.js'));
 assert.ok(html.includes('https://wiki.lemeit.ar/sim/manual-de-uso/'));
 assert.ok(!html.includes('href="ayuda.html"'));
});
test('ruta de ayuda histórica apunta al manual de la wiki',()=>{
 const html=readFileSync(new URL('../site/ayuda.html',import.meta.url),'utf8');
 assert.ok(html.includes('http-equiv="refresh"'));
 assert.ok(html.includes('https://wiki.lemeit.ar/sim/manual-de-uso/'));
});

test('redimensionar desde cualquier borde mantiene límites y ancla opuesta',()=>{
 const p={left:200,top:120,width:340,height:300};
 const east=dock.resizeRect(p,'e',90,0,1280,800);
 assert.equal(east.width,430);assert.equal(east.left,200);
 const west=dock.resizeRect(p,'w',50,0,1280,800);
 assert.equal(west.left,250);assert.equal(west.width,290);
 const north=dock.resizeRect(p,'n',0,35,1280,800);
 assert.equal(north.top,155);assert.equal(north.height,265);
 const corner=dock.resizeRect(p,'se',80,60,1280,800);
 assert.equal(corner.width,420);assert.equal(corner.height,360);
});
test('no permite tamaño menor de 220×150 ni salirse del viewport',()=>{
 const p={left:100,top:100,width:320,height:260};
 const tiny=dock.resizeRect(p,'nw',450,350,1024,768);
 assert.equal(tiny.width,220);assert.equal(tiny.height,150);
 const limit=dock.resizeRect(p,'se',2000,2000,1024,768);
 assert.equal(limit.width,916);assert.equal(limit.height,660);
});
test('se elimina texto de paneles fuera de contexto en Ver',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert.ok(!html.includes('Paneles: arrastrá su cabecera'));
 assert.ok(src.includes("id='view-reset-layout'"));
});
