import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../site/diagram-interactions.js',import.meta.url),'utf8');
const env={};runInNewContext(source,env);
const gestures=env.SimDiagramInteractions;
const bounds={left:200,top:100,right:1000,bottom:600};

test('arrastrar dentro del diagrama no elimina objetos',()=>{
 for(const [x,y] of [[201,300],[999,300],[300,120],[500,600],[1015,300]]){
  assert.equal(gestures.shouldRemoveAfterDrag({startX:500,startY:250,x,y,rect:bounds}),false);
 }
});
test('arrastrar suficientemente lejos del lienzo permite eliminar al soltar',()=>{
 assert.equal(gestures.shouldRemoveAfterDrag({startX:700,startY:300,x:1040,y:300,rect:bounds}),true);
 assert.equal(gestures.shouldRemoveAfterDrag({startX:500,startY:250,x:100,y:250,rect:bounds}),true);
 assert.equal(gestures.shouldRemoveAfterDrag({startX:500,startY:250,x:500,y:50,rect:bounds}),true);
 assert.equal(gestures.shouldRemoveAfterDrag({startX:500,startY:250,x:500,y:680,rect:bounds}),true);
 assert.equal(gestures.shouldRemoveAfterDrag({startX:500,startY:250,x:1040,y:300,rect:bounds,cancelled:true}),false);
});
test('no borra por pequeños movimientos ni por posiciones inválidas',()=>{
 assert.equal(gestures.shouldRemoveAfterDrag({startX:1000,startY:300,x:1015,y:300,rect:bounds}),false);
 assert.equal(gestures.shouldRemoveAfterDrag({startX:600,startY:300,x:NaN,y:200,rect:bounds}),false);
 assert.equal(gestures.shouldRemoveAfterDrag({startX:600,startY:300,x:600,y:300,rect:null}),false);
});
test('Supr y Retroceso respetan campos de edición y combinaciones de teclado',()=>{
 const plain={closest:()=>null,isContentEditable:false};
 const input={closest:selector=>selector.includes('input')?{}:null};
 for(const key of ['Delete','Backspace'])assert.equal(gestures.isDeleteShortcut({key,target:plain}),true);
 assert.equal(gestures.isDeleteShortcut({key:'Backspace',target:input}),false);
 assert.equal(gestures.isDeleteShortcut({key:'Delete',target:{isContentEditable:true}}),false);
 assert.equal(gestures.isDeleteShortcut({key:'Delete',target:plain,ctrlKey:true}),false);
 assert.equal(gestures.isDeleteShortcut({key:'x',target:plain}),false);
});
test('el portal muestra una indicación al arrastrar para eliminar y conserva el selector de objetos',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 assert.ok(html.includes('diagram-interactions.js'));
 assert.ok(html.indexOf('diagram-interactions.js')<html.indexOf('app.js'));
 assert.ok(html.includes('id="diagram-trash-zone"'));
 assert.ok(!app.includes('draggable="true"'));
 assert.match(app,/palette\.addEventListener\('pointerdown'/);
 assert.match(app,/window\.addEventListener\('pointermove',movePalette,true\)/);
 assert.match(app,/window\.addEventListener\('pointerup',endPalette,true\)/);
 assert.match(app,/svg\.focus\(\{preventScroll:true\}\)/);
 assert.match(html,/id="diagram"[^>]*tabindex="0"/);
 assert.ok(!app.includes('<span class="add-sign">+</span>'));
 assert.match(app,/palette-drop-ready/);
 assert.match(app,/object-drop-delete/);
 assert.match(app,/SimDiagramInteractions\.isDeleteShortcut/);
 assert.match(app,/if\(deleteDrag\)\{removeSelected\(\)/);
 assert.match(app,/graph\.edges=graph\.edges\.filter\(e=>e\.from!==selection\.node&&e\.to!==selection\.node\)/);
});

test('acepta el punto de entrega dentro del diagrama, incluidos sus bordes',()=>{
 assert.equal(gestures.insideCanvas(200,100,bounds),true);
 assert.equal(gestures.insideCanvas(1000,600,bounds),true);
 assert.equal(gestures.insideCanvas(500,350,bounds),true);
 assert.equal(gestures.insideCanvas(199,300,bounds),false);
 assert.equal(gestures.insideCanvas(500,601,bounds),false);
 assert.equal(gestures.insideCanvas(NaN,300,bounds),false);
});
test('mantiene la incorporación por clic y evita duplicar el gesto de arrastre HTML5',()=>{
 const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 assert.match(app,/palette'\)\.addEventListener\('click'/);
 assert.match(app,/const p=svgPoint\(e\);\s*addNode\(type/);
 assert.ok(!app.includes("addEventListener('dragstart'"));
});
