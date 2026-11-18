import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../site/engine-routing.js',import.meta.url),'utf8'),context);
const routing=context.SimEngineRouting;
const states={state:'ready',supported_equipment:['MaterialStream','EnergyStream','Mixer','Splitter','Heater','Cooler','Pump','Tank','Compressor','Expander','ConversionReactor','EquilibriumReactor'],supported_features:['simple_material_recycle']};
const example={nodes:[{id:'f',type:'MaterialStream'},{id:'m',type:'Mixer'},{id:'s',type:'MaterialStream'},{id:'d',type:'Splitter'},{id:'r',type:'MaterialStream'}],
edges:[{from:'f',to:'m'},{from:'m',to:'s'},{from:'s',to:'d'},{from:'d',to:'r'},{from:'r',to:'m'}]};
test('auto conserva destino efectivo o prueba alternativo; fijación no conmuta',()=>{
 assert.deepEqual([...routing.order('auto','windows')],['windows','debian']);
 assert.deepEqual([...routing.order('auto','debian')],['debian','windows']);
 assert.deepEqual([...routing.order('windows','debian')],['windows']);
});
test('los motores antiguos no reciben reciclado y un gateway con la capacidad sí',()=>{
 assert.equal(routing.supports(states,example),true);
 assert.equal(routing.supports({...states,supported_features:[]},example),false);
 assert.equal(routing.supports({...states,state:'offline'},example),false);
 assert.equal(routing.supports({...states,supported_equipment:states.supported_equipment.filter(x=>x!=='Splitter')},example),false);
 assert.equal(routing.supports({...states,supported_features:[]},{nodes:[{id:'h',type:'Heater'}],edges:[]}),true);
});
test('la interfaz permite modo automático a alumnos y control administrativo al rol correcto',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 const session=readFileSync(new URL('../site/session-banner.js',import.meta.url),'utf8');
 assert.match(html,/value="auto">Automático/);
 assert.match(html,/id="engine-current"/);
 assert.ok(html.indexOf('engine-routing.js')<html.indexOf('app.js'));
 assert.match(app,/engineMode='auto'/);
 assert.match(app,/dataset.sessionRole!=='admin'/);
 assert.match(app,/checkEngine\(\{silent:true,exclude:\[calculationEngine\]\}\)/);
 assert.match(session,/sim-session-role/);
});
