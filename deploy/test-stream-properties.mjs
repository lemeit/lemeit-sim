import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../site/stream-properties.js',import.meta.url),'utf8'),context);const S=context.SimproxStreams;
test('unidades conservan valores físicos y convierten temperatura con desplazamiento',()=>{assert.ok(Math.abs(S.toCanonical('temperature_C',32,'°F'))<1e-10);assert.equal(S.toCanonical('temperature_C',273.15,'K'),0);assert.equal(S.toCanonical('mass_flow',3600,'kg/h'),1);assert.equal(S.toCanonical('pressure_kPa',1,'bar'),100);assert.equal(S.toCanonical('vapor_fraction',25,'%'),.25);for(const [key,choices] of Object.entries(S.units))for(const u of Object.keys(choices)){assert.ok(Math.abs(S.toCanonical(key,S.fromCanonical(key,123.456,u),u)-123.456)<1e-8);}});
test('se validan solo las propiedades independientes seleccionadas',()=>{const n={flash_spec:'PH',pressure_kPa:101.325,enthalpy_kJ_kg:200,mass_flow:1,composition:{Water:1}};assert.equal(S.issues(n,['Water']).length,0);assert.ok(S.issues({...n,flash_spec:'TP'},['Water']).length);assert.ok(S.issues({...n,flash_spec:'PV',vapor_fraction:1.5},['Water']).length);assert.ok(S.issues({...n,composition:{Water:NaN}},['Water']).length);});
