import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../../../site/' + path,import.meta.url),'utf8');
const projects = ['mix','HeaterWater','CoolerWater','SplitterWater','WaterEthanol','MulticomponentBalance','ConversionReactor','EquilibriumReactor','ThermalNetwork','AmmoniaBypass','FlashDrum','PumpValve','HeatExchangerWater'];
const close = (a,b,tol=1e-9) => assert.ok(Math.abs(a-b)<tol,`Se esperaba ${b} pero se obtuvo ${a}`);

test('menú, selector y guía incluyen los trece ejemplos en orden',()=>{
  const index=read('index.html'),guide=read('ejemplos.html');
  const positions=projects.map(id=>{
    assert.ok(index.includes(`<option value="${id}">`),`Falta la opción ${id}`);
    assert.ok(index.includes(`data-example="${id}"`),`Falta el botón ${id}`);
    assert.ok(guide.includes(`href="examples/${id}.json"`),`Falta descarga ${id}`);
    return index.indexOf(`data-example="${id}"`);
  });
  assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
  for(let i=5;i<projects.length;i++)assert.ok(guide.includes(`id="${projects[i]}"`));
});

test('caso 06 utiliza operaciones admitidas y conexiones únicas',()=>{
  const g=JSON.parse(read('examples/MulticomponentBalance.json'));
  assert.equal(g.version,1);assert.equal(g.model,'NRTL');
  assert.deepEqual(g.compounds,['Water','Ethanol','Acetone']);
  assert.equal(g.nodes.length,11);
  assert.equal(g.edges.length,10);
  assert.equal(g.nodes.filter(n=>n.type==='Mixer').length,2);
  assert.equal(g.nodes.filter(n=>n.type==='Splitter').length,1);
  const byId=new Map(g.nodes.map(n=>[n.id,n]));
  assert.equal(byId.size,g.nodes.length);
  const occupied=new Set();
  for(const edge of g.edges){
    const a=byId.get(edge.from),b=byId.get(edge.to);
    assert.ok(a&&b);
    assert.notEqual(a.type.endsWith('Stream'),b.type.endsWith('Stream'));
    for(const key of [`${edge.from}:out:${edge.fromIndex??0}`,`${edge.to}:in:${edge.toIndex??0}`]){
      assert.ok(!occupied.has(key),`Puerto duplicado: ${key}`);
      occupied.add(key);
    }
  }
  assert.equal(byId.get('d1').split,0.6);
  assert.equal(g.edges.filter(e=>e.to==='m1').length,3);
  assert.equal(g.edges.filter(e=>e.to==='m2').length,2);
  for(const n of g.nodes.filter(n=>n.type==='MaterialStream'&&!g.edges.some(e=>e.to===n.id))){
    assert.deepEqual(Object.keys(n.composition).sort(),[...g.compounds].sort());
    close(Object.values(n.composition).reduce((a,b)=>a+b),1);
  }
});

test('caso 06 resuelve el sistema inverso y conserva cada componente',()=>{
  const g=JSON.parse(read('examples/MulticomponentBalance.json'));
  const feed=id=>g.nodes.find(n=>n.id===id);
  const x=feed('f2').mass_flow,y=feed('f3').mass_flow;
  // Dos especificaciones independientes: agua 41,5 %, etanol 35 % en S1.
  close(.265*x+.315*y,.285);
  close(.35*x-.15*y,.15);
  const det=.265*(-.15)-.315*.35;
  assert.ok(Math.abs(det)>1e-8);
  const xSolve=(.285*(-.15)-.315*.15)/det;
  const ySolve=(.265*.15-.35*.285)/det;
  close(xSolve,.6);close(ySolve,.4);
  const component=id=>g.compounds.map(c=>feed(id).mass_flow*feed(id).composition[c]);
  const f1=component('f1'),f2=component('f2'),f3=component('f3'),f4=component('f4');
  const s1=f1.map((v,i)=>v+f2[i]+f3[i]);
  const p1=s1.map(v=>.6*v);
  const p2=s1.map((v,i)=>.4*v+f4[i]);
  [s1,p1,p2].forEach((values,i)=>values.forEach((v,j)=>close(v,[[.83,.7,.47],[.498,.42,.282],[.382,.43,.488]][i][j])));
  close(p1.reduce((a,b)=>a+b),1.2);
  close(p2.reduce((a,b)=>a+b),1.3);
  for(let i=0;i<3;i++)close(f1[i]+f2[i]+f3[i]+f4[i],p1[i]+p2[i]);
});

