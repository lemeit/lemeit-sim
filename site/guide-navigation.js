"use strict";
globalThis.SimGuide=(()=>{
 function mount(root=document,onReturn=null){
  const standalone=root===document;
  const sections=[...root.querySelectorAll('section[id]')],links=[...root.querySelectorAll('.exercise-index a')],$=id=>root.querySelector('#'+id);let current=sections[0]?.id;
  const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function activate(id){const visible=sections.filter(s=>!s.hidden),index=visible.findIndex(s=>s.id===id);if(index<0)return;current=id;links.forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});$('guide-current').textContent=sections.find(s=>s.id===id).querySelector('h2').textContent;for(const [name,delta] of [['guide-prev',-1],['guide-next',1]]){const target=visible[index+delta];$(name).setAttribute('aria-disabled',String(!target));$(name).tabIndex=target?0:-1;$(name).href=target?'#'+target.id:'#'+id;}}
  function reveal(id){const section=sections.find(s=>s.id===id);if(section){section.hidden=false;section.querySelector('details').open=true;activate(id);section.scrollIntoView({block:'start'});}}
  function filter(){const query=clean($('guide-search').value.trim());const intro=root.querySelector('.guide-intro');if(intro)intro.hidden=!!query;let count=0;for(const section of sections){const matches=!query||(/^\d{1,2}$/.test(query)?clean(section.querySelector('h2').textContent).startsWith(query.padStart(2,'0')+' ·'):clean(section.textContent).includes(query));section.hidden=!matches;if(matches)count++;const link=links.find(a=>a.hash==='#'+section.id);if(link)link.hidden=!matches;if(query&&matches)section.querySelector('details').open=true;}$('guide-count').textContent=count+' de '+sections.length+' ejercicios';const selected=sections.find(s=>s.id===current&&!s.hidden)||sections.find(s=>!s.hidden);if(selected)activate(selected.id);else{$('guide-current').textContent='Sin coincidencias';for(const name of ['guide-prev','guide-next'])$(name).setAttribute('aria-disabled','true');}}
  $('guide-search').addEventListener('input',filter);$('guide-expand').onclick=()=>sections.filter(s=>!s.hidden).forEach(s=>s.querySelector('details').open=true);$('guide-collapse').onclick=()=>sections.forEach(s=>s.querySelector('details').open=false);
  for(const link of [...links,$('guide-prev'),$('guide-next')])link.addEventListener('click',e=>{if(link.getAttribute('aria-disabled')==='true'){e.preventDefault();return;}if(!standalone)e.preventDefault();reveal(decodeURIComponent(link.hash.slice(1)));});
  $('guide-return').onclick=e=>{if(onReturn){e.preventDefault();onReturn();}};
  if(standalone)window.addEventListener('hashchange',()=>reveal(decodeURIComponent(location.hash.slice(1))));
  else for(const link of root.querySelectorAll('a[href]:not([href^="#"])'))if(link.id!=='guide-return'){link.target='_blank';link.rel='noopener';}
  filter();if(standalone&&location.hash)reveal(decodeURIComponent(location.hash.slice(1)));else if(sections[0])sections[0].querySelector('details').open=true;
  const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&!e.target.hidden)activate(e.target.id);},{root:standalone?null:root,rootMargin:'-15% 0px -65% 0px'});sections.forEach(s=>observer.observe(s));
 }
 async function open(dialog,host){
  dialog.showModal();if(host.shadowRoot)return;host.textContent='Cargando guía…';
  try{const response=await fetch('ejemplos.html');if(!response.ok)throw Error('No se pudo cargar la guía.');const parsed=new DOMParser().parseFromString(await response.text(),'text/html'),main=parsed.querySelector('main');if(!main)throw Error('La guía no tiene contenido.');
   host.textContent='';const shadow=host.attachShadow({mode:'open'}),link=document.createElement('link');link.rel='stylesheet';link.href='examples-guide.css';const style=document.createElement('style');style.textContent=':host{display:block;height:100%;width:100%;min-height:0} *,*::before,*::after{box-sizing:border-box} .guide-embedded{height:100%;overflow:auto;background:var(--spx-bg);color:var(--spx-text);font:15px/1.6 var(--spx-font-sans)}';const root=document.createElement('div');root.className='guide-embedded';root.append(main);shadow.append(link,style,root);mount(root,()=>dialog.close());
  }catch(e){host.textContent=e.message+' Abrila desde Ayuda o volvé a intentarlo.';}
 }
 if(!document.body.classList.contains('sim-shell')){try{const saved=localStorage.getItem('simprox-theme');if(saved==='dark'||saved==='light')document.documentElement.dataset.theme=saved;}catch{}}
 if(document.querySelector('#guide-search'))mount();return {open,mount};
})();
