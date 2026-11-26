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

async function browserPage(t, simulationResult=result){
  const server=createServer(async (request,response)=>{
    const path=new URL(request.url,'http://localhost').pathname;
    response.setHeader('Content-Security-Policy',csp);
    try{
      if(path==='/api/catalog'||path==='/api/simulate'||path==='/api/status'){
        response.setHeader('Content-Type','application/json');
        response.end(path.endsWith('/catalog')?catalog:path.endsWith('/simulate')?simulationResult:JSON.stringify({gateway_version:'0.35.0',state:'ready',supported_equipment:['MaterialStream','EnergyStream','Mixer','Splitter','Heater','Cooler','Separator','Pump','Compressor','Expander','Tank','Valve','HeatExchanger','ConversionReactor','EquilibriumReactor'],supported_features:['simple_material_recycle'],started_at:'2026-11-18T16:00:00Z',uptime_s:100}));
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
  await page.locator('#exercise-open').click();
  await page.locator('#project-tab-report').click();
  await page.locator('#report-student').fill('Alumno Ejemplo');
  await page.locator('#report-studentId').fill('EST-007');
  await page.locator('#report-subject').fill('Fisica 5');
  await page.locator('#report-institution').fill('Escuela de prueba');
  await page.locator('#exercise-form button[type=submit]').click();
  assert.equal(await page.locator('#exercise-dialog').evaluate(el=>el.open),false);
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
  assert.equal(pageObjects.length,1,'El PDF reúne diagrama y balances en una única lámina');
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
 assert.equal([...pdf.bytes.toString('latin1').matchAll(/\/Type \/Page\b/g)].length,1,'Oficio debe reunir diagrama y tablas en una lámina');
 await page.getByText('Archivo',{exact:true}).click();
 await page.getByRole('button',{name:'Exportar imagen · SVG / PNG…'}).click();
 assert.equal(await dlg.locator('[name=format]').inputValue(),'svg');
});


test('Lámina A4: tablas compactas sin texto fuera de márgenes y diagrama con prioridad visual',async t=>{
  const page=await browserPage(t);
  const measured=await page.evaluate(()=>{
    const ns='http://www.w3.org/2000/svg',shape=document.createElementNS(ns,'svg');
    shape.setAttribute('viewBox','0 0 540 190');
    shape.setAttribute('width','540');shape.setAttribute('height','190');
    const line=document.createElementNS(ns,'path');
    line.setAttribute('d','M20 65 H520');line.setAttribute('stroke','#345');line.setAttribute('fill','none');shape.append(line);
    const tables=[
      {name:'Equipos',rows:[['Equipo','Tipo','Entradas','Salidas'],['Reactor','ConversionReactor',1,2]]},
      {name:'Corrientes',rows:[['Corriente','Caudal (kg/s)','Temp. (°C)','Presión (kPa)','H (kJ/kg)','S (kJ/(kg K))','Dens. (kg/m³)','Caudal molar (mol/s)'],['Alimentación',1,500,101.33,1189,3.583,.1893,83.26],['Producto vapor',1,500,101.33,1064,3.883,.2272,69.39],['Producto líquido',-2e-16,500,101.33,1064,3.883,.2272,-1.54e-14]]},
      {name:'Balances',rows:[['Equipo','Entrada (kg/s)','Salida (kg/s)','Residuo masa (kg/s)','Energía hacia fluido (kW)','Reactivo','Transferencia'],['Reactor',1,1,0,-6837,'Sí','Calor']]},
      {name:'Componentes',rows:[['Equipo','Componente','Entrada (kg/s)','Salida (kg/s)','Residuo o consumo neto (kg/s)','Interpretación'],['Reactor','Hydrogen',.1119,.05595,.05595,'Consumo (+), generación (-)'],['Reactor','Oxygen',.8881,.444,.4441,'Consumo (+), generación (-)'],['Reactor','Water',0,.5,-.5,'Consumo (+), generación (-)']]}
    ];
    const options={paper:'a4',orientation:'landscape',margin:15,titleBlock:true,tables,report:{student:'Alumno de prueba',subject:'Física'}};
    const sheet=SimSheetLayout.sheet(shape,'Formación de agua',options);
    sheet.style.position='absolute';sheet.style.left='-10000px';document.body.append(sheet);
    const box=sheet.viewBox.baseVal;
    const texts=[...sheet.querySelectorAll('text')];
    const errors=texts.filter(node=>{
      if(!node.textContent.trim())return false;
      const r=node.getBBox();
      return r.x<38||r.x+r.width>box.width-36||r.y+r.height>box.height-35;
    }).map(node=>node.textContent);
    const fontSizes=[...sheet.querySelectorAll('text')].map(t=>Number(t.getAttribute('font-size')||0));
    const chart=sheet.querySelector('g[transform]');
    const match=chart.getAttribute('transform').match(/scale\(([\d.]+)\)/);
    const chartScale=Number(match?.[1]||0);
    const tiny=sheet.textContent.includes('≈ 0');
    sheet.remove();
    return {errors,chartScale,tiny,smallFonts:fontSizes.filter(x=>x<=6.1).length,views:[box.width,box.height]};
  });
  assert.deepEqual(measured.errors,[],'Ningún texto puede salir de los márgenes impresos');
  assert.ok(measured.chartScale>.5,'El diagrama no debe quedar reducido a una miniatura');
  assert.ok(measured.tiny,'Residuos numéricos próximos a cero usan formato compacto');
  assert.ok(measured.smallFonts>25,'El reporte aplica tipografía reducida a las tablas');
  assert.ok(measured.views[0]>measured.views[1],'La lámina se conserva horizontal');
});


test('Ficha integrada: actividad, notas y rótulo comparten un guardado; cancelar no modifica el proyecto',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 await page.locator('#exercise-open').click();
 const editor=page.locator('#exercise-dialog');
 const originalStatement=await editor.locator('#exercise-statement').inputValue();
 await editor.locator('#project-tab-notes').click();
 const originalNoteCount=await editor.locator('.exercise-note-row').count();
 await editor.locator('#project-tab-report').click();
 const originalStudent=await editor.locator('#report-student').inputValue();
 await editor.locator('#project-tab-activity').click();
 await editor.locator('#exercise-statement').fill('Enunciado original de prueba');
 await editor.locator('#project-tab-notes').click();
 await editor.locator('#exercise-new-note').click();
 assert.equal(await editor.locator('.exercise-note-row').count(),originalNoteCount+1);
 await editor.locator('#project-tab-report').click();
 await editor.locator('#report-student').fill('Alumno 1');
 await editor.locator('#project-editor-cancel').click();
 await page.locator('#exercise-open').click();
 assert.equal(await editor.locator('#exercise-statement').inputValue(),originalStatement);
 await editor.locator('#project-tab-notes').click();
 assert.equal(await editor.locator('.exercise-note-row').count(),originalNoteCount);
 await editor.locator('#project-tab-report').click();
 assert.equal(await editor.locator('#report-student').inputValue(),originalStudent);
 await editor.locator('#project-tab-activity').click();
 await editor.locator('#exercise-statement').fill('Trabajo integrado');
 await editor.locator('#project-tab-notes').click();
 await editor.locator('#exercise-new-note').click();
 await editor.locator('#project-tab-report').click();
 await editor.locator('#report-student').fill('Alumno 2');
 await editor.getByRole('button',{name:'Guardar cambios'}).click();
 assert.equal(await editor.evaluate(el=>el.open),false);
 await page.locator('#exercise-open').click();
 assert.equal(await editor.locator('#exercise-statement').inputValue(),'Trabajo integrado');
 await editor.locator('#project-tab-notes').click();
 assert.equal(await editor.locator('.exercise-note-row').count(),originalNoteCount+1);
 await editor.locator('#project-tab-report').click();
 assert.equal(await editor.locator('#report-student').inputValue(),'Alumno 2');
 await editor.locator('#project-editor-report').click();
 assert.equal(await page.locator('#diagram-export-dialog').evaluate(el=>el.open),true);
 assert.equal(await page.locator('#diagram-export-form [name=format]').inputValue(),'pdf');
});


test('Reporte PDF incluye enunciado, consignas y observaciones completos sin truncar',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 await page.locator('#exercise-open').click();
 await page.locator('#exercise-statement').fill('Enunciado: calcular un balance de materia de prueba.');
 await page.locator('#exercise-instructions').fill('Consigna 1: identificar las corrientes.\nConsigna 2: analizar el caudal final.');
 await page.locator('#exercise-observations').fill('Observación del estudiante: cierre de masa correcto.');
 await page.locator('#exercise-form').getByRole('button',{name:'Guardar cambios'}).click();
 const layout=await page.evaluate(()=>{
   const shape=document.createElementNS('http://www.w3.org/2000/svg','svg');
   shape.setAttribute('viewBox','0 0 560 180');
   shape.setAttribute('width','560');shape.setAttribute('height','180');
   const options={paper:'a4',orientation:'landscape',margin:15,titleBlock:true,includeActivity:true,tables:[],
     exercise:{statement:'Balance de materia breve',instructions:'Identificar entradas y salidas',observations:'Balance cerrado'}};
   const short=SimSheetLayout.sheet(shape,'Caso didáctico',options);
   const shortText=short.textContent;
   const huge='Párrafo largo de prueba con distintas operaciones de balance. '.repeat(140);
   const longOptions={...options,exercise:{statement:huge,instructions:'Consigna final A',observations:'Observación final B'}};
   const long=SimSheetLayout.sheet(shape,'Caso didáctico',longOptions);
   const annex=SimSheetLayout.activityAnnexes('Caso didáctico',{...longOptions,resolvedOrientation:'landscape'});
   return {shortText,inline:short.dataset.activityAnnex,longAnnex:long.dataset.activityAnnex,
     pages:annex.length,fullText:annex.map(p=>p.textContent).join(' ')};
 });
 assert.match(layout.shortText,/Balance de materia breve/);
 assert.match(layout.shortText,/Identificar entradas y salidas/);
 assert.match(layout.shortText,/Balance cerrado/);
 assert.equal(layout.inline,'false');
 assert.equal(layout.longAnnex,'true');
 assert.ok(layout.pages>=2,'El texto didáctico extenso requiere un anexo paginado');
 assert.match(layout.fullText,/Consigna final A/);
 assert.match(layout.fullText,/Observación final B/);
 assert.ok(layout.fullText.includes('operaciones de balance'),'No pierde el contenido largo');

 await page.getByText('Archivo',{exact:true}).click();
 await page.locator('#report-pdf-menu').click();
 const dialog=page.locator('#diagram-export-dialog');
 await dialog.locator('[name=equipment]').uncheck();
 await dialog.locator('[name=balances]').uncheck();
 await dialog.locator('[name=streams]').uncheck();
 assert.equal(await dialog.locator('[name=activity]').isChecked(),true);
 await dialog.locator('#diagram-export-preview').click();
 await dialog.locator('#diagram-print-preview:not([hidden]) img').waitFor();
 const preview=decodeURIComponent((await dialog.locator('#diagram-preview-image').getAttribute('src')).split(',')[1]);
 assert.ok(preview.includes('Enunciado: calcular un balance de materia de prueba.'));
 assert.ok(preview.includes('Consigna 1: identificar las corrientes.'));
 assert.ok(preview.includes('Observación del estudiante: cierre de masa correcto.'));
 const pdf=await download(page,()=>dialog.getByRole('button',{name:'Descargar',exact:true}).click());
 assert.match(pdf.bytes.toString('latin1'),/^%PDF-/);
 assert.equal([...pdf.bytes.toString('latin1').matchAll(/\/Type \/Page\b/g)].length,1,'Actividad corta en una sola A4');
});


test('Anotaciones: insertar texto en el diagrama, editar con doble clic, arrastrar, cancelar y Supr',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 const tool=page.locator('#diagram-note-insert');
 assert.equal(await tool.isDisabled(),false);
 await tool.click();
 assert.equal(await tool.getAttribute('aria-pressed'),'true');
 await page.locator('#diagram').click({position:{x:320,y:300}});
 const editor=page.locator('.diagram-note-editor textarea');
 await editor.waitFor();
 await editor.fill('Anotación escrita sobre el diagrama');
 await editor.press('Control+Enter');
 assert.equal(await editor.count(),0);
 const note=page.locator('#diagram [data-exercise-note]').last();
 assert.equal(await note.count(),1);
 assert.match(await note.textContent(),/Anotación escrita sobre el diagrama/);
 await note.dblclick();
 await editor.waitFor();
 await editor.fill('Versión temporal que se cancela');
 await editor.press('Escape');
 assert.match(await note.textContent(),/Anotación escrita sobre el diagrama/);
 await note.dblclick();
 await editor.fill('Anotación corregida directamente');
 await editor.press('Control+Enter');
 assert.match(await note.textContent(),/Anotación corregida directamente/);
 const oldTransform=await note.getAttribute('transform');
 const box=await note.boundingBox();
 await page.mouse.move(box.x+18,box.y+15);
 await page.mouse.down();
 await page.mouse.move(box.x+85,box.y+45,{steps:5});
 await page.mouse.up();
 assert.notEqual(await note.getAttribute('transform'),oldTransform);
 await page.locator('#exercise-open').click();
 await page.locator('#project-tab-notes').click();
 assert.match(await page.locator('#exercise-note-list').textContent().catch(()=>''),/Anotación|/);
 assert.equal(await page.locator('#exercise-note-list textarea').last().inputValue(),'Anotación corregida directamente');
 await page.locator('#project-editor-cancel').click();
 await note.click();
 await page.keyboard.press('Delete');
 assert.equal(await page.locator('#diagram [data-exercise-note]').count(),0);
});


