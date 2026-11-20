import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handle} from './worker.mjs';
test('recorrido real con SQLite: administrador crea clase, alumno entra y no puede administrar',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const f of ['0001_class_access.sql','0002_calculation_quotas.sql','0003_recoverable_class_codes.sql','0004_student_projects.sql'])db.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
  const d1={prepare(sql){return {bind(...params){return {async first(){return db.prepare(sql).get(...params)||null},async run(){db.prepare(sql).run(...params);return {success:true}},async all(){return {results:db.prepare(sql).all(...params)}}}},async all(){return {results:db.prepare(sql).all()}}}}};
  const env={SIM_AUTH_DB:d1,SIM_SESSION_SECRET:'integration-session-secret-not-for-production',SIM_ADMIN_PASSWORD:'integration-admin-password-not-for-production'};
  const post=(name,body,cookie='')=>handle(new Request('https://sim.test/api/auth/'+name,{method:'POST',headers:{Origin:'https://sim.test','Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)}),env);
  const admin=await post('login',{role:'admin',password:env.SIM_ADMIN_PASSWORD});assert.equal(admin.status,200);const adminCookie=admin.headers.get('Set-Cookie').split(';')[0];
  const created=await post('create-class',{label:'Clase de integración',hours:2},adminCookie);assert.equal(created.status,201);const cls=await created.json();
  const stored=db.prepare('SELECT code_digest,code_encrypted FROM classes WHERE id=?').get(cls.id);assert.notEqual(stored.code_digest,cls.code);assert.notEqual(stored.code_encrypted,cls.code);assert.match(stored.code_encrypted,/^v1:/);
  const listed=await post('list-classes',{},adminCookie);const visible=(await listed.json()).classes;assert.equal(visible[0].code,cls.code);assert.equal(visible[0].code_encrypted,undefined);
  db.prepare('UPDATE classes SET code_encrypted=NULL WHERE id=?').run(cls.id);
  const legacy=await post('list-classes',{},adminCookie);assert.equal((await legacy.json()).classes[0].code,null);
  db.prepare('UPDATE classes SET code_encrypted=? WHERE id=?').run(stored.code_encrypted.slice(0,-1)+(stored.code_encrypted.endsWith('0')?'1':'0'),cls.id);
  const corrupt=await post('list-classes',{},adminCookie);assert.equal((await corrupt.json()).classes[0].code,null);
  db.prepare('UPDATE classes SET code_encrypted=? WHERE id=?').run(stored.code_encrypted,cls.id);
  db.prepare('UPDATE classes SET expires_at=? WHERE id=?').run(Math.floor(Date.now()/1000)-1,cls.id);
  const expired=await post('list-classes',{},adminCookie);assert.equal((await expired.json()).classes[0].code,null);
  db.prepare('UPDATE classes SET expires_at=? WHERE id=?').run(cls.expires_at,cls.id);
  const login=await post('login',{role:'student',code:cls.code});assert.equal(login.status,200);const studentCookie=login.headers.get('Set-Cookie').split(';')[0];
  const me=await handle(new Request('https://sim.test/api/auth/me',{headers:{Cookie:studentCookie}}),env);assert.equal((await me.json()).class_name,'Clase de integración');
  for(const operation of ['list-classes','create-class','disable-class'])assert.equal((await post(operation,{id:cls.id,label:'No permitido',hours:2},studentCookie)).status,403);
  const panel=await handle(new Request('https://sim.test/admin.html',{headers:{Cookie:studentCookie}}),env,{'/admin.html':{data:btoa('PRIVADO'),type:'text/html'}});assert.equal(panel.status,302);assert.match(panel.headers.get('Location'),/acceso.html\?role=admin$/);
  assert.equal((await post('disable-class',{id:cls.id},adminCookie)).status,200);
  const disabled=await post('list-classes',{},adminCookie);assert.equal((await disabled.json()).classes[0].code,null);
  const revoked=await handle(new Request('https://sim.test/api/auth/me',{headers:{Cookie:studentCookie}}),env);assert.equal((await revoked.json()).authenticated,false);
  assert.equal((await post('logout',{},adminCookie)).status,200);
  const after=await handle(new Request('https://sim.test/api/auth/me',{headers:{Cookie:adminCookie}}),env);assert.equal((await after.json()).authenticated,false);
 }finally{db.close();}
});
