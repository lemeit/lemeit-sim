/* Distribución flexible de paneles de ΣIM. Solo modifica presentación local. */
'use strict';
globalThis.SimDockLayout=(()=>{
 const STORE='sim-dock-layout-v1';
 const IDS=['equipment','inspector','results'];
 const fresh=()=>({swapped:false,floating:{equipment:false,inspector:false,results:false},positions:{}});
 function normalise(value){
  const s=fresh();
  if(!value||typeof value!=='object')return s;
  s.swapped=value.swapped===true;
  for(const id of IDS){
   s.floating[id]=value.floating?.[id]===true;
   const p=value.positions?.[id];
   if(p&&['left','top','width','height'].every(k=>Number.isFinite(p[k]))&&p.width>=220&&p.width<=1600&&p.height>=150&&p.height<=1200)s.positions[id]={left:p.left,top:p.top,width:p.width,height:p.height};
  }
  return s;
 }
 function slots(s){return s.swapped?{equipment:3,inspector:1}:{equipment:1,inspector:3};}
 function mount(){
  const workspace=document.querySelector('.workspace');
  if(!workspace)return;
  const elements={
   equipment:document.querySelector('.equipment-panel'),
   inspector:document.querySelector('.inspector-panel'),
   results:document.querySelector('#results-panel')
  };
  if(IDS.some(id=>!elements[id]))return;
  const menu=document.querySelector('#view-menu>.menu-panel');
  let state;try{state=normalise(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{state=fresh();}
  const persist=()=>{try{localStorage.setItem(STORE,JSON.stringify(state));}catch{}};
  const mobile=()=>window.innerWidth<=760;
  const floats={};
  const make=(tag,label,title)=>{const el=document.createElement(tag);el.type='button';el.textContent=label;el.title=title;el.setAttribute('aria-label',title);return el;};
  const wrappers={};
  for(const id of IDS){
   const el=elements[id],heading=el.querySelector(id==='results'?'.results-heading':'.panel-heading');
   const wrap=document.createElement('span');wrap.className='dock-tools';
   if(id!=='results'){
    const swap=make('button','⇄','Intercambiar paneles laterales');
    swap.className='dock-action dock-swap';
    swap.addEventListener('click',()=>{state.swapped=!state.swapped;apply();persist();});
    wrap.append(swap);
   }
   const toggle=make('button','↗','Flotar panel');
   toggle.className='dock-action dock-toggle';
   toggle.addEventListener('click',()=>{if(mobile())return;state.floating[id]=!state.floating[id];if(state.floating[id]&&!state.positions[id])state.positions[id]=defaultPosition(id);apply();persist();});
   wrap.append(toggle);heading.append(wrap);wrappers[id]={wrap,toggle,heading};
  }
  const reset=make('button','Restablecer distribución','Restablecer distribución de paneles');
  reset.id='view-reset-layout';menu?.append(reset);
  reset.addEventListener('click',()=>{state=fresh();apply();persist();document.querySelectorAll('.app-menu[open]').forEach(m=>m.removeAttribute('open'));});
  function defaultPosition(id){
   const rect=elements[id].getBoundingClientRect();
   return {left:Math.max(12,Math.min(window.innerWidth-350,rect.left+30)),top:Math.max(110,rect.top+25),width:id==='results'?Math.min(740,window.innerWidth-30):Math.min(340,window.innerWidth-30),height:id==='results'?350:Math.min(540,window.innerHeight-120)};
  }
  function position(el,p){
   const w=Math.min(Math.max(220,p.width),Math.max(220,window.innerWidth-24));
   const h=Math.min(Math.max(150,p.height),Math.max(150,window.innerHeight-80));
   const x=Math.max(8,Math.min(p.left,window.innerWidth-w-8));
   const y=Math.max(65,Math.min(p.top,window.innerHeight-h-8));
   el.style.left=x+'px';el.style.top=y+'px';el.style.width=w+'px';el.style.height=h+'px';
   return {left:x,top:y,width:w,height:h};
  }
  function apply(){
   const desktop=!mobile()&&!document.body.classList.contains('diagram-focus')&&!document.body.classList.contains('results-window');
   const side=slots(state);
   document.body.classList.toggle('layout-custom',desktop);
   for(const id of IDS){
    const el=elements[id],isFloat=desktop&&state.floating[id];
    el.classList.toggle('sim-panel-floating',isFloat);
    if(id!=='results'){
      el.style.gridColumn=desktop?String(side[id]):'';
      el.style.gridRow=desktop?'1':'';
    }
    if(isFloat){state.positions[id]=position(el,state.positions[id]||defaultPosition(id));}
    else for(const prop of ['left','top','width','height'])el.style[prop]='';
    wrappers[id].toggle.textContent=isFloat?'↙':'↗';
    wrappers[id].toggle.title=isFloat?'Acoplar panel':'Flotar panel';
    wrappers[id].toggle.setAttribute('aria-label',wrappers[id].toggle.title);
    wrappers[id].toggle.disabled=mobile();
   }
   if(desktop){
    const leftId=state.swapped?'inspector':'equipment',rightId=state.swapped?'equipment':'inspector';
    workspace.style.setProperty('--dock-left',state.floating[leftId]?'0px':`var(--${leftId==='equipment'?'equipment':'inspector'}-width, ${leftId==='equipment'?186:265}px)`);
    workspace.style.setProperty('--dock-right',state.floating[rightId]?'0px':`var(--${rightId==='equipment'?'equipment':'inspector'}-width, ${rightId==='equipment'?186:265}px)`);
    elements.inspector.style.removeProperty('display');elements.equipment.style.removeProperty('display');
    document.body.classList.toggle('layout-swapped',state.swapped);
   }else{
    workspace.style.removeProperty('--dock-left');workspace.style.removeProperty('--dock-right');
    document.body.classList.remove('layout-swapped');
   }
   persist();
  }
  for(const id of IDS){
   const heading=wrappers[id].heading,el=elements[id];
   let drag=null;
   heading.addEventListener('pointerdown',e=>{
     if(e.button!==0||!el.classList.contains('sim-panel-floating')||e.target.closest('button,a,input,select,[role=button]'))return;
     const p=state.positions[id];drag={x:e.clientX,y:e.clientY,left:p.left,top:p.top};heading.setPointerCapture(e.pointerId);
   });
   heading.addEventListener('pointermove',e=>{
     if(!drag)return;
     state.positions[id]=position(el,{...state.positions[id],left:drag.left+e.clientX-drag.x,top:drag.top+e.clientY-drag.y});
   });
   const end=()=>{if(drag){drag=null;persist();}};
   heading.addEventListener('pointerup',end);heading.addEventListener('pointercancel',end);
   el.addEventListener('pointerup',()=>{if(el.classList.contains('sim-panel-floating')){const r=el.getBoundingClientRect();state.positions[id]={left:r.left,top:r.top,width:r.width,height:r.height};persist();}});
  }
  window.addEventListener('resize',apply);
  apply();return {reset:()=>{state=fresh();apply();}};
 }
 return Object.freeze({normalise,slots,mount});
})();
