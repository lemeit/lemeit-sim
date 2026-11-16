import {checkRelease} from './check-release.mjs';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.webmanifest':'application/manifest+json; charset=utf-8','.ico':'image/x-icon','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
async function collect(dir,prefix=''){
  const out={};for(const entry of await readdir(dir,{withFileTypes:true})){
    const key=prefix+'/'+entry.name,file=path.join(dir,entry.name);
    if(entry.isDirectory())Object.assign(out,await collect(file,key));
    else out[key]={type:mime[path.extname(entry.name)]||'application/octet-stream',data:(await readFile(file)).toString('base64')};
  }return out;
}
await checkRelease();
const assets=await collect(path.join(root,'site'));
// Build sin bundler: incluir el módulo de autenticación dentro del Worker único.
const auth=(await readFile(path.join(root,'deploy/auth.mjs'),'utf8'))
  .replaceAll('export async function ','async function ')
  .replace('export {configured};','');
const source=(await readFile(path.join(root,'deploy/worker.mjs'),'utf8'))
   .replace("import {authorize,authRoute,authorizeCalculation} from './auth.mjs';",auth)
  .replace('/* ASSETS */ {}',JSON.stringify(assets));
await mkdir(path.join(root,'.build'),{recursive:true});
await writeFile(path.join(root,'.build/worker.mjs'),source);
console.log(`Worker preparado: ${Object.keys(assets).length} archivos, ${Buffer.byteLength(source)} bytes. No se publicó.`);
