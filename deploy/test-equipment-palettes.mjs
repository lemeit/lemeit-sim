import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../site/equipment-palettes.js',import.meta.url),'utf8');
function setup(saved,blocked=false){const values=new Map([['lemeit-visual-palette-v1',saved]]),events={};const env={localStorage:{getItem:k=>{if(blocked)throw Error();return values.get(k);},setItem:(k,v)=>{if(blocked)throw Error();values.set(k,v);}},addEventListener:(k,f)=>events[k]=f};runInNewContext(source,env);return {manager:env.SimEquipmentPalettes,values,events};}
test('preferencia válida persiste, ignora valores desconocidos y soporta almacenamiento bloqueado',()=>{const {manager,values}=setup('invalid');assert.equal(manager.current,'sim');assert.equal(manager.select('invalid'),false);manager.select('dwsim');assert.equal(values.get('lemeit-visual-palette-v1'),'dwsim');assert.equal(setup('dwsim').manager.current,'dwsim');const blocked=setup(null,true).manager;assert.doesNotThrow(()=>blocked.select('dwsim'));assert.equal(blocked.current,'dwsim');});
test('sincroniza ventanas y permite cancelar suscripciones sin bucles',()=>{const {manager,events}=setup('sim');let calls=0;const off=manager.subscribe(()=>calls++);events.storage({key:'lemeit-visual-palette-v1',newValue:'dwsim'});assert.equal(manager.current,'dwsim');assert.equal(calls,1);manager.select('dwsim');assert.equal(calls,1);off();manager.select('sim');assert.equal(calls,1);});
const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
const types=app.match(/const TYPES = ([\s\S]*?);/)[1];
const originals=app.slice(app.indexOf('function originalEquipmentSymbol'),app.indexOf('function renderPalette'));
const ports=app.slice(app.indexOf('function basePortList'),app.indexOf('function point('));
test('todos los equipos tienen dos apariencias y conservan los puertos, tamaños y proyecto',()=>{
 const {manager}=setup('sim');const env={isStream:n=>n.type.endsWith('Stream'),isReactor:n=>n.type.endsWith('Reactor')};
 runInNewContext('const TYPES='+types+';'+originals+ports+';this.types=TYPES;this.original=originalEquipmentSymbol;this.ports=portList;',env);
 const graph=JSON.parse(readFileSync(new URL('../site/examples/PumpValve.json',import.meta.url),'utf8'));
 const before=JSON.stringify(graph);
 const signatures={};for(const type of Object.keys(env.types).filter(t=>!t.endsWith('Stream'))){signatures[type]=JSON.stringify(env.ports({type,scale:1.7}));assert.equal(manager.symbol(type,env.original),env.original(type));}
 manager.select('dwsim');
 for(const type of Object.keys(signatures)){assert.match(manager.symbol(type,env.original),/<path/);assert.notEqual(manager.symbol(type,env.original),env.original(type));assert.equal(JSON.stringify(env.ports({type,scale:1.7})),signatures[type]);}
 assert.equal(JSON.stringify(graph),before);
 assert.equal(manager.symbol('Unknown',()=>'<fallback/>'),'<fallback/>');
});
test('selector solo repinta y conserva proyecto, selección, vista y resultados calculados',()=>{
 const {manager}=setup('sim');const handlers={};const selector={addEventListener:(name,fn)=>handlers[name]=fn};
 const state={graph:{nodes:[{id:'p',type:'Pump',x:120,y:50,pressure_kPa:500}],edges:[]},result:{streams:{s:{mass_flow:1}}},selection:{node:'p'},zoom:.72,revision:7};
 const snapshot=JSON.stringify(state);let painted=0;
 const env={...state,SimEquipmentPalettes:manager,$:()=>selector,renderPalette:()=>painted++,renderDiagram:()=>painted++,updateControls:()=>painted++};
 runInNewContext(app.slice(app.indexOf('function bindVisualPalette(){'))+';bindVisualPalette();',env);
 selector.value='dwsim';handlers.change();assert.equal(manager.current,'dwsim');assert.equal(painted,3);
 for(const key of Object.keys(state))assert.strictEqual(env[key],state[key]);assert.equal(JSON.stringify(state),snapshot);
});
