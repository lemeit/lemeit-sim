import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('desplegables de propiedades comparten fuente y escala del inspector',()=>{
  const css=readFileSync(new URL('../site/style.css',import.meta.url),'utf8');
  assert.match(css,/\.sim-shell \.inspector-panel #inspector select\s*\{[\s\S]*?font-family:var\(--spx-font-sans\),sans-serif;/);
  assert.match(css,/\.sim-shell \.inspector-panel #inspector select\s*\{[\s\S]*?font-size:11px;/);
  assert.match(css,/\.sim-shell \.inspector-panel #inspector select option\s*\{/);
  assert.match(css,/\.sim-shell \.inspector-panel #inspector \.stream-value-unit select\s*\{/);
});
test('las opciones y campos dinámicos conservan sus select nativos',()=>{
  const js=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
  assert.match(js,/function selectField\(/);
  assert.match(js,/<select data-field=/);
});
