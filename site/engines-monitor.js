(()=>{
'use strict';
// Consulta de solo lectura. El historial es local a esta pestaña, sin persistencia ni secretos.
const logs=[], history=new Map();
const dialog=document.getElementById('services-dialog');
const active=()=>!document.hidden&&(!dialog||dialog.open);
const names={windows:'Windows',debian:'Debian'};
const byId=id=>document.getElementById(id);
const portalVersion=document.documentElement?.dataset?.portalVersion||'';
function olderVersion(gateway,portal){
  const parse=value=>/^\d+\.\d+\.\d+$/.test(value)?value.split('.').map(Number):null;
  const a=parse(gateway),b=parse(portal);if(!a||!b)return false;
  for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]<b[i];}
  return false;
}
function field(dl,name,value){
  const dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=name;dd.textContent=value;dl.append(dt,dd);
}
function snapshot(engine,summary,details){
  const view=byId(engine);view.querySelector('.summary').textContent=summary;
  view.dataset.state=summary==='Disponible'?'ready':summary==='Ocupado'?'busy':'unconfirmed';
  const dl=view.querySelector('dl');dl.replaceChildren();
  for(const [key,value] of Object.entries(details))field(dl,key,String(value));
}
function transition(engine,state,detail,when){
  const previous=history.get(engine);
  if(!previous||previous.state!==state){
    history.set(engine,{state,since:when,failures:state==='unconfirmed'?1:0});
    logs.unshift(new Date(when).toLocaleString('es-AR')+' · '+names[engine]+' · '+(previous?previous.state+' → ':'')+state+(detail?' · '+detail:''));
    logs.splice(20);
    const list=byId('events');list.replaceChildren();
    for(const entry of logs){const li=document.createElement('li');li.textContent=entry;list.append(li);}
  }else if(state==='unconfirmed')previous.failures++;
  return history.get(engine);
}
async function check(engine){
  const started=performance.now(),time=Date.now(),stamp=new Date(time).toLocaleString('es-AR');
  snapshot(engine,'Comprobando…',{'Última comprobación':stamp});
  try{
    const res=await fetch('/api/status',{headers:{'X-SIM-Engine':engine},signal:AbortSignal.timeout(12000),cache:'no-store'});
    let data={};try{data=await res.json();}catch{}
    if(!res.ok)throw new Error(res.status===404?'Gateway antiguo: actualizar y reiniciar para disponer de /api/status':(data.error||'HTTP '+res.status));
    if(!/^\d+\.\d+\.\d+$/.test(data.gateway_version)||!['ready','busy'].includes(data.state)||!Array.isArray(data.supported_equipment)||!data.supported_equipment.every(x=>typeof x==='string'))throw new Error('Respuesta de estado incompleta');
    const startedAt=new Date(data.started_at);
    if(!Number.isFinite(startedAt.getTime())||!Number.isFinite(data.uptime_s)||data.uptime_s<0)throw new Error('Fecha de inicio o tiempo activo inválido');
    const state=data.state==='busy'?'Ocupado':'Disponible';
    const entry=transition(engine,data.state,'gateway '+data.gateway_version,time);
    snapshot(engine,state,{
      'Versión del gateway':data.gateway_version,
      'Compatibilidad':olderVersion(data.gateway_version,portalVersion)?'Versión anterior al portal: actualizar código y reiniciar el gateway':'Sin diferencias de versión anteriores detectadas',
      'Iniciado':startedAt.toLocaleString('es-AR'),
      'Tiempo activo':(data.uptime_s/3600).toFixed(1)+' h',
      'Estado desde':new Date(entry.since).toLocaleString('es-AR'),
      'Equipos reconocidos':data.supported_equipment.join(', '),
      'Última comprobación':stamp,
      'Latencia HTTP':Math.round(performance.now()-started)+' ms',
      'Alcance':'Consulta de estado; no ejecuta una simulación'
    });
  }catch(err){
    const entry=transition(engine,'unconfirmed',err.message,time);
    snapshot(engine,'Sin estado confirmado',{
      'Estado desde':new Date(entry.since).toLocaleString('es-AR'),
      'Comprobaciones fallidas consecutivas':entry.failures,
      'Última comprobación':stamp,
      'Diagnóstico':err.message,
      'Orientación':'Verificá alimentación, gateway, túnel y versión instalada. Sin estado no equivale necesariamente a equipo apagado.'
    });
  }
}
let running=false;
async function refresh(){if(running)return;running=true;byId('refresh').disabled=true;
  try{await Promise.all([check('windows'),check('debian')]);}
  finally{running=false;byId('refresh').disabled=false;}
}
byId('refresh').addEventListener('click',refresh);
setInterval(()=>{if(byId('automatic').checked&&active())refresh();},30000);
document.addEventListener('visibilitychange',()=>{if(active()&&byId('automatic').checked)refresh();});
if(dialog){
  byId('services-button').addEventListener('click',()=>{
    document.querySelectorAll('.app-menu[open]').forEach(menu=>menu.removeAttribute('open'));
    dialog.showModal();refresh();
  });
}else refresh();
})();
