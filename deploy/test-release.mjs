import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRelease,checkRelease} from './check-release.mjs';
test('la entrega tiene versión y cambios coherentes en Acerca de e historial',async()=>{assert.match(await checkRelease(),/^\d+\.\d+\.\d+$/);});
test('se rechaza una versión visible atrasada o un historial diferente',()=>{const html='<dialog id="about-dialog">Versión del portal · 0.1.1<ul><li>Cambio</li></ul></dialog>';assert.throws(()=>validateRelease(html,'## 0.2.0 — fecha','## 0.2.0 — fecha'),/Acerca de/);assert.throws(()=>validateRelease(html,'## 0.1.1 — fecha','otra copia'),/historial/);});
