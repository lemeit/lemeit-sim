/* Metadatos didácticos y notas gráficas: no se envían a DWSIM. */
'use strict';
const SimExerciseEditor=(()=>{
  let getGraph,nonPhysical,getSVG,getPoint,render;
  let dragged=null,draftNotes=null;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function notes(g){return Array.isArray(g.annotations)?g.annotations:[];}
  function markup(g,exporting=false){
    return notes(g).map(n=>{
      const x=Number(n.x),y=Number(n.y);
      if(!Number.isFinite(x)||!Number.isFinite(y))return '';
      const lines=String(n.text||'').slice(0,400).split(/\r?\n/).slice(0,7);
      const width=Math.min(320,Math.max(110,...lines.map(l=>l.length*7+24)));
      const height=20+lines.length*18;
      return '<g class="exercise-note" transform="translate('+x+' '+y+')"'+(exporting?'':' data-exercise-note="'+esc(n.id)+'" role="button" tabindex="0" aria-label="Anotación: '+esc(n.text)+'"')+'><rect width="'+width+'" height="'+height+'" rx="5"/>'+lines.map((line,i)=>'<text x="12" y="'+(21+i*18)+'">'+esc(line.slice(0,65))+'</text>').join('')+'</g>';
    }).join('');
  }
  function renderNotes(){
    const list=$('exercise-note-list');list.replaceChildren();
    for(const n of draftNotes||[]){
      const row=document.createElement('div');row.className='exercise-note-row';
      const input=document.createElement('textarea');input.rows=2;input.maxLength=400;input.value=n.text||'';input.setAttribute('aria-label','Texto de anotación');
      input.addEventListener('input',()=>{n.text=input.value;});
      const remove=document.createElement('button');remove.type='button';remove.textContent='Eliminar';remove.addEventListener('click',()=>{draftNotes=draftNotes.filter(a=>a.id!==n.id);renderNotes();});
      row.append(input,remove);list.append(row);
    }
  }
  function sync(){
    const g=getGraph();
    draftNotes=structuredClone(notes(g));
    $('exercise-statement').value=g.exercise?.statement||g.learning||'';
    $('exercise-instructions').value=g.exercise?.instructions||'';
    $('exercise-observations').value=g.exercise?.observations||'';
    SimProjectReport.sync();
    renderNotes();
  }
  function showTab(name){
    const available=['activity','notes','report'],chosen=available.includes(name)?name:'activity';
    for(const section of available){
      const selected=section===chosen;
      $('project-section-'+section).hidden=!selected;
      $('project-tab-'+section).setAttribute('aria-selected',String(selected));
      $('project-tab-'+section).tabIndex=selected?0:-1;
    }
    if(chosen==='report')$('report-statement-preview').textContent=$('exercise-statement').value||'Sin enunciado';
  }
  function open(tab='activity'){
    if(!getGraph()?.compounds?.length)return;
    sync();showTab(tab);
    for(const menu of document.querySelectorAll('.app-menu[open]'))menu.open=false;
    $('exercise-dialog').showModal();
  }
  function save(){
    const g=getGraph();
    g.exercise={statement:$('exercise-statement').value.slice(0,4000),instructions:$('exercise-instructions').value.slice(0,4000),observations:$('exercise-observations').value.slice(0,4000)};
    g.learning=g.exercise.statement;
    g.annotations=structuredClone(draftNotes||[]);
    SimProjectReport.save();
    nonPhysical();
    $('exercise-dialog').close();
  }
  function bind(options){
    ({getGraph,nonPhysical,getSVG,getPoint,render}=options);
    $('exercise-open').addEventListener('click',()=>open('activity'));
    $('project-editor-menu').addEventListener('click',()=>open('activity'));
    $('project-report-menu').addEventListener('click',()=>{$('report-pdf-menu').click();});
    for(const tab of document.querySelectorAll('[data-project-tab]'))tab.addEventListener('click',()=>showTab(tab.dataset.projectTab));
    $('project-editor-cancel').addEventListener('click',()=>$('exercise-dialog').close());
    $('project-editor-report').addEventListener('click',()=>{save();$('report-pdf-menu').click();});
    $('exercise-form').addEventListener('submit',e=>{e.preventDefault();save();});
    $('exercise-new-note').addEventListener('click',()=>{
      if(!draftNotes||draftNotes.length>=20)return;
      draftNotes.push({id:'note-'+crypto.randomUUID().slice(0,8),x:70,y:70+draftNotes.length*38,text:'Nueva anotación'});
      renderNotes();
    });
    const svg=getSVG();
    svg.addEventListener('pointerdown',e=>{
      const el=e.target.closest('[data-exercise-note]');if(!el||e.button!==0)return;
      e.preventDefault();e.stopImmediatePropagation();
      const g=getGraph(),note=notes(g).find(n=>n.id===el.dataset.exerciseNote);if(!note)return;
      const p=getPoint(e);dragged={id:note.id,x:note.x,y:note.y,start:p,moved:false};
      svg.setPointerCapture(e.pointerId);
    },true);
    svg.addEventListener('pointermove',e=>{
      if(!dragged)return;
      e.stopImmediatePropagation();const p=getPoint(e),note=notes(getGraph()).find(n=>n.id===dragged.id);
      if(!note)return;note.x=Math.round(dragged.x+p.x-dragged.start.x);note.y=Math.round(dragged.y+p.y-dragged.start.y);
      dragged.moved=true;render();
    },true);
    for(const type of ['pointerup','pointercancel'])svg.addEventListener(type,e=>{
      if(!dragged)return;e.stopImmediatePropagation();
      const moved=dragged.moved;dragged=null;
      if(moved)nonPhysical();else open();
    },true);
    svg.addEventListener('keydown',e=>{
      const el=e.target.closest('[data-exercise-note]');if(!el)return;
      if(e.key==='Enter'){e.preventDefault();open();}
      if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();const g=getGraph();g.annotations=notes(g).filter(n=>n.id!==el.dataset.exerciseNote);nonPhysical();}
    },true);
  }
  function validate(g){
    if(g.exercise!==undefined){
      if(!g.exercise||typeof g.exercise!=='object')throw Error('Enunciado inválido.');
      for(const [field,max] of Object.entries({title:120,statement:4000,instructions:4000,observations:4000}))
        if(g.exercise[field]!==undefined&&(typeof g.exercise[field]!=='string'||g.exercise[field].length>max))throw Error('Campo didáctico inválido: '+field);
    }
    if(g.annotations!==undefined){
      if(!Array.isArray(g.annotations)||g.annotations.length>20)throw Error('Cantidad de anotaciones inválida.');
      const ids=new Set();
      for(const n of g.annotations){
        if(!n||typeof n.id!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(n.id)||ids.has(n.id)||typeof n.text!=='string'||n.text.length>400||!Number.isFinite(n.x)||!Number.isFinite(n.y))throw Error('Anotación inválida.');
        ids.add(n.id);
      }
    }
  }
  return {markup,bind,validate,open};
})();
