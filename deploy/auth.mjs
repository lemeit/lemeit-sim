// Autorización en el borde de Cloudflare; nunca enviar secretos al navegador ni a los motores.
const utf8=new TextEncoder();
const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const hex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
const now=()=>Math.floor(Date.now()/1000);
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
async function digest(secret,message){
  const k=await crypto.subtle.importKey('raw',utf8.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hex(await crypto.subtle.sign('HMAC',k,utf8.encode(message)));
}
function configured(env){
 const invalid=[];
 if(!env.SIM_AUTH_DB)invalid.push('SIM_AUTH_DB:missing');
 if(typeof env.SIM_SESSION_SECRET!=='string'||env.SIM_SESSION_SECRET.length<32)invalid.push('SIM_SESSION_SECRET:missing-or-short');
 if(typeof env.SIM_ADMIN_PASSWORD!=='string'||env.SIM_ADMIN_PASSWORD.length<20)invalid.push('SIM_ADMIN_PASSWORD:missing-or-short');
 // Solo nombres y validación; nunca valores ni longitudes de credenciales.
 if(invalid.length)console.warn(JSON.stringify({event:'auth_configuration_invalid',invalid}));
 return invalid.length===0;
}
// Códigos recuperables solo para administración, cifrados y ligados a su clase.
async function classCodeKey(env){
 const material=await crypto.subtle.digest('SHA-256',utf8.encode('sim-class-code:v1:'+env.SIM_SESSION_SECRET));
 return crypto.subtle.importKey('raw',material,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function encryptClassCode(env,id,code){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:utf8.encode(id)},await classCodeKey(env),utf8.encode(code));
 return 'v1:'+hex(iv)+':'+hex(encrypted);
}
async function decryptClassCode(env,id,value){
 if(typeof value!=='string')return null;
 const parts=value.split(':');if(parts.length!==3||parts[0]!=='v1'||!/^[a-f0-9]{24}$/.test(parts[1])||!/^[a-f0-9]+$/.test(parts[2])||parts[2].length%2)return null;
 const bytes=s=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));
 try{
  const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(parts[1]),additionalData:utf8.encode(id)},await classCodeKey(env),bytes(parts[2]));
  const code=new TextDecoder().decode(raw);return /^[A-HJ-NP-Z2-9]{12}$/.test(code)?code:null;
 }catch{return null;}
}
function cookie(request){const m=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)sim_session=([a-f0-9]{64})(?:;|$)/);return m?.[1]||null;}
function randomSession(){return hex(crypto.getRandomValues(new Uint8Array(32)));}
function randomClassCode(){const buf=crypto.getRandomValues(new Uint8Array(12));return [...buf].map(b=>chars[b%chars.length]).join('');}
function sessionCookie(session,maxAge){return 'sim_session='+session+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age='+maxAge;}
function clearCookie(){return 'sim_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';}
async function sessionFor(request,env){
  if(!configured(env))return null;
  const raw=cookie(request);if(!raw)return null;
  const key=await digest(env.SIM_SESSION_SECRET,'session:'+raw);
  const result=await env.SIM_AUTH_DB.prepare('SELECT s.role,s.class_id,s.student_id,s.expires_at,c.active,c.label AS class_name,c.expires_at AS class_expires,st.alias AS student_name FROM sessions s LEFT JOIN classes c ON c.id=s.class_id LEFT JOIN students st ON st.id=s.student_id AND st.class_id=s.class_id WHERE s.session_digest=?').bind(key).first();
  if(!result||result.expires_at<=now())return null;
  if(result.role==='student'&&(!result.active||result.class_expires<=now()))return null;
  return {role:result.role,class_id:result.class_id,class_name:result.role==='student'?result.class_name:null,class_expires_at:result.role==='student'?result.class_expires:null,student_id:result.role==='student'?result.student_id:null,student_name:result.role==='student'?result.student_name:null,expires_at:result.role==='student'?Math.min(result.expires_at,result.class_expires):result.expires_at,session_digest:key};
}
async function actorKey(request,env,kind){
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 return digest(env.SIM_SESSION_SECRET,'actor:'+kind+':'+ip);
}
async function limited(db,key){
 const row=await db.prepare('SELECT failures,window_start FROM login_attempts WHERE actor_digest=?').bind(key).first();
 return !!row&&now()-row.window_start<900&&row.failures>=5;
}
async function failed(db,key){
 const time=now();
 await db.prepare('INSERT INTO login_attempts(actor_digest,failures,window_start) VALUES(?,1,?) ON CONFLICT(actor_digest) DO UPDATE SET failures=CASE WHEN ?>=window_start+900 THEN 1 ELSE failures+1 END,window_start=CASE WHEN ?>=window_start+900 THEN ? ELSE window_start END').bind(key,time,time,time,time).run();
}
async function ok(db,key){await db.prepare('DELETE FROM login_attempts WHERE actor_digest=?').bind(key).run();}
async function issue(env,role,classId){
 const raw=randomSession(),issued=now(),lifetime=role==='admin'?8*3600:4*3600;
 await env.SIM_AUTH_DB.prepare('INSERT INTO sessions(session_digest,role,class_id,issued_at,expires_at) VALUES(?,?,?,?,?)').bind(await digest(env.SIM_SESSION_SECRET,'session:'+raw),role,classId,issued,issued+lifetime).run();
 return {raw,lifetime};
}
function sameOrigin(request){
 const expected=new URL(request.url).origin;
 return request.headers.get('Origin')===expected &&
   (request.headers.get('Content-Type')||'').split(';')[0]==='application/json';
}
async function bodyJson(request){
 const text=await request.text();if(text.length>2048)throw Error('Datos demasiado extensos.');
 return JSON.parse(text);
}
export async function authorize(request,env,role='student'){
 if(!configured(env))return {ok:false,response:json({error:'Acceso a clases sin configurar; los motores permanecen cerrados.'},503)};
 try{
  const s=await sessionFor(request,env);
  if(!s)return {ok:false,response:json({error:'Acceso requerido. Ingresá un código de clase o credencial administrativa.'},401)};
  if(role==='admin'&&s.role!=='admin')return {ok:false,response:json({error:'Se requiere acceso de administrador.'},403)};
  return {ok:true,session:s};
 }catch{return {ok:false,response:json({error:'No se pudo verificar el acceso; no se enviará el cálculo.'},503)};}
}
export async function authRoute(request,env){
 if(!configured(env))return json({error:'Acceso sin configurar. Contactá al administrador.'},503);
 const u=new URL(request.url),path=u.pathname;
 if(path==='/api/auth/me'&&request.method==='GET'){
  const s=await sessionFor(request,env);return json({authenticated:!!s,role:s?.role||null,class_name:s?.class_name||null,class_expires_at:s?.class_expires_at||null,expires_at:s?.expires_at||null,server_time:now(),...(s?.student_id?{student_name:s.student_name}:{} )});
 }
 if(!sameOrigin(request))return json({error:'Origen o formato de solicitud no autorizado.'},403);
 if(path==='/api/auth/logout'&&request.method==='POST'){
  const raw=cookie(request);
  if(raw)await env.SIM_AUTH_DB.prepare('DELETE FROM sessions WHERE session_digest=?').bind(await digest(env.SIM_SESSION_SECRET,'session:'+raw)).run();
  return json({ok:true},200,{'Set-Cookie':clearCookie()});
 }
 if(!['POST'].includes(request.method))return json({error:'Operación no disponible.'},404);
 let body;try{body=await bodyJson(request);}catch{return json({error:'Solicitud JSON inválida.'},400);}
 if(path==='/api/auth/login'){
  const kind=body.role==='admin'?'admin':'student';
  const actor=await actorKey(request,env,kind);
  if(await limited(env.SIM_AUTH_DB,actor))return json({error:'Demasiados intentos. Probá nuevamente en 15 minutos.'},429);
  let role,classId=null,success=false;
  if(kind==='admin'){
   const provided=typeof body.password==='string'?body.password:'';
   // Comparación de digests de longitud idéntica; credencial larga solo en secreto Worker.
   const a=await digest(env.SIM_SESSION_SECRET,'admin:'+provided);
   const b=await digest(env.SIM_SESSION_SECRET,'admin:'+env.SIM_ADMIN_PASSWORD);
   success=a===b;role='admin';
  }else{
   const code=typeof body.code==='string'?body.code.toUpperCase().replace(/[-\s]/g,''):'';
   if(/^[A-HJ-NP-Z2-9]{12}$/.test(code)){
    const row=await env.SIM_AUTH_DB.prepare('SELECT id FROM classes WHERE code_digest=? AND active=1 AND expires_at>?').bind(await digest(env.SIM_SESSION_SECRET,'code:'+code),now()).first();
    if(row){success=true;classId=row.id;}
   }
   role='student';
  }
  if(!success){await failed(env.SIM_AUTH_DB,actor);return json({error:'Credencial incorrecta o código vencido.'},401);}
  await ok(env.SIM_AUTH_DB,actor);
  const s=await issue(env,role,classId);return json({ok:true,role,expires_at:now()+s.lifetime},200,{'Set-Cookie':sessionCookie(s.raw,s.lifetime)});
 }
 if(path==='/api/auth/release-student'){
   const s=await sessionFor(request,env);
   if(!s||s.role!=='student'||!s.class_id)return json({error:'Se requiere acceso vigente a una clase.'},403);
   await env.SIM_AUTH_DB.prepare('UPDATE sessions SET student_id=NULL WHERE session_digest=? AND class_id=? AND role=?').bind(s.session_digest,s.class_id,'student').run();
   return json({ok:true});
 }
 if(path==='/api/auth/student-identity'){
   const s=await sessionFor(request,env);
   if(!s||s.role!=='student'||!s.class_id)return json({error:'Se requiere acceso vigente a una clase.'},403);
   const alias=typeof body.alias==='string'?body.alias.trim().replace(/\s+/g,' '):'';
   const password=typeof body.password==='string'?body.password:'';
   const action=body.action;
   if(!/^[\p{L}\p{N} ._-]{2,40}$/u.test(alias)||password.length<10||password.length>128||!['register','login'].includes(action))
     return json({error:'Usá un alias de 2 a 40 caracteres y una clave personal de al menos 10 caracteres.'},422);
   const key=alias.toLocaleLowerCase('es-AR');
   const actor=await actorKey(request,env,'student-account');
   const accountKey=await digest(env.SIM_SESSION_SECRET,'student-account:'+s.class_id+':'+key);
   if(await limited(env.SIM_AUTH_DB,actor)||await limited(env.SIM_AUTH_DB,accountKey))
     return json({error:'Demasiados intentos; probá nuevamente en 15 minutos.'},429);
   const row=await env.SIM_AUTH_DB.prepare('SELECT id,secret_digest,alias FROM students WHERE class_id=? AND alias_key=?').bind(s.class_id,key).first();
   let id;
   if(action==='register'){
     if(row)return json({error:'Ese alias ya está utilizado en esta clase. Ingresá con su clave o elegí otro.'},409);
     id=crypto.randomUUID();
     const secret=await digest(env.SIM_SESSION_SECRET,'student-secret:'+id+':'+password);
     const inserted=await env.SIM_AUTH_DB.prepare('INSERT OR IGNORE INTO students(id,class_id,alias,alias_key,secret_digest,created_at) VALUES(?,?,?,?,?,?)').bind(id,s.class_id,alias,key,secret,now()).run();
     if(!inserted.meta?.changes)return json({error:'Ese alias ya existe en esta clase.'},409);
   }else{
     const testDigest=await digest(env.SIM_SESSION_SECRET,'student-secret:'+(row?.id||'missing')+':'+password);
     if(!row||testDigest!==row.secret_digest){
       await failed(env.SIM_AUTH_DB,actor);await failed(env.SIM_AUTH_DB,accountKey);
       return json({error:'Alias o clave personal incorrectos.'},401);
     }
     id=row.id;
   }
   await ok(env.SIM_AUTH_DB,actor);await ok(env.SIM_AUTH_DB,accountKey);
   await env.SIM_AUTH_DB.prepare('UPDATE sessions SET student_id=? WHERE session_digest=? AND class_id=? AND role=?').bind(id,s.session_digest,s.class_id,'student').run();
   return json({ok:true,student_name:row?.alias||alias});
 }
 const s=await sessionFor(request,env);
 if(s?.role!=='admin')return json({error:'Se requiere acceso de administrador.'},403);
 if(path==='/api/auth/create-class'){
  const label=typeof body.label==='string'?body.label.trim():'';
  const hours=Number(body.hours);
  if(!label||label.length>80||!Number.isInteger(hours)||hours<1||hours>720)return json({error:'Ingresá nombre de clase y duración de 1 a 720 horas.'},422);
  const id=crypto.randomUUID(),code=randomClassCode(),created=now(),expires=created+hours*3600;
  const encrypted=await encryptClassCode(env,id,code);
  await env.SIM_AUTH_DB.prepare('INSERT INTO classes(id,label,code_digest,active,created_at,expires_at,code_encrypted) VALUES(?,?,?,1,?,?,?)').bind(id,label,await digest(env.SIM_SESSION_SECRET,'code:'+code),created,expires,encrypted).run();
  return json({id,label,code,expires_at:expires},201);
 }
 if(path==='/api/auth/renew-class'){
   const id=typeof body.id==='string'?body.id:'';
   const hours=Number(body.hours);
   if(!/^[a-f0-9-]{36}$/.test(id)||!Number.isInteger(hours)||hours<1||hours>720)return json({error:'Clase o duración inválida.'},422);
   const existing=await env.SIM_AUTH_DB.prepare('SELECT id,label FROM classes WHERE id=?').bind(id).first();
   if(!existing)return json({error:'Clase no encontrada.'},404);
   const code=randomClassCode(),expires=now()+hours*3600,encrypted=await encryptClassCode(env,id,code);
   await env.SIM_AUTH_DB.prepare('UPDATE classes SET active=1,expires_at=?,code_digest=?,code_encrypted=? WHERE id=?').bind(expires,await digest(env.SIM_SESSION_SECRET,'code:'+code),encrypted,id).run();
   // No cambia el ID de clase: mantiene alumnos y proyectos asociados.
   return json({id,label:existing.label,code,expires_at:expires});
 }
 if(path==='/api/auth/disable-class'){
  if(typeof body.id!=='string')return json({error:'ID inválido.'},422);
  await env.SIM_AUTH_DB.prepare('UPDATE classes SET active=0 WHERE id=?').bind(body.id).run();
  return json({ok:true});
 }
 if(path==='/api/auth/list-classes'){
  const rows=await env.SIM_AUTH_DB.prepare('SELECT id,label,active,created_at,expires_at,code_encrypted FROM classes ORDER BY created_at DESC LIMIT 100').all();
  const classes=await Promise.all((rows.results||[]).map(async row=>{
   const {code_encrypted,...entry}=row;
   const code=row.active===1&&row.expires_at>now()?await decryptClassCode(env,row.id,code_encrypted):null;
   return {...entry,code};
  }));
  return json({classes});
 }
 return json({error:'Operación de acceso no disponible.'},404);
}
// Cuotas por sesión y ventana; fila actualizada atómicamente con RETURNING.
export async function authorizeCalculation(env,session){
 if(session.role==='admin')return {ok:true};
 const window=Math.floor(now()/60);
 try{
  const row=await env.SIM_AUTH_DB.prepare(
   'INSERT INTO calculation_usage(session_digest,window_start,requests) VALUES(?,?,1) ON CONFLICT(session_digest,window_start) DO UPDATE SET requests=requests+1 RETURNING requests'
  ).bind(session.session_digest,window).first();
  const maxPerMinute=12; // Cuota por alumno: protege los motores sin interrumpir la práctica habitual.
  if(!row||row.requests>maxPerMinute)return {ok:false,response:json({error:'Se alcanzó el máximo de '+maxPerMinute+' cálculos por minuto para esta sesión. Podés continuar en el próximo minuto.'},429)};
  return {ok:true};
 }catch{
  return {ok:false,response:json({error:'No se pudo comprobar la cuota de cálculo.'},503)};
 }
}
export {configured};
