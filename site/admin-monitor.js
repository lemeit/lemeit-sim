'use strict';
const logs=[];
const names={windows:'Windows',debian:'Debian'};
const byId=id=>document.getElementById(id);
function field(dl,name,value){
  const dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=name;dd.textContent=value;dl.append(dt,dd);
}
function snapshot(engine,summary,details){
  const view=byId(engine);view.querySelector('.summary').textContent=summary;
  const dl=view.querySelector('dl');dl.replaceChildren();
  for(const [key,value] of Object.entries(details))field(dl,key,String(value));
}
async function check(engine){
  const started=performance.now(),stamp=new Date().toLocaleString('es-AR');
  snapshot(engine,'Comprobando…',{'Última comprobación':stamp});
  try{
    const res=await fetch('/api/status',{headers:{'X-SIM-Engine':engine},signal:AbortSignal.timeout(12000),cache:'no-store'});
    let data={};try{data=await res.json();}catch{}
    if(!res.ok)throw new Error(res.status===404?'Gateway antiguo: actualizar y reiniciar para disponer de /api/status':(data.error||'HTTP '+res.status));
    if(!data.gateway_version||!['ready','busy'].includes(data.state)||!Array.isArray(data.supported_equipment))throw new Error('Respuesta de estado incompleta');
    const startedAt=new Date(data.started_at);
    if(!Number.isFinite(startedAt.getTime()))throw new Error('Fecha de inicio inválida');
    const state=data.state==='busy'?'Ocupado':'Disponible';
    snapshot(engine,state,{
      'Versión del gateway':data.gateway_version,
      'Iniciado':startedAt.toLocaleString('es-AR'),
      'Tiempo activo':(Number(data.uptime_s)/3600).toFixed(1)+' h',
      'Equipo reconocido':data.supported_equipment.join(', '),
      'Última comprobación':stamp,
      'Latencia HTTP':Math.round(performance.now()-started)+' ms',
      'Aviso':'Este control no ejecutó una simulación'
    });
    logs.unshift(stamp+' · '+names[engine]+' · '+state+' · gateway '+data.gateway_version);
  }catch(err){
    snapshot(engine,'Sin estado confirmado',{'Última comprobación':stamp,'Diagnóstico':err.message,'Orientación':'Verificá alimentación, gateway, túnel y versión instalada'});
    logs.unshift(stamp+' · '+names[engine]+' · sin estado confirmado · '+err.message);
  }
  const list=byId('events');list.replaceChildren();
  for(const entry of logs.slice(0,20)){const li=document.createElement('li');li.textContent=entry;list.append(li);}
}
let running=false;
async function refresh(){if(running)return;running=true;byId('refresh').disabled=true;
  try{await Promise.all([check('windows'),check('debian')]);}
  finally{running=false;byId('refresh').disabled=false;}
}
byId('refresh').addEventListener('click',refresh);
setInterval(()=>{if(byId('automatic').checked&&!document.hidden)refresh();},30000);
refresh();
