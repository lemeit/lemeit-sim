import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const report = read('docs/validation/examples-0.8.0-windows.json');
const names = ['ThermalNetwork','AmmoniaBypass'];
const close=(a,b,tol=1e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,`${a} != ${b}`);
for(const name of names)test(`${name}: diagrama compatible, completo y sin puertos duplicados`,()=>{
 const g=read(`site/examples/${name}.json`),ids=new Map(g.nodes.map(n=>[n.id,n]));
 assert.equal(g.nodes.length,15);assert.equal(g.edges.length,15);assert.equal(ids.size,15);
 const ports=new Set(),adj=new Map(g.nodes.map(n=>[n.id,[]]));
 for(const n of g.nodes){assert.ok(n.x>=0&&n.y>=0&&n.x<=3000&&n.y<=2000);assert.ok(n.name.length<=45);}
 for(const e of g.edges){
  assert.ok(ids.has(e.from)&&ids.has(e.to));
  assert.notEqual(ids.get(e.from).type.endsWith('Stream'),ids.get(e.to).type.endsWith('Stream'));
  for(const key of [`${e.from}:${e.fromPort||'out'}:${e.fromIndex||0}`,`${e.to}:${e.toPort||'in'}:${e.toIndex||0}`]){assert.ok(!ports.has(key),key);ports.add(key);}
  adj.get(e.from).push(e.to);
 }
 const active=new Set(),done=new Set();
 function visit(id){assert.ok(!active.has(id),'Recirculación no admitida');if(done.has(id))return;active.add(id);adj.get(id).forEach(visit);active.delete(id);done.add(id);}
 g.nodes.forEach(n=>visit(n.id));
 const feeds=g.nodes.filter(n=>n.type==='MaterialStream'&&!g.edges.some(e=>e.to===n.id));
 for(const n of feeds){const s=report.cases[name].streams[n.id];close(s.mass_flow_kg_s,n.mass_flow);close(s.temperature_C,n.temperature_C);close(s.pressure_Pa,n.pressure_kPa*1000);for(const c of g.compounds)close(s.mass_fractions[c],n.composition[c]);}
});
test('09: cierre independiente por especie y energía usando las corrientes del informe',()=>{
 const g=read('site/examples/ThermalNetwork.json'),s=report.cases.ThermalNetwork.streams,b=report.cases.ThermalNetwork.balances;
 close(s.product.mass_flow_kg_s,2);close(s.hotin.mass_flow_kg_s,1.3);close(s.coldin.mass_flow_kg_s,.7);
 for(const c of g.compounds)close(s.f1.mass_flow_kg_s*s.f1.mass_fractions[c]+s.f2.mass_flow_kg_s*s.f2.mass_fractions[c],s.product.mass_flow_kg_s*s.product.mass_fractions[c]);
 const flux=k=>s[k].mass_flow_kg_s*s[k].enthalpy_kJ_kg;
 const heat=b.filter(u=>['h1','c1'].includes(u.id)).reduce((a,u)=>a+u.heat_to_fluid_kW,0);
 close(flux('product')-flux('f1')-flux('f2'),heat,1e-4);
 close(s.hotout.temperature_C,70,1e-5);close(s.coldout.temperature_C,15,1e-5);
});
test('10: se conservan átomos y producción al diluir con el bypass',()=>{
 const s=report.cases.AmmoniaBypass.streams;
 const atomic=(k,element)=>{const x=s[k].mole_fractions;return s[k].molar_flow_mol_s*(element==='N'?2*x.Nitrogen+x.Ammonia:2*x.Hydrogen+3*x.Ammonia);};
 for(const element of ['N','H'])close(atomic('feed',element),atomic('product',element)+atomic('liquid',element),1e-5);
 const ammonia=k=>s[k].mass_flow_kg_s*s[k].mass_fractions.Ammonia;
 close(ammonia('product')+ammonia('liquid'),ammonia('vapor')+ammonia('liquid'));
 assert.ok(s.product.mass_fractions.Ammonia<s.vapor.mass_fractions.Ammonia);
 assert.ok(report.cases.AmmoniaBypass.checks.reactor_nitrogen_conversion>0);
 close(s.hot.temperature_C,450,1e-5);close(s.cooled.temperature_C,80,1e-5);
});
