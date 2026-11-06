'use strict';
window.TexTheme = {
  init() {
    const root=document.documentElement,button=document.getElementById('theme-toggle');
    let theme='light';
    try { const saved=localStorage.getItem('lemeit-theme'); if(saved==='dark'||saved==='light')theme=saved; } catch {}
    root.classList.add('lm-root');
    function paint(){
      root.setAttribute('data-theme',theme);
      const label=theme==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro';
      button.setAttribute('aria-label',label);button.title=label+' (Alt + T)';
    }
    paint();
    button.addEventListener('click',()=>{
      theme=theme==='dark'?'light':'dark';paint();
      try{localStorage.setItem('lemeit-theme',theme);}catch{}
      document.dispatchEvent(new CustomEvent('lemeit-theme-changed',{detail:{theme}}));
    });
  }
};
