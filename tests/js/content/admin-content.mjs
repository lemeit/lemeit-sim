import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../../../site/'+file,import.meta.url),'utf8');
test('panel de diagnostico visible y enlazado',()=>{
 const html=read('admin.html'),editor=read('index.html'),js=read('engines-monitor.js');
 assert.match(editor,/id="services-button"/);
 assert.match(editor,/<dialog id="services-dialog"/);
 assert.match(editor,/id="admin-nav-link"[^>]*hidden/);
 assert.match(html,/id="windows"/);
 assert.match(html,/id="debian"/);
 assert.match(js,/\/api\/status/);
 assert.match(js,/Promise\.all\(\[check\('windows'\),check\('debian'\)\]\)/);
});
test('panel no ofrece acciones de administracion remota',()=>{
 const html=read('admin.html'),js=read('engines-monitor.js');
 assert.doesNotMatch(js,/fetch\([^\n]*\/api\/(restart|stop|start)/i);
 assert.doesNotMatch(js,/method:\s*['"]POST/i);
 assert.match(html,/solo lectura/);
});
