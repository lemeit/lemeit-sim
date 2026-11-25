'use strict';
if(typeof window!=='undefined')window.SimproxTheme?.init();
const $class=id=>document.getElementById(id);
async function classApi(path,data){
 const response=await fetch('/api/auth/'+path,{
  method:'POST',headers:{'Content-Type':'application/json'},
  credentials:'same-origin',body:JSON.stringify(data||{})
 });
 const result=await response.json();
 if(!response.ok)throw Error(result.error||'No se pudo completar la operación');
 return result;
}
function classDate(epoch){return new Date(epoch*1000).toLocaleString('es-AR');}
async function listClasses(){
 const target=$class('classes-table'),message=$class('classes-message');
 message.textContent='Actualizando clases…';
 try{
  const {classes}=await classApi('list-classes');
  target.replaceChildren();
  for(const entry of classes){
   const tr=document.createElement('tr'),label=document.createElement('td'),codeCell=document.createElement('td'),state=document.createElement('td'),expires=document.createElement('td'),action=document.createElement('td');
   label.textContent=entry.label;
   const active=entry.active===1&&entry.expires_at>Date.now()/1000;
   const badge=document.createElement('span');badge.className='class-state '+(active?'active':'inactive');badge.textContent=active?'Activa':'Inactiva / vencida';state.append(badge);
   expires.textContent=classDate(entry.expires_at);
   if(active&&entry.code){
    const value=document.createElement('code'),copy=document.createElement('button');value.textContent=entry.code;copy.type='button';copy.textContent='Copiar';copy.setAttribute('aria-label','Copiar código de '+entry.label);
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(entry.code);copy.textContent='Copiado';}catch{message.textContent='Seleccioná el código y copialo manualmente.';}});
    codeCell.append(value,copy);
   }else{codeCell.textContent=active?'Anterior · no recuperable':'—';codeCell.className='class-code-unavailable';if(active)codeCell.title='Este código fue creado antes del guardado cifrado. Creá uno nuevo para volver a compartirlo.';}

   const renew=document.createElement('button');renew.type='button';renew.textContent='Renovar clave';
   renew.addEventListener('click',async()=>{
    if(!confirm('¿Renovar el código de «'+entry.label+'» por 30 días? Los proyectos y alumnos se conservarán. El código anterior dejará de funcionar.'))return;
    renew.disabled=true;
    try{
      const renewed=await classApi('renew-class',{id:entry.id,hours:720});
      $class('class-code-value').textContent=renewed.code;
      $class('class-code-detail').textContent=entry.label+' · nuevo código válido hasta '+classDate(renewed.expires_at)+'. Los proyectos existentes se conservan.';
      $class('class-new-code').hidden=false;
      await listClasses();
    }catch(error){message.textContent=error.message;}
    finally{renew.disabled=false;}
   });
   action.append(renew);
   if(active){
    const button=document.createElement('button');button.type='button';button.textContent='Desactivar';
    button.addEventListener('click',async()=>{
     if(!confirm('¿Desactivar este código y todas sus sesiones?'))return;
     button.disabled=true;
     try{await classApi('disable-class',{id:entry.id});await listClasses();}
     catch(error){message.textContent=error.message;button.disabled=false;}
    });
    action.append(button);
   }
   tr.append(label,codeCell,state,expires,action);target.append(tr);
  }
  message.textContent=classes.length?classes.length+' clases · '+classes.filter(c=>c.active===1&&c.expires_at>Date.now()/1000).length+' activas':'Todavía no hay clases. Creá el primer código arriba.';
 }catch(error){message.textContent=error.message;}
}
$class('class-create-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const message=$class('classes-message'),out=$class('class-new-code'),button=event.currentTarget.querySelector('button[type="submit"]');
 button.disabled=true;out.hidden=true;$class('class-code-value').textContent='';
 try{
  const data=await classApi('create-class',{label:$class('class-label').value,hours:Number($class('class-hours').value)});
  $class('class-code-value').textContent=data.code;
  $class('class-code-detail').textContent=data.label+' · vence '+classDate(data.expires_at)+'. También podés copiarlo desde el listado mientras esté activo.';
  $class('class-copy').textContent='Copiar código';out.hidden=false;
  $class('class-label').value='';
  await listClasses();
 }catch(error){message.textContent=error.message;}
 finally{button.disabled=false;}
});
$class('classes-refresh').addEventListener('click',listClasses);
listClasses();

$class('class-code-dismiss').addEventListener('click',()=>{$class('class-new-code').hidden=true;$class('class-code-value').textContent='';});
$class('class-copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($class('class-code-value').textContent);$class('class-copy').textContent='Copiado';}
 catch{$class('classes-message').textContent='Seleccioná el código y copialo manualmente.';}
});
