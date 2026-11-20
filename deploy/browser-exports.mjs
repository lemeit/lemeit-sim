import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {test} from 'node:test';
import {inflateSync} from 'node:zlib';
import {chromium} from 'playwright';

const load=(path)=>readFile(new URL(path,import.meta.url));
const portalVersion=JSON.parse(await load('../package.json')).version;
const example=await load('../site/examples/MulticomponentBalance.json');
const result=await load('./fixtures/example6-results.json');
const catalog=await load('../site/catalog-cache.json');
const csp="default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; script-src 'self'; connect-src 'self'; base-uri 'none'";
const types={html:'text/html',css:'text/css',js:'text/javascript',svg:'image/svg+xml',json:'application/json',ttf:'font/ttf',png:'image/png'};

async function browserPage(t){
  const server=createServer(async (request,response)=>{
    const path=new URL(request.url,'http://localhost').pathname;
    response.setHeader('Content-Security-Policy',csp);
    try{
      if(path==='/api/catalog'||path==='/api/simulate'||path==='/api/status'){
        response.setHeader('Content-Type','application/json');
        response.end(path.endsWith('/catalog')?catalog:path.endsWith('/simulate')?result:JSON.stringify({gateway_version:'0.35.0',state:'ready',supported_equipment:['MaterialStream','EnergyStream','Mixer','Splitter','Heater','Cooler','Separator','Pump','Compressor','Expander','Tank','Valve','HeatExchanger','ConversionReactor','EquilibriumReactor'],supported_features:['simple_material_recycle'],started_at:'2026-11-18T16:00:00Z',uptime_s:100}));
      }else if(/^\/[a-zA-Z0-9_./-]+$/.test(path)){
        response.setHeader('Content-Type',types[path.split('.').at(-1)]??'application/octet-stream');
        response.end(await load('../site'+path));
      }else response.writeHead(404).end();
    }catch{response.writeHead(404).end();}
  });
  server.listen(0,'127.0.0.1');
  t.after(()=>server.close());
  await once(server,'listening');
  const browser=await chromium.launch(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{});
  t.after(()=>browser.close());
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  t.after(()=>assert.deepEqual(errors,[]));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'networkidle'});
  return page;
}

async function download(page,click){
  const [file]=await Promise.all([page.waitForEvent('download',{timeout:8000}),click()]);
  return {name:file.suggestedFilename(),bytes:await readFile(await file.path())};
}

async function openProject(page,bytes){
  await page.locator('#file-input').setInputFiles({name:'proceso.json',mimeType:'application/json',buffer:bytes});
  await page.locator('#diagram .node').first().waitFor({timeout:5000});
}

async function exportDiagram(page,format,configure=async()=>{}){
  await page.locator('.diagram-export-tool').click();
  const dialog=page.locator('#diagram-export-dialog');
  await dialog.locator('[name=format]').selectOption(format);
  await configure(dialog);
  try{return await download(page,()=>dialog.getByRole('button',{name:'Descargar'}).click());}
  catch(error){throw new Error('Descarga '+format+': '+await dialog.getByRole('status').textContent(),{cause:error});}
}

function pdfStreams(bytes){
  const source=bytes.toString('latin1');
  const streams=[];
  for(const match of source.matchAll(/\/Filter \/FlateDecode[^>]*>>\s*stream\r?\n/g)){
    const start=match.index+match[0].length;
    const end=source.indexOf('\nendstream',start);
    streams.push(inflateSync(bytes.subarray(start,end)).toString('latin1'));
  }
  return streams;
}

test('Editor: Ejemplo 6 calculado, archivos de resultados y Acerca de tras recargar',async t=>{
  const page=await browserPage(t);
  await page.reload({waitUntil:'networkidle'});
  await page.getByText('Ayuda',{exact:true}).click();
  await page.locator('#about-button').click();
  assert.ok((await page.locator('#about-dialog').innerText()).includes('Versión del portal · '+portalVersion));
  await page.keyboard.press('Escape');

  await openProject(page,example);
  await page.locator('#calculate-button').click();
  await page.waitForFunction(()=>document.querySelector('#calculation-state').textContent==='Resultados vigentes');
  for(const [kind,decimal,suffix,expected] of [
    ['csv','comma','corrientes-coma.csv','941,2494715054087;44,919060011504634'],
    ['csv','point','corrientes-punto.csv','941.2494715054087,44.919060011504634'],
    ['xlsx','point','.xlsx','<c t="n" s="1"><v>941.2494715054087</v></c>'],
  ]){
    await page.getByText('Archivo',{exact:true}).click();
    await page.getByRole('button',{name:'Exportar tablas · Excel / CSV…',exact:true}).click();
    const dialog=page.locator('#data-export-dialog');
    await dialog.locator('[name=format]').selectOption(kind);
    if(kind==='csv'){await dialog.locator('[name=scope]').selectOption('streams');await dialog.locator('[name=decimal]').selectOption(decimal);}
    const file=await download(page,()=>dialog.getByRole('button',{name:'Descargar',exact:true}).click());
    assert.ok(file.name.endsWith(suffix),file.name);assert.ok(file.bytes.includes(expected),kind);
  }
  await page.getByText('Archivo',{exact:true}).click();await page.getByRole('button',{name:'Exportar tablas · Excel / CSV…',exact:true}).click();
  const allDialog=page.locator('#data-export-dialog');await allDialog.locator('[name=format]').selectOption('csv');
  assert.equal(await allDialog.locator('[name=scope]').inputValue(),'all');
  const allCsv=await download(page,()=>allDialog.getByRole('button',{name:'Descargar',exact:true}).click());
  for(const section of ['Corrientes','Balances','Componentes','Datos'])assert.ok(allCsv.bytes.toString().includes(section));
  const svg=await exportDiagram(page,'svg');
  assert.match(svg.bytes.toString(),/F1 · Base acuosa.*25.*°C/s);
});

