import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

const code=await readFile(new URL('../site/tank-dynamics.js',import.meta.url),'utf8');
const sandbox={};
runInNewContext(code,sandbox);
const tank=sandbox.SimTankDynamics;
const defaults={capacityM3:5,areaM2:2.5,densityKgM3:997,initialVolumeM3:0.5,
  inflowKgS:1,outflowKgS:0,durationS:6000,stepS:20,outletMode:'constant'};

test('Dinámica: llenado de 0,5 a 5 m³ conserva masa y detecta volumen máximo',()=>{
 const run=tank.simulate(defaults);
 assert.equal(run.source,'sim-simplified-tank');
 assert.equal(run.event,'lleno');
 assert.ok(Math.abs(run.simulatedDurationS-4486.5)<1e-7);
 assert.ok(Math.abs(run.points.at(-1).volume_m3-5)<1e-9);
 assert.ok(Math.abs(run.massResidualKg)<1e-7);
 assert.ok(run.points.every((p,i)=>i===0||p.time_s>=run.points[i-1].time_s));
 assert.ok(run.points.every(p=>p.volume_m3>=0&&p.volume_m3<=5));
});

test('Dinámica: tanque con igual entrada y salida mantiene volumen',()=>{
 const run=tank.simulate({...defaults,outflowKgS:1,durationS:1200});
 assert.equal(run.event,null);
 assert.equal(run.completed,true);
 assert.ok(run.points.every(p=>Math.abs(p.volume_m3-0.5)<1e-10));
 assert.ok(Math.abs(run.massResidualKg)<1e-10);
});

test('Dinámica: vaciado hasta cero detiene la integración',()=>{
 const run=tank.simulate({...defaults,inflowKgS:0,outflowKgS:2,initialVolumeM3:1});
 assert.equal(run.event,'vacío');
 assert.ok(Math.abs(run.simulatedDurationS-498.5)<1e-7);
 assert.equal(run.points.at(-1).volume_m3,0);
 assert.ok(Math.abs(run.massResidualKg)<1e-7);
});

test('Dinámica: descarga por gravedad reduce caudal a medida que disminuye nivel',()=>{
 const run=tank.simulate({...defaults,outletMode:'gravity',inflowKgS:0,initialVolumeM3:2,outletAreaM2:0.0005,durationS:300,stepS:1});
 assert.ok(run.points.length>1);
 assert.ok(run.points.at(-1).volume_m3<2);
 assert.ok(run.points.at(-1).outlet_m3_s<run.points[0].outlet_m3_s);
 assert.ok(Math.abs(run.massResidualKg)<1e-7);
});

test('Dinámica: valida parámetros físicos y límite de intervalos',()=>{
 for(const bad of [
   {capacityM3:0},{initialVolumeM3:6},{densityKgM3:-1},{stepS:0},
   {stepS:0.001},{outletMode:'arbitrary'},{inflowKgS:-5},
 ]){
   assert.throws(()=>tank.simulate({...defaults,...bad}));
 }
});

test('Dinámica: CSV numérico en español distingue explícitamente el modelo',()=>{
 const run=tank.simulate({...defaults,durationS:20,stepS:10});
 const csv=tank.csv(run);
 assert.ok(csv.startsWith('\uFEFFModelo;Didáctico ΣIM (no DWSIM)'));
 assert.match(csv,/Tiempo \[s\];Volumen \[m3\];Nivel \[m\]/);
 assert.match(csv,/0;0,5;0,2/);
 assert.equal(csv.trim().split('\r\n').length,6);
});
