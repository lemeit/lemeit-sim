(()=>{
 'use strict';
 document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog')?.close()));
 document.querySelectorAll('dialog').forEach(dialog=>{
  const heading=dialog.querySelector('.dialog-heading');
  if(heading){
   const clamp=(n,min,max)=>Math.max(min,Math.min(n,Math.max(min,max)));
   const bounds=()=>({w:window.innerWidth,h:window.innerHeight});
   const grip=document.createElement('button');grip.type='button';grip.className='sim-dialog-size';grip.textContent='◢';grip.title='Redimensionar ventana';grip.setAttribute('aria-label','Redimensionar ventana');dialog.append(grip);
   let gesture=null;
   const apply=(x,y,w,h)=>{const b=bounds();w=clamp(w,Math.min(300,b.w-16),b.w-16);h=clamp(h,Math.min(180,b.h-16),b.h-16);dialog.classList.add('sim-dialog-positioned');Object.assign(dialog.style,{left:clamp(x,8,b.w-w-8)+'px',top:clamp(y,8,b.h-h-8)+'px',width:w+'px',height:h+'px'});};
   const begin=(e,mode)=>{if(!dialog.open||e.button!==0||gesture||(mode==='move'&&e.target.closest('button,a,input,select,textarea')))return;const r=dialog.getBoundingClientRect();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,r,mode,target:e.currentTarget};e.preventDefault();e.stopPropagation();apply(r.left,r.top,r.width,r.height);e.currentTarget.setPointerCapture(e.pointerId);};
   const move=e=>{if(!gesture||gesture.id!==e.pointerId)return;const {r,x,y,mode}=gesture,dx=e.clientX-x,dy=e.clientY-y;apply(r.left+(mode==='move'?dx:0),r.top+(mode==='move'?dy:0),r.width+(mode==='size'?dx:0),r.height+(mode==='size'?dy:0));};
   const finish=e=>{if(!gesture||gesture.id!==e.pointerId)return;const target=gesture.target;gesture=null;if(target.hasPointerCapture(e.pointerId))target.releasePointerCapture(e.pointerId);};
   heading.classList.add('sim-dialog-drag');heading.title='Arrastrar para mover · doble clic para restaurar';
   heading.addEventListener('pointerdown',e=>begin(e,'move'));grip.addEventListener('pointerdown',e=>begin(e,'size'));
   for(const el of [heading,grip]){el.addEventListener('pointermove',move);el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish);el.addEventListener('lostpointercapture',()=>{gesture=null;});}
   const reset=()=>{dialog.classList.remove('sim-dialog-positioned');for(const key of ['left','top','width','height'])dialog.style.removeProperty(key);};
   heading.addEventListener('dblclick',e=>{if(!e.target.closest('button,a,input,select,textarea'))reset();});
   grip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const r=dialog.getBoundingClientRect();apply(r.left,r.top,r.width+({ArrowLeft:-16,ArrowRight:16}[e.key]||0),r.height+({ArrowUp:-16,ArrowDown:16}[e.key]||0));});
   dialog.addEventListener('close',()=>{gesture=null;reset();});
   window.addEventListener('resize',()=>{if(dialog.open&&dialog.classList.contains('sim-dialog-positioned')){const r=dialog.getBoundingClientRect();apply(r.left,r.top,r.width,r.height);}});
  }
  let startedOutside=false;
  const outside=event=>{const r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;};
  dialog.addEventListener('pointerdown',event=>{startedOutside=event.target===dialog&&outside(event);});
  dialog.addEventListener('pointercancel',()=>{startedOutside=false;});
  dialog.addEventListener('click',event=>{if(startedOutside&&event.target===dialog&&outside(event))dialog.close();startedOutside=false;});
 });
})();
