import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=name=>readFileSync(new URL('../../../site/'+name,import.meta.url),'utf8');
test('Archivo ofrece guardado cloud separado de exportación JSON',()=>{
 const html=file('index.html'),app=file('app.js'),cloud=file('cloud-projects.js');
 assert.match(html,/id="cloud-save-menu"/);
 assert.match(html,/id="cloud-projects-open"/);
 assert.match(app,/\$\('cloud-save-menu'\)\.disabled=!hasProject/);
 assert.match(cloud,/\$\('cloud-save-menu'\)\.onclick=/);
 assert.match(cloud,/if\(shouldSave\)await save\(\)/);
});
test('identificación confirma y cierra; error visible junto al formulario',()=>{
 const html=file('index.html'),cloud=file('cloud-projects.js');
 assert.match(html,/id="cloud-identify-message"/);
 assert.doesNotMatch(html,/Los proyectos se guardan en Cloudflare D1 y se recuperan/);
 assert.match(cloud,/\$\('cloud-project-dialog'\)\.close\(\)/);
 assert.match(cloud,/message\.textContent=explanation/);
});
test('botones de cierre y campos de nube tienen estilos específicos',()=>{
 const css=file('style.css');
 assert.match(css,/flex:0 0 34px;width:34px;height:34px/);
 assert.match(css,/#cloud-project-dialog \.exercise-form-body :is\(select,input\):focus-visible/);
 assert.match(css,/#cloud-project-dialog \[hidden\]\{display:none!important\}/);
});

test('Cambiar alumno conserva la clase pero reinicia el espacio local',()=>{
 const html=file('index.html'),cloud=file('cloud-projects.js'),app=file('app.js');
 assert.match(html,/id="cloud-switch-student"/);
 assert.match(cloud,/api\/auth\/release-student/);
 assert.match(cloud,/clearWorkspace\(\)/);
 assert.match(app,/removeItem\('lemeit-process-v1'\)/);
 assert.match(app,/clearWorkspace:\(\)=>clearLoadedProject\(true\)/);
});

test('el rótulo de exportación indica el modelo termodinámico tomado del proyecto',()=>{
 const app=file('app.js'),layout=file('sheet-layout.js');
 assert.match(app,/resultValidity==='valid'&&result\?\.model/);
 assert.match(layout,/MODELO TERMODINÁMICO/);
 assert.match(layout,/model:options\.model\|\|''/);
});