test('Editor: SVG completo fuera del viewport, selección, PNG transparente y PDF vectorial',async t=>{
  const page=await browserPage(t);
  const wide=JSON.parse(example);
  // Separar un grupo del viewport con coordenadas de ambos signos.
  wide.nodes.push({id:'far',type:'Mixer',name:'Equipo lejano Ω',x:-2100,y:1850});
  const extra=30-wide.nodes.length;
  for(let i=0;i<extra;i++){
    wide.nodes.push({id:'valve-'+i,type:'Valve',name:'Válvula '+(i+1),
      x:1200+(i%8)*190,y:800+Math.floor(i/8)*180});
  }
  await openProject(page,Buffer.from(JSON.stringify(wide)));
  const first=await exportDiagram(page,'svg');
  const svg=first.bytes.toString();
  assert.match(svg,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/Equipo lejano Ω/);
  assert.match(svg,/Válvula 18/);
  assert.match(svg,/viewBox="-\d+ -?\d+ \d{4,} \d{4,}"/);
  assert.doesNotMatch(svg,/<(?:image|script|foreignObject)\b|stream-hit|resize-handle|data-node/);
  const editorRoute=await page.locator('#diagram [data-node="s1"] .stream-line').getAttribute('d');
  assert.ok(svg.includes(`d="${editorRoute}"`));
  await page.evaluate(()=>{zoom=3;viewX=500;viewY=500;renderDiagram();});
  const zoomed=await exportDiagram(page,'svg');
  assert.equal(zoomed.bytes.toString(),svg);

  await page.evaluate(()=>{selection={nodes:['m1','s1']};renderDiagram();});
  const selected=await exportDiagram(page,'svg',dialog=>dialog.locator('[name=scope]').selectOption('selection'));
  assert.match(selected.name,/-seleccion\.svg$/);
  assert.match(selected.bytes.toString(),/M1 · Mezcla ternaria/);
  assert.match(selected.bytes.toString(),/S1 · Mezcla inicial/);
  assert.doesNotMatch(selected.bytes.toString(),/Equipo lejano|Producto B|selection/);
  const [width,height]=selected.bytes.toString().match(/\bwidth="(\d+)" height="(\d+)"/).slice(1).map(Number);

  const png=await exportDiagram(page,'png',async dialog=>{
    await dialog.locator('[name=background]').selectOption('transparent');
    await dialog.locator('[name=scale]').selectOption('3');
  });
  assert.equal(png.bytes.subarray(1,4).toString(),'PNG');
  assert.equal(png.bytes.readUInt32BE(16),width*3);
  assert.equal(png.bytes.readUInt32BE(20),height*3);
  const pixels=await page.evaluate(async base64=>{
    const image=new Image();
    image.src='data:image/png;base64,'+base64;
    await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=image.width;canvas.height=image.height;
    const drawing=canvas.getContext('2d');
    drawing.drawImage(image,0,0);
    const data=drawing.getImageData(0,0,image.width,image.height).data;
    return {corner:data[3],ink:data.some((value,index)=>index%4===3&&value>0)};
  },png.bytes.toString('base64'));
  assert.deepEqual(pixels,{corner:0,ink:true});

  const pdf=await exportDiagram(page,'pdf',async dialog=>{
    await dialog.locator('[name=scope]').selectOption('all');
    await dialog.locator('[name=paper]').selectOption('a3');
    await dialog.locator('[name=orientation]').selectOption('portrait');
    await dialog.locator('[name=margin]').selectOption('20');
    await dialog.locator('[name=fit]').selectOption('reduce');
  });
  const source=pdf.bytes.toString('latin1');
  assert.match(source,/^%PDF-/);
  assert.match(source,/\/MediaBox \[0 0 841\.8\d* 1190\.5\d*\]/);
  assert.doesNotMatch(source,/\/Subtype \/Image/);
  const content=pdfStreams(pdf.bytes).find(stream=>stream.includes(' Tf'));
  assert.ok(content,'El contenido contiene texto vectorial');
  assert.match(content,/-?\d+(?:\.\d*)? -?\d+(?:\.\d*)? l\n/);
  assert.ok(source.includes('/ToUnicode'),'El PDF incluye una tabla Unicode para las etiquetas');

  const pdfSelection=await exportDiagram(page,'pdf',async dialog=>{
    await dialog.locator('[name=scope]').selectOption('selection');
    await dialog.locator('[name=paper]').selectOption('a4');
    await dialog.locator('[name=orientation]').selectOption('landscape');
    await dialog.locator('[name=fit]').selectOption('fill');
  });
  assert.match(pdfSelection.name,/-seleccion\.pdf$/);
  assert.match(pdfSelection.bytes.toString('latin1'),/\/MediaBox \[0 0 841\.8\d* 595\.2\d*\]/);

  const limits=await page.evaluate(()=>{
    try{SimDiagramFiles.pngSize(8000,8000,4);}catch(error){return error.message;}
  });
  assert.match(limits,/Reducí la escala/);
});


