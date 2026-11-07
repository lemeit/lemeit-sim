import {readFile} from 'node:fs/promises';
export function validateRelease(html,history,servedHistory){
  const about=html.match(/<dialog id="about-dialog">([\s\S]*?)<\/dialog>/)?.[1]||'';
  const visible=about.match(/Versión del portal · (\d+\.\d+\.\d+)/)?.[1];
  const latest=history.match(/^## (\d+\.\d+\.\d+) —/m)?.[1];
  if(!visible||visible!==latest)throw new Error('Actualizar Acerca de: su versión debe coincidir con la última entrada del historial.');
  if(history!==servedHistory)throw new Error('El historial servido no coincide con docs/CHANGELOG.md.');
  if(!/<ul>[\s\S]*?<li>/.test(about))throw new Error('Acerca de debe incluir los cambios de la versión.');
  return visible;
}
export async function checkRelease(){const [html,history,served]=await Promise.all(['../site/index.html','../docs/CHANGELOG.md','../site/CHANGELOG.md'].map(p=>readFile(new URL(p,import.meta.url),'utf8')));return validateRelease(html,history,served);}
