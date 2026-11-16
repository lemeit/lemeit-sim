import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const js=readFileSync(new URL('../site/context-help.js',import.meta.url),'utf8');
const env={};runInNewContext(js,env);
const help=env.SimContextHelp;
test('todos los objetos del editor disponen de vínculo al capítulo correspondiente',()=>{
  const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
  const keys=[...app.matchAll(/^  (\w+): \{label:/gm)].map(m=>m[1]);
  assert.equal(keys.length,12);
  for(const key of keys){
    const h=help.get(key);
    assert.ok(h, 'Falta ayuda para '+key);
    assert.match(h.url,/^https:\/\/wiki\.lemeit\.ar\/sim\/[a-z-]+\/$/);
    assert.match(help.link(key),/rel="noopener noreferrer"/);
    assert.ok(help.link(key).includes('>'+h.title+' ↗</a>'));
    assert.ok(!help.link(key).includes('Aprender:'));
  }
});
test('tipos desconocidos no generan enlaces ni HTML dinámico',()=>{
  assert.equal(help.get('Unknown'),null);
  assert.equal(help.link('<script>'),'');
});
test('vínculos para diagnóstico, conexiones, propiedades y especificaciones',()=>{
  for(const key of ['specifications','properties','connections','validation']){
    assert.match(help.chapter(key).url,/^https:\/\/wiki\.lemeit\.ar\/sim\//);
  }
});
test('orden de scripts: ayuda disponible antes del editor',()=>{
  const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('context-help.js')>0&&html.indexOf('context-help.js')<html.indexOf('app.js'));
  assert.match(html,/Fundamentos y ejercicios · Wiki/);
  assert.match(html,/Manual de uso/);
});
