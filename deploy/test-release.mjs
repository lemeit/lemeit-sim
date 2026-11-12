import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRelease,checkRelease} from './check-release.mjs';
import {readFileSync} from 'node:fs';
test('la entrega tiene versión y cambios coherentes en Acerca de e historial',async()=>{assert.match(await checkRelease(),/^\d+\.\d+\.\d+$/);});
test('se rechaza una versión visible atrasada o un historial diferente',()=>{const html='<dialog id="about-dialog">Versión del portal · 0.1.1<ul><li>Cambio</li></ul></dialog>';assert.throws(()=>validateRelease(html,'## 0.2.0 — fecha','## 0.2.0 — fecha'),/Acerca de/);assert.throws(()=>validateRelease(html,'## 0.1.1 — fecha','otra copia'),/historial/);});

test('el selector de motores se ubica solo en el footer, sin ocupar la barra de cálculo',()=>{
  const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
  const footer=html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1]||'';
  const bar=html.match(/<section class="command-bar"[^>]*>([\s\S]*?)<\/section>/)?.[1]||'';
  assert.match(footer,/<select id="engine-select"/);
  assert.doesNotMatch(bar,/id="engine-select"/);
  assert.equal((html.match(/id="engine-select"/g)||[]).length,1);
  assert.match(footer,/id="connection-monitor-button"/);
});

test('footer compacto con enlaces accesibles y sin salto de línea',()=>{
  const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../site/style.css',import.meta.url),'utf8');
  const footer=html.match(/<footer class="site-footer">([\\s\\S]*?)<\\/footer>/)?.[1]||'';
  assert.match(footer,/id="connection-monitor-button"/);
  assert.match(footer,/id="engine-select"/);
  assert.match(footer,/<details class="footer-info">/);
  assert.match(footer,/Componentes y licencias/);
  assert.match(css,/\.site-footer \.footer-service\{[^}]*flex-wrap:nowrap/);
  assert.match(css,/\.sim-shell footer\.site-footer\{[^}]*flex-wrap:nowrap/);
});
