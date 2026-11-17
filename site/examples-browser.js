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
  function refresh(){let count=0;for(const row of rows){row.hidden=!matches({number:row.dataset.number,category:row.dataset.category,text:row.textContent},search.value,filter);if(!row.hidden)count++;}document.getElementById('examples-count').textContent=count+' de '+rows.length+' ejemplos';document.getElementById('examples-empty').hidden=count!==0;}
  search.addEventListener('input',refresh);search.addEventListener('keydown',event=>{if(event.key==='Enter')event.preventDefault();});
  dialog.querySelectorAll('[data-example-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.exampleFilter;dialog.querySelectorAll('[data-example-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refresh();});
  dialog.querySelectorAll('[data-example-guide]').forEach(button=>button.onclick=()=>{dialog.close();openGuide(button.dataset.exampleGuide);});refresh();
 }
 return {matches,mount};
})();
