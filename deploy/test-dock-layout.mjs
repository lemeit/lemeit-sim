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
