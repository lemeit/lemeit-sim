/* Distribución personalizable de la barra de herramientas de ΣIM.
 * Solo cambia presentación local, nunca modifica el proyecto ni DWSIM. */
'use strict';
globalThis.SimToolbarLayout=(()=>{
 const KEY='sim-toolbar-layout-v1';
 const FLOAT_KEY='sim-toolbar-floating-v1';
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
   const floating=new Map();
   try{
     const layouts=JSON.parse(localStorage.getItem(FLOAT_KEY)||'{}');
     for(const id of ORDER){
       const layout=layouts?.[id];
       if(layout&&[layout.x,layout.y,layout.width].every(Number.isFinite))floating.set(id,layout);
     }
   }catch{}
   const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
   function place(id){
     const el=groups.get(id),layout=floating.get(id);
     el.classList.toggle('toolbar-floating',!!layout);
     if(!layout)return;
     const width=clamp(layout.width,120,window.innerWidth-8);
     el.style.setProperty('--toolbar-width',width+'px');
     el.style.setProperty('--toolbar-x',clamp(layout.x,4,window.innerWidth-el.offsetWidth-4)+'px');
     el.style.setProperty('--toolbar-y',clamp(layout.y,4,window.innerHeight-el.offsetHeight-4)+'px');
   }
   function saveFloating(){try{localStorage.setItem(FLOAT_KEY,JSON.stringify(Object.fromEntries(floating)));}catch{}}
   function dock(id){
     floating.delete(id);place(id);saveFloating();
   }
   window.addEventListener('resize',()=>floating.forEach((_,id)=>place(id)));
   let gesture=null;
   let target=null;
   function showTarget(el){
     target?.classList.remove('toolbar-drop-target');
     target=el;
     target?.classList.add('toolbar-drop-target');
   }
   function move(e){
     if(gesture?.pointerId!==e.pointerId)return;
     const {id,startX,startY,layout,resize}=gesture;
     const dx=e.clientX-startX,dy=e.clientY-startY;
     if(!gesture.moved&&Math.hypot(dx,dy)<5)return;
     gesture.moved=true;
     bar.classList.add('toolbar-reordering');
     if(resize||gesture.floating){
       const width=resize?clamp(layout.width+dx,120,window.innerWidth-8):layout.width;
       floating.set(id,{x:layout.x+(resize?0:dx),y:layout.y+(resize?0:dy),width});
       place(id);
     }
     if(!resize){
       const hit=document.elementsFromPoint(e.clientX,e.clientY).find(el=>
         el.parentElement===bar&&el.classList.contains('command-group')&&!el.classList.contains('toolbar-floating'));
       showTarget(hit===groups.get(id)?null:hit);
     }
   }
   function finish(e){
     if(gesture?.pointerId!==e.pointerId)return;
     const {id,moved,resize,layout,floating:wasFloating}=gesture;
     gesture=null;
     const el=groups.get(id);
     if(moved&&e.type==='pointerup'){
       const bounds=bar.getBoundingClientRect();
       const overBar=e.clientX>=bounds.left&&e.clientX<=bounds.right&&e.clientY>=bounds.top&&e.clientY<=bounds.bottom;
       if(!resize&&overBar){
         dock(id);
         if(target){
           const items=current(bar);
           bar.insertBefore(el,items.indexOf(el)<items.indexOf(target)?target.nextSibling:target);
           save();
         }
       }else if(!resize&&!wasFloating){
         floating.set(id,{x:e.clientX-10,y:e.clientY-12,width:Math.ceil(layout.width)+24});
         place(id);
       }
       saveFloating();
     }else if(moved&&wasFloating){
       floating.set(id,layout);place(id);
     }
     showTarget(null);
     bar.classList.remove('toolbar-reordering');
   }
   function bindPointer(control,id,resize=false){
     control.addEventListener('pointerdown',e=>{
       if(!e.isPrimary||e.button!==0||gesture)return;
       const rect=groups.get(id).getBoundingClientRect();
       gesture={id,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,resize,
         floating:floating.has(id),layout:{x:rect.left,y:rect.top,width:rect.width},moved:false};
       control.setPointerCapture(e.pointerId);
     });
     control.addEventListener('pointermove',move);
     for(const name of ['pointerup','pointercancel','lostpointercapture'])control.addEventListener(name,finish);
   }
   for(const [id,el] of groups){
     const handle=document.createElement('button');
     handle.type='button';handle.className='toolbar-grip';
     handle.setAttribute('aria-label','Mover grupo '+label[id]+' de la barra de herramientas');
     handle.title='Arrastrar para mover '+label[id]+' · Alt + ← / → reordena, Alt + ↓ desacopla, Alt + ↑ acopla';
     handle.innerHTML='<svg viewBox="0 0 12 18" width="9" height="15" aria-hidden="true"><circle cx="3" cy="4" r="1.15"/><circle cx="9" cy="4" r="1.15"/><circle cx="3" cy="9" r="1.15"/><circle cx="9" cy="9" r="1.15"/><circle cx="3" cy="14" r="1.15"/><circle cx="9" cy="14" r="1.15"/></svg>';
     el.prepend(handle);
     bindPointer(handle,id);
     const resize=document.createElement('button');
     resize.type='button';resize.className='toolbar-resize';
     resize.setAttribute('aria-label','Cambiar ancho del grupo '+label[id]);
     resize.title='Cambiar ancho · ← / →';
     el.append(resize);
     bindPointer(resize,id,true);
     resize.addEventListener('keydown',e=>{
       if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
       e.preventDefault();
       const layout=floating.get(id);
       if(!layout)return;
       layout.width=clamp(el.offsetWidth+(e.key==='ArrowLeft'?-20:20),120,window.innerWidth-8);
       place(id);saveFloating();
     });
     place(id);
     handle.addEventListener('keydown',e=>{
       if(!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
       if(e.key==='ArrowUp'){e.preventDefault();dock(id);return;}
       if(e.key==='ArrowDown'){
         e.preventDefault();
         if(floating.has(id))return;
         const rect=el.getBoundingClientRect();
         floating.set(id,{x:rect.left,y:rect.bottom+8,width:Math.ceil(rect.width)+24});
         place(id);saveFloating();return;
       }
       if(floating.has(id))return;
       e.preventDefault();const arr=current(bar),at=arr.indexOf(el),to=at+(e.key==='ArrowLeft'?-1:1);
       if(to<0||to>=arr.length)return;
       if(to>at)bar.insertBefore(arr[to],el);else bar.insertBefore(el,arr[to]);
       save();handle.focus();
     });
   }
   document.getElementById('toolbar-layout-reset')?.addEventListener('click',()=>{
     for(const id of ORDER)dock(id);
     apply(ORDER);save();document.querySelectorAll('.app-menu[open]').forEach(el=>el.open=false);
   });
 }
 return {mount,ordered};
})();
document.addEventListener('DOMContentLoaded',()=>SimToolbarLayout.mount());
