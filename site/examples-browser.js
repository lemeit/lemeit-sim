/* Explorador de casos: filtrar nunca carga ni modifica una simulación. */
'use strict';
globalThis.SimExamplesBrowser=(()=>{
 const clean=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function matches({number,category,text},query,filter='all'){
  const term=clean(query.trim());
  return (filter==='all'||category===filter)&&(!term||(/^\d{1,2}$/.test(term)?number===term.padStart(2,'0'):clean(text).includes(term)));
 }
 function mount({openGuide}){
  const dialog=document.getElementById('examples-dialog'),search=document.getElementById('examples-search'),rows=[...dialog.querySelectorAll('.example-entry')];let filter='all';
  const quick=document.getElementById('examples-quick-menu');
  if(quick){
   const names={balances:'Balances de materia',energia:'Energía',mezclas:'Mezcla y separación',reacciones:'Reactores',recirculacion:'Recirculación',dinamica:'Dinámica',equipos:'Equipos'};
   const groups=new Map();
   for(const row of rows){const category=row.dataset.category;if(!groups.has(category))groups.set(category,[]);groups.get(category).push(row);}
   for(const [category,items] of groups){const section=document.createElement('details');section.className='examples-category';const title=document.createElement('summary');title.textContent=names[category]||category.charAt(0).toUpperCase()+category.slice(1);section.append(title);
    for(const row of items){const b=document.createElement('button');b.type='button';b.textContent=row.dataset.number+' · '+row.querySelector('[data-example-title]').textContent;b.addEventListener('click',()=>row.querySelector('[data-example]').click());section.append(b);}
    section.addEventListener('toggle',()=>{if(section.open)for(const other of quick.querySelectorAll('details'))if(other!==section)other.open=false;});quick.append(section);}
  }
  function refresh(){let count=0;for(const row of rows){row.hidden=!matches({number:row.dataset.number,category:row.dataset.category,text:row.textContent},search.value,filter);if(!row.hidden)count++;}document.getElementById('examples-count').textContent=count+' de '+rows.length+' ejemplos';document.getElementById('examples-empty').hidden=count!==0;}
  dialog.querySelectorAll('[data-example-title]').forEach(button=>button.onclick=()=>{const row=button.closest('.example-entry');row.querySelector('[data-example]').click();});
  search.addEventListener('input',refresh);search.addEventListener('keydown',event=>{if(event.key==='Enter')event.preventDefault();});
  dialog.querySelectorAll('[data-example-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.exampleFilter;dialog.querySelectorAll('[data-example-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refresh();});
  dialog.querySelectorAll('[data-example-guide]').forEach(button=>button.onclick=()=>{dialog.close();openGuide(button.dataset.exampleGuide);});refresh();
 }
 return {matches,mount};
})();
