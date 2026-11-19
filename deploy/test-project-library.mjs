import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const moduleSource=readFileSync(new URL('../site/project-library.js',import.meta.url),'utf8');
function fixture(){
  const store=new Map(),elements=new Map(),messages=[];
  const get=id=>{if(!elements.has(id))elements.set(id,{onclick:null,addEventListener(){},showModal(){},close(){},replaceChildren(){},textContent:'',append(){}});return elements.get(id)};
  const current={version:1,title:'Mi proceso',compounds:['Water'],model:'Steam Tables (IAPWS-IF97)',nodes:[],edges:[]};
  const context=vm.createContext({localStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,val)},document:{getElementById:get,createElement:()=>({className:'',textContent:'',type:'',onclick:null,append(){}})},crypto:{randomUUID:()=>String(store.size+1)},structuredClone,Date,window:{confirm:()=>true}});
  vm.runInContext(moduleSource,context);
  const library=vm.runInContext('SimProjectLibrary',context);
  library.bind({getGraph:()=>current,hasProject:()=>true,loadGraph:g=>Object.assign(current,g),notice:m=>messages.push(m),closeMenus(){}});
  return {library,store,current,get,messages};
}
test('biblioteca guarda varios procesos y actualiza el activo',()=>{
 const f=fixture();
 assert.ok(f.library.save());
 f.current.title='Segundo nombre';
 f.library.save();
 assert.equal(f.library.read().length,1);
 assert.equal(f.library.read()[0].title,'Segundo nombre');
 f.library.save(true);
 assert.equal(f.library.read().length,2);
});
test('la biblioteca no reemplaza el último borrador del navegador',()=>{
 const f=fixture();
 f.store.set('lemeit-process-v1','borrador previo');
 f.library.save();
 assert.equal(f.store.get('lemeit-process-v1'),'borrador previo');
});
test('reiniciar el proyecto no sobrescribe otra entrada',()=>{
 const f=fixture();f.library.save();
 f.library.resetActive();
 f.current.title='Proyecto nuevo';f.library.save();
 assert.equal(f.library.read().length,2);
});
test('el único título editable es el título del proyecto',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 const exercise=readFileSync(new URL('../site/exercise-editor.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(html,/id="exercise-title"/);
 assert.match(html,/id="project-title"/);
 assert.doesNotMatch(exercise,/\$\('exercise-title'\)/);
 assert.match(app,/delete graph\.exercise\.title/);
 assert.match(html,/Mis proyectos \(este navegador\)/);
});
