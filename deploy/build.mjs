import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
async function collect(dir,prefix=''){
  const out={};for(const entry of await readdir(dir,{withFileTypes:true})){
    const key=prefix+'/'+entry.name,file=path.join(dir,entry.name);
    if(entry.isDirectory())Object.assign(out,await collect(file,key));
    else out[key]={type:mime[path.extname(entry.name)]||'application/octet-stream',data:(await readFile(file)).toString('base64')};
  }return out;
}
const assets=await collect(path.join(root,'site'));
const source=(await readFile(path.join(root,'deploy/worker.mjs'),'utf8')).replace('/* ASSETS */ {}',JSON.stringify(assets));
await mkdir(path.join(root,'.build'),{recursive:true});
await writeFile(path.join(root,'.build/worker.mjs'),source);
console.log(`Worker preparado: ${Object.keys(assets).length} archivos, ${Buffer.byteLength(source)} bytes. No se publicó.`);