test('Calcular: sin botón fantasma y con luz de progreso y resultado verde',async t=>{
 const page=await browserPage(t);
 assert.equal(await page.locator('#report-open').count(),0,'No debe existir el antiguo botón vacío');
 assert.equal(await page.locator('#calculate-button .calculation-lamp').count(),1);
 await openProject(page,example);
 const button=page.locator('#calculate-button'),status=page.locator('#result-validity');
 await button.click();
 await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid',{timeout:12000});
 assert.equal(await button.getAttribute('data-state'),'valid');
 assert.equal(await status.getAttribute('data-state'),'valid');
 assert.match(await status.textContent(),/Cálculo correcto/);
 assert.equal(await button.locator('.calculation-lamp').count(),1,'La luz permanece tras calcular');
});


test('Play de Calcular y exploración posterior sin nuevos POST: equipos, corrientes y estados',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 const calc=page.locator('#calculate-button');
 assert.equal(await calc.locator('.calculate-play').count(),1);
 assert.equal(await calc.locator('.calculation-lamp').count(),1);
 assert.equal(await page.locator('#process-explorer-open').isDisabled(),true);
 let requests=0;
 page.on('request',req=>{if(new URL(req.url()).pathname==='/api/simulate')requests++;});
 await calc.click();
 await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid');
 assert.equal(requests,1);
 const explore=page.locator('#process-explorer-open');
 assert.equal(await explore.isDisabled(),false);
 await explore.click();
 const panel=page.locator('#process-explorer-panel');
 assert.equal(await panel.isVisible(),true);
 assert.match(await panel.locator('#process-explorer-counter').textContent(),/Etapa 1 de/);
 assert.equal(await page.locator('#diagram .explorer-current').count(),1);
 assert.ok((await panel.locator('.explorer-reading').count())>0);
 const first=await panel.locator('#process-explorer-title').textContent();
 await panel.locator('#process-explorer-next').click();
 assert.notEqual(await panel.locator('#process-explorer-title').textContent(),first);
 assert.equal(await page.locator('#diagram .explorer-current').count(),1);
 const interpretation=panel.locator('#process-explorer-interpretation');
 while(!await interpretation.isVisible()&&await panel.locator('#process-explorer-next').isEnabled()){
   await panel.locator('#process-explorer-next').click();
 }
 await interpretation.locator('summary').click();
 assert.match(await interpretation.innerText(),/Mezcla adiabática/);
 assert.match(await interpretation.innerText(),/Water · entrada − salida\s+0,83 kg\/s − 0,83 kg\/s/);
 assert.match(await interpretation.innerText(),/ΔḢ · salida − entrada/);
 assert.match(await interpretation.innerText(),/Dentro de tolerancia/);
 const next=panel.locator('#process-explorer-next');
 const analysis=interpretation.locator('#process-explorer-analysis');
 assert.ok(await analysis.evaluate(el=>el.scrollHeight>el.clientHeight));
 assert.ok(await next.evaluate(button=>{
   const {x,y,width,height,bottom}=button.getBoundingClientRect();
   return bottom<document.querySelector('#process-explorer-summary').getBoundingClientRect().top
     && document.elementFromPoint(x+width/2,y+height/2)===button;
 }));
 const current=await panel.locator('#process-explorer-title').textContent();
 await next.click();
 assert.notEqual(await panel.locator('#process-explorer-title').textContent(),current);
 assert.equal(requests,1,'Explorar nunca vuelve a enviar la simulación');
 while(await panel.locator('#process-explorer-back').isEnabled()){
   await panel.locator('#process-explorer-back').click();
 }
 assert.equal(await panel.locator('#process-explorer-title').textContent(),first);
 await panel.locator('#process-explorer-close').click();
 assert.equal(await panel.isVisible(),false);
 assert.equal(await page.locator('#diagram .explorer-muted').count(),0);
 await explore.click();
 await page.getByText('Archivo',{exact:true}).click();
 await page.locator('#close-project-button').click();
 await page.locator('#confirm-close-project').click();
 assert.equal(await panel.isVisible(),false,'El explorador se cierra con el proyecto');
 assert.equal(await explore.isDisabled(),true);
});

