/* Proyectos persistentes en D1, aislados por alumno y clase.
   Ningún proyecto se envía a Windows/Debian para almacenarlo. */
'use strict';
const responses=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const problem=(message,status=400)=>responses({error:message},status);
const MAX_BYTES=1000000;
async function readBody(request){
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')throw Error('Se requiere JSON.');
  if(Number(request.headers.get('Content-Length')||0)>MAX_BYTES)throw Error('El proyecto supera 1 MB.');
  const text=await request.text();
  if(new TextEncoder().encode(text).byteLength>MAX_BYTES)throw Error('El proyecto supera 1 MB.');
  return JSON.parse(text);
}
function graphData(value){
  if(!value||typeof value!=='object'||value.version!==1||typeof value.title!=='string'||!value.title.trim()||value.title.length>70||
      !Array.isArray(value.compounds)||!value.compounds.length||value.compounds.length>8||
      typeof value.model!=='string'||!Array.isArray(value.nodes)||value.nodes.length>30||
      !Array.isArray(value.edges)||value.edges.length>60)throw Error('El proyecto no tiene un formato válido.');
  const json=JSON.stringify(value);
  if(new TextEncoder().encode(json).byteLength>MAX_BYTES)throw Error('El proyecto supera 1 MB.');
  return {title:value.title.trim(),json};
}
function originAllowed(request){
  const origin=new URL(request.url).origin;
  return request.headers.get('Origin')===origin&&request.headers.get('Sec-Fetch-Site')!=='cross-site';
}
export async function projectRoute(request,env,session){
  const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
  const id=parts[2]||null;
  if(parts.length>3||parts[0]!=='api'||parts[1]!=='projects'||(id&&!/^[a-f0-9-]{36}$/.test(id)))return problem('Proyecto no encontrado.',404);
  const student=session.role==='student';
  if(student&&!session.student_id)return problem('Identificate con tu alias y clave personal para utilizar la nube.',403);
  const classId=student?session.class_id:url.searchParams.get('class_id');
  if(!classId||typeof classId!=='string'||classId.length>100)return problem('Elegí una clase válida.',422);
  if(!['GET','POST','PUT','DELETE'].includes(request.method))return problem('Método no disponible.',405);
  if(request.method!=='GET'&&(!student||!originAllowed(request)))return problem('No autorizado para modificar proyectos.',403);
  const db=env.SIM_AUTH_DB,owner=session.student_id;
  try{
    if(request.method==='GET'&&!id){
      const sql=student?'SELECT id,title,revision,created_at,updated_at FROM projects WHERE class_id=? AND student_id=? ORDER BY updated_at DESC LIMIT 100':
        'SELECT p.id,p.title,p.revision,p.created_at,p.updated_at,s.alias AS student_name FROM projects p JOIN students s ON s.id=p.student_id WHERE p.class_id=? ORDER BY p.updated_at DESC LIMIT 300';
      const rows=await db.prepare(sql).bind(...(student?[classId,owner]:[classId])).all();
      return responses({projects:rows.results||[]});
    }
    if(request.method==='GET'){
      const row=await db.prepare('SELECT id,class_id,student_id,title,revision,created_at,updated_at,graph_json FROM projects WHERE id=? AND class_id=?'+(student?' AND student_id=?':'')).bind(...(student?[id,classId,owner]:[id,classId])).first();
      if(!row)return problem('Proyecto no encontrado o sin permiso.',404);
      return responses({project:{id:row.id,title:row.title,revision:row.revision,created_at:row.created_at,updated_at:row.updated_at,graph:JSON.parse(row.graph_json)}});
    }
    let body={};
    if(request.method!=='DELETE')try{body=await readBody(request);}catch{return problem('JSON inválido o proyecto demasiado grande.',400);}
    if(request.method==='POST'&&!id){
      const count=await db.prepare('SELECT COUNT(*) AS amount FROM projects WHERE class_id=? AND student_id=?').bind(classId,owner).first();
      if(Number(count?.amount)>=50)return problem('Alcanzaste el límite de 50 proyectos. Exportá una copia antes de eliminar alguno.',409);
      let data;try{data=graphData(body.graph);}catch(e){return problem(e.message,422);}
      const newId=crypto.randomUUID(),time=Math.floor(Date.now()/1000);
      await db.prepare('INSERT INTO projects(id,class_id,student_id,title,graph_json,revision,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)').bind(newId,classId,owner,data.title,data.json,time,time).run();
      return responses({id:newId,revision:1,updated_at:time},201);
    }
    if(!id)return problem('Indicá el proyecto.',400);
    if(request.method==='PUT'){
      const revision=body.revision;
      if(!Number.isInteger(revision)||revision<1)return problem('Falta la versión de guardado.',422);
      let data;try{data=graphData(body.graph);}catch(e){return problem(e.message,422);}
      const time=Math.floor(Date.now()/1000);
      const written=await db.prepare('UPDATE projects SET title=?,graph_json=?,revision=revision+1,updated_at=? WHERE id=? AND class_id=? AND student_id=? AND revision=?').bind(data.title,data.json,time,id,classId,owner,revision).run();
      if(written.meta?.changes===1)return responses({id,revision:revision+1,updated_at:time});
      const exists=await db.prepare('SELECT revision FROM projects WHERE id=? AND class_id=? AND student_id=?').bind(id,classId,owner).first();
      return exists?problem('El proyecto fue modificado desde otra sesión. Abrilo de nuevo antes de sobrescribirlo.',409):problem('Proyecto no encontrado.',404);
    }
    if(request.method==='DELETE'){
      const removed=await db.prepare('DELETE FROM projects WHERE id=? AND class_id=? AND student_id=?').bind(id,classId,owner).run();
      return removed.meta?.changes===1?responses({ok:true}):problem('Proyecto no encontrado.',404);
    }
    return problem('Operación no disponible.',404);
  }catch(error){
    console.warn(JSON.stringify({event:'project_storage_failed',cause:String(error).slice(0,150)}));
    return problem('No se pudo acceder a la biblioteca en la nube. Revisá la migración de la base D1.',503);
  }
}
