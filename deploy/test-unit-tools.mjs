import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({});
for(const file of ['unit-tools.js','stream-properties.js'])vm.runInContext(readFileSync(new URL('../site/'+file,import.meta.url),'utf8'),context);
const U=context.SimUnits,S=context.SimproxStreams;
const near=(a,b,tol=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,`${a} != ${b}`);
test('temperatura absoluta, Rankine y diferencias usan desplazamientos correctos',()=>{
 near(U.convert('temperature',0,'°C','K'),273.15);near(U.convert('temperature',32,'°F','°C'),0);near(U.convert('temperature',0,'°C','°R'),491.67);near(U.convert('delta_temperature',10,'Δ°C','Δ°F'),18);
});
test('referencias anglosajonas se convierten a SI con definiciones identificadas',()=>{
 near(U.convert('mass',1,'lb','kg'),.45359237);near(U.convert('volume',1,'gal US','L'),3.785411784);near(U.convert('volume',1,'gal imp','L'),4.54609);near(U.convert('power',1,'hp mec','W'),745.6998715822702);near(U.convert('enthalpy',1,'Btu/lb','J/kg'),2326,1e-8);near(U.convert('entropy',1,'Btu/(lb·°R)','J/(kg·K)'),4186.8,1e-8);near(U.convert('amount',1,'lbmol','mol'),453.59237);
});
test('presión manométrica requiere referencia y no admite absoluta negativa',()=>{
 near(U.pressure(0,'psi','Pa',true,false),101325);near(U.pressure(1,'bar','kPa',true,false,90000),190);near(U.pressure(101325,'Pa','psi',false,true),0);assert.throws(()=>U.pressure(-20,'psi','Pa',true,false));assert.throws(()=>U.pressure(0,'Pa','Pa',true,false,0));
});
test('conversiones mantienen identidad por dimensión y rechazan familias incompatibles',()=>{
 for(const [key,g] of Object.entries(U.groups)){const first=Object.keys(g.units)[0];for(const unit of Object.keys(g.units)){const value=U.convert(key,123.45,first,unit);near(U.convert(key,value,unit,first),123.45,1e-7);}}
 assert.throws(()=>U.convert('mass_flow',1,'kg/s','mol/s'));assert.throws(()=>U.convert('mass',NaN,'kg','lb'));
});
test('fracciones másicas y molares conservan mezcla y masa molar',()=>{
 const masses=[28.0134,2.01588],mix=U.mixture([.25,.75],masses,'molar');near(mix.M,8.51526);near(mix.w[0]+mix.w[1],1);const back=U.mixture(mix.w,masses,'mass');near(back.y[0],.25);near(back.y[1],.75);assert.throws(()=>U.mixture([.2,.2],masses));assert.throws(()=>U.mixture([.5,.5],[0,2]));
});
test('presiones parciales cierran P y concentración ideal queda dimensionalmente definida',()=>{
 const p=U.partials([.25,.75],200000,300);near(p[0].pressure_Pa,50000);near(p.reduce((s,v)=>s+v.pressure_Pa,0),200000);near(p[1].ideal_concentration_mol_m3,150000/(8.31446261815324*300));assert.throws(()=>U.partials([.5,.5],100000,0));
});
test('cambiar sistema no reinterpreta los números canónicos ni las unidades particulares',()=>{
 const n={temperature_C:25,pressure_kPa:101.325,mass_flow:1,units:{pressure_kPa:'bar'}},before=JSON.stringify(n);S.setSystem('english');near(S.fromCanonical('temperature_C',n.temperature_C,S.unit(n,'temperature_C')),77);near(S.fromCanonical('pressure_kPa',n.pressure_kPa,S.defaultUnit('pressure_kPa')),14.6959487755,1e-8);near(S.fromCanonical('molar_flow',1,'lbmol/h'),3600/453.59237);assert.equal(S.unit(n,'pressure_kPa'),'bar');assert.equal(JSON.stringify(n),before);S.setSystem('si');assert.equal(S.defaultUnit('temperature_C'),'K');assert.equal(S.defaultUnit('power_kW'),'W');
});

test('catálogo exportado contiene masas reales finitas y distingue faltantes',()=>{
 const data=JSON.parse(readFileSync(new URL('../site/compound-masses.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(data.masses).length,1601);assert.equal(data.unavailable.length,19);
 assert.ok(Object.values(data.masses).every(m=>Number.isFinite(m)&&m>0));
 for(const [c,m] of Object.entries({Water:18.01528,Ethanol:46.06844,Acetone:58.07914,Nitrogen:28.0134,Hydrogen:2.01588,Ammonia:17.03052}))near(data.masses[c],m,1e-8);
 for(const c of data.unavailable)assert.ok(!Object.hasOwn(data.masses,c));
});