test('Explorador: diferencia cero de datos faltantes en los balances',async t=>{
 const partial=JSON.parse(result);
 delete partial.balances.find(b=>b.id==='m1').components.Ethanol;
 partial.streams.f1.phases.find(p=>p.name==='Mixture').enthalpy_kJ_kg=null;
 const page=await browserPage(t,JSON.stringify(partial));
 await openProject(page,example);
 await page.locator('#calculate-button').click();
 await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid');
 await page.locator('#process-explorer-open').click();
 const interpretation=page.locator('#process-explorer-interpretation');
 while(!await interpretation.isVisible()&&await page.locator('#process-explorer-next').isEnabled()){
   await page.locator('#process-explorer-next').click();
 }
 await interpretation.locator('summary').click();
 const text=await interpretation.innerText();
 assert.match(text,/Residuo global\s+0 kg\/s/);
 assert.match(text,/Ethanol · entrada − salida\s+Sin dato de DWSIM − Sin dato de DWSIM/);
 assert.match(text,/Residuo energético bajo el supuesto adiabático\s+Sin dato de DWSIM/);
});
test('Desplazar el lienzo con la rueda presionada o manteniendo Espacio',async t=>{
 const page=await browserPage(t);
 await page.reload({waitUntil:'networkidle'});
 await page.getByText('Ayuda',{exact:true}).click();
 await page.locator('#about-button').click();
 assert.match(await page.locator('#about-dialog').innerText(),new RegExp('Versión del portal · '+portalVersion));
 await page.keyboard.press('Escape');
 await openProject(page,example);
 const diagram=page.locator('#diagram');
 assert.equal(await page.locator('#diagram-pan').count(),0);
 await page.locator('#fit-button').click();
 await diagram.focus();
 await page.keyboard.press('Control+a');
 const snapshot=()=>diagram.evaluate(svg=>[...svg.querySelectorAll('.node')].map(n=>n.outerHTML));
 const original=await snapshot();
 const view=()=>diagram.getAttribute('viewBox');
 const initial=await view();
 const drag=async button=>{
   const box=await diagram.boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
   await page.mouse.down({button});
   assert.equal(await diagram.evaluate(svg=>svg.classList.contains('panning')),true);
   await page.mouse.move(box.x+box.width/2+54,box.y+box.height/2+32,{steps:4});
   await page.mouse.up({button});
   assert.equal(await diagram.evaluate(svg=>svg.classList.contains('panning')),false);
 };
 await drag('middle');
 const moved=await view();
 assert.notEqual(moved,initial);
 assert.deepEqual(moved.split(' ').slice(2),initial.split(' ').slice(2));
 assert.deepEqual(await snapshot(),original);
 await page.locator('#zoom-in').focus();
 await page.keyboard.down('Space');
 assert.equal(await diagram.evaluate(svg=>svg.classList.contains('pan-mode')),true);
 await drag('left');
 assert.notEqual(await view(),moved);
 assert.deepEqual(await snapshot(),original);
 await page.keyboard.up('Space');
 assert.equal(await diagram.evaluate(svg=>svg.classList.contains('pan-mode')),false);
 assert.deepEqual((await view()).split(' ').slice(2),initial.split(' ').slice(2));
 assert.deepEqual(await snapshot(),original);
 const panned=await view();
 await page.locator('#fit-button').click();
 assert.notEqual(await view(),panned);
});