test('Rótulo editable en SVG y balances incorporados al PDF',async t=>{
  const page=await browserPage(t);
  await openProject(page,example);
  await page.locator('#report-open').click();
  await page.locator('#report-student').fill('Alumno Ejemplo');
  await page.locator('#report-studentId').fill('EST-007');
  await page.locator('#report-subject').fill('Fisica 5');
  await page.locator('#report-institution').fill('Escuela de prueba');
  await page.locator('#report-form button[type=submit]').click();
  assert.equal(await page.locator('#report-dialog').evaluate(el=>el.open),false);
  const drawing=await exportDiagram(page,'svg');
  const source=drawing.bytes.toString();
  for(const value of ['Alumno Ejemplo','EST-007','Fisica 5','Escuela de prueba','ENUNCIADO'])assert.ok(source.includes(value),value);
  await page.locator('#calculate-button').click();
  await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid');
  const withBalances=await exportDiagram(page,'pdf',async dialog=>{
    await dialog.locator('[name=balances]').check();
  });
  const pdfSource=withBalances.bytes.toString('latin1');
  assert.match(pdfSource,/^%PDF-/);
  const pageObjects=[...pdfSource.matchAll(/\/Type \/Page\b/g)];
  assert.ok(pageObjects.length>=2,'El PDF contiene el diagrama y al menos una hoja de balances');
  const withoutBalances=await exportDiagram(page,'pdf',async dialog=>{
    await dialog.locator('[name=balances]').uncheck();
  });
  const regularPages=[...withoutBalances.bytes.toString('latin1').matchAll(/\/Type \/Page\b/g)];
  assert.equal(regularPages.length,1,'El rótulo no agrega páginas extra por sí solo');
});


test('Archivo ordenado y vista previa de reporte Oficio con rótulo y tablas',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 await page.getByText('Archivo',{exact:true}).click();
 const fileMenu=page.locator('#file-menu .menu-panel');
 // Las tres formas de almacenamiento llevan nombres explícitos.
 await page.getByRole('button',{name:'Reporte PDF · diagrama y balances…'}).click();
 const dlg=page.locator('#diagram-export-dialog');
 assert.equal(await dlg.locator('[name=format]').inputValue(),'pdf');
 await dlg.locator('[name=paper]').selectOption('oficio');
 await dlg.locator('[name=orientation]').selectOption('landscape');
 await dlg.locator('[name=balances]').uncheck(); // sin cálculo previo
 await dlg.locator('[name=streams]').uncheck();
 await dlg.locator('[name=equipment]').check();
 await dlg.locator('#diagram-export-preview').click();
 await dlg.locator('#diagram-print-preview:not([hidden]) img').waitFor();
 const img=await dlg.locator('#diagram-preview-image').getAttribute('src');
 assert.ok(img.includes('data:image/svg+xml'));
 assert.ok(decodeURIComponent(img).includes('ΣIM'));
 assert.ok((await dlg.locator('#diagram-preview-caption').textContent()).includes('OFICIO'));
 const pdf=await download(page,()=>dlg.getByRole('button',{name:'Descargar',exact:true}).click());
 assert.match(pdf.bytes.toString('latin1'),/^%PDF-/);
 assert.ok([...pdf.bytes.toString('latin1').matchAll(/\/Type \/Page\b/g)].length>=2);
 await page.getByText('Archivo',{exact:true}).click();
 await page.getByRole('button',{name:'Exportar imagen · SVG / PNG…'}).click();
 assert.equal(await dlg.locator('[name=format]').inputValue(),'svg');
});
