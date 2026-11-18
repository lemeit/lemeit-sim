import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const load=file=>readFileSync(new URL('../site/'+file,import.meta.url),'utf8');
const ctx={};runInNewContext(load('engine-compatibility.js'),ctx);
const compat=ctx.SimEngineCompatibility;
const windows={gateway_version:'0.33.0',supported_equipment:['MaterialStream','Mixer','Expander','Pump']};
const debian={gateway_version:'0.19.0',supported_equipment:['MaterialStream','Mixer','Pump']};

test('compara versiones semánticas sin interpretar versiones desconocidas como antiguas',()=>{
 assert.equal(compat.compareVersions('0.19.0','0.33.0'),'older');
 assert.equal(compat.compareVersions('0.33.0','0.33.0'),'same');
 assert.equal(compat.compareVersions('1.0.0','0.33.0'),'newer');
 assert.equal(compat.compareVersions('desconocida','0.33.0'),'unknown');
});
test('distingue capacidades ausentes de estados no confirmados',()=>{
 assert.equal(compat.capability(windows,'Expander'),'supported');
 assert.equal(compat.capability(debian,'Expander'),'unsupported');
 assert.equal(compat.capability(null,'Expander'),'unknown');
 assert.equal(compat.capability({supported_equipment:'Expander'},'Expander'),'unknown');
 assert.equal(compat.missing(null,['Expander']),null);
 assert.equal(JSON.stringify(compat.missing(debian,['Mixer','Expander'])),JSON.stringify(['Expander']));
});
test('matriz de operaciones compara ambos gateways sin inventar respuestas',()=>{
 const rows=compat.comparison(windows,debian);
 const expander=rows.find(x=>x.type==='Expander');
 assert.equal(expander.windows,'supported');
 assert.equal(expander.debian,'unsupported');
 const unknown=compat.comparison(windows,null).find(x=>x.type==='Expander');
 assert.equal(unknown.windows,'supported');
 assert.equal(unknown.debian,'unknown');
 assert.ok(rows.some(x=>x.type==='HeatExchanger'));
 assert.ok(rows.some(x=>x.type==='EquilibriumReactor'));
 assert.ok(rows.some(x=>x.type==='simple_material_recycle'));
 assert.equal(compat.capability({supported_equipment:[],supported_features:['simple_material_recycle']},'simple_material_recycle'),'supported');
 assert.equal(compat.capability({supported_equipment:[]},'simple_material_recycle'),'unsupported');
});
test('monitor en las dos vistas consulta la API y muestra diferencias en una tabla de solo lectura',()=>{
 for(const page of ['index.html','admin.html']){
   const html=load(page);
   assert.match(html,/id="engine-compat-table"/);
   assert.match(html,/id="engine-compat-summary"/);
   assert.ok(html.indexOf('engine-compatibility.js')<html.indexOf('engines-monitor.js'));
   const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
   assert.ok(html.includes('data-portal-version="'+version+'"'));
 }
 const script=load('engines-monitor.js');
 assert.match(script,/lastStatus\[engine\]=null/);
 assert.match(script,/lastStatus\[engine\]=\{gateway_version/);
 assert.match(script,/renderCompatibility\(\)/);
 assert.match(script,/fetch\('\/api\/status'/);
 assert.doesNotMatch(script,/method\s*:\s*['"]POST/);
});
