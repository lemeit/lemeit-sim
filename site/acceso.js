(()=>{
 'use strict';
 const el=id=>document.getElementById(id),form=el('access-form'),code=el('access-code'),password=el('access-password'),message=el('access-message'),submit=el('access-submit');
 const admin=()=>form.elements.role.value==='admin';
 const params=new URLSearchParams(location.search);
 const pages=new Map([['/','abrir el simulador'],['/index.html','abrir el simulador'],['/ejemplos.html','ver los ejemplos'],['/ayuda.html','ver la guía de uso'],['/catalogo.html','consultar el catálogo'],['/adaptacion.html','consultar la guía de adaptación']]);
 const requested=params.get('next'),next=pages.has(requested)?requested:null;
 const destination=role=>next||(role==='admin'?'/admin.html':'/');
 if(next){el('access-notice').textContent='Iniciá sesión para '+pages.get(next)+'. Después de ingresar, volverás a esa página.';el('access-notice').hidden=false;}

 function changeRole(){
  const isAdmin=admin();el('access-code-label').hidden=isAdmin;el('access-password-label').hidden=!isAdmin;
  code.required=!isAdmin;code.disabled=isAdmin;password.required=isAdmin;password.disabled=!isAdmin;
  code.value='';password.value='';message.textContent='';
  el('access-description').textContent=isAdmin?'Ingresá con tu contraseña para gestionar las clases.':'Ingresá el código de tu clase para comenzar.';
  el('access-footnote').textContent=isAdmin?'Acceso privado de administración':'Acceso por código · Sin cuenta de correo';
 }
 if(params.get('role')==='admin')form.elements.role.value='admin';
 form.addEventListener('change',event=>{if(event.target.name==='role')changeRole();});changeRole();
 form.addEventListener('submit',async event=>{
  event.preventDefault();submit.disabled=true;message.textContent='Verificando acceso…';
  const isAdmin=admin();
  try{
   const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(isAdmin?{role:'admin',password:password.value}:{role:'student',code:code.value})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'No se pudo ingresar.');
   code.value='';password.value='';location.assign(destination(data.role));
  }catch(error){message.textContent=error.message;submit.disabled=false;}
 });
 el('access-switch').addEventListener('click',async()=>{
  el('access-switch').disabled=true;
  try{const r=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:'{}'});if(!r.ok)throw Error('No se pudo cerrar la sesión.');location.replace('/acceso.html'+(next?'?next='+encodeURIComponent(next):''));}
  catch(error){message.textContent=error.message;el('access-switch').disabled=false;}
 });
 fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
  if(!data?.authenticated)return;
  el('access-current-label').textContent=data.role==='admin'?'Sesión abierta: Administrador':'Sesión abierta: '+(data.class_name||'Alumno');
  el('access-continue').href=destination(data.role);el('access-current').hidden=false;
 }).catch(()=>{});
})();
