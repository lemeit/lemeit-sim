/* Distribución personalizable de la barra de herramientas de ΣIM.
 * Solo cambia presentación local, nunca modifica el proyecto ni DWSIM. */
'use strict';
globalThis.SimToolbarLayout=(()=>{
 const KEY='sim-toolbar-layout-v1';
 const WIDTH_KEY='sim-toolbar-widths-v1';
 const FLOAT_KEY='sim-toolbar-floating-v1';
 const ORDER=['file-tools','project-tools','drawing-tools','simulation-tools','zoom-controls','portal-tools'];
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
   if(JSON.stringify(saved)===JSON.stringify(['file-tools','project-tools','simulation-tools','drawing-tools','zoom-controls','portal-tools']))saved=null;
   apply(ordered(saved));
   const floating=new Map(),widths=new Map();
   try{
     const layouts=JSON.parse(localStorage.getItem(FLOAT_KEY)||'{}');
     const savedWidths=JSON.parse(localStorage.getItem(WIDTH_KEY)||'{}');
     for(const id of ORDER){
       const layout=layouts?.[id];
       if(layout&&[layout.x,layout.y,layout.width].every(Number.isFinite))floating.set(id,layout);
       if(Number.isFinite(savedWidths?.[id]))widths.set(id,savedWidths[id]);
     }
   }catch{}
   const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
   function place(id){
     const el=groups.get(id),layout=floating.get(id);
     el.classList.toggle('toolbar-floating',!!layout);
     const width=widths.get(id)??layout?.width;
     el.classList.toggle('toolbar-sized',width!==undefined);
     if(width===undefined){el.style.removeProperty('--toolbar-width');return;}
     const minWidth=Math.max(56,...Array.from(el.children)
       .filter(child=>!child.matches('.toolbar-grip,.toolbar-resize'))
       .map(child=>child.offsetWidth+30));
     el.style.setProperty('--toolbar-width',clamp(width,minWidth,Math.max(minWidth,window.innerWidth-16))+'px');
     if(!layout)return;
     el.style.setProperty('--toolbar-x',clamp(layout.x,4,window.innerWidth-el.offsetWidth-4)+'px');
     el.style.setProperty('--toolbar-y',clamp(layout.y,4,window.innerHeight-el.offsetHeight-4)+'px');
   }
   function saveFloating(){try{localStorage.setItem(FLOAT_KEY,JSON.stringify(Object.fromEntries(floating)));}catch{}}
   function saveWidths(){try{localStorage.setItem(WIDTH_KEY,JSON.stringify(Object.fromEntries(widths)));}catch{}}
   function dock(id){
     floating.delete(id);place(id);saveFloating();
   }
   window.addEventListener('resize',()=>groups.forEach((_,id)=>place(id)));
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
     if(resize){
       widths.set(id,layout.width+dx);
       place(id);
     }else if(gesture.floating){
       floating.set(id,{x:layout.x+dx,y:layout.y+dy,width:layout.width});
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
     const {id,moved,resize,layout,previousWidth,floating:wasFloating}=gesture;
     gesture=null;
     const el=groups.get(id);
     if(moved&&resize){
       if(e.type==='pointerup'){
         widths.set(id,el.getBoundingClientRect().width);
         saveWidths();
       }else if(previousWidth===undefined){
         widths.delete(id);
       }else{
         widths.set(id,previousWidth);
       }
       place(id);
     }else if(moved&&e.type==='pointerup'){
       const bounds=bar.getBoundingClientRect();
       const overBar=e.clientX>=bounds.left&&e.clientX<=bounds.right&&e.clientY>=bounds.top&&e.clientY<=bounds.bottom;
       if(overBar){
         dock(id);
         if(target){
           const items=current(bar);
           bar.insertBefore(el,items.indexOf(el)<items.indexOf(target)?target.nextSibling:target);
           save();
         }
       }else if(!wasFloating){
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
         floating:floating.has(id),previousWidth:widths.get(id),layout:{x:rect.left,y:rect.top,width:rect.width},moved:false};
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
     handle.innerHTML='<svg viewBox="0 0 12 18" width="6" height="10" aria-hidden="true"><circle cx="3" cy="4" r="1"/><circle cx="9" cy="4" r="1"/><circle cx="3" cy="9" r="1"/><circle cx="9" cy="9" r="1"/><circle cx="3" cy="14" r="1"/><circle cx="9" cy="14" r="1"/></svg>';
     el.prepend(handle);
     bindPointer(handle,id);
     const resize=document.createElement('button');
     resize.type='button';resize.className='toolbar-resize';
     resize.setAttribute('aria-label','Cambiar ancho del grupo '+label[id]);
     resize.title='Arrastrar el borde para cambiar el ancho · ← / →';
     el.append(resize);
     bindPointer(resize,id,true);
     resize.addEventListener('keydown',e=>{
       if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
       e.preventDefault();
       widths.set(id,el.offsetWidth+(e.key==='ArrowLeft'?-20:20));
       place(id);
       widths.set(id,el.getBoundingClientRect().width);
       saveWidths();
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
     widths.clear();saveWidths();
     for(const id of ORDER)dock(id);
     apply(ORDER);save();document.querySelectorAll('.app-menu[open]').forEach(el=>el.open=false);
   });
 }
 return {mount,ordered};
})();
document.addEventListener('DOMContentLoaded',()=>SimToolbarLayout.mount());
