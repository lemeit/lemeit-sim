import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
const start=source.indexOf('function equipmentSpecificationIssues(');
const end=source.indexOf('function failureHints(',start);
assert.ok(start>=0&&end>start);
const rules=source.slice(start,end);
function check(node){const scope=vm.createContext({});vm.runInContext(rules,scope);return [...scope.equipmentSpecificationIssues(node)];}
test('bomba y válvula requieren presión absoluta, y la bomba eficiencia',()=>{
  assert.ok(check({type:'Pump',efficiency_pct:75}).some(x=>/presión absoluta/.test(x)));
  assert.ok(check({type:'Pump',outlet_pressure_kPa:500,efficiency_pct:0}).some(x=>/eficiencia/.test(x)));
  assert.equal(check({type:'Pump',outlet_pressure_kPa:500,efficiency_pct:75}).length,0);
  assert.equal(check({type:'Valve',outlet_pressure_kPa:200}).length,0);
});
test('intercambiador requiere potencia térmica positiva finita',()=>{
  assert.ok(check({type:'HeatExchanger',heat_duty_kW:0}).length);
  assert.ok(check({type:'HeatExchanger',heat_duty_kW:NaN}).length);
  assert.equal(check({type:'HeatExchanger',heat_duty_kW:40}).length,0);
});
test('divisor requiere fracción válida y calentador temperatura objetivo',()=>{
  assert.ok(check({type:'Splitter',split:1}).length);
  assert.equal(check({type:'Splitter',split:0.7}).length,0);
  assert.ok(check({type:'Heater'}).some(x=>/temperatura/.test(x)));
  assert.equal(check({type:'Cooler',outlet_C:30}).length,0);
});
test('reactor requiere parámetros básicos coherentes',()=>{
  const base={type:'ConversionReactor',outlet_C:400,conversion:50,phase:'Vapor',base_compound:'A',stoichiometry:{A:-1,B:1}};
  assert.equal(check(base).length,0);
  assert.ok(check({...base,conversion:150}).some(x=>/conversión/.test(x)));
  assert.ok(check({...base,stoichiometry:{A:1,B:2}}).some(x=>/estequiometría/.test(x)));
});
test('el diagnóstico utiliza las reglas de equipos y aclara su alcance',()=>{
  assert.match(rules,/issues\.push\(\.\.\.equipmentSpecificationIssues\(n\)/);
  assert.match(source,/no un cálculo algebraico completo de grados de libertad/);
});
