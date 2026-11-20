/* Metadatos didácticos y notas gráficas: no se envían a DWSIM. */
'use strict';
const SimExerciseEditor=(()=>{
  let getGraph,nonPhysical,getSVG,getPoint,render,canEdit;
  let dragged=null,draftNotes=null,selectedId=null,placing=false,editor=null;
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
      return '<g class="exercise-note'+(!exporting&&selectedId===n.id?' is-selected':'')+'" transform="translate('+x+' '+y+')"'+(exporting?'':' data-exercise-note="'+esc(n.id)+'" role="button" tabindex="0" aria-label="Anotación: '+esc(n.text)+'"')+'><rect width="'+width+'" height="'+height+'" rx="5"/>'+lines.map((line,i)=>'<text x="12" y="'+(21+i*18)+'">'+esc(line.slice(0,65))+'</text>').join('')+'</g>';
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
    if(editor)clearEditor(true);
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
  const findNote=id=>notes(getGraph()).find(n=>n.id===id);
  function select(id,focus=false){
    selectedId=id;
    getSVG().querySelectorAll('[data-exercise-note]').forEach(el=>{
      const current=el.dataset.exerciseNote===id;
      el.classList.toggle('is-selected',current);
      if(focus&&current)el.focus({preventScroll:true});
    });
    $('diagram').classList.toggle('note-is-selected',!!id);
  }
  function clearEditor(commit=false){
    if(!editor)return;
    const active=editor;editor=null;
    const value=active.textarea.value.slice(0,400);
    active.container.remove();
    if(commit&&findNote(active.id)&&findNote(active.id).text!==value){
      findNote(active.id).text=value;
      nonPhysical();
    }
    select(active.id,false);
  }
  function startEdit(id){
    if(!canEdit?.()||!findNote(id))return;
    if(editor)clearEditor(true);
    placing=false;$('diagram-note-insert').setAttribute('aria-pressed','false');
    const group=getSVG().querySelector('[data-exercise-note="'+id+'"]');
    if(!group)return;
    select(id,false);
    const note=findNote(id),wrap=$('canvas-wrap'),box=group.getBoundingClientRect(),canvas=wrap.getBoundingClientRect();
    const container=document.createElement('div');container.className='diagram-note-editor';
    const textarea=document.createElement('textarea');textarea.value=note.text||'';textarea.maxLength=400;textarea.rows=3;
    textarea.setAttribute('aria-label','Editar texto de anotación');
    textarea.setAttribute('title','Ctrl + Enter: guardar · Esc: cancelar');
    container.style.left=Math.max(0,box.left-canvas.left+wrap.scrollLeft)+'px';
    container.style.top=Math.max(0,box.top-canvas.top+wrap.scrollTop)+'px';
    container.style.width=Math.max(155,Math.min(350,box.width+50))+'px';
    container.append(textarea);wrap.append(container);
    editor={id,container,textarea};
    textarea.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();clearEditor(false);getSVG().focus({preventScroll:true});}
      if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();clearEditor(true);getSVG().focus({preventScroll:true});}
    });
    textarea.addEventListener('blur',()=>{if(editor?.textarea===textarea)clearEditor(true);});
    textarea.focus({preventScroll:true});textarea.select();
  }
  function insertAt(point){
    if(!canEdit?.()||notes(getGraph()).length>=20){placing=false;$('diagram-note-insert').setAttribute('aria-pressed','false');return;}
    const note={id:'note-'+crypto.randomUUID().slice(0,8),x:Math.round(point.x),y:Math.round(point.y),text:'Nueva anotación'};
    getGraph().annotations=[...notes(getGraph()),note];
    placing=false;$('diagram-note-insert').setAttribute('aria-pressed','false');
    nonPhysical();startEdit(note.id);
  }
  function removeNote(id){
    if(!findNote(id)||!canEdit?.())return;
    if(editor?.id===id)clearEditor(false);
    getGraph().annotations=notes(getGraph()).filter(n=>n.id!==id);
    selectedId=null;nonPhysical();getSVG().focus({preventScroll:true});
  }
  function bind(options){
    ({getGraph,nonPhysical,getSVG,getPoint,render,canEdit}=options);
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
    $('diagram-note-insert').addEventListener('click',()=>{
      if(!canEdit?.())return;
      if(editor)clearEditor(true);
      placing=!placing;
      $('diagram-note-insert').setAttribute('aria-pressed',String(placing));
      $('canvas-wrap').classList.toggle('note-insert-mode',placing);
      if(placing)getSVG().focus({preventScroll:true});
    });
    const svg=getSVG();
    svg.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      if(placing){
        e.preventDefault();e.stopImmediatePropagation();
        $('canvas-wrap').classList.remove('note-insert-mode');
        insertAt(getPoint(e));return;
      }
      const el=e.target.closest('[data-exercise-note]');
      if(!el||!canEdit?.())return;
      e.preventDefault();e.stopImmediatePropagation();
      if(editor)clearEditor(true);
      const note=findNote(el.dataset.exerciseNote);if(!note)return;
      select(note.id,true);
      const p=getPoint(e);
      dragged={id:note.id,x:note.x,y:note.y,start:p,moved:false,pointerId:e.pointerId};
      // Capturar sobre SVG, pero mover solo el grupo actual. Re-renderizar
      // en cada paso rompe el pointer capture y hace saltar la anotación.
      svg.setPointerCapture(e.pointerId);
    },true);
    svg.addEventListener('pointermove',e=>{
      if(!dragged||e.pointerId!==dragged.pointerId)return;
      e.stopImmediatePropagation();
      const p=getPoint(e),dx=p.x-dragged.start.x,dy=p.y-dragged.start.y;
      if(!dragged.moved&&Math.hypot(dx,dy)<3)return;
      dragged.moved=true;
      const note=findNote(dragged.id);if(!note)return;
      note.x=Math.round(dragged.x+dx);note.y=Math.round(dragged.y+dy);
      const el=svg.querySelector('[data-exercise-note="'+note.id+'"]');
      if(el)el.setAttribute('transform','translate('+note.x+' '+note.y+')');
    },true);
    for(const type of ['pointerup','pointercancel'])svg.addEventListener(type,e=>{
      if(!dragged||e.pointerId!==dragged.pointerId)return;
      e.stopImmediatePropagation();
      const moved=dragged.moved,original=dragged;
      dragged=null;
      if(type==='pointercancel'&&moved){
        const note=findNote(original.id);if(note){note.x=original.x;note.y=original.y;}
        render();select(original.id,false);
      }else if(moved)nonPhysical();
      else select(original.id,true);
    },true);
    svg.addEventListener('dblclick',e=>{
      const group=e.target.closest('[data-exercise-note]');if(!group)return;
      e.preventDefault();e.stopImmediatePropagation();startEdit(group.dataset.exerciseNote);
    },true);
    svg.addEventListener('keydown',e=>{
      const el=e.target.closest('[data-exercise-note]');
      const id=el?.dataset.exerciseNote||selectedId;
      if(!id||!findNote(id))return;
      if(e.key==='Enter'&&el){e.preventDefault();e.stopImmediatePropagation();startEdit(id);return;}
      if((e.key==='Delete'||e.key==='Backspace')&&!e.ctrlKey&&!e.metaKey){
        e.preventDefault();e.stopImmediatePropagation();removeNote(id);return;
      }
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();select(null);}
    },true);
    // La aplicación también escucha Escape y Supr a nivel documento.
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&placing){
        placing=false;$('canvas-wrap').classList.remove('note-insert-mode');
        $('diagram-note-insert').setAttribute('aria-pressed','false');
      }
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
