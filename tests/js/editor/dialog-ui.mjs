import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../../site/dialog-ui.js',import.meta.url),'utf8');
function setup(){const listeners={},d={closed:0,querySelector:()=>null,getBoundingClientRect:()=>({left:100,right:400,top:100,bottom:400}),close(){this.closed++},addEventListener:(name,fn)=>listeners[name]=fn};vm.runInNewContext(source,{document:{querySelectorAll:s=>s==='dialog'?[d]:[]}});return {d,emit:(type,x,y,target=d)=>listeners[type]({target,clientX:x,clientY:y})};}
test('clic fuera cierra el diálogo, clic dentro no lo cierra',()=>{const h=setup();h.emit('pointerdown',150,150);h.emit('click',150,150);assert.equal(h.d.closed,0);h.emit('pointerdown',50,50);h.emit('click',50,50);assert.equal(h.d.closed,1);});
test('arrastrar desde dentro hacia fuera y cancelar puntero no cierra',()=>{const h=setup();h.emit('pointerdown',150,150);h.emit('click',50,50);assert.equal(h.d.closed,0);h.emit('pointerdown',50,50);h.emit('pointercancel',50,50);h.emit('click',50,50);assert.equal(h.d.closed,0);});
