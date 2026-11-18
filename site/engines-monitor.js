(()=>{
'use strict';
// Consulta de solo lectura. El historial es local a esta pestaña, sin persistencia ni secretos.
const logs=[], history=new Map(),lastStatus={windows:null,debian:null};
const dialog=document.getElementById('services-dialog');
const active=()=>!document.hidden&&(!dialog||dialog.open);
const names={windows:'Motor principal',debian:'Motor alternativo'};
const byId=id=>document.getElementById(id);
const portalVersion=document.documentElement?.dataset?.portalVersion||'';
const compatibility=globalThis.SimEngineCompatibility;
function renderCompatibility(){
  const table=byId('engine-compat-table'),summary=byId('engine-compat-summary');if(!table||!summary||!compatibility)return;
  const tbody=table.tBodies[0];tbody.replaceChildren();
  const rows=compatibility.comparison(lastStatus.windows,lastStatus.debian);
  const labels={supported:'✓ Admite',unsupported:'× No admite',unknown:'— Sin datos'};
  for(const row of rows){
    const tr=document.createElement('tr'),name=document.createElement('th');name.scope='row';name.textContent=row.label;tr.append(name);
    for(const engine of ['windows','debian']){const cell=document.createElement('td'),state=row[engine];cell.textContent=labels[state];cell.className='compat-'+state;tr.append(cell);}
    tbody.append(tr);
  }
  const unknown=['windows','debian'].filter(engine=>!lastStatus[engine]);
  const old=['windows','debian'].filter(engine=>lastStatus[engine]&&olderVersion(lastStatus[engine].gateway_version,portalVersion));
  const different=rows.filter(row=>row.windows!=='unknown'&&row.debian!=='unknown'&&row.windows!==row.debian);
  const notices=[];
  if(unknown.length)notices.push('Sin estado confirmado: '+unknown.join(', ')+'.');
  if(old.length)notices.push('Gateway con versión anterior al portal: '+old.join(', ')+'. Actualizar el servicio local y volver a comprobar.');
  if(different.length)notices.push(different.length+' operaciones con compatibilidad diferente entre motores.');
  if(!notices.length)notices.push('Ambos gateways anuncian las mismas operaciones y no son anteriores al portal.');
  summary.textContent=notices.join(' ');
}

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
  field(dl,'Ficha del equipo','Datos declarados · no implica disponibilidad');
  const hardware=engine==='windows'?{
    'Sistema operativo':'Windows 11 Home Single Language · 25H2 · 64 bits',
    'Compilación del sistema':'26200.9974',
    'Nombre del equipo':'DESKTOP-L3GD8TH',
    'Procesador':'Intel Core i9-10900 · 2,80 GHz',
    'Memoria instalada':'16 GB',
    'Gráficos':'Radeon RX 550/550 Series · 4 GB'
  }:{'Sistema operativo':'GNU/Linux Debian','Versión del sistema':'Pendiente de confirmar'};
  for(const [key,value] of Object.entries(hardware))field(dl,key,value);

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
    lastStatus[engine]={gateway_version:data.gateway_version,supported_equipment:[...data.supported_equipment]};
    const state=data.state==='busy'?'Ocupado':'Disponible';
    const entry=transition(engine,data.state,'gateway '+data.gateway_version,time);
    snapshot(engine,state,{
      'Versión del gateway':data.gateway_version,
      'Compatibilidad':olderVersion(data.gateway_version,portalVersion)?'Versión anterior al portal: puede requerir actualización del gateway':'No se detectó una versión anterior al portal; comprobar la tabla de operaciones',
      'Iniciado':startedAt.toLocaleString('es-AR'),
      'Tiempo activo':(data.uptime_s/3600).toFixed(1)+' h',
      'Estado desde':new Date(entry.since).toLocaleString('es-AR'),
      'Equipos reconocidos':data.supported_equipment.join(', '),
      'Última comprobación':stamp,
      'Latencia HTTP':Math.round(performance.now()-started)+' ms',
      'Alcance':'Consulta de estado; no ejecuta una simulación'
    });
  }catch(err){
    lastStatus[engine]=null;
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
  finally{renderCompatibility();running=false;byId('refresh').disabled=false;}
}
renderCompatibility();
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
