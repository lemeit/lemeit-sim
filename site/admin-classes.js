'use strict';
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
   const tr=document.createElement('tr'),label=document.createElement('td'),state=document.createElement('td'),expires=document.createElement('td'),action=document.createElement('td');
   label.textContent=entry.label;
   const active=entry.active===1&&entry.expires_at>Date.now()/1000;
   state.textContent=active?'Activo':'Inactivo / vencido';
   expires.textContent=classDate(entry.expires_at);
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
   tr.append(label,state,expires,action);target.append(tr);
  }
  message.textContent=classes.length+' clases registradas. Los códigos no se almacenan en claro.';
 }catch(error){message.textContent=error.message;}
}
$class('class-create-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const message=$class('classes-message'),out=$class('class-new-code'),button=event.currentTarget.querySelector('button[type="submit"]');
 button.disabled=true;out.textContent='';
 try{
  const data=await classApi('create-class',{label:$class('class-label').value,hours:Number($class('class-hours').value)});
  out.textContent='Código para compartir con la clase: '+data.code+' · vence '+classDate(data.expires_at)+' · copialo ahora, después no podrá consultarse.';
  $class('class-label').value='';
  await listClasses();
 }catch(error){message.textContent=error.message;}
 finally{button.disabled=false;}
});
$class('classes-refresh').addEventListener('click',listClasses);
$class('admin-logout').addEventListener('click',async()=>{
 try{await classApi('logout');location.assign('/acceso.html');}
 catch(error){$class('classes-message').textContent=error.message;}
});
listClasses();