test('Puertos visibles sin selección en todos los equipos y rotulados en el flash',async t=>{
 const page=await browserPage(t);
 await page.reload({waitUntil:'networkidle'});
 await page.getByText('Ayuda',{exact:true}).click();
 await page.locator('#about-button').click();
 assert.ok((await page.locator('#about-dialog').innerText()).includes('Versión del portal · '+portalVersion));
 await page.keyboard.press('Escape');
 const project=JSON.parse(await load('../site/examples/FlashDrum.json'));
 project.edges=project.edges.filter(e=>e.to!=='vapor');
 const equipmentTypes=await page.locator('#diagram-add option').evaluateAll(options=>
   options.map(option=>option.value).filter(type=>type&&!['MaterialStream','EnergyStream'].includes(type)));
 for(const [i,type] of equipmentTypes.entries()){
   if(project.nodes.some(node=>node.type===type))continue;
   project.nodes.push({id:'unit'+i,type,name:type,x:180+(i%6)*210,y:530+Math.floor(i/6)*155});
 }
 await openProject(page,Buffer.from(JSON.stringify(project)));
 const units=page.locator('#diagram .equipment-node');
 assert.equal(await units.count(),equipmentTypes.length);
 assert.deepEqual(await units.evaluateAll(elements=>elements.filter(unit=>{
   const ports=[...unit.querySelectorAll('.port')];
   return ports.length<2||ports.some(p=>Number(getComputedStyle(p).opacity)<=0);
 }).map(unit=>unit.getAttribute('aria-label'))),[]);
 const flash=page.locator('#diagram [data-node="flash"]');
 assert.deepEqual(await flash.locator('.flash-port-label').allTextContents(),['Alimentación','Vapor','Líquido']);
 assert.match(await flash.locator('[data-port="out"][data-index="0"]').getAttribute('aria-label'),/Vapor, libre/);
 assert.match(await flash.locator('[data-port="out"][data-index="1"]').getAttribute('aria-label'),/Líquido, conectado/);
});

test('Barra por categorías, rótulo desde Proyecto y resultados acoplables a la derecha',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 const toolbar=page.getByRole('toolbar',{name:'Herramientas del proyecto y del diagrama'});
 assert.deepEqual(await toolbar.locator('.command-group').evaluateAll(groups=>groups.map(g=>g.getAttribute('aria-label'))),
   ['Archivo','Proyecto','Simulación','Diagrama','Vista','Portal']);
 for(const text of ['Insertar texto en el diagrama','Datos del rótulo','Encuadrar todo el proceso','Mostrar cuadrícula','Abrir diagrama en otra ventana','Pantalla completa']){
   assert.equal(await toolbar.getByRole('button',{name:text,exact:true}).locator('svg').count(),1);
 }
 await page.locator('#project-edit-menu summary').click();
 await page.getByRole('button',{name:'Datos del rótulo…',exact:true}).click();
 assert.equal(await page.locator('#project-section-report').isVisible(),true);
 await page.keyboard.press('Escape');
 await page.locator('#diagram-menu summary').click();
 await page.locator('#diagram-menu').getByRole('button',{name:'Insertar texto en el diagrama',exact:true}).click();
 assert.equal(await page.locator('#diagram-note-insert').getAttribute('aria-pressed'),'true');
 await page.keyboard.press('Escape');
 const results=page.locator('#results-panel');
 assert.equal(await results.getAttribute('data-sim-cad-mode'),'right');
 await page.locator('#calculate-button').click();
 await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid');
 assert.equal(await page.locator('#canvas-model').isVisible(),true);
 assert.equal(await page.locator('#canvas-run-time').isVisible(),true);
 assert.equal(await results.locator('#results > :first-child').getAttribute('class'),'balance-grid');
 await page.setViewportSize({width:950,height:720});
 const titleBar=results.locator('.results-heading');
 assert.ok(await titleBar.evaluate(header=>{
   const row=header.getBoundingClientRect();
   const controls=[...header.querySelectorAll('select,button,a')];
   return controls.length===4&&controls.every(control=>{
     const rect=control.getBoundingClientRect();
     return rect.top>=row.top&&rect.bottom<=row.bottom&&rect.right<=row.right;
   })&&Math.max(...controls.map(c=>c.getBoundingClientRect().top))
       -Math.min(...controls.map(c=>c.getBoundingClientRect().top))<4;
 }));
 assert.equal(await results.getByText('Residuo másico').first().isVisible(),true);
 const streams=results.getByRole('button',{name:'Corrientes',exact:true});
 await streams.click();
 assert.equal(await results.locator('[data-results-content="balances"]').isVisible(),false);
 const stream=results.locator('.stream-result').first();
 await stream.locator('summary').click();
 assert.equal(await stream.getByText('Entalpía',{exact:true}).isVisible(),true);
 assert.ok(await results.locator('#results').evaluate(el=>el.scrollWidth<=el.clientWidth));
 await results.getByRole('button',{name:'Balances',exact:true}).click();
 assert.equal(await results.locator('[data-results-content="balances"]').isVisible(),true);
 await page.setViewportSize({width:1280,height:720});
 const position=results.locator('.sim-cad-position');
 await position.selectOption('bottom');
 assert.equal(await results.getAttribute('data-sim-cad-mode'),'bottom');
 await position.selectOption('float');
 assert.equal(await results.getAttribute('data-sim-cad-mode'),'float');
 const heading=results.locator('.results-heading');
 await heading.focus();
 const left=await results.evaluate(el=>el.getBoundingClientRect().left);
 await page.keyboard.press('ArrowRight');
 assert.ok(await results.evaluate(el=>el.getBoundingClientRect().left)>left);
 await page.locator('#view-menu summary').click();
 await page.locator('#view-reset-layout').click();
 assert.equal(await results.getAttribute('data-sim-cad-mode'),'right');
});

