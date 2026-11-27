/* Desktop-only presentation. Shared scientific UI stays unchanged. */
'use strict';
globalThis.SimDesktopShell=(()=>{
  const $=id=>document.getElementById(id);
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
    bar.innerHTML='<div class="desktop-title-brand"><img src="assets/sim-wordmark.svg" alt="ΣIM"><span>Desktop</span></div><div class="desktop-title-project" aria-label="Proyecto actual"></div><div class="desktop-window-controls"></div>';
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
    action('Cerrar','<path d="m4 4 8 8m0-8-8 8"/>',()=>win.close()).classList.add('desktop-window-close');
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
  function init(){
    if(!globalThis.SimDesktop)return;
    document.documentElement.classList.add('sim-desktop');
    document.title='ΣIM Desktop';
    const hide=id=>{const el=$(id);if(el)el.classList.add('desktop-hidden');};
    for(const id of ['cloud-projects-open','cloud-save-menu','cloud-open-toolbar','admin-nav-link','session-banner','engine-select','services-button','install-app-button'])hide(id);
    document.querySelector('label[for="engine-select"]')?.classList.add('desktop-hidden');
    const cloudLabel=$('cloud-projects-open')?.previousElementSibling;
    if(cloudLabel?.classList.contains('menu-section-label'))cloudLabel.classList.add('desktop-hidden');
    icon($('new-project-toolbar'),'new','Nuevo proyecto (Ctrl+N)');
    icon($('open-project-toolbar'),'open','Abrir proyecto (Ctrl+O)');
    icon($('cloud-save-toolbar'),'save','Guardar proyecto (Ctrl+S)');
    const save=$('cloud-save-toolbar');
    if(save){save.hidden=false;save.classList.remove('cloud-toolbar-button');save.classList.add('desktop-save-button');save.onclick=()=>$('save-button').click();}
    $('open-button').textContent='Abrir proyecto…';
    $('save-button').textContent='Guardar copia JSON…';
    $('recent-button').textContent='Recuperar borrador local';
    $('local-projects-open').textContent='Biblioteca local…';
    const menu=$('file-menu')?.querySelector('.menu-panel');
    const saveMenu=$('save-button');
    if(menu&&saveMenu)menu.insertBefore(saveMenu,$('close-project-button'));
    const cloudStart=cloudLabel?.previousElementSibling;
    if(cloudStart?.tagName==='HR')cloudStart.classList.add('desktop-hidden');
    const about=$('about-dialog');
    if(about){
      about.querySelector('h2').textContent='Acerca de ΣIM Desktop';
      const version=[...about.querySelectorAll('strong')].find(e=>e.textContent.startsWith('Versión del portal'));
      if(version)version.textContent='Desktop · prototipo alpha.2 | Base científica 0.51.9';
    }
    const brand=document.querySelector('.brand-description');if(brand)brand.textContent='Desktop';
    void installTitlebar();
  }
  return {init};
})();
document.addEventListener('DOMContentLoaded',()=>SimDesktopShell.init());
