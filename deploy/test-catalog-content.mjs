import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../site/'+path,import.meta.url),'utf8');
const rows=[...read('catalogo.html').matchAll(/<tr><td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g)]
  .map(([,label,engine,status])=>({label,engine,status}));
const byEngine=new Map(rows.map(row=>[row.engine,row]));
const app=read('app.js');

test('el catálogo enumera equipos que aparecen en la biblioteca',()=>{
  const types={
    Mixer:'Mixer',Splitter:'Splitter',Heater:'Heater',Cooler:'Cooler',
    Separator:'Vessel',Tank:'Tank',Expander:'Expander',Compressor:'Compressor',Pump:'Pump',Valve:'Valve',HeatExchanger:'HeatExchanger',
    ConversionReactor:'ConversionReactor',EquilibriumReactor:'EquilibriumReactor'
  };
  for(const [type,engine] of Object.entries(types)){
    assert.match(app,new RegExp('\\b'+type+': \\{label:'));
    assert.ok(byEngine.has(engine),`El catálogo no enumera ${type}/${engine}`);
  }
});

test('el catálogo refleja equipos validados en Debian',()=>{
  assert.match(byEngine.get('Vessel').status,/Disponible.*0\.10\.0/);
  for(const name of ['Pump','Valve']){
    assert.match(byEngine.get(name).status,/Disponible.*0\.11\.0/);
    assert.doesNotMatch(byEngine.get(name).status,/En desarrollo/);
  }
});

test('intercambiador declara validación Debian de 0.12.0',()=>{
  assert.match(byEngine.get('HeatExchanger').status,/Disponible.*0\.12\.0/);
});

test('cada objeto aparece exactamente una vez en el catálogo',()=>{
  assert.equal(byEngine.size,rows.length);
});