test('La barra abre los menús completos y permite insertar equipos y corrientes',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 const toolbar=page.getByRole('toolbar',{name:'Herramientas del proyecto y del diagrama'});
 for(const width of [1280,950,420]){
   await page.setViewportSize({width,height:720});
   for(const trigger of await toolbar.locator('.toolbar-object-picker summary').all()){
     assert.ok(await trigger.evaluate(summary=>{
       const box=summary.getBoundingClientRect(), icon=summary.querySelector('svg').getBoundingClientRect();
       return icon.width>=20&&icon.height>=20&&icon.top>=box.top+3&&icon.bottom<=box.bottom-3
         &&icon.left>=box.left+3&&icon.right<=box.right-3;
     }));
   }
 }
 await page.setViewportSize({width:1280,height:720});
 for(const width of [420,1280]){
   await page.setViewportSize({width,height:720});
   for(const picker of await toolbar.locator('.toolbar-object-picker').all()){
     await picker.locator('summary').click();
     assert.ok(await picker.evaluate(element=>{
       const button=element.querySelector('summary').getBoundingClientRect();
       const menu=element.querySelector('.menu-panel').getBoundingClientRect();
       const anchor=button.left+menu.width<=innerWidth-6?button.left:button.right-menu.width;
       const left=Math.max(6,Math.min(anchor,innerWidth-menu.width-6));
       return Math.abs(menu.left-left)<1&&Math.abs(menu.top-button.bottom-3)<1;
     }));
     await page.keyboard.press('Escape');
   }
 }
 const triggers=toolbar.locator('[data-toolbar-menu]');
 assert.equal(await triggers.count(),7);
 for(const trigger of await triggers.all()){
   const menu=page.locator('#'+await trigger.getAttribute('aria-controls'));
   await trigger.click();
   assert.equal(await trigger.getAttribute('aria-expanded'),'true');
   assert.equal(await menu.locator('.menu-panel').isVisible(),true);
   await page.keyboard.press('Escape');
   assert.equal(await trigger.getAttribute('aria-expanded'),'false');
 }
 const nodes=page.locator('#diagram .node');
 const count=await nodes.count();
 await toolbar.locator('#toolbar-equipment summary').click();
 const equipment=toolbar.locator('#toolbar-equipment .menu-panel');
 assert.ok(await equipment.locator('[data-insert-type]').first().evaluate(row=>{
   const icon=row.querySelector('svg').getBoundingClientRect();
   const label=row.querySelector('span').getBoundingClientRect();
   return icon.right<label.left&&label.top>=icon.top&&label.bottom<=icon.bottom;
 }));
 assert.deepEqual(await equipment.locator('.menu-section-label').allTextContents(),
   ['Mezcla y división','Separación y almacenamiento','Presión y transporte','Intercambio térmico','Reacción']);
 assert.deepEqual(await equipment.locator('[data-insert-type]').evaluateAll(items=>items.map(item=>item.dataset.insertType)),
   await page.locator('#palette [data-type]:not([data-type$="Stream"])').evaluateAll(items=>items.map(item=>item.dataset.type)));
 await equipment.getByRole('button',{name:'Separador flash',exact:true}).click();
 assert.equal(await nodes.count(),count+1);
 await toolbar.locator('#toolbar-streams summary').click();
 const streams=toolbar.locator('#toolbar-streams .menu-panel');
 assert.equal(await streams.getByRole('button').count(),2);
 for(const type of ['MaterialStream','EnergyStream']){
   const palette=page.locator(`#palette [data-type="${type}"] svg`);
   const picker=streams.locator(`[data-insert-type="${type}"] svg`);
   const icon=svg=>svg.evaluate(el=>({markup:el.innerHTML,stroke:getComputedStyle(el).stroke,fill:getComputedStyle(el).fill}));
   assert.notDeepEqual(await icon(picker),await icon(palette),'La barra usa icono técnico propio y la paleta conserva DWSIM');
 }
 await streams.getByRole('button',{name:'Corriente de materia',exact:true}).click();
 assert.equal(await nodes.count(),count+2);
 await toolbar.getByRole('button',{name:'Ejemplos',exact:true}).click();
 assert.equal(await page.locator('#examples-dialog').isVisible(),true);
});


test('Ventana de balances respeta motor Debian fijado en ventana principal',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 await page.evaluate(async()=>{
   document.body.dataset.sessionRole='admin';
   await selectCalculationEngine('debian');
 });
 await page.waitForFunction(()=>document.querySelector('#engine-current')?.textContent?.includes('Fijado · Debian'));
 await page.locator('#calculate-button').click();
 await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid');
 const [popup]=await Promise.all([page.waitForEvent('popup'),page.locator('#results-popout').click()]);
 await popup.waitForFunction(()=>document.querySelector('#engine-current')?.textContent?.includes('Fijado · Debian')&&document.querySelector('#engine-current')?.textContent?.includes('cálculo: Debian'));
 assert.equal(await popup.locator('#engine-select').isDisabled(),true,'El motor solo se cambia en la ventana principal');
 assert.match(await popup.locator('#results').innerText(),/Balances|Entrada másica/);
 await page.evaluate(async()=>{await selectCalculationEngine('auto');});
 await popup.waitForFunction(()=>document.querySelector('#engine-select')?.value==='auto');
 assert.match(await popup.locator('#engine-current').innerText(),/Automático/);
 await popup.close();
});

