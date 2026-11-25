/* Distribución personalizable de la barra de herramientas de ΣIM.
 * Solo cambia presentación local, nunca modifica el proyecto ni DWSIM. */
'use strict';
globalThis.SimToolbarLayout=(()=>{
 const KEY='sim-toolbar-layout-v1';
 const ORDER=['file-tools','project-tools','simulation-tools','drawing-tools','zoom-controls','portal-tools'];
 const label={ 'file-tools':'Archivo','project-tools':'Proyecto','simulation-tools':'Simulación','drawing-tools':'Diagrama','zoom-controls':'Vista','portal-tools':'Herramientas' };
 const current=bar=>[...bar.children].filter(el=>el.classList.contains('command-group')&&ORDER.some(k=>el.classList.contains(k)));
 const groupId=el=>ORDER.find(k=>el.classList.contains(k));
 function ordered(saved){
   if(!Array.isArray(saved)||saved.length!==ORDER.length||new Set(saved).size!==ORDER.length||!saved.every(k=>ORDER.includes(k)))return ORDER.slice();
   return saved;
 }
 function mount(){
   if(new URLSearchParams(location.search).has('diagram')||new URLSearchParams(location.search).has('results'))return;
   const bar=document.querySelector('.command-bar');if(!bar||bar.dataset.customizable)return;
   bar.dataset.customizable='true';
   const groups=new Map(current(bar).map(el=>[groupId(el),el]));if(groups.size!==ORDER.length)return;
   let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
   function apply(keys){
     const input=bar.querySelector('#file-input');
     for(const key of ordered(keys))bar.insertBefore(groups.get(key),input);
   }
   function save(){try{localStorage.setItem(KEY,JSON.stringify(current(bar).map(groupId)));}catch{}}
   apply(ordered(saved));
   let dragged=null;
   for(const [id,el] of groups){
     const handle=document.createElement('button');
     handle.type='button';handle.className='toolbar-grip';handle.draggable=true;
     handle.setAttribute('aria-label','Mover grupo '+label[id]+' de la barra de herramientas');
     handle.title='Arrastrar para reordenar '+label[id]+' · con teclado: Alt + ← / →';
     handle.innerHTML='<svg viewBox="0 0 12 18" width="9" height="15" aria-hidden="true"><circle cx="3" cy="4" r="1.15"/><circle cx="9" cy="4" r="1.15"/><circle cx="3" cy="9" r="1.15"/><circle cx="9" cy="9" r="1.15"/><circle cx="3" cy="14" r="1.15"/><circle cx="9" cy="14" r="1.15"/></svg>';
     el.prepend(handle);
     handle.addEventListener('dragstart',e=>{dragged=id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);bar.classList.add('toolbar-reordering');});
     el.addEventListener('dragover',e=>{if(!dragged||dragged===id)return;e.preventDefault();e.dataTransfer.dropEffect='move';el.classList.add('toolbar-drop-target');});
     el.addEventListener('dragleave',()=>el.classList.remove('toolbar-drop-target'));
     el.addEventListener('drop',e=>{if(!dragged||dragged===id)return;e.preventDefault();const items=current(bar);const source=groups.get(dragged);const before=items.indexOf(source)<items.indexOf(el);bar.insertBefore(source,before?el.nextSibling:el);el.classList.remove('toolbar-drop-target');save();});
     handle.addEventListener('dragend',()=>{dragged=null;bar.classList.remove('toolbar-reordering');for(const item of groups.values())item.classList.remove('toolbar-drop-target');});
     handle.addEventListener('keydown',e=>{
       if(!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key))return;
       e.preventDefault();const arr=current(bar),at=arr.indexOf(el),to=at+(e.key==='ArrowLeft'?-1:1);
       if(to<0||to>=arr.length)return;
       if(to>at)bar.insertBefore(arr[to],el);else bar.insertBefore(el,arr[to]);
       save();handle.focus();
     });
   }
   document.getElementById('toolbar-layout-reset')?.addEventListener('click',()=>{
     apply(ORDER);save();document.querySelectorAll('.app-menu[open]').forEach(el=>el.open=false);
   });
 }
 return {mount,ordered};
})();
document.addEventListener('DOMContentLoaded',()=>SimToolbarLayout.mount());
