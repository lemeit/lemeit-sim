import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../site/' + path,import.meta.url),'utf8');
const projects = ['mix','HeaterWater','CoolerWater','SplitterWater','WaterEthanol','MulticomponentBalance','ConversionReactor','EquilibriumReactor'];
const close = (a,b,tol=1e-9) => assert.ok(Math.abs(a-b)<tol,`Se esperaba ${b} pero se obtuvo ${a}`);

test('menú, selector y guía incluyen los ocho ejemplos en orden',()=>{
  const index=read('index.html'),guide=read('ejemplos.html');
  const positions=projects.map(id=>{
    assert.ok(index.includes(`<option value="${id}">`),`Falta la opción ${id}`);
    assert.ok(index.includes(`data-example="${id}"`),`Falta el botón ${id}`);
    assert.ok(guide.includes(`href="examples/${id}.json"`),`Falta descarga ${id}`);
    return index.indexOf(`data-example="${id}"`);
  });
  assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
  for(let i=5;i<8;i++)assert.ok(guide.includes(`id="${projects[i]}"`));
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
  assert.match(guide,/casos 01–05 tienen resultados numéricos previamente contrastados/);
  assert.match(guide,/referencias de materia verificadas analíticamente/i);
  assert.match(guide,/motor Windows/);
  assert.match(guide,/sin comparación independiente con la API de escritorio/i);
  assert.match(guide,/Debian no se probó/);
});
