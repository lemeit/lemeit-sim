import test from 'node:test';
import assert from 'node:assert/strict';
import '../site/chart-data.js';
const {stationary,parse}=globalThis.SimChartData;
test('results from any stationary example populate currents, balances and components without fictitious time',()=>{
 const graph={nodes:[{id:'a',name:'Entrada'},{id:'b',name:'Salida'}],compounds:['Water']};
 const result={streams:{a:{temperature_K:293.15,pressure_Pa:101325,mass_flow_kg_s:1,phases:[{name:'Mixture',density_kg_m3:1000,compounds:{Water:{mass_fraction:1}}}]},b:{temperature_K:353.15,mass_flow_kg_s:2}},balances:[{id:'m',mass_in:2,mass_out:2,mass_residual:0,components:{Water:{in_kg_s:2,out_kg_s:2,residual_kg_s:0}}}]};
 const [s,b,c]=stationary(graph,result,'debian');assert.equal(s.points.length,2);assert.equal(s.points[0].temperature,20);assert.equal(s.points[0].volume,.001);assert.equal(s.points[0].w0,1);assert.equal(s.points[1].pressure,null);assert.equal(b.points[0].residual,0);assert.equal(c.points.length,1);assert.ok(!s.columns.some(c=>c.key==='time_s'));assert.deepEqual(stationary(graph,null),[]);
});
test('experimental numeric CSV and decimal comma TSV, missing data and malformed rows',()=>{
 const d=parse('Tiempo [s];Concentración [mol/L]\n0;1,25\n5;0,5');assert.equal(d.points[0].c1,1.25);assert.equal(d.columns[1].unit,'mol/L');
 assert.equal(parse('X\tY\n1\t2,5').points[0].c1,2.5);assert.throws(()=>parse('X;Y\n1;abc'),/no numérico/);assert.throws(()=>parse('X;Y\n1'),/columnas/);
});