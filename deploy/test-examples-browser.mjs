import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../site/examples-browser.js',import.meta.url),'utf8'),context);const {matches}=context.SimExamplesBrowser;
test('búsqueda exacta por número y búsqueda de texto sin acentos respetan el filtro',()=>{
 const row={number:'13',category:'energia',text:'13 Intercambiador de calor · actividad guiada'};
 assert.ok(matches(row,'13'));assert.ok(matches(row,'INTERCAMBIADOR','energia'));assert.ok(matches(row,'actividad guiada'));
 assert.equal(matches(row,'1'),false);assert.equal(matches(row,'13','reacciones'),false);assert.ok(matches({number:'07',category:'reacciones',text:'Reactor de conversión'},'conversion'));assert.ok(matches({number:'07',category:'reacciones',text:'Reactor'},'7'));
});
test('los veinte casos tienen resolución propia y ya no forman un desplegable largo',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');const browser=html.slice(html.indexOf('<dialog id="examples-dialog"'));
 const ids=[...browser.matchAll(/data-example="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,20);assert.equal(new Set(ids).size,20);
 for(const id of ids)assert.ok(browser.includes('data-example-guide="'+id+'"'));
 const header=html.slice(0,html.indexOf('</header>'));assert.doesNotMatch(header,/data-example=/);assert.match(header,/aria-haspopup="dialog">Ejemplos/);
});
