/* Desktop-only presentation. Shared scientific UI stays unchanged. */
'use strict';
globalThis.SimDesktopShell=(()=>{
  const $=id=>document.getElementById(id);
  let project, closePending=false;
  function bindProjectClose(options){project=options;}
  function confirmClose(windowClosing){
    if(closePending)return false;
    if(project?.isBusy()){
      project.notice('Hay un cálculo en curso. Esperá a que termine antes de cerrar.',true);
      return false;
    }
    if(!project?.isDirty())return true;
    const dialog=$('desktop-unsaved-dialog');
    $('desktop-unsaved-title').textContent=windowClosing?'Cerrar ΣiM Desktop':'Cerrar proyecto';
    $('desktop-unsaved-error').textContent='';
    dialog.returnValue='cancel';
    dialog.showModal();
    closePending=true;
    return new Promise(resolve=>{
      dialog.addEventListener('close',()=>{
        closePending=false;
        resolve(dialog.returnValue==='close');
      },{once:true});
    });
  }
  async function closeProject(){if(await confirmClose(false))project.closeProject();}
  function installCloseDialog(){
    const dialog=document.createElement('dialog');
    dialog.id='desktop-unsaved-dialog';
    dialog.setAttribute('aria-labelledby','desktop-unsaved-title');
    dialog.setAttribute('aria-describedby','desktop-unsaved-message');
    dialog.innerHTML='<form method="dialog"><div class="dialog-heading"><h2 id="desktop-unsaved-title"></h2></div><div class="dialog-body"><p id="desktop-unsaved-message">Hay cambios sin guardar en el proyecto o en su última corrida. Podés conservarlos en la biblioteca local antes de cerrar.</p><p id="desktop-unsaved-error" role="alert"></p><div class="dialog-actions"><button type="submit" class="outline-button" value="cancel" autofocus>Cancelar</button><button type="submit" class="outline-button" value="close">Cerrar sin guardar</button><button type="button" class="calculate-button" id="desktop-save-and-close">Guardar en biblioteca y cerrar</button></div></div></form>';
    (document.querySelector('.sim-shell')||document.body).append(dialog);
    $('desktop-save-and-close').onclick=()=>{
      if(project.save())dialog.close('close');
      else $('desktop-unsaved-error').textContent='No se pudo guardar en la biblioteca. Cancelá para volver al proyecto y guardar una copia .sim.';
    };
  }
  const icons={
    new:'<path d="M12 5v14M5 12h14"/>',
    open:'<path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2h7"/>',
    save:'<path d="M4 3h13l3 3v15H4z"/><path d="M8 3v7h8V3M8 21v-7h8v7"/>'
  };
  function icon(button,name,label){
    if(!button)return;
    button.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
    button.title=label;button.setAttribute('aria-label',label);
  }
  async function installTitlebar(){
    const win=globalThis.__TAURI__?.window?.getCurrentWindow?.();
    const header=document.querySelector('.app-header');
    if(!win||!header||location.origin!=='http://127.0.0.1:5920'||location.pathname!=='/'||location.search)return;
    const bar=document.createElement('div');bar.className='desktop-titlebar';
    bar.innerHTML='<div class="desktop-title-brand"><img src="assets/sim-wordmark.svg" alt="ΣiM"><span>Desktop</span></div><div class="desktop-title-project" aria-label="Proyecto actual"></div><div class="desktop-window-controls"></div>';
    const title=bar.querySelector('.desktop-title-project');
    const controls=bar.querySelector('.desktop-window-controls');
    const fail=error=>console.error('Control de ventana Desktop:',error);
    const action=(name,path,fn)=>{
      const button=document.createElement('button');button.type='button';button.title=name;button.setAttribute('aria-label',name);
      button.innerHTML='<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">'+path+'</svg>';
      button.addEventListener('click',()=>void fn().catch(fail));controls.append(button);return button;
    };
    action('Minimizar','<path d="M3 11h10"/>',()=>win.minimize());
    action('Maximizar o restaurar','<rect x="3.5" y="3.5" width="9" height="9"/>',()=>win.toggleMaximize());
    let interceptsNativeClose=false;
    try{
      await win.onCloseRequested(async event=>{
        if(!await confirmClose(true))event.preventDefault();
      });
      interceptsNativeClose=true;
    }catch(error){fail(error);}
    action('Cerrar','<path d="m4 4 8 8m0-8-8 8"/>',async()=>{
      if(interceptsNativeClose||await confirmClose(true))await win.close();
    }).classList.add('desktop-window-close');
    bar.addEventListener('mousedown',event=>{
      if(event.button!==0||event.target.closest('button'))return;
      if(event.detail===2){void win.toggleMaximize().catch(fail);return;}
      if(event.detail===1)void win.startDragging().catch(fail);
    });
    const syncTitle=()=>{const next=$('project-title')?.value||'Ningún proyecto abierto';if(title.textContent!==next)title.textContent=next;};
    syncTitle();
    header.before(bar);
    const edges=[];
    for(const direction of ['North','South','East','West','NorthEast','NorthWest','SouthEast','SouthWest']){
      const edge=document.createElement('div');edge.className='desktop-resize-edge desktop-resize-'+direction.toLowerCase();
      edge.addEventListener('mousedown',e=>{if(e.button===0){e.preventDefault();void win.startResizeDragging(direction).catch(fail);}});
      document.body.append(edge);edges.push(edge);
    }
    try{
      await win.setDecorations(false);
      document.documentElement.classList.add('desktop-custom-frame');
      setInterval(syncTitle,500);
    }catch(error){
      bar.remove();edges.forEach(e=>e.remove());fail(error);
    }
  }
  function installHelp(){
    const menu=$('help-menu')?.querySelector('.menu-panel');
    if(!menu)return;
    const closeMenus=()=>document.querySelectorAll('.app-menu[open],.footer-info[open]').forEach(e=>e.removeAttribute('open'));
    const dialog=document.createElement('dialog');dialog.id='desktop-help-dialog';dialog.setAttribute('aria-labelledby','desktop-help-title');
    dialog.innerHTML='<form method="dialog"><div class="dialog-heading"><h2 id="desktop-help-title">Ayuda</h2><button class="dialog-close" aria-label="Cerrar" value="close">×</button></div><div class="dialog-body desktop-help-body"></div></form>';
    (document.querySelector('.sim-shell')||document.body).append(dialog);
    const body=dialog.querySelector('.dialog-body');
    let request=0;
    const show=async(title,path,selector)=>{
      closeMenus();const id=++request;
      $('desktop-help-title').textContent=title;body.textContent='Cargando…';
      if(!dialog.open)dialog.showModal();
      try{
        const response=await fetch(path);if(!response.ok)throw Error('Documento no disponible');
        const parsed=new DOMParser().parseFromString(await response.text(),'text/html');
        const source=parsed.querySelector(selector);if(!source)throw Error('Documento sin contenido');
        if(id!==request)return;
        for(const el of source.querySelectorAll('script,iframe,object,embed,form,link,style'))el.remove();
        body.replaceChildren(...source.childNodes);body.scrollTop=0;
      }catch(error){if(id===request)body.textContent='No se pudo abrir la ayuda local: '+error.message;}
    };
    const manual=()=>show('Manual de usuario · ΣiM Desktop','desktop-help.html','main');
    const catalog=()=>show('Catálogo de equipos','catalogo.html','main .table-wrap');
    const shortcuts=()=>show('Atajos de teclado','desktop-help.html','#desktop-shortcuts');
    const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{closeMenus();action();});return b;};
    const external=(label,url)=>{const a=document.createElement('a');a.textContent=label+' ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
    const about=$('about-button');
    menu.replaceChildren(button('Manual de usuario · F1',manual),button('Tutoriales y ejemplos',()=>$('examples-browser-button').click()),button('Guía de resoluciones',()=>{if(!$('guide-dialog').open)SimGuide.open($('guide-dialog'),$('guide-host'));}),button('Catálogo de equipos',catalog),button('Atajos de teclado',shortcuts),document.createElement('hr'),external('Wiki de ΣiM','https://wiki.lemeit.ar/sim/'),external('Manual en línea','https://wiki.lemeit.ar/sim/manual-de-uso/'),external('Tutoriales DWSIM','https://dwsim.org/tutorials/en/index.html'),external('Repositorio','https://github.com/lemeit/lemeit-sim'),external('Informar un problema','https://github.com/lemeit/lemeit-sim/issues'),document.createElement('hr'),button('Licencias y créditos',()=>document.querySelector('.footer-info a[href="licenses/NOTICE.md"]')?.click()),about);
    about.textContent='Acerca de ΣiM Desktop';
    const footer=document.querySelector('.footer-info summary');if(footer)footer.textContent='Licencias';
    document.addEventListener('keydown',event=>{if(event.key==='F1'&&!document.querySelector('dialog[open]')){event.preventDefault();void manual();}});
    document.addEventListener('click',event=>{
      const anchor=event.composedPath().find(node=>node instanceof HTMLAnchorElement);
      if(!anchor||!anchor.hasAttribute('href')||anchor.hasAttribute('data-information'))return;
      let url;try{url=new URL(anchor.href,location.href);}catch{return;}
      if(url.origin===location.origin&&url.pathname==='/catalogo.html'){event.preventDefault();event.stopPropagation();void catalog();return;}
      if(url.origin===location.origin)return;
      event.preventDefault();event.stopPropagation();closeMenus();
      const opener=globalThis.__TAURI__?.opener?.openUrl;
      if(url.protocol!=='https:'||!opener){alert('Enlace externo no disponible: '+url.href);return;}
      void opener(url.href).catch(error=>{console.error(error);alert('No se pudo abrir el navegador. Enlace: '+url.href);});
    },true);
  }
  function init(){
    if(!globalThis.SimDesktop)return;
    document.documentElement.classList.add('sim-desktop');
    document.title='ΣiM Desktop';
    const hide=id=>{const el=$(id);if(el)el.classList.add('desktop-hidden');};
    for(const id of ['cloud-projects-open','cloud-save-menu','cloud-open-toolbar','admin-nav-link','session-banner','engine-select','services-button','install-app-button'])hide(id);
    document.querySelector('label[for="engine-select"]')?.classList.add('desktop-hidden');
    const cloudLabel=$('cloud-projects-open')?.previousElementSibling;
    if(cloudLabel?.classList.contains('menu-section-label'))cloudLabel.classList.add('desktop-hidden');
    icon($('new-project-toolbar'),'new','Nuevo proyecto (Ctrl+N)');
    icon($('open-project-toolbar'),'open','Abrir proyecto (Ctrl+O)');
    icon($('cloud-save-toolbar'),'save','Guardar · Ctrl+S');
    const save=$('cloud-save-toolbar');
    if(save){save.hidden=false;save.classList.remove('cloud-toolbar-button');save.classList.add('desktop-save-button');save.onclick=()=>$('save-button').click();}
    $('open-button').textContent='Abrir…';
    $('save-button').textContent='Guardar…';
    $('recent-button').textContent='Recuperar borrador local';
    $('local-projects-open').textContent='Biblioteca local…';
    $('local-project-title').textContent='Mis proyectos · Biblioteca local';
    $('local-project-dialog').querySelector('.dialog-body > p').textContent=
      'Los proyectos se guardan en la biblioteca de ΣiM Desktop de este equipo. Para llevar un proyecto a otro equipo, usá Archivo → Guardar.';
    $('report-pdf-menu').textContent='Exportar PDF…';
    const menu=$('file-menu')?.querySelector('.menu-panel');
    const backupLabel=$('recent-button').previousElementSibling;
    if(backupLabel?.classList.contains('menu-section-label'))backupLabel.textContent='Recuperación';
    const saveMenu=$('save-button');
    if(menu&&saveMenu)menu.insertBefore(saveMenu,$('close-project-button'));
    const cloudStart=cloudLabel?.previousElementSibling;
    if(cloudStart?.tagName==='HR')cloudStart.classList.add('desktop-hidden');
    const about=$('about-dialog');
    if(about){
      about.querySelector('h2').textContent='Acerca de ΣiM Desktop';
      const version=[...about.querySelectorAll('strong')].find(e=>e.textContent.startsWith('Versión del portal'));
      if(version)version.prepend('Desktop · alpha.3 | ');
    }
    const brand=document.querySelector('.brand-description');if(brand)brand.textContent='Desktop';
    installCloseDialog();
    installHelp();
    void installTitlebar();
  }
  return {init,bindProjectClose,closeProject,confirmClose};
})();
document.addEventListener('DOMContentLoaded',()=>SimDesktopShell.init());