test('ΣIM 0.47.7: Calcular propio, barra reordenable, tema único y navegación integrada',async t=>{
  const page=await browserPage(t);
  assert.equal(await page.locator('#theme-toggle').count(),1);
  assert.equal(await page.locator('[data-toolbar-action="theme-toggle"]').count(),0);
  assert.equal(await page.locator('#calculate-button .calculate-play path').count(),2);
  assert.equal(await page.locator('#calculate-button.primary-calculate').count(),1);
  assert.equal(await page.locator('#toolbar-layout-reset').count(),1);
  assert.equal(await page.locator('#view-menu [data-toolbar-action="fit-button"]').count(),0,'Vista no repite el encuadre de la barra');
  const admin=page.locator('#admin-nav-link');
  assert.equal(await admin.getAttribute('target'),null,'Administración no abre otra pestaña');
  const order=()=>page.locator('.command-bar > .command-group').evaluateAll(els=>els.map(el=>[...el.classList].find(k=>['file-tools','project-tools','simulation-tools','drawing-tools','zoom-controls','portal-tools'].includes(k))));
  const original=await order();
  await page.locator('.simulation-tools .toolbar-grip').evaluate(el=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',altKey:true,bubbles:true})));
  const changed=await order();
  assert.notDeepEqual(changed,original);
  assert.equal(changed.indexOf('simulation-tools'),original.indexOf('simulation-tools')-1);
  await page.locator('#view-menu > summary').click();
  await page.locator('#toolbar-layout-reset').click();
  assert.deepEqual(await order(),['file-tools','project-tools','simulation-tools','drawing-tools','zoom-controls','portal-tools']);
  await page.locator('#theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.goto(new URL('/admin.html',page.url()).href,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#theme-toggle').count(),1);
  assert.equal(await page.locator('.admin-header-navigation a[href="/"]').count(),1);
  await page.goto(new URL('/acceso.html',page.url()).href,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#theme-toggle').count(),1);
  assert.equal(await page.locator('.access-brand').count(),0,'Acceso usa un solo logotipo');
});

test('Explorador estable: no cambia altura del lienzo al recorrer etapas ni expandir ecuaciones',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 await page.locator('#calculate-button').click();
 await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid');
 await page.locator('#process-explorer-open').click();
 const panel=page.locator('#process-explorer-panel'),canvas=page.locator('#canvas-wrap');
 const measure=()=>page.evaluate(()=>{
   const panel=document.querySelector('#process-explorer-panel').getBoundingClientRect();
   const canvas=document.querySelector('#canvas-wrap').getBoundingClientRect();
   return {panelHeight:panel.height,canvasHeight:canvas.height,canvasTop:canvas.top};
 });
 const initial=await measure();
 assert.ok(initial.panelHeight>100);
 for(let i=0;i<4;i++){
   const next=panel.locator('#process-explorer-next');
   if(!await next.isEnabled())break;
   await next.click();
   const now=await measure();
   assert.ok(Math.abs(now.panelHeight-initial.panelHeight)<1,'La altura del explorador no varía al avanzar');
   assert.ok(Math.abs(now.canvasHeight-initial.canvasHeight)<1,'El alto del lienzo permanece fijo');
   assert.ok(Math.abs(now.canvasTop-initial.canvasTop)<1,'El lienzo no se desplaza');
 }
 const details=panel.locator('#process-explorer-interpretation');
 while(!await details.isVisible()&&await panel.locator('#process-explorer-next').isEnabled())
   await panel.locator('#process-explorer-next').click();
 assert.equal(await details.isVisible(),true);
 await details.locator('summary').click();
 assert.equal(await details.getAttribute('open'),'');
 const expanded=await measure();
 assert.ok(Math.abs(expanded.panelHeight-initial.panelHeight)<1,'Abrir ecuaciones no aumenta el panel');
 assert.ok(Math.abs(expanded.canvasHeight-initial.canvasHeight)<1,'Abrir ecuaciones no reduce el lienzo');
 const marker=await details.locator('summary').evaluate(el=>getComputedStyle(el,'::before').content);
 assert.match(marker,/−|\2212/,'El detalle usa signo menos en lugar del triángulo nativo');
 if(await panel.locator('#process-explorer-next').isEnabled()){
   await panel.locator('#process-explorer-next').click();
   const after=await measure();
   assert.ok(Math.abs(after.panelHeight-initial.panelHeight)<1);
   assert.ok(Math.abs(after.canvasHeight-initial.canvasHeight)<1);
 }
});

test('ΣIM 0.47.9: iconografía coherente y detalles informativos sin flechas nativas',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 const equipment=page.locator('#toolbar-equipment>summary>svg');
 const streams=page.locator('#toolbar-streams>summary>svg');
 assert.equal(await equipment.count(),1);
 assert.equal(await streams.count(),1);
 assert.equal(await equipment.getAttribute('viewBox'),'0 0 24 24');
 assert.equal(await streams.getAttribute('viewBox'),'0 0 24 24');
 assert.equal(await equipment.getAttribute('stroke-width'),await streams.getAttribute('stroke-width'));
 assert.notEqual(await equipment.locator('path').getAttribute('d'),await streams.locator('path').getAttribute('d'));
 await page.locator('#toolbar-streams>summary').click();
 const menu=page.locator('#toolbar-streams .menu-panel');
 assert.equal(await menu.locator('[data-insert-type="MaterialStream"]>svg').count(),1);
 assert.equal(await menu.locator('[data-insert-type="EnergyStream"]>svg').count(),1);
 assert.notEqual(await menu.locator('[data-insert-type="MaterialStream"]>svg path').getAttribute('d'),
   await menu.locator('[data-insert-type="EnergyStream"]>svg path').getAttribute('d'));
 await page.keyboard.press('Escape');
 await page.locator('#calculate-button').click();
 await page.waitForFunction(()=>document.querySelector('#result-validity')?.dataset.state==='valid');
 const details=page.locator('.component-balances').first();
 assert.equal(await details.count(),1);
 const summary=details.locator('summary');
 assert.ok(await summary.evaluate(el=>getComputedStyle(el).listStyleType==='none'));
 assert.match(await summary.evaluate(el=>getComputedStyle(el,'::before').content),/\+/);
 await summary.click();
 assert.equal(await details.getAttribute('open'),'');
 assert.match(await summary.evaluate(el=>getComputedStyle(el,'::before').content),/−|\2212/);
 const controls=page.locator('.app-menu>summary');
 assert.equal(await controls.first().evaluate(el=>getComputedStyle(el).listStyleType),'none');
 await page.goto(new URL('/admin.html',page.url()).href,{waitUntil:'networkidle'});
 const history=page.locator('.services-history').first();
 assert.match(await history.locator('summary').evaluate(el=>getComputedStyle(el,'::before').content),/\+/);
 await history.locator('summary').click();
 assert.match(await history.locator('summary').evaluate(el=>getComputedStyle(el,'::before').content),/−|\2212/);
});

test('Catálogo: acceso a nombres posteriores a C y carga paginada',async t=>{
 const page=await browserPage(t);
 await page.locator('#file-menu>summary').click();
 await page.locator('#new-project-button').click();
 const list=page.locator('#new-component-list');
 assert.equal(await list.locator('[data-new-add="Water"]').count(),1,'Water aparece sin buscar');
 assert.equal(await list.locator('[data-new-add="Methane"]').count(),1,'Los compuestos frecuentes son accesibles de entrada');
 assert.equal(await list.locator('.compound-option').count(),35,'La primera página tiene 35 resultados');
 assert.equal(await list.locator('#new-compounds-more').count(),1,'Existe navegación para el resto del catálogo');
 await list.locator('#new-compounds-more').click();
 assert.equal(await list.locator('.compound-option').count(),70);
 await page.locator('#new-component-search').fill('Water');
 assert.equal(await list.locator('[data-new-add="Water"]').count(),1);
 assert.match(await page.locator('#new-component-count').textContent(),/compuestos disponibles/);
});
test('Los divisores de panel son descubribles sin desplazar su mecanismo',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 const splitter=page.locator('.equipment-panel .panel-resizer');
 assert.equal(await splitter.getAttribute('role'),'separator');
 assert.equal(await splitter.getAttribute('aria-orientation'),'vertical');
 assert.match(await splitter.evaluate(el=>getComputedStyle(el,'::after').content),/""/);
 const results=page.locator('#results-resizer');
 assert.equal(await results.getAttribute('role'),'separator');
 assert.match(await results.evaluate(el=>getComputedStyle(el,'::after').content),/""/);
});


