import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handle} from './worker.mjs';
test('recorrido real con SQLite: administrador crea clase, alumno entra y no puede administrar',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const f of ['0001_class_access.sql','0002_calculation_quotas.sql'])db.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
  const d1={prepare(sql){return {bind(...params){return {async first(){return db.prepare(sql).get(...params)||null},async run(){db.prepare(sql).run(...params);return {success:true}},async all(){return {results:db.prepare(sql).all(...params)}}}},async all(){return {results:db.prepare(sql).all()}}}}};
  const env={SIM_AUTH_DB:d1,SIM_SESSION_SECRET:'integration-session-secret-not-for-production',SIM_ADMIN_PASSWORD:'integration-admin-password-not-for-production'};
  const post=(name,body,cookie='')=>handle(new Request('https://sim.test/api/auth/'+name,{method:'POST',headers:{Origin:'https://sim.test','Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)}),env);
  const admin=await post('login',{role:'admin',password:env.SIM_ADMIN_PASSWORD});assert.equal(admin.status,200);const adminCookie=admin.headers.get('Set-Cookie').split(';')[0];
  const created=await post('create-class',{label:'Clase de integración',hours:2},adminCookie);assert.equal(created.status,201);const cls=await created.json();
  const login=await post('login',{role:'student',code:cls.code});assert.equal(login.status,200);const studentCookie=login.headers.get('Set-Cookie').split(';')[0];
  const me=await handle(new Request('https://sim.test/api/auth/me',{headers:{Cookie:studentCookie}}),env);assert.equal((await me.json()).class_name,'Clase de integración');
  for(const operation of ['list-classes','create-class','disable-class'])assert.equal((await post(operation,{id:cls.id,label:'No permitido',hours:2},studentCookie)).status,403);
  const panel=await handle(new Request('https://sim.test/admin.html',{headers:{Cookie:studentCookie}}),env,{'/admin.html':{data:btoa('PRIVADO'),type:'text/html'}});assert.equal(panel.status,302);assert.match(panel.headers.get('Location'),/acceso.html\?role=admin$/);
  assert.equal((await post('disable-class',{id:cls.id},adminCookie)).status,200);
  const revoked=await handle(new Request('https://sim.test/api/auth/me',{headers:{Cookie:studentCookie}}),env);assert.equal((await revoked.json()).authenticated,false);
  assert.equal((await post('logout',{},adminCookie)).status,200);
  const after=await handle(new Request('https://sim.test/api/auth/me',{headers:{Cookie:adminCookie}}),env);assert.equal((await after.json()).authenticated,false);
 }finally{db.close();}
});
