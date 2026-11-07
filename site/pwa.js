'use strict';
(()=>{
  const button=document.getElementById('install-app-button');let installPrompt=null;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;if(button)button.hidden=false;});
  window.addEventListener('appinstalled',()=>{installPrompt=null;if(button)button.hidden=true;});
  button?.addEventListener('click',async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;button.hidden=true;await prompt.prompt();await prompt.userChoice;});
  if('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(error=>console.warn('No se pudo activar la instalación de ΣIM:',error.message));});
})();
