import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../../site/diagnostics-console.js',import.meta.url),'utf8');
const sandbox=vm.createContext({Date,globalThis:{}});
vm.runInContext(source,sandbox);
const D=sandbox.globalThis.SimDiagnostics;
const fixture={time:'2026-11-18T22:17:37.338Z',level:'ERROR',event:'Validación de capacidades',engine:'windows',http:200,stage:'preflight',message:'Gateway sin reciclado'};
test('consola solo acepta campos técnicos permitidos y redacta secretos',()=>{
 const entry=D.normalize({...fixture,token:'SUPERSECRETO',password:'PRIVATE',payload:{secret:'PRIVATE'},
   message:'token=abc123 origin_key:123456 Bearer=private https://private.example.com/path'});
 assert.equal(entry.token,undefined);
 assert.equal(entry.payload,undefined);
 assert.equal(entry.password,undefined);
 assert.doesNotMatch(JSON.stringify(entry),/SUPERSECRETO|PRIVATE|abc123|123456|private.example.com/i);
 assert.match(entry.message,/REDACTADO/);
});
test('filtro y retención acotada respetan el orden de los eventos',()=>{
 const events=[];
 for(let i=0;i<107;i++)D.add(events,{...fixture,event:'evento '+i,level:i%2?'INFO':'ERROR'});
 assert.equal(events.length,100);
 assert.equal(events[0].event,'evento 7');
 assert.equal(events.at(-1).event,'evento 106');
 assert.equal(D.show(events,'errors').length,50);
 assert.match(D.line(events.at(-1)),/\[ERROR\].*evento 106/);
});
test('reporte presenta HTTP, etapa y motor, sin datos de proceso ni credenciales',()=>{
 const data=JSON.parse(D.exportReport({project:'Prueba',model:'NRTL',engine:'debian',portalVersion:'0.35.1',review:[],lastCalculation:{time:fixture.time,engine:'windows',state:'failed',http:503,duration_ms:248,message:'token=mysecret Gateway fuera de servicio'},connectionCheck:{state:'online',http:200,ms:32,originKey:'nunca'},gatewayCheck:{version:'0.35.0',ok:true},events:[fixture]}));
 assert.equal(data.events[0].stage,'preflight');
 assert.equal(data.events[0].http,200);
 assert.equal(data.last_calculation.http,503);
 assert.equal(data.gateway.version,'0.35.0');
 assert.doesNotMatch(JSON.stringify(data),/mysecret|originKey|nunca/);
});
test('los scripts de la consola se cargan antes de iniciar app.js',()=>{
 const html=readFileSync(new URL('../../../site/index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('src="diagnostics-console.js"')<html.indexOf('src="app.js"'));
 for(const id of ['diagnostics-log','diagnostics-filter','diagnostics-clear','diagnostics-download'])assert.ok(html.includes('id="'+id+'"'));
});
test('el cálculo no registra un POST hasta que pasa la comprobación de capacidades',()=>{
 const app=readFileSync(new URL('../../../site/app.js',import.meta.url),'utf8');
 const i=app.indexOf('async function calculate()');
 const preflight=app.indexOf("const hasRecirculation=diagramHasRecirculation(payload);",i);
 const posted=app.indexOf("simulationRequested=true;",i);
 assert.ok(preflight>=0 && posted>preflight);
 assert.match(app,/traceConnection\(simulationRequested\?'POST \/api\/simulate':'Preflight \/api\/status'/);
});
