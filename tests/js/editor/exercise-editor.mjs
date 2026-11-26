import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../../site/exercise-editor.js',import.meta.url),'utf8');
function api(){
  const context=vm.createContext({document:{},crypto:{randomUUID:()=> '12345678-1234'}});
  vm.runInContext(source,context);
  return vm.runInContext('SimExerciseEditor',context);
}
test('anotaciones se exportan en SVG escapando HTML',()=>{
 const g={annotations:[{id:'note-1',x:70,y:90,text:'Texto <alerta> & prueba'}]};
 const svg=api().markup(g,true);
 assert.match(svg,/translate\(70 90\)/);
 assert.match(svg,/&lt;alerta&gt; &amp; prueba/);
 assert.doesNotMatch(svg,/<alerta>/);
});
test('proyectos antiguos sin anotaciones siguen siendo válidos',()=>{
 assert.doesNotThrow(()=>api().validate({version:1,nodes:[],edges:[]}));
});
test('datos de anotación inválidos se rechazan',()=>{
 assert.throws(()=>api().validate({annotations:[{id:'note-1',x:NaN,y:0,text:'a'}]}),/Anotación inválida/);
 assert.throws(()=>api().validate({exercise:{statement:'x'.repeat(4001)}}),/Campo didáctico inválido/);
});
test('editor está integrado con persistencia y cambios no físicos',()=>{
 const app=readFileSync(new URL('../../../site/app.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../../../site/index.html',import.meta.url),'utf8');
 assert.match(app,/SimExerciseEditor\.validate\(data\)/);
 assert.match(app,/nonPhysical:\(\)=>changed\(\{physical:false\}\)/);
 assert.match(html,/id="exercise-dialog"/);
 assert.match(html,/exercise-editor\.js/);
});
