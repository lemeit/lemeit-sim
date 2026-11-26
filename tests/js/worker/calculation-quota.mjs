import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {authorizeCalculation} from '../../../deploy/auth.mjs';

test('cuota educativa: 12 simulaciones por minuto por sesión, la número 13 responde 429',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(readFileSync(new URL('../../../migrations/0002_calculation_quotas.sql',import.meta.url),'utf8'));
  const env={SIM_AUTH_DB:{prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null}}}}}}};
  const alumno={role:'student',session_digest:'a'.repeat(64)};
  for(let i=0;i<12;i++){const r=await authorizeCalculation(env,alumno);assert.equal(r.ok,true,'Solicitud '+(i+1));}
  const rejected=await authorizeCalculation(env,alumno);
  assert.equal(rejected.ok,false);
  assert.equal(rejected.response.status,429);
  assert.match((await rejected.response.json()).error,/12 cálculos por minuto/);
  const otro=await authorizeCalculation(env,{role:'student',session_digest:'b'.repeat(64)});
  assert.equal(otro.ok,true,'Otra sesión tiene cuota independiente');
  const admin=await authorizeCalculation(env,{role:'admin',session_digest:'admin'});
  assert.equal(admin.ok,true,'El administrador no consume cuota educativa');
 }finally{db.close();}
});
