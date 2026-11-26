(()=>{
 'use strict';
 if(globalThis.SimDesktop)return;
 const el=id=>document.getElementById(id),banner=el('session-banner');
 if(!banner)return;
 let session=null,clock=null,loading=false,expired=false;
 const adminLink=el('admin-nav-link');
 function end(){
  expired=true;banner.hidden=false;banner.dataset.state='expired';
  el('session-countdown').textContent='00:00:00';
  el('session-status').textContent='Acceso finalizado. Guardá el proyecto antes de volver a ingresar.';
  el('session-login').hidden=false;if(adminLink)adminLink.hidden=true;document.dispatchEvent(new CustomEvent('sim-session-role',{detail:{role:'student'}}));
 }
 function tick(){
  if(!session||!clock||expired)return;
  const seconds=Math.max(0,Math.ceil(session.expires_at-clock.server-(performance.now()-clock.local)/1000));
  if(!seconds){end();return;}
  if(session.role==='admin'){banner.dataset.state='active';return;}
  const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  el('session-countdown').textContent=[h,m,s].map(v=>String(v).padStart(2,'0')).join(':');
  banner.dataset.state=seconds<=300?'ending':'active';
 }
 async function refresh(){
  if(loading)return;loading=true;
  const start=performance.now();
  try{
   const response=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw Error('No se pudo verificar la sesión.');
   const data=await response.json();
   if(!data.authenticated){end();return;}
   if(!['student','admin'].includes(data.role)||!Number.isFinite(data.expires_at)||!Number.isFinite(data.server_time))throw Error('Estado de sesión incompleto.');
   session=data;clock={server:data.server_time+(performance.now()-start)/2000,local:performance.now()};expired=false;
   const admin=data.role==='admin';
   el('session-countdown-label').hidden=admin;
   el('session-countdown').hidden=admin;
   if(admin)el('session-countdown').textContent='';
   el('session-role').textContent=admin?'Administrador':'Alumno';
   el('session-name').textContent=admin?'Sesión administrativa':(data.class_name||'Clase');
   el('session-name').title=el('session-name').textContent;
   el('session-countdown-label').textContent='Acceso restante';
   el('session-note').textContent=!admin&&data.class_expires_at>data.expires_at?'Clase hasta '+new Date(data.class_expires_at*1000).toLocaleString('es-AR')+' · la sesión puede renovarse al ingresar.':'';
   el('session-status').textContent='';el('session-login').hidden=true;
   if(adminLink)adminLink.hidden=!admin;
   document.dispatchEvent(new CustomEvent('sim-session-role',{detail:{role:data.role}}));
   banner.hidden=false;tick();
  }catch{
   if(adminLink)adminLink.hidden=true;
   banner.hidden=false;el('session-status').textContent=expired?'Acceso finalizado. Guardá el proyecto antes de volver a ingresar.':'No se pudo actualizar el estado del acceso.';
  }finally{loading=false;}
 }
 el('session-logout')?.addEventListener('click',()=>el('signout-dialog').showModal());
 el('session-confirm-logout')?.addEventListener('click',async()=>{
  const button=el('session-confirm-logout');button.disabled=true;
  try{const r=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:'{}'});if(!r.ok)throw Error();location.assign('/acceso.html');}
  catch{el('session-logout-message').textContent='No se pudo cerrar la sesión. Intentá nuevamente.';button.disabled=false;}
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();refresh();}});
 setInterval(()=>{if(!document.hidden)tick();},1000);
 setInterval(()=>{if(!document.hidden)refresh();},60000);
 refresh();
})();
