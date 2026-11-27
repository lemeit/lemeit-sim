/* Paneles acoplables de ΣIM: manejo estilo CAD de las ventanas del proyecto.
 * Los datos de distribución son locales; no modifican proyectos ni resultados. */
'use strict';
globalThis.SimDockLayout=(()=>{
  const KEY='sim-dock-layout-cad-v3';
  const IDS=['equipment','inspector','results','charts','explorer'];
  const EDGES=['left','right','top','bottom'];
  const MODES=['float',...EDGES];
  const LABELS={left:'Izquierda',right:'Derecha',top:'Arriba',bottom:'Abajo',float:'Flotante',reset:'Restaurar'};
  const DEFAULT={equipment:'left',inspector:'right',results:'right',charts:'float',explorer:'float'};
  const DEFAULT_SIZES={left:186,right:336,top:200,bottom:160};
  let revealPanel=()=>{};
  const clamp=(n,a,b)=>Math.min(Math.max(n,a),b);
  const safe=(n,fallback)=>Number.isFinite(Number(n))?Number(n):fallback;
  function fit(b,vw,vh){
    const w=clamp(safe(b?.w,330),240,Math.max(240,vw-16));
    const h=clamp(safe(b?.h,370),180,Math.max(180,vh-16));
    return {x:clamp(safe(b?.x,80),8,Math.max(8,vw-w-8)),
      y:clamp(safe(b?.y,90),8,Math.max(8,vh-h-8)),w,h};
  }
  function targetEdge(x,y,rect){
    if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return null;
    if(x<rect.left+38)return 'left';
    if(x>rect.right-38)return 'right';
    if(y<rect.top+38)return 'top';
    if(y>rect.bottom-38)return 'bottom';
    return null;
  }
  function recover(stored,vw,vh){
    const fallback={
      equipment:{x:60,y:130,w:310,h:500},
      inspector:{x:Math.max(8,vw-390),y:130,w:355,h:500},
      results:{x:Math.max(8,(vw-760)/2),y:Math.max(8,vh-410),w:760,h:350},
      explorer:{x:Math.max(8,vw-580),y:90,w:550,h:Math.min(620,vh-110)},
      charts:{x:(vw-660)/2,y:Math.max(65,(vh-640)/2),w:660,h:Math.min(640,vh-90)}
    };
    return Object.fromEntries(IDS.map(id=>{
      const p=stored?.[id];
      return [id,{id,mode:MODES.includes(p?.mode)?p.mode:DEFAULT[id],
        lastDock:EDGES.includes(p?.lastDock)?p.lastDock:['charts','explorer'].includes(id)?'bottom':DEFAULT[id],
        box:fit(p?.box||fallback[id],vw,vh)}];
    }));
  }
  function mount(){
    // Vistas secundarias deben continuar usando el enlace sincronizado existente.
    if(new URLSearchParams(location.search).has('diagram')||new URLSearchParams(location.search).has('results'))return;
    const workspace=document.querySelector('.workspace');
    const diagram=workspace?.querySelector('.diagram-panel');
    const elements={
      equipment:workspace?.querySelector('.equipment-panel'),
      inspector:workspace?.querySelector('.inspector-panel'),
      results:document.getElementById('results-panel'),charts:document.getElementById('charts-dialog'),explorer:document.getElementById('process-explorer-panel')
    };
    if(!workspace||!diagram||IDS.some(id=>!elements[id]))return;
    let saved={};
    try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
    // La versión anterior persistía la disposición inicial aunque no se hubiera editado.
    const oldDefault=saved.equipment?.mode==='left'&&saved.inspector?.mode==='right'&&
      saved.results?.mode==='bottom'&&saved.results.lastDock==='bottom'&&saved.sizes?.right===265&&
      saved.sizes?.left===186&&saved.sizes?.bottom===160&&saved.sizes?.top===200;
    if(!saved.revision&&oldDefault)saved={};
    // Migra únicamente la posición automática de Gráficas; las demás ventanas conservan su distribución.
    if(saved.charts&&!saved.chartsFloatingV1)delete saved.charts;
    const panels=recover(saved,innerWidth,innerHeight);
    // Desktop abre sin proyecto: conserva geometría, pero no muestra resultados flotantes vacíos.
    if(globalThis.SimDesktop&&panels.results.mode==='float'&&!elements.results.hidden){
      elements.results.hidden=true;elements.results.dataset.revealOnProject='true';
      document.getElementById('view-results')?.setAttribute('aria-pressed','false');
    }
    for(const id of IDS)panels[id].el=elements[id];
    const sizes={...DEFAULT_SIZES,...saved.sizes};
    const stackWeights=Object.fromEntries(IDS.map(id=>[id,clamp(safe(saved.stackWeights?.[id],1),.15,20)]));
    const slots={};
    for(const edge of EDGES){
      const slot=document.createElement('section');
      slot.className='sim-cad-slot';slot.dataset.edge=edge;slots[edge]=slot;
    }
    workspace.classList.add('sim-cad-workspace');
    workspace.replaceChildren(slots.top,slots.left,diagram,slots.right,slots.bottom);
    const indicator=document.createElement('div');
    indicator.className='sim-cad-target';indicator.hidden=true;
    indicator.setAttribute('aria-hidden','true');document.body.append(indicator);
    let z=900,gesture=null,saveTimer=null;
    const mobile=()=>innerWidth<=760;
    const activeMode=p=>mobile()?(['charts','explorer'].includes(p.id)?'bottom':DEFAULT[p.id]):p.mode;
    const visible=p=>!p.el.hidden;
    function persist(){
      const value=Object.fromEntries(IDS.map(id=>[id,{mode:panels[id].mode,
        lastDock:panels[id].lastDock,box:panels[id].box}]));
      value.sizes=sizes;
      value.stackWeights=stackWeights;
      value.revision=2;value.chartsFloatingV1=true;
      try{localStorage.setItem(KEY,JSON.stringify(value));}catch{}
    }
    function store(){clearTimeout(saveTimer);saveTimer=setTimeout(persist,120);}
    const makeButton=(value,title)=>{
      const b=document.createElement('button');b.type='button';b.textContent=value;
      b.setAttribute('aria-label',title);b.title=title;return b;
    };
    function setSize(edge,n){
      const side=edge==='left'||edge==='right';
      const extent=side?workspace.clientWidth:workspace.clientHeight;
      const max=Math.max(side?160:100,extent*(side ? .42 : .40));
      sizes[edge]=clamp(safe(n,sizes[edge]),side?160:100,max);
      workspace.style.setProperty('--sim-cad-'+edge,sizes[edge]+'px');
    }

    // Separadores INTERNOS: cambian la altura de dos paneles de la misma columna,
    // nunca el ancho de toda la columna ni su posición de acoplamiento.
    function refreshStackSeparators(){
      for(const edge of ['left','right']){
        const slot=slots[edge];
        slot.querySelectorAll(':scope>.sim-cad-stack-splitter').forEach(el=>el.remove());
        const stack=IDS.map(id=>panels[id]).filter(p=>p.el.parentNode===slot&&visible(p));
        stack.forEach(p=>p.el.style.setProperty('--sim-cad-weight',String(stackWeights[p.id])));
        for(let i=1;i<stack.length;i++){
          const upper=stack[i-1],lower=stack[i];
          const handle=document.createElement('div');
          handle.className='sim-cad-stack-splitter';
          handle.tabIndex=0;handle.setAttribute('role','separator');
          handle.setAttribute('aria-orientation','horizontal');
          handle.setAttribute('aria-label','Ajustar altura entre '+upper.title+' y '+lower.title);
          handle.title='Arrastrar para repartir la altura · Doble clic: partes iguales · Flechas ↑/↓: ajustar';
          const applyDelta=(change,oldUpper,oldLower)=>{
            const total=oldUpper+oldLower;
            if(total<160)return;
            const upperHeight=clamp(oldUpper+change,80,total-80);
            const scale=stackWeights[upper.id]+stackWeights[lower.id];
            stackWeights[upper.id]=scale*upperHeight/total;
            stackWeights[lower.id]=scale*(total-upperHeight)/total;
            upper.el.style.setProperty('--sim-cad-weight',String(stackWeights[upper.id]));
            lower.el.style.setProperty('--sim-cad-weight',String(stackWeights[lower.id]));
            handle.setAttribute('aria-valuenow',String(Math.round(upperHeight/total*100)));
          };
          const setCurrent=delta=>{
            const a=upper.el.getBoundingClientRect().height,b=lower.el.getBoundingClientRect().height;
            applyDelta(delta,a,b);store();
          };
          handle.setAttribute('aria-valuemin','10');handle.setAttribute('aria-valuemax','90');
          handle.setAttribute('aria-valuenow',String(Math.round(100*stackWeights[upper.id]/(stackWeights[upper.id]+stackWeights[lower.id]))));
          let start=null;
          handle.addEventListener('pointerdown',e=>{
            if(e.button!==0)return;e.preventDefault();e.stopPropagation();
            start={pointer:e.pointerId,y:e.clientY,a:upper.el.getBoundingClientRect().height,b:lower.el.getBoundingClientRect().height};
            handle.setPointerCapture(e.pointerId);
          });
          handle.addEventListener('pointermove',e=>{
            if(!start||e.pointerId!==start.pointer)return;
            applyDelta(e.clientY-start.y,start.a,start.b);
          });
          const finish=e=>{
            if(!start||e.pointerId!==start.pointer)return;
            start=null;if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);store();
          };
          handle.addEventListener('pointerup',finish);
          handle.addEventListener('pointercancel',finish);
          handle.addEventListener('keydown',e=>{
            if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
            e.preventDefault();
            const a=upper.el.getBoundingClientRect().height,b=lower.el.getBoundingClientRect().height;
            const delta=e.key==='Home'?80-a:e.key==='End'?a+b-80-a:(e.key==='ArrowDown'?1:-1)*(e.shiftKey?30:10);
            applyDelta(delta,a,b);store();
          });
          handle.addEventListener('dblclick',()=>{
            const v=(stackWeights[upper.id]+stackWeights[lower.id])/2;
            stackWeights[upper.id]=v;stackWeights[lower.id]=v;
            upper.el.style.setProperty('--sim-cad-weight',String(v));
            lower.el.style.setProperty('--sim-cad-weight',String(v));
            handle.setAttribute('aria-valuenow','50');store();
          });
          slot.insertBefore(handle,lower.el);
        }
      }
    }
    function updateSlots(){
      for(const edge of EDGES){
        const el=slots[edge];
        el.hidden=!IDS.some(id=>panels[id].el.parentNode===el&&visible(panels[id]));
        setSize(edge,sizes[edge]);
        if(el.hidden)workspace.style.setProperty('--sim-cad-'+edge,'0px');
      }
      refreshStackSeparators();
    }
    function apply(p,save=true){
      const mode=activeMode(p);
      const parent=mode==='float'?document.body:slots[mode];
      p.el.dataset.simCadMode=mode;
      p.el.classList.add('sim-cad-panel');
      if(p.el.parentNode!==parent)parent.append(p.el);
      p.box=fit(p.box,innerWidth,innerHeight);
      for(const key of ['left','top','width','height','zIndex'])p.el.style.removeProperty(key);
      if(mode==='float'){
        Object.assign(p.el.style,{left:p.box.x+'px',top:p.box.y+'px',
          width:p.box.w+'px',height:p.box.h+'px',zIndex:String(++z)});
      }
      p.select.value=mode;
      p.select.querySelectorAll('option').forEach(o=>{
        o.disabled=mobile()&&EDGES.includes(o.value);
      });
      p.button.textContent=mode==='float'?'↙':'↗';
      p.button.title=mode==='float'?'Volver a acoplar':'Separar panel';
      p.button.setAttribute('aria-label',p.button.title+' '+p.title);
      updateSlots();if(save)store();
    }
    function place(p,mode){
      if(mode==='reset'){
        p.mode=DEFAULT[p.id];p.lastDock=['charts','explorer'].includes(p.id)?'bottom':DEFAULT[p.id];
        p.box=recover(null,innerWidth,innerHeight)[p.id].box;
      }else if(MODES.includes(mode)){
        if(p.mode!=='float')p.lastDock=p.mode;
        p.mode=mode;
      }
      apply(p);
    }
    function preview(edge){
      indicator.hidden=!edge;
      if(!edge)return;
      const r=workspace.getBoundingClientRect();
      const w=edge==='top'||edge==='bottom'?r.width:Math.min(300,r.width*.32);
      const h=edge==='left'||edge==='right'?r.height:Math.min(210,r.height*.30);
      Object.assign(indicator.style,{
        left:(edge==='right'?r.right-w:r.left)+'px',
        top:(edge==='bottom'?r.bottom-h:r.top)+'px',
        width:w+'px',height:h+'px'
      });
      indicator.textContent='Acoplar '+LABELS[edge].toLowerCase();
    }
    function stopGesture(cancel=false){
      if(!gesture)return;
      const g=gesture;gesture=null;preview(null);
      document.body.classList.remove('sim-cad-dragging');
      window.removeEventListener('pointermove',onGestureMove,true);
      window.removeEventListener('pointerup',onGestureUp,true);
      window.removeEventListener('pointercancel',onGestureCancel,true);
      if(cancel){g.panel.mode=g.before.mode;g.panel.box=g.before.box;apply(g.panel);}
      else if(g.mode==='move'&&g.edge)place(g.panel,g.edge);
      else apply(g.panel);
    }
    function onGestureMove(e){
      if(!gesture||e.pointerId!==gesture.pointer)return;
      const g=gesture,p=g.panel;
      if(g.mode==='move'){
        p.box=fit({...p.box,x:e.clientX-g.dx,y:e.clientY-g.dy},innerWidth,innerHeight);
        p.el.style.left=p.box.x+'px';p.el.style.top=p.box.y+'px';
        g.edge=e.altKey||mobile()?null:targetEdge(e.clientX,e.clientY,workspace.getBoundingClientRect());
        preview(g.edge);
      }else{
        p.box=fit({...g.before.box,
          w:g.before.box.w+e.clientX-g.x,
          h:g.before.box.h+e.clientY-g.y},innerWidth,innerHeight);
        Object.assign(p.el.style,{left:p.box.x+'px',top:p.box.y+'px',width:p.box.w+'px',height:p.box.h+'px'});
      }
    }
    function onGestureUp(e){if(gesture&&e.pointerId===gesture.pointer)stopGesture();}
    function onGestureCancel(e){if(gesture&&e.pointerId===gesture.pointer)stopGesture(true);}
    function begin(e,p,mode){
      if(e.button!==0||mobile()||gesture)return;
      e.preventDefault();e.stopPropagation();
      const r=p.el.getBoundingClientRect();
      const before={mode:p.mode,box:{...p.box}};
      let dx=clamp(e.clientX-r.left,0,Math.max(30,r.width-30));
      let dy=clamp(e.clientY-r.top,0,35);
      if(mode==='move'){
        if(activeMode(p)!=='float'){p.lastDock=p.mode;p.mode='float';}
        p.box=fit({x:e.clientX-dx,y:e.clientY-dy,w:r.width,h:r.height},innerWidth,innerHeight);
        apply(p,false);
      }else{p.box=fit({x:r.left,y:r.top,w:r.width,h:r.height},innerWidth,innerHeight);}
      gesture={panel:p,pointer:e.pointerId,mode,x:e.clientX,y:e.clientY,dx,dy,edge:null,before};
      document.body.classList.add('sim-cad-dragging');
      p.el.style.zIndex=String(++z);
      // Global listeners: el movimiento continúa al cruzar el SVG y otros paneles.
      window.addEventListener('pointermove',onGestureMove,true);
      window.addEventListener('pointerup',onGestureUp,true);
      window.addEventListener('pointercancel',onGestureCancel,true);
    }
    for(const edge of EDGES){
      const slot=slots[edge],vertical=edge==='left'||edge==='right';
      const handle=document.createElement('div');handle.className='sim-cad-resizer';
      handle.tabIndex=0;handle.setAttribute('role','separator');
      handle.setAttribute('aria-label','Redimensionar acoplamiento '+LABELS[edge]);
      handle.setAttribute('aria-orientation',vertical?'vertical':'horizontal');
      slot.append(handle);
      let resizing=null;
      handle.addEventListener('pointerdown',e=>{
        if(e.button!==0)return;
        resizing={id:e.pointerId,start:vertical?e.clientX:e.clientY,size:sizes[edge]};
        handle.setPointerCapture(e.pointerId);e.preventDefault();
      });
      handle.addEventListener('pointermove',e=>{
        if(!resizing)return;
        const d=(vertical?e.clientX:e.clientY)-resizing.start;
        setSize(edge,resizing.size+d*(edge==='right'||edge==='bottom'?-1:1));
      });
      const finish=e=>{
        if(!resizing)return;resizing=null;
        if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
        store();
      };
      handle.addEventListener('pointerup',finish);
      handle.addEventListener('pointercancel',finish);
      handle.addEventListener('dblclick',()=>{setSize(edge,DEFAULT_SIZES[edge]);store();});
      handle.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
        e.preventDefault();
        const delta=(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)*(edge==='right'||edge==='bottom'?-1:1);
        setSize(edge,sizes[edge]+delta*(e.shiftKey?30:10));store();
      });
    }
    for(const id of IDS){
      const el=elements[id],p=panels[id];
      p.el=el;
      p.title={equipment:'Equipos y corrientes',inspector:'Propiedades',results:'Balances y corrientes',charts:'Gráficas',explorer:'Explorar proceso'}[id];
      const heading=el.querySelector(id==='results'?'.results-heading':'.panel-heading');
      heading.classList.add('sim-cad-heading');heading.tabIndex=0;
      if(id!=='results'&&id!=='charts')heading.querySelector('.panel-heading>span')?.classList.add('sim-cad-index');
      heading.title='Arrastrar para mover o acoplar; Alt evita el acoplamiento; doble clic para flotar o volver';
      const grip=document.createElement('span');grip.className='sim-cad-move';
      grip.textContent='⠿';grip.setAttribute('aria-hidden','true');grip.title='Arrastrar panel';heading.prepend(grip);
      const select=document.createElement('select');select.className='sim-cad-position';
      select.setAttribute('aria-label','Posición de '+p.title);
      select.title='Cambiar posición o restaurar panel';
      for(const choice of [...MODES,'reset']){
        const o=document.createElement('option');o.value=choice;o.textContent=LABELS[choice];select.append(o);
      }
      p.select=select;
      const button=makeButton('↗','Separar '+p.title);
      button.className='sim-cad-float';
      p.button=button;
      const tools=document.createElement('span');tools.className='sim-cad-controls';
      tools.append(select,button);
      heading.insertBefore(tools,heading.querySelector('.results-tools,#charts-close,#process-explorer-expand'));
      const sizeGrip=makeButton('◢','Redimensionar '+p.title);
      sizeGrip.className='sim-cad-size-grip';el.append(sizeGrip);
      select.addEventListener('change',()=>place(p,select.value));
      button.addEventListener('click',()=>place(p,activeMode(p)==='float'?p.lastDock:'float'));
      heading.addEventListener('dblclick',e=>{
        if(!e.target.closest('button,select,a,input'))place(p,activeMode(p)==='float'?p.lastDock:'float');
      });
      heading.addEventListener('pointerdown',e=>{
        if(e.target.closest('button,select,a,input,textarea'))return;
        begin(e,p,'move');
      });
      sizeGrip.addEventListener('pointerdown',e=>{
        if(activeMode(p)==='float')begin(e,p,'resize');
      });
      sizeGrip.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
        e.preventDefault();
        p.box=fit({...p.box,w:p.box.w+(e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0),
          h:p.box.h+(e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0)},innerWidth,innerHeight);
        apply(p);
      });
      heading.addEventListener('keydown',e=>{
        if(e.target!==heading||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
        e.preventDefault();if(activeMode(p)!=='float')place(p,'float');
        p.box=fit({...p.box,x:p.box.x+(e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0),
          y:p.box.y+(e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0)},innerWidth,innerHeight);
        apply(p);
      });
      el.addEventListener('pointerdown',()=>{if(activeMode(p)==='float')el.style.zIndex=String(++z);});
      new MutationObserver(updateSlots).observe(el,{attributes:true,attributeFilter:['hidden']});
      apply(p,false);
    }
    const menu=document.querySelector('#view-menu>.menu-panel');
    const existing=document.getElementById('view-reset-layout');
    if(existing)existing.remove();
    const reset=makeButton('Restablecer distribución','Restablecer distribución de paneles');
    reset.id='view-reset-layout';menu?.append(reset);
    reset.addEventListener('click',()=>{
      for(const id of IDS)place(panels[id],'reset');
      Object.assign(sizes,DEFAULT_SIZES);
      for(const id of IDS)stackWeights[id]=1;
      updateSlots();store();
      document.querySelectorAll('.app-menu[open]').forEach(m=>m.removeAttribute('open'));
    });
    window.addEventListener('resize',()=>{
      if(gesture)stopGesture(true);
      for(const id of IDS)apply(panels[id],false);
    });
    window.addEventListener('pagehide',persist);
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&gesture){e.preventDefault();stopGesture(true);}
    },true);
    revealPanel=(id,{presentation=false}={})=>{
      const p=panels[id];if(!p)return;
      if(presentation&&['charts','explorer'].includes(id)){p.mode='float';p.box=recover(null,innerWidth,innerHeight)[id].box;}
      p.el.hidden=false;apply(p,false);
    };
    updateSlots();store();
  }
  return Object.freeze({fit,targetEdge,recover,mount,reveal:(id,options)=>revealPanel(id,options)});
})();
document.addEventListener('DOMContentLoaded',()=>globalThis.SimDockLayout.mount());
