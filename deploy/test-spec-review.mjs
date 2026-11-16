// Pruebas puras del diagnóstico previo de puertos; no requieren DWSIM.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../site/app.js', import.meta.url), 'utf8');
const start = source.indexOf('function reviewGraph(){');
const end = source.indexOf('function failureHints(', start);
assert.ok(start >= 0 && end > start, 'reviewGraph debe estar definido');

function issuesFor(nodes, edges) {
  const graph = { nodes, edges, model: 'NRTL', compounds: ['Water'] };
  const ctx = {
    hasProject: true, graph,
    isFeed: n => n.type === 'MaterialStream' && !edges.some(e => e.to === n.id),
    isStream: n => n.type.endsWith('Stream'),
    isReactor: n => ['ConversionReactor', 'EquilibriumReactor'].includes(n.type),
    nodeById: id => nodes.find(n => n.id === id),
    equipmentSpecificationIssues: () => [],
    SimproxStreams: { issues: () => [] },
  };
  return runInNewContext(source.slice(start, end) + '\nreviewGraph()', ctx);
}
const node = (id, type) => ({id, type, name:id});
const edge = (from,to,fromIndex=0,toIndex=0) => ({from,to,fromPort:'out',toPort:'in',fromIndex,toIndex});

test('bomba sin salida: el diagnóstico pide exactamente una', () => {
  const warnings=issuesFor([node('F','MaterialStream'),node('P','Pump')],[edge('F','P')]);
  assert.ok(warnings.some(w=>w.includes('P: conectá una salida de materia')));
});
test('intercambiador con una alimentación: exige ambas', () => {
  const nodes=[node('F','MaterialStream'),node('HX','HeatExchanger'),node('O1','MaterialStream'),node('O2','MaterialStream')];
  const warnings=issuesFor(nodes,[edge('F','HX'),edge('HX','O1'),edge('HX','O2',1)]);
  assert.ok(warnings.some(w=>w.includes('HX: conectá dos alimentaciones')));
  assert.ok(!warnings.some(w=>w.includes('HX: conectá las dos salidas')));
});
test('divisor con una sola salida: exige las dos', () => {
  const warnings=issuesFor([node('F','MaterialStream'),node('D','Splitter'),node('O','MaterialStream')],[edge('F','D'),edge('D','O')]);
  assert.ok(warnings.some(w=>w.includes('D: conectá las dos salidas')));
});
test('mezclador con una entrada y una salida: conexión admitida', () => {
  const warnings=issuesFor([node('F','MaterialStream'),node('M','Mixer'),node('O','MaterialStream')],[edge('F','M'),edge('M','O')]);
  assert.equal(warnings.length,0);
});
