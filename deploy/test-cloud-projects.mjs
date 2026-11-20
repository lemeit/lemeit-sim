import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handle} from './worker.mjs';

function fixture(){
  const db=new DatabaseSync(':memory:');
  for(const name of ['0001_class_access.sql','0002_calculation_quotas.sql','0003_recoverable_class_codes.sql','0004_student_projects.sql'])
    db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
  const d1={prepare(sql){return {bind(...params){return {
    async first(){return db.prepare(sql).get(...params)||null},
    async run(){const info=db.prepare(sql).run(...params);return {success:true,meta:{changes:info.changes}}},
    async all(){return {results:db.prepare(sql).all(...params)}}
  }},async all(){return {results:db.prepare(sql).all()}}}}};
  const env={SIM_AUTH_DB:d1,SIM_SESSION_SECRET:'cloud-integration-secret-not-for-production',SIM_ADMIN_PASSWORD:'cloud-integration-admin-password-secret'};
  const base='https://sim.test';
  const api=(path,method='GET',payload,cookie='')=>handle(new Request(base+path,{method,headers:{Cookie:cookie,...(method==='GET'?{}:{Origin:base,'Content-Type':'application/json'})},...(method==='GET'?{}:{body:JSON.stringify(payload||{})})}),env);
  const login=async(role,credential)=>{
    const r=await api('/api/auth/login','POST',role==='admin'?{role,password:credential}:{role:'student',code:credential});
    assert.equal(r.status,200);
    return r.headers.get('Set-Cookie').split(';')[0];
  };
  return {db,env,api,login,close:()=>db.close()};
}
const graph={version:1,title:'Balance de mezcla',compounds:['Water'],model:'Steam Tables (IAPWS-IF97)',nodes:[],edges:[],exercise:{statement:'Enunciado didáctico'},annotations:[]};
test('clase → identidad individual → CRUD nube; aislamiento, admin y renovación',async()=>{
 const f=fixture();
 try{
  const admin=await f.login('admin',f.env.SIM_ADMIN_PASSWORD);
  const create=await f.api('/api/auth/create-class','POST',{label:'Física 5.º A',hours:1},admin);
  assert.equal(create.status,201);const cls=await create.json();
  const alice=await f.login('student',cls.code);
  const anonymous=await f.api('/api/projects','GET',null,alice);assert.equal(anonymous.status,403);
  let identity=await f.api('/api/auth/student-identity','POST',{action:'register',alias:'Alumno A',password:'clave-Alumno-A-123'},alice);
  assert.equal(identity.status,200,await identity.clone().text());
  const me=await f.api('/api/auth/me','GET',null,alice);assert.equal((await me.json()).student_name,'Alumno A');
  const saved=await f.api('/api/projects','POST',{graph},alice);assert.equal(saved.status,201,await saved.clone().text());
  const project=await saved.json();assert.equal(project.revision,1);
  const firstList=await f.api('/api/projects','GET',null,alice);assert.equal((await firstList.json()).projects.length,1);
  const got=await f.api('/api/projects/'+project.id,'GET',null,alice);
  assert.equal((await got.json()).project.graph.exercise.statement,'Enunciado didáctico');
  const bob=await f.login('student',cls.code);
  identity=await f.api('/api/auth/student-identity','POST',{action:'register',alias:'Alumno B',password:'clave-Alumno-B-123'},bob);
  assert.equal(identity.status,200,await identity.clone().text());
  const unauthorized=await f.api('/api/projects/'+project.id,'GET',null,bob);assert.equal(unauthorized.status,404);
  const bobList=await f.api('/api/projects','GET',null,bob);assert.equal((await bobList.json()).projects.length,0);
  const denied=await f.api('/api/projects/'+project.id,'PUT',{graph,revision:1},bob);assert.equal(denied.status,404);
  const changed=await f.api('/api/projects/'+project.id,'PUT',{graph:{...graph,title:'Mezcla revisada'},revision:1},alice);
  assert.equal(changed.status,200,await changed.clone().text());assert.equal((await changed.json()).revision,2);
  const conflict=await f.api('/api/projects/'+project.id,'PUT',{graph,revision:1},alice);assert.equal(conflict.status,409);
  const adminList=await f.api('/api/projects?class_id='+cls.id,'GET',null,admin);assert.equal((await adminList.json()).projects.length,1);
  const adminRead=await f.api('/api/projects/'+project.id+'?class_id='+cls.id,'GET',null,admin);assert.equal(adminRead.status,200);
  const adminWrite=await f.api('/api/projects/'+project.id+'?class_id='+cls.id,'PUT',{graph,revision:2},admin);assert.equal(adminWrite.status,403);
  const newCode=await f.api('/api/auth/renew-class','POST',{id:cls.id,hours:720},admin);assert.equal(newCode.status,200);
  const renewal=await newCode.json();assert.equal(renewal.id,cls.id);assert.notEqual(renewal.code,cls.code);
  const old=await f.api('/api/auth/login','POST',{role:'student',code:cls.code});assert.equal(old.status,401);
  const aliceNew=await f.login('student',renewal.code);
  const wrong=await f.api('/api/auth/student-identity','POST',{action:'login',alias:'Alumno A',password:'incorrect-123'},aliceNew);
  assert.equal(wrong.status,401);
  const correct=await f.api('/api/auth/student-identity','POST',{action:'login',alias:'Alumno A',password:'clave-Alumno-A-123'},aliceNew);
  assert.equal(correct.status,200);
  const recovered=await f.api('/api/projects/'+project.id,'GET',null,aliceNew);assert.equal(recovered.status,200);
  const released=await f.api('/api/auth/release-student','POST',{},aliceNew);assert.equal(released.status,200);
  const anonymousAfterSwitch=await f.api('/api/projects','GET',null,aliceNew);assert.equal(anonymousAfterSwitch.status,403);
  const classStillActive=await f.api('/api/auth/me','GET',null,aliceNew);
  const state=await classStillActive.json();assert.equal(state.authenticated,true);assert.equal(state.role,'student');assert.equal(state.student_name,undefined);
  const another=await f.api('/api/auth/student-identity','POST',{action:'login',alias:'Alumno B',password:'clave-Alumno-B-123'},aliceNew);
  assert.equal(another.status,200);
  const blocked=await f.api('/api/projects/'+project.id,'GET',null,aliceNew);assert.equal(blocked.status,404);
  await f.api('/api/auth/release-student','POST',{},aliceNew);
  const reentered=await f.api('/api/auth/student-identity','POST',{action:'login',alias:'Alumno A',password:'clave-Alumno-A-123'},aliceNew);
  assert.equal(reentered.status,200);
  const recoveredAgain=await f.api('/api/projects/'+project.id,'GET',null,aliceNew);assert.equal(recoveredAgain.status,200);
  const deleted=await f.api('/api/projects/'+project.id,'DELETE',{},aliceNew);assert.equal(deleted.status,200);
  const gone=await f.api('/api/projects/'+project.id,'GET',null,aliceNew);assert.equal(gone.status,404);
 }finally{f.close();}
});
test('solicitudes de otra procedencia no pueden guardar proyectos',async()=>{
 const f=fixture();
 try{
  const noAuth=await f.api('/api/projects','GET');assert.equal(noAuth.status,401);
 }finally{f.close();}
});
