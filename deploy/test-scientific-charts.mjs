import test from 'node:test';
import assert from 'node:assert/strict';
import '../site/scientific-charts.js';
const chart=globalThis.SimScientificCharts;
function fake(){return {innerHTML:'',setAttribute(k,v){this[k]=v;}}}
test('scientific axes, labels, units and source use actual points',()=>{
 const svg=fake();chart.render(svg,{points:[{t:0,h:0},{t:60,h:.2339},{t:120,h:.2962}],xKey:'t',xLabel:'Tiempo [s]',yLabel:'Nivel [m]',series:[{key:'h',name:'Nivel'}],index:1,source:'DWSIM MCP',markers:true});
 assert.match(svg.innerHTML,/Nivel \[m\]/);assert.match(svg.innerHTML,/Tiempo \[s\]/);assert.match(svg.innerHTML,/DWSIM MCP/);assert.match(svg.innerHTML,/<path d="M/);assert.doesNotMatch(svg.innerHTML,/NaN|Infinity/);
});
test('logarithmic axes exclude nonpositive values without fabricating points',()=>{
 const svg=fake();chart.render(svg,{points:[{x:0,y:0},{x:1,y:1},{x:2,y:10}],xKey:'x',series:[{key:'y',name:'C'}],logY:true});assert.doesNotMatch(svg.innerHTML,/NaN|Infinity/);
 assert.throws(()=>chart.render(svg,{points:[{x:0,y:0}],xKey:'x',series:[{key:'y',name:'C'}],logY:true}),/datos válidos/);
});
test('signed and missing values are supported without interpolation',()=>{
 const svg=fake();chart.render(svg,{points:[{x:0,y:-1},{x:1,y:null},{x:2,y:2}],xKey:'x',series:[{key:'y',name:'A < B'}]});assert.match(svg.innerHTML,/A &lt; B/);assert.match(svg.innerHTML,/M[\d.]+ [\d.]+ M/);assert.doesNotMatch(svg.innerHTML,/NaN|Infinity/);
});