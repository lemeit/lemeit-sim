(()=>{
 'use strict';
 document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog')?.close()));
 document.querySelectorAll('dialog').forEach(dialog=>{
  let startedOutside=false;
  const outside=event=>{const r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;};
  dialog.addEventListener('pointerdown',event=>{startedOutside=event.target===dialog&&outside(event);});
  dialog.addEventListener('pointercancel',()=>{startedOutside=false;});
  dialog.addEventListener('click',event=>{if(startedOutside&&event.target===dialog&&outside(event))dialog.close();startedOutside=false;});
 });
})();
