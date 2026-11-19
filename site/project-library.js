/* Biblioteca de proyectos del navegador. No sincroniza dispositivos ni sube datos. */
'use strict';
const SimProjectLibrary=(()=>{
  const KEY='sim-project-library-v1',LIMIT=30;
  let getGraph,hasProject,loadGraph,notice,closeMenus,activeId=null;
  const $=id=>document.getElementById(id);
  const read=()=>{
    const data=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(!Array.isArray(data))throw Error('La biblioteca local no tiene un formato válido.');
    return data.filter(x=>x&&typeof x.id==='string'&&x.graph&&typeof x.graph==='object'&&typeof x.modified==='string').slice(0,LIMIT);
  };
  const write=items=>localStorage.setItem(KEY,JSON.stringify(items));
  const resetActive=()=>{activeId=null;};
  function save(asCopy=false){
    if(!hasProject())return notice('Creá o abrí un proyecto antes de guardarlo.',true);
    try{
      const items=read();
      let id=!asCopy&&activeId&&items.some(item=>item.id===activeId)?activeId:null;
      if(!id&&items.length>=LIMIT)return notice('La biblioteca local admite hasta 30 proyectos. Exportá uno a JSON y eliminá alguna copia para continuar.',true);
      if(!id)id='project-'+crypto.randomUUID();
      const g=structuredClone(getGraph());
      const item={id,title:String(g.title||'Proceso sin título').trim().slice(0,70),modified:new Date().toISOString(),graph:g};
      const next=[item,...items.filter(i=>i.id!==id)];
      write(next);activeId=id;
      notice('Proyecto guardado en la biblioteca de este navegador. Para usarlo en otra computadora, descargá el JSON.');
      render();return id;
    }catch(error){notice('No se pudo guardar en este navegador: '+error.message+'. Descargá el JSON como copia de seguridad.',true);return null;}
  }
  function render(){
    const list=$('local-project-list');if(!list)return;
    list.replaceChildren();
    let items;
    try{items=read();}catch(error){list.textContent=error.message;return;}
    $('local-project-count').textContent=items.length+' de '+LIMIT+' proyectos locales';
    if(!items.length){list.textContent='No hay proyectos guardados en este navegador. Abrí o creá uno y elegí «Guardar en biblioteca».';
      return;}
    for(const item of items){
      const row=document.createElement('div');row.className='local-project-entry';
      const info=document.createElement('div');info.className='local-project-info';
      const title=document.createElement('strong');title.textContent=item.title;
      const date=document.createElement('small');
      const timestamp=new Date(item.modified);
      date.textContent=Number.isNaN(timestamp.getTime())?'Fecha desconocida':timestamp.toLocaleString('es-AR');
      info.append(title,date);
      const actions=document.createElement('div');actions.className='local-project-actions';
      const open=document.createElement('button');open.type='button';open.textContent='Abrir';
      open.onclick=()=>{
        if(hasProject()&&!window.confirm('¿Abrir este proyecto? Los cambios que no hayas guardado en la biblioteca o exportado pueden perderse.'))return;
        try{loadGraph(structuredClone(item.graph));activeId=item.id;$('local-project-dialog').close();closeMenus();notice('Proyecto abierto desde la biblioteca local. Calculá para actualizar sus resultados.');}
        catch(error){notice('No se pudo abrir este proyecto: '+error.message,true);}
      };
      const remove=document.createElement('button');remove.type='button';remove.textContent='Eliminar';
      remove.onclick=()=>{
        if(!window.confirm('¿Eliminar «'+item.title+'» de la biblioteca de este navegador?'))return;
        try{write(read().filter(i=>i.id!==item.id));if(activeId===item.id)activeId=null;render();}
        catch(error){notice('No se pudo eliminar: '+error.message,true);}
      };
      actions.append(open,remove);row.append(info,actions);list.append(row);
    }
  }
  function bind(options){
    ({getGraph,hasProject,loadGraph,notice,closeMenus}=options);
    $('local-projects-open').onclick=()=>{render();closeMenus();$('local-project-dialog').showModal();};
    $('local-projects-save').onclick=()=>save();
    $('local-project-save-current').onclick=()=>save();
    $('local-project-save-copy').onclick=()=>save(true);
    $('local-project-dialog').addEventListener('close',()=>{});
  }
  return {bind,save,resetActive,read};
})();