test('Ventanas laterales: separador horizontal regula altura y se restablece',async t=>{
 const page=await browserPage(t);
 await openProject(page,example);
 const right=page.locator('.sim-cad-slot[data-edge="right"]');
 const inspector=right.locator(':scope > .inspector-panel');
 const balances=right.locator(':scope > #results-panel');
 const splitter=right.locator(':scope > .sim-cad-stack-splitter');
 assert.equal(await splitter.count(),1,'Hay separador interno entre Propiedades y Balances');
 assert.equal(await splitter.getAttribute('aria-orientation'),'horizontal');
 const before=await inspector.evaluate(el=>el.getBoundingClientRect().height);
 const width=await right.evaluate(el=>el.getBoundingClientRect().width);
 await splitter.focus();
 await page.keyboard.press('ArrowDown');
 const after=await inspector.evaluate(el=>el.getBoundingClientRect().height);
 assert.ok(after>before+3,'La primera ventana aumenta su altura con flecha abajo');
 assert.ok(Math.abs((await right.evaluate(el=>el.getBoundingClientRect().width))-width)<1,'No cambia el ancho de columna');
 assert.ok(await balances.evaluate(el=>el.getBoundingClientRect().height)>80);
 await splitter.dblclick();
 const a=await inspector.evaluate(el=>el.getBoundingClientRect().height);
 const b=await balances.evaluate(el=>el.getBoundingClientRect().height);
 assert.ok(Math.abs(a-b)<4,'Doble clic reparte la altura en partes iguales');
});

test('Tanque: el módulo didáctico genera curva propia sin llamar al gateway de simulación',async t=>{
 const page=await browserPage(t);
 const tankExample=await load('../site/examples/TankWater.json');
 await openProject(page,tankExample);
 let simulations=0;
 page.on('request',req=>{if(new URL(req.url()).pathname==='/api/simulate')simulations++;});
 await page.locator('#diagram [data-node="tank"]').click();
 await page.locator('#inspector [data-tank-dynamic="tank"]').click();
 const dialog=page.locator('#tank-dynamics-dialog');
 assert.equal(await dialog.isVisible(),true);
 assert.match(await dialog.locator('#tank-dynamic-hint').innerText(),/independiente de DWSIM|no usa DWSIM/);
 await dialog.locator('#tank-dynamic-calculate').click();
 assert.equal(await dialog.locator('#tank-dynamic-result').isVisible(),true);
 assert.ok(await dialog.locator('#tank-dynamic-chart path').count()>0);
 assert.match(await dialog.locator('#tank-dynamic-status').innerText(),/Residuo de masa/);
 assert.equal(simulations,0,'Este prototipo no debe invocar DWSIM');
 const csv=await download(page,()=>dialog.locator('#tank-dynamic-download').click());
 assert.match(csv.bytes.toString('utf8'),/Didáctico ΣIM \(no DWSIM\)/);
 await page.keyboard.press('Escape');
 assert.equal(await dialog.isVisible(),false);
});

