import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../site/'+path,import.meta.url),'utf8');
const html=read('index.html'),js=read('app.js');

test('el menú de herramientas conserva configuración y diagnóstico del proyecto',()=>{
  assert.match(html,/id="settings-button"/);
  assert.match(html,/id="settings-dialog"/);
  assert.match(html,/id="diagnostics-button"/);
  assert.match(js,/\$\('settings-button'\)\.onclick/);
});
test('monitor de motor accesible desde indicador del pie de página',()=>{
  assert.match(html,/id="connection-monitor-button"/);
  assert.match(html,/id="server-dialog"/);
  assert.match(js,/\$\('connection-monitor-button'\)\.onclick/);
  assert.doesNotMatch(js,/\$\('server-status-button'\)/);
});
test('referencias a elementos de menú existentes',()=>{
  const bind=js.slice(js.indexOf('function bindWorkspaceTools(){'));
  for (const [,id] of bind.matchAll(/\$\('([^']+)'\)\.onclick/g)){
    assert.ok(html.includes('id="'+id+'"'),id+' no existe en index.html');
  }
});
