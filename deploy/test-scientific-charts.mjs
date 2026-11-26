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
test('dual axis uses independent bounds and disappears without right series',()=>{const svg=fake(),points=[{time_s:0,h:0,q:0},{time_s:5,h:.33,q:10}];chart.render(svg,{points,yLabel:'Nivel [m]',y2Label:'Descarga [kg/s]',series:[{key:'h',name:'Nivel'},{key:'q',name:'Descarga',axis:'right'}]});assert.match(svg.innerHTML,/data-axis="right"/);assert.match(svg.innerHTML,/Descarga \[kg\/s\]/);assert.doesNotMatch(svg.innerHTML,/NaN|Infinity/);chart.render(svg,{points,yLabel:'Nivel [m]',series:[{key:'h',name:'Nivel'}]});assert.doesNotMatch(svg.innerHTML,/data-axis="right"/);});

test('legend symbols match representation and metadata is escaped',()=>{const svg=fake(),points=[{time_s:0,y:1},{time_s:5,y:2}],series=[{key:'y',name:'Masa'}];for(const [connect,markers,style] of [[false,false,'points'],[true,false,'line'],[true,true,'both']]){chart.render(svg,{points,series,connect,markers,subtitle:'Ejemplo <20>',reference:'ΣIM 0.51.1',generated:'Generado: 26/11/2026'});const legend=svg.innerHTML.match(/<g data-legend-style="([^"]+)">([\s\S]*?)<\/g>/);assert.equal(legend[1],style);assert.equal(legend[2].includes('<line'),connect);assert.equal(legend[2].includes('<circle'),markers||!connect);assert.match(svg.innerHTML,/Ejemplo &lt;20&gt;/);assert.match(svg.innerHTML,/ΣIM 0.51.1/);}});

test('independent series styles are reflected in legend',()=>{const svg=fake();chart.render(svg,{points:[{time_s:0,a:0,b:1},{time_s:1,a:1,b:2}],series:[{key:'a',name:'A',connect:true,markers:false},{key:'b',name:'B',connect:false,markers:true,color:'#287a61'}]});assert.match(svg.innerHTML,/data-legend-style="line"/);assert.match(svg.innerHTML,/data-legend-style="points"/);assert.match(svg.innerHTML,/#287a61/);});
