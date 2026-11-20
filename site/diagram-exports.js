/* Exportación del dibujo vectorial compartido con el editor. */
'use strict';
const SimDiagramFiles=(()=>{
  const ns='http://www.w3.org/2000/svg';
  const paint=['fill','stroke','stroke-width','stroke-dasharray','stroke-linejoin',
    'stroke-linecap','opacity','text-anchor','font-size','font-family','font-weight','paint-order'];
  const assetRoot=new URL('.',document.currentScript.src);
  const element=tag=>document.createElementNS(ns,tag);
  let font, pdfLibraries;

  function loadFont(){
    font??=fetch(new URL('assets/Asap-SemiBold.ttf',assetRoot)).then(async response=>{
      if(!response.ok)throw new Error('No se pudo cargar la tipografía del diagrama.');
      const bytes=new Uint8Array(await response.arrayBuffer());
      let text='';
      for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));
      return btoa(text);
    }).catch(error=>{font=null;throw error;});
    return font;
  }

  function script(path){
    return new Promise((resolve,reject)=>{
      const tag=document.createElement('script');
      tag.src=new URL(path,assetRoot).href;
      tag.onload=resolve;
      tag.onerror=()=>{tag.remove();reject(new Error('No se pudo cargar la exportación PDF.'));};
      document.head.append(tag);
    });
  }

  function loadPdf(){
    pdfLibraries??=(window.jspdf?Promise.resolve():script('vendor/jspdf.umd.min.js'))
      .then(()=>script('vendor/svg2pdf.umd.min.js'))
      .catch(error=>{pdfLibraries=null;throw error;});
    return pdfLibraries;
  }

  function snapshot(markup,title,background,forPdf){
    const svg=element('svg');
    const stage=document.createElement('div');
    stage.className='diagram-export-stage';
    stage.setAttribute('aria-hidden','true');
    svg.innerHTML=markup;
    stage.append(svg);
    document.body.append(stage);
    try{
      const box=svg.getBBox();
      const margin=18,x=Math.floor(box.x)-margin,y=Math.floor(box.y)-margin;
      const width=Math.ceil(box.x+box.width)-x+margin;
      const height=Math.ceil(box.y+box.height)-y+margin;
      for(const shape of svg.querySelectorAll('path,ellipse,rect,circle,text')){
        const style=getComputedStyle(shape);
        const appearance=paint.map(key=>[key,style.getPropertyValue(key)]);
        if(style.vectorEffect==='non-scaling-stroke'){
          if(forPdf){
            const matrix=shape.getCTM();
            const scale=matrix?Math.sqrt(Math.abs(matrix.a*matrix.d-matrix.b*matrix.c)):1;
            const stroke=appearance.find(([name])=>name==='stroke-width');
            if(scale>0)stroke[1]=String(parseFloat(stroke[1])/scale);
          }else shape.setAttribute('vector-effect','non-scaling-stroke');
        }
        shape.removeAttribute('style');
        for(const [key,value] of appearance){
          // svg2pdf acepta RGB/RGBA. Chromium resuelve color-mix a color(srgb ...).
          const mixed=value.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+) \/ ([\d.]+)\)$/);
          const color=mixed?`rgba(${mixed.slice(1,4).map(v=>Math.round(v*255)).join(',')},${mixed[4]})`:value;
          shape.setAttribute(key,color);
        }
      }
      for(const item of svg.querySelectorAll('[class]'))item.removeAttribute('class');
      svg.setAttribute('viewBox',`${x} ${y} ${width} ${height}`);
      svg.setAttribute('width',width);
      svg.setAttribute('height',height);
      const label=element('title');
      label.textContent=title;
      svg.prepend(label);
      if(background==='white'){
        const paper=element('rect');
        for(const [key,value] of Object.entries({x,y,width,height,fill:'#fff'}))paper.setAttribute(key,value);
        label.after(paper);
      }
      return svg;
    }finally{stage.remove();}
  }


  const textValue=value=>String(value??'').replace(/[\r\n\t]+/g,' ').trim().slice(0,120);
  function addBalancesPage(pdf,rows,{title,report,identity}){
    if(!Array.isArray(rows)||rows.length<2)return;
    pdf.addPage();
    const page=pdf.internal.pageSize,W=page.getWidth(),H=page.getHeight(),margin=36;
    const fontName='DWSIM Asap';
    pdf.setFont(fontName,'bold');pdf.setTextColor(30,37,42);pdf.setFontSize(13);
    pdf.text('ΣIM  ·  TABLAS DEL PROCESO',margin,margin+8);
    pdf.setFontSize(9);
    pdf.text(textValue(title),margin,margin+25);
    const owner=textValue(report?.student||identity?.student_name||'');
    const cls=textValue(report?.className||identity?.class_name||'');
    pdf.text([owner,cls].filter(Boolean).join('  ·  ').slice(0,115),margin,margin+40);
    const available=W-2*margin,headers=rows[0],count=headers.length,widths=Array.from({length:count},()=>available/count);
    let y=margin+58;
    const headerHeight=35,rowHeight=27;
    const drawRow=(values,heading)=>{
      const height=heading?headerHeight:rowHeight;
      if(y+height>H-margin){pdf.addPage();y=margin;drawRow(headers,true);}
      let x=margin;
      for(let i=0;i<widths.length;i++){
        pdf.setDrawColor(150,155,160);pdf.setLineWidth(.4);
        pdf.rect(x,y,widths[i],height);
        pdf.setFontSize(heading?7:7.5);pdf.setFont(fontName,'bold');
        const content=String(values[i]??'');
        const formatted=typeof values[i]==='number'?Number.isFinite(values[i])?Number(values[i].toPrecision(6)).toString():'—':content;
        const wrapped=pdf.splitTextToSize(formatted,widths[i]-8).slice(0,heading?3:2);
        pdf.text(wrapped,x+4,y+11,{baseline:'alphabetic'});
        x+=widths[i];
      }
      y+=height;
    };
    drawRow(headers,true);
    for(const row of rows.slice(1))drawRow(row,false);
    pdf.setFontSize(8);pdf.setFont(fontName,'bold');
    if(y+18<H-margin)pdf.text('Resultados calculados por DWSIM. No son mediciones experimentales.',margin,y+18);
  }

  function svgText(svg,fontData){
    const style=element('style');
    style.textContent=`@font-face{font-family:"DWSIM Asap";src:url(data:font/ttf;base64,${fontData}) format("truetype");font-weight:600}`;
    svg.prepend(style);
    return new XMLSerializer().serializeToString(svg);
  }

  function pngSize(width,height,scale){
    const w=Math.ceil(width*scale),h=Math.ceil(height*scale);
    if(w>16384||h>16384||w*h>32_000_000)
      throw new Error('El PNG supera el tamaño admitido. Reducí la escala o elegí SVG/PDF.');
    return [w,h];
  }

  async function png(svg,fontData,scale){
    const [width,height]=pngSize(Number(svg.getAttribute('width')),Number(svg.getAttribute('height')),scale);
    const image=new Image();
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText(svg,fontData));
    await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    const context=canvas.getContext('2d');
    if(!context)throw new Error('El navegador no pudo reservar el lienzo del PNG.');
    context.drawImage(image,0,0,width,height);
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>{
      if(blob)resolve(blob);else reject(new Error('El navegador no pudo generar el PNG.'));
    },'image/png'));
  }

  function pdfLayout(width,height,pageWidth,pageHeight,margin,fit){
    const scale=Math.min((pageWidth-2*margin)/width,(pageHeight-2*margin)/height,fit==='reduce'?72/96:Infinity);
    return {x:(pageWidth-width*scale)/2,y:(pageHeight-height*scale)/2,width:width*scale,height:height*scale};
  }

  async function pdf(svg,fontData,title,options){
    const {paper,orientation,margin,fit}=options;
    await loadPdf();
    const pdf=new window.jspdf.jsPDF({orientation,unit:'pt',format:paper==='oficio'?[612.28,935.43]:paper,compress:true,putOnlyUsedFonts:true});
    const fontName='DWSIM Asap';
    pdf.addFileToVFS('Asap-SemiBold.ttf',fontData);
    pdf.addFont('Asap-SemiBold.ttf',fontName,'bold');
    pdf.setProperties({title,creator:'ΣIM'});
    // svg2pdf busca el peso por su nombre registrado en jsPDF.
    for(const text of svg.querySelectorAll('text'))text.setAttribute('font-weight','bold');
    const page=pdf.internal.pageSize;
    await pdf.svg(svg,{x:0,y:0,width:page.getWidth(),height:page.getHeight()});
    if(Array.isArray(options.tables)){
      for(const table of options.tables)if(table?.rows?.length>1)addBalancesPage(pdf,table.rows,{title:(table.name||'Resultados')+' · '+title,report:options.report,identity:options.identity});
    }else if(Array.isArray(options.balances)&&options.balances.length>1)addBalancesPage(pdf,options.balances,{title,report:options.report,identity:options.identity});
    return pdf.output('blob');
  }

  async function file(markup,title,options){
    const fontData=await loadFont();
    await document.fonts.load('600 12px "DWSIM Asap"');
    const source=snapshot(markup,title,options.format==='pdf'?'white':options.background,options.format==='pdf');
    const svg=options.format==='pdf'?SimSheetLayout.sheet(source,title,options):SimSheetLayout.compact(source,title,options);
    if(options.format==='png')return png(svg,fontData,options.scale);
    if(options.format==='pdf')return pdf(svg,fontData,title,options);
    return new Blob([svgText(svg,fontData)],{type:'image/svg+xml'});
  }
  function preview(markup,title,options){
    const source=snapshot(markup,title,'white',true);
    const diagram=options.format==='pdf'?SimSheetLayout.sheet(source,title,options):SimSheetLayout.compact(source,title,options);
    return new XMLSerializer().serializeToString(diagram);
  }
  return {file,preview,pngSize,pdfLayout};
})();
