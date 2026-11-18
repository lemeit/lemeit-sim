import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read = name => readFileSync(new URL('../site/' + name, import.meta.url), 'utf8');
const app = read('app.js');
const source = read('dwsim-symbols.js');
const symbols = runInNewContext(source + ';DwsimSymbols');
const types = runInNewContext(app.slice(0, app.indexOf('const isReactor')) + ';TYPES', {});

test('PFD y biblioteca comparten los símbolos de DWSIM y retiran la preferencia anterior', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /visual-palette|equipment-palettes/);
  assert.ok(html.indexOf('dwsim-symbols.js') < html.indexOf('app.js'));
  assert.match(app, /localStorage.removeItem\('lemeit-visual-palette-v1'\)/);
  for (const [type, dimensions] of Object.entries(types)) {
    const {w, h} = dimensions;
    const equipment = symbols.equipment(type, w, h);
    assert.doesNotMatch(equipment, /undefined|NaN/, type);
    if(type==='EnergyStream')assert.match(symbols.thumbnail(type, dimensions),/stroke-dasharray=/);else assert.ok(symbols.thumbnail(type, dimensions).includes(equipment), type);
  }
});

test('las flechas de corriente siguen el tramo y conservan su extremo', () => {
  const transform = symbols.arrowTransform({a:{x:20,y:50}, b:{x:20,y:20}, length:30}, 'out');
  assert.equal(transform, 'translate(20 20) rotate(-90) scale(0.3) translate(-100 -50)');
  assert.match(symbols.arrow(transform), /M0 35 H65 V25 L100 50 L65 75 V65 H0 Z/);
});