test('Dinámica DWSIM MCP: curva real identificada y CSV diferente del didáctico',async t=>{
 const page=await browserPage(t);
 await page.route('**/api/dynamics/capabilities',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({supported:true,missing_tools:[]})}));
 let realRequests=0;
 await page.route('**/api/dynamics/tank',async route=>{
   realRequests++;
   const body=route.request().postDataJSON();
   assert.equal(body.capacity_m3,5);
   assert.equal(route.request().headers()['x-sim-engine'],'windows');
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     source:'dwsim-mcp-dynamics',model:'DWSIM · integración temporal real',
     assumptions:'Serie real de DWSIM; volumen calculado a partir del nivel.',
     points:[{time_s:0,volume_m3:0,level_m:0,fill_pct:0,inlet_m3_s:.01,outlet_m3_s:0,outlet_kg_s:0},
       {time_s:60,volume_m3:.23,level_m:.23,fill_pct:4.6,inlet_m3_s:.01,outlet_m3_s:.0084,outlet_kg_s:8.4},
       {time_s:600,volume_m3:.333,level_m:.333,fill_pct:6.66,inlet_m3_s:.01,outlet_m3_s:.01,outlet_kg_s:10}]
   })});
 });
 const tank=await load('../site/examples/TankWater.json');
 await openProject(page,tank);
 await page.locator('#diagram [data-node="tank"]').click();
 await page.locator('#inspector [data-tank-dynamic="tank"]').click();
 const dialog=page.locator('#tank-dynamics-dialog');
 await page.waitForFunction(()=>document.querySelector('#tank-dynamic-source option[value="dwsim"]')?.disabled===false);
 assert.equal(await dialog.locator('#tank-dynamic-source').inputValue(),'dwsim');
 await dialog.locator('#tank-dynamic-calculate').click();
 await dialog.locator('#tank-dynamic-result').waitFor();
 assert.equal(realRequests,1);
 assert.match(await dialog.locator('#tank-dynamic-status').innerText(),/DWSIM/);
 assert.ok(await dialog.locator('#tank-dynamic-chart path').count()>0);
 const exported=await download(page,()=>dialog.locator('#tank-dynamic-download').click());
 assert.match(exported.bytes.toString('utf8'),/DWSIM MCP · integración dinámica real/);
 assert.doesNotMatch(exported.bytes.toString('utf8'),/Modelo;Didáctico ΣIM/);
 await page.locator('#charts-from-tank').click();
 await page.locator('#charts-content').waitFor();
 assert.equal(await page.locator('#charts-model-section').isVisible(),false);
 assert.equal(await page.locator('#charts-format').evaluate(el=>el.open),false);
 assert.equal(await page.locator('#charts-dataset').inputValue(),'dynamic');
 assert.equal(await page.locator('#charts-x').inputValue(),'time_s');
 assert.equal(await page.locator('#charts-y').inputValue(),'level_m');
 await page.locator('#charts-y2').selectOption('outlet_kg_s');assert.equal(await page.locator('#charts-svg [data-axis=right]').count(),1);for(const [fmt,signature] of [['png','89504e47'],['jpg','ffd8ff']]){const file=await download(page,()=>page.locator('#charts-export-'+fmt).click()).catch(async error=>{throw new Error('Exportación '+fmt+': '+await page.locator('#charts-error').textContent(),{cause:error});});assert.ok(file.bytes.toString('hex').startsWith(signature));assert.ok(file.name.endsWith('.'+fmt));}await page.locator('#charts-y2').selectOption('');assert.equal(await page.locator('#charts-svg [data-axis=right]').count(),0);
 assert.match(await page.locator('#charts-source').innerText(),/3 registros/);
 assert.ok(await page.locator('#charts-svg circle').count()>=3);
 await page.locator('#charts-data-details summary').click();
 assert.equal(await page.locator('#charts-data-table tbody tr').count(),3);
 await page.locator('#charts-zoom-in').click();
 assert.notEqual(await page.locator('#charts-svg').getAttribute('viewBox'),'0 0 785 340');
 await page.locator('#charts-fit').click();
 assert.equal(await page.locator('#charts-svg').getAttribute('viewBox'),'0 0 785 340');
 assert.equal(await page.locator('.charts-body').evaluate(el=>getComputedStyle(el).overflowY),'auto');
 await page.locator('#charts-close').click();
 await page.locator('#charts-open').click();
 assert.equal(await page.locator('#charts-dataset').inputValue(),'dynamic');
 assert.equal(realRequests,1);
 await page.locator('#charts-close').click();
});

 test('Gráficas: cálculo estacionario alimenta ejes XY e importación independiente',async t=>{
 const page=await browserPage(t);await openProject(page,example);await page.locator('#calculate-button').click();await page.waitForFunction(()=>document.querySelector('#calculation-state').textContent==='Resultados vigentes');assert.equal(await page.locator('#charts-dialog').isVisible(),false);await page.locator('#charts-open').click();await page.locator('#charts-content').waitFor();assert.equal(await page.locator('#charts-dialog').getAttribute('data-sim-cad-mode'),'float');assert.equal(await page.locator('#charts-dialog').isVisible(),true);await page.waitForFunction(()=>getComputedStyle(document.querySelector('#calculate-button')).backgroundColor==='rgb(35, 115, 68)');await page.locator('#charts-dialog .sim-cad-position').selectOption('float');assert.equal(await page.locator('#charts-dialog').getAttribute('data-sim-cad-mode'),'float');await page.locator('#charts-dialog .sim-cad-position').selectOption('bottom');assert.equal(await page.locator('#charts-dialog').getAttribute('data-sim-cad-mode'),'bottom');assert.equal(await page.locator('#charts-y').inputValue(),'temperature');assert.match(await page.locator('#charts-svg').innerHTML(),/Temperatura/);await page.locator('#charts-x').selectOption('mass');assert.match(await page.locator('#charts-svg').innerHTML(),/Caudal másico/);await page.getByText('Importar o ingresar datos',{exact:true}).click();await page.locator('#charts-paste').fill('Tiempo [s];Concentración [mol/L]\\n0;1\\n5;0,5'.replaceAll('\\n','\n'));await page.locator('#charts-load-data').click();assert.equal(await page.locator('#charts-dataset').inputValue(),'manual');assert.match(await page.locator('#charts-svg').innerHTML(),/Concentración/);await page.keyboard.press('Escape');
});

 test('Gráficas: abrir sin cálculo, recuperar vista solo diagrama y posición guardada',async t=>{const page=await browserPage(t);await openProject(page,example);await page.locator('#charts-open').click();await page.locator('#charts-empty').waitFor({state:'visible'});assert.equal(await page.locator('#charts-dialog').getAttribute('data-sim-cad-mode'),'float');assert.equal(await page.locator('#charts-open').getAttribute('aria-pressed'),'true');await page.locator('#charts-open').click();assert.equal(await page.locator('#charts-dialog').isVisible(),false);await page.locator('#charts-open').click();assert.equal(await page.locator('#charts-open-error').isVisible(),false);await page.locator('#charts-close').click();await page.locator('#diagram-focus').click();await page.locator('#charts-open').click();await page.locator('#charts-empty').waitFor({state:'visible'});assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('diagram-focus')),false);await page.locator('#charts-close').click();await page.evaluate(()=>{const k='sim-dock-layout-cad-v3',v=JSON.parse(localStorage.getItem(k)||'{}');v.chartsFloatingV1=true;v.charts={mode:'float',lastDock:'bottom',box:{x:99999,y:99999,w:650,h:450}};localStorage.setItem(k,JSON.stringify(v));});await page.reload({waitUntil:'networkidle'});await openProject(page,example);await page.getByText('Simulación',{exact:true}).click();await page.locator('#charts-menu-open').click();await page.locator('#charts-empty').waitFor({state:'visible'});const b=await page.locator('#charts-dialog').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.width>100&&b.height>100);});

test('Ejemplo 20: Calcular principal integra tiempo sin POST estacionario',async t=>{const page=await browserPage(t);let steady=0,dynamic=0;await page.route('**/api/simulate',r=>{steady++;return r.abort();});await page.route('**/api/dynamics/capabilities',r=>r.fulfill({json:{supported:true}}));await page.route('**/api/dynamics/tank',r=>{dynamic++;const p=r.request().postDataJSON();assert.equal(p.duration_s,600);assert.equal(p.step_s,5);assert.equal(p.capacity_m3,2);assert.equal(p.feed_mass_flow_kg_s,10);return r.fulfill({json:{source:'dwsim-mcp-dynamics',points:[{time_s:0,level_m:0},{time_s:5,level_m:.1},{time_s:600,level_m:.33}]}});});await openProject(page,await load('../site/examples/TankFillingDynamic.json'));assert.equal(await page.locator('#simulation-regime').inputValue(),'dynamic');await page.locator('#calculate-button').click();await page.locator('#charts-content').waitFor();assert.equal(steady,0);assert.equal(dynamic,1);assert.equal(await page.locator('#charts-x').inputValue(),'time_s');assert.equal(await page.locator('#charts-y').inputValue(),'level_m');await page.waitForFunction(()=>document.querySelector('#calculate-button').dataset.state==='valid');assert.equal(await page.locator('#charts-dataset').inputValue(),'dynamic');await page.locator('#charts-close').click();await page.locator('#dynamic-settings').click();await page.locator('#dynamic-parameters input[name=duration_s]').fill('300');await page.locator('#dynamic-settings-form button[type=submit]').click();assert.equal(await page.locator('#calculate-button').getAttribute('data-state'),'stale');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lemeit-process-v1')).simulation.parameters.duration_s),300);});
