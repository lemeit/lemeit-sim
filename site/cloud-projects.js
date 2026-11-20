/* Biblioteca D1 compartida entre dispositivos: no depende de localStorage. */
'use strict';
const SimCloudProjects=(()=>{
  const $=id=>document.getElementById(id);
  let getGraph,hasProject,loadGraph,notice,closeMenus,me=null,active=null,revision=null,version=0,timer=null,working=false,dirty=false,pendingSave=false;
  const api=async(path,method='GET',payload)=>{
    const options={method,credentials:'same-origin',cache:'no-store'};
    if(method!=='GET')Object.assign(options,{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload||{})});
    options.signal=AbortSignal.timeout(12000);
    const response=await fetch(path,options);
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'No se pudo acceder a la nube.');
    return data;
  };
  const student=()=>me?.role==='student';
  const identified=()=>student()&&!!me.student_name;
  const available=()=>me?.role==='admin'||identified();
  const status=message=>{$('cloud-project-status').textContent=message;};
  function resetActive(){
    active=null;revision=null;version++;dirty=false;
    if(timer)clearTimeout(timer);timer=null;
  }
  async function refreshIdentity(){
    const data=await api('/api/auth/me');
    me=data;
    if(!me.authenticated)throw Error('Iniciá una sesión de clase antes de usar la biblioteca.');
    $('cloud-identification').hidden=!student()||identified();
    $('cloud-identify-message').textContent='';
    $('cloud-library-body').hidden=!available();
    $('cloud-project-save').disabled=!identified()||!hasProject();
    $('cloud-project-copy').disabled=!identified()||!hasProject();
    if(student()){
      $('cloud-space-name').textContent=(me.class_name||'Clase')+(identified()?' · '+me.student_name:'');
    }else{
      $('cloud-space-name').textContent='Administración · consultar proyectos de una clase';
      const {classes}=await api('/api/auth/list-classes','POST');
      const select=$('cloud-class-select');select.replaceChildren();
      for(const c of classes){
        const opt=document.createElement('option');opt.value=c.id;opt.textContent=c.label;select.append(opt);
      }
    }
    $('cloud-admin-classes').hidden=student();
  }
  async function open(){
    closeMenus();status('Conectando con la biblioteca…');
    $('cloud-project-dialog').showModal();
    try{await refreshIdentity();if(available())await list();}
    catch(error){status(error.message);}
  }
  function requestClass(){
    const id=$('cloud-class-select').value;
    return me?.role==='admin'?('?class_id='+encodeURIComponent(id)):'';
  }
  async function list(){
    if(!available())return;
    status('Consultando proyectos…');
    try{
      const {projects}=await api('/api/projects'+requestClass());
      const target=$('cloud-project-list');target.replaceChildren();
      $('cloud-project-count').textContent=projects.length+' proyecto(s) guardado(s)';
      if(!projects.length)target.textContent='Todavía no hay proyectos en este espacio.';
      for(const p of projects){
        const row=document.createElement('div');row.className='local-project-entry';
        const info=document.createElement('div');info.className='local-project-info';
        const title=document.createElement('strong');title.textContent=p.title;
        const meta=document.createElement('small');
        meta.textContent=(p.student_name?p.student_name+' · ':'')+'Modificado '+new Date(p.updated_at*1000).toLocaleString('es-AR');
        info.append(title,meta);
        const controls=document.createElement('div');controls.className='local-project-actions';
        const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;return b;};
        controls.append(button('Abrir',async()=>{
          if(hasProject()&&!window.confirm('Abrir proyecto desde la nube: los cambios locales no guardados podrían perderse. ¿Continuar?'))return;
          try{
            const {project}=await api('/api/projects/'+p.id+requestClass());
            resetActive();loadGraph(project.graph);
            if(identified()){active=project.id;revision=project.revision;}
            $('cloud-project-dialog').close();
            notice(me.role==='admin'?'Proyecto consultado como administrador; la edición no se guardará en la nube.':'Proyecto recuperado de la nube. Los cambios posteriores se guardarán automáticamente.');
          }catch(error){status(error.message);}
        }));
        if(identified())controls.append(button('Eliminar',async()=>{
          if(!window.confirm('¿Eliminar este proyecto de la nube? Esta acción no se puede deshacer.'))return;
          try{await api('/api/projects/'+p.id,'DELETE');if(active===p.id)resetActive();await list();}
          catch(error){status(error.message);}
        }));
        row.append(info,controls);target.append(row);
      }
      status('Tus proyectos están disponibles desde cualquier computadora.');
    }catch(error){status(error.message);}
  }
  async function save(copy=false,quiet=false){
    if(!identified())return !quiet&&status('Ingresá primero con tu alias y clave personal.');
    if(!hasProject())return !quiet&&status('Abrí o creá un proyecto.');
    if(working){dirty=true;return;}
    working=true;const currentGeneration=version;
    const graph=structuredClone(getGraph());
    try{
      let data;
      if(copy||!active){
        data=await api('/api/projects','POST',{graph});
        if(currentGeneration===version){active=data.id;revision=data.revision;}
      }else{
        data=await api('/api/projects/'+active,'PUT',{graph,revision});
        if(currentGeneration===version)revision=data.revision;
      }
      if(!quiet){status('Proyecto guardado en la nube.');notice('Proyecto guardado en la nube.');if($('cloud-project-dialog').open)await list();}
      else status('Guardado automáticamente en la nube.');
    }catch(error){status('No se pudo guardar: '+error.message+' Descargá el JSON como respaldo.');if(!$('cloud-project-dialog').open)notice('No se pudo guardar en la nube: '+error.message,true);dirty=false;}
    finally{
      working=false;
      if(dirty&&currentGeneration===version){dirty=false;onChange();}
    }
  }
  function onChange(){
    if(!identified()||!active||!hasProject())return;
    if(timer)clearTimeout(timer);
    timer=setTimeout(()=>{timer=null;void save(false,true);},1800);
  }
  function bind(options){
    ({getGraph,hasProject,loadGraph,notice,closeMenus}=options);
    $('cloud-projects-open').onclick=open;
    $('cloud-save-menu').onclick=async()=>{
      closeMenus();
      if(!hasProject())return notice('Primero creá o abrí un proyecto.',true);
      if(!identified()){
        pendingSave=true;
        await open();
        if(identified()){pendingSave=false;await save();}
        else status('Identificate para guardar tu proyecto.');
        return;
      }
      await save();
    };
    $('cloud-project-save').onclick=()=>void save();
    $('cloud-project-copy').onclick=()=>void save(true);
    $('cloud-class-select').onchange=()=>void list();
    $('cloud-project-dialog').addEventListener('close',()=>{pendingSave=false;});
    $('cloud-identify-form').onsubmit=async event=>{
      event.preventDefault();
      const button=$('cloud-identify-submit'),message=$('cloud-identify-message');
      button.disabled=true;button.textContent='Ingresando…';message.textContent='Comprobando tus datos…';
      try{
        const result=await api('/api/auth/student-identity','POST',{
          action:$('cloud-identify-action').value,
          alias:$('cloud-identify-alias').value,
          password:$('cloud-identify-password').value
        });
        $('cloud-identify-password').value='';
        me={...me,student_name:result.student_name};
        $('cloud-identification').hidden=true;
        $('cloud-library-body').hidden=false;
        const shouldSave=pendingSave;
        pendingSave=false;
        $('cloud-project-dialog').close();
        notice('Ingresaste como '+result.student_name+'. Ya podés guardar y abrir tus proyectos.');
        if(shouldSave)await save();
      }catch(error){
        const explanation=error.name==='TimeoutError'?'No se recibió respuesta. Comprobá la conexión e intentá nuevamente.':error.message;
        message.textContent=explanation;
        status(explanation);
      }
      finally{button.disabled=false;button.textContent='Continuar';}
    };
  }
  return {bind,open,onChange,resetActive};
})();
