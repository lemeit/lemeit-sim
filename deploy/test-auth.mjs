import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from './worker.mjs';

const future=()=>Math.floor(Date.now()/1000)+3600;
const fakeDb=(role='student')=>({
  prepare(sql){
    return {
      bind(){
        return {
          async first(){
            if(sql.includes('FROM sessions s'))return {role,class_id:role==='student'?'clase-1':null,expires_at:future(),active:1,class_expires:future()};
            return null;
          },
          async run(){return {success:true}},
          async all(){return {results:[]}}
        };
      }
    };
  }
});
const env=(role='student')=>({
 SIM_AUTH_DB:fakeDb(role),
 SIM_SESSION_SECRET:'session-secret-only-for-tests-32-bytes',
 SIM_ADMIN_PASSWORD:'admin-secret-only-for-tests-long-enough'
});
const sessionHeaders={'Cookie':'sim_session='+('b'.repeat(64))};
const asset=(p)=>({[p]:{data:btoa('ARCHIVO'),type:'text/html'}});
test('acceso público solo a la pantalla de ingreso',async()=>{
 const a=await handle(new Request('https://sim.lemeit.ar/acceso.html'),{},asset('/acceso.html'));
 assert.equal(a.status,200);
 const b=await handle(new Request('https://sim.lemeit.ar/'),{},asset('/index.html'));
 assert.equal(b.status,302);
});
test('usuario sin sesión no puede consultar ni calcular desde el motor',async()=>{
 for(const path of ['/api/status','/api/catalog','/api/simulate']){
  const request=new Request('https://sim.lemeit.ar'+path,path==='/api/simulate'?{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://sim.lemeit.ar'},body:'{}'}:undefined);
  const r=await handle(request,env());
  assert.equal(r.status,401,path);
 }
});
test('código de clase no permite leer panel ni JS de administración',async()=>{
 for(const path of ['/admin.html','/admin-classes.js','/admin-monitor.js']){
  const r=await handle(new Request('https://sim.lemeit.ar'+path,{headers:sessionHeaders}),env(),asset(path));
  assert.equal(r.status,401,path);
 }
});
test('sesión administrativa permite panel privado',async()=>{
 const r=await handle(new Request('https://sim.lemeit.ar/admin.html',{headers:sessionHeaders}),env('admin'),asset('/admin.html'));
 assert.equal(r.status,200);
});
test('nunca habilitar el motor cuando faltan los secretos',async()=>{
 const r=await handle(new Request('https://sim.lemeit.ar/api/catalog',{headers:sessionHeaders}),{});
 assert.equal(r.status,503);
});