test('los reactores de conversión y equilibrio conservan sus proyectos descargables',()=>{
  const conversion=JSON.parse(read('examples/ConversionReactor.json'));
  const equilibrium=JSON.parse(read('examples/EquilibriumReactor.json'));
  assert.ok(conversion.nodes.some(n=>n.type==='ConversionReactor'));
  assert.ok(equilibrium.nodes.some(n=>n.type==='EquilibriumReactor'));
  assert.ok(conversion.nodes.find(n=>n.type==='ConversionReactor').conversion===50);
  assert.ok(equilibrium.nodes.find(n=>n.type==='EquilibriumReactor').stoichiometry.Ammonia===2);
  assert.ok(read('ejemplos.html').includes('no se impone como en un reactor de conversión'));
});

test('la guía distingue referencias analíticas de ejemplos DWSIM verificados',()=>{
  const guide=read('ejemplos.html');
  assert.match(guide,/resultados de referencia calculados con DWSIM/);
  assert.match(guide,/referencias de materia verificadas analíticamente/i);
  assert.doesNotMatch(guide.split('<section id="TankFillingDynamic">')[0],/Windows|Debian/);
  assert.match(guide,/id="TankFillingDynamic"/);
  assert.match(guide,/no mediciones experimentales/i);
  assert.match(guide,/modelo termodinámico/i);
});

test('cada ejercicio 01–13 conserva una resolución numerada paso a paso',()=>{
 const guide=read('ejemplos.html');
 for(const id of projects){
  const section=guide.split(`<section id="${id}">`)[1]?.split('</section>')[0];
  assert.ok(section?.includes('Resolución paso a paso'),id);
  assert.ok((section.match(/<ol>/g)||[]).length>=1,id);
  assert.ok((section.match(/<li>/g)||[]).length>=4,id);
 }
});

test('caso 11 flash NRTL conecta entrada, vapor y líquido y documenta residuo del motor',()=>{
 const g=JSON.parse(read('examples/FlashDrum.json'));
 const guide=read('ejemplos.html'),app=read('app.js');
 assert.equal(g.model,'NRTL');
 assert.deepEqual(g.compounds,['Water','Ethanol']);
 assert.equal(g.nodes.find(n=>n.id==='flash').type,'Separator');
 assert.deepEqual(g.edges.filter(e=>e.from==='flash').map(e=>e.fromIndex).sort(),[0,1]);
 assert.match(guide,/7,131099×10⁻⁶/);
 assert.match(guide,/1,171057×10⁻⁵/);
 assert.match(app,/Separator: \{label:'Separador flash'/);
});

test('caso 12 bomba y válvula, catálogo y referencias didácticas consistentes',()=>{
 const graph=JSON.parse(read('examples/PumpValve.json'));
 const guide=read('ejemplos.html');
 const catalog=read('catalogo.html');
 assert.equal(graph.model,'Steam Tables (IAPWS-IF97)');
 assert.equal(graph.nodes.find(n=>n.type==='Pump').outlet_pressure_kPa,500);
 assert.equal(graph.nodes.find(n=>n.type==='Pump').efficiency_pct,75);
 assert.equal(graph.nodes.find(n=>n.type==='Valve').outlet_pressure_kPa,200);
 assert.match(guide,/id="PumpValve"/);
 assert.match(guide,/Entalpía de válvula/);
 assert.ok(catalog.includes('<td>Pump</td><td>Disponible · 0.11.0'));
 assert.ok(catalog.includes('<td>Valve</td><td>Disponible · 0.11.0'));
});

test('caso 13 intercambiador con dos entradas, dos salidas y resultados térmicos Debian',()=>{
 const graph=JSON.parse(read('examples/HeatExchangerWater.json'));
 const guide=read('ejemplos.html'),catalog=read('catalogo.html');
 const hx=graph.nodes.find(n=>n.type==='HeatExchanger');
 assert.equal(hx.heat_duty_kW,40);
 assert.deepEqual(graph.edges.filter(e=>e.to==='hx').map(e=>e.toIndex).sort(),[0,1]);
 assert.deepEqual(graph.edges.filter(e=>e.from==='hx').map(e=>e.fromIndex).sort(),[0,1]);
 assert.match(guide,/id="HeatExchangerWater"/);
 assert.match(guide,/0,00000033 kW/);
 assert.ok(catalog.includes('<td>HeatExchanger</td><td>Disponible · 0.12.0'));
});
