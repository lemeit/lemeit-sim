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
    const brand=document.querySelector('.brand-description');if(brand)brand.textContent='Desktop';
  }
  return {init};
})();
document.addEventListener('DOMContentLoaded',()=>SimDesktopShell.init());
