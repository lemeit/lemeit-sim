/* Layout imprimible de ΣIM: rótulo compacto y lámina a escala de papel. */
'use strict';
const SimSheetLayout=(()=>{
 const ns='http://www.w3.org/2000/svg';
 const el=tag=>document.createElementNS(ns,tag);
 const clean=v=>String(v??'').replace(/[\r\n\t]+/g,' ').trim();
 const attr=(node,values)=>{for(const [k,v] of Object.entries(values))node.setAttribute(k,String(v));return node;};
 const rectangle=(root,x,y,width,height,fill='#fff')=>root.append(attr(el('rect'),{x,y,width,height,fill,stroke:'#707980','stroke-width':.7}));
 const text=(root,x,y,str,size=8,bold=false,max=36)=>{const t=attr(el('text'),{x,y,fill:'#20252a','font-family':'Arial, sans-serif','font-size':size,'font-weight':bold?'bold':'normal'});const v=clean(str);t.textContent=v.length>max?v.slice(0,max-1)+'…':v;root.append(t);};
 const field=(root,x,y,label,value,max=28)=>{text(root,x,y,label,6.5,true,40);text(root,x,y+11,value,8,false,max);};
 function size(options){
   const sizes={a4:[595.276,841.89],a3:[841.89,1190.55],oficio:[612.28,935.43]};
   let [width,height]=sizes[options.paper]||sizes.a4;
   if(options.orientation==='landscape')[width,height]=[height,width];
   return {width,height};
 }
 function identityFields(title,options){
   const r=options.report||{},i=options.identity||{};
   return {project:title,student:r.student||i.student_name||'',studentId:r.studentId||'',klass:r.className||i.class_name||'',subject:r.subject||'',group:r.group||'',institution:r.institution||'',teacher:r.teacher||'',sheet:r.sheet||'',revision:r.revision||'',model:options.model||''};
 }
 function compact(svg,title,options){
   if(!options.titleBlock)return svg;
   const view=svg.viewBox.baseVal,{x,y}=view,w=view.width,h=view.height;
   const W=Math.max(w,540),right=x+W,top=y+h+12,bw=350,bh=124,bx=right-bw;
   svg.setAttribute('viewBox',[x,y,W,h+bh+20].join(' '));
   svg.setAttribute('width',W);svg.setAttribute('height',h+bh+20);
   const group=el('g'),d=identityFields(title,options);
   rectangle(group,bx,top,bw,bh);rectangle(group,bx,top,bw,14,'#f3f5f7');
   text(group,bx+7,top+10,'ΣIM · DIAGRAMA DE PROCESO',8,true);
   field(group,bx+7,top+22,'PROYECTO',d.project,28);
   field(group,bx+185,top+22,'ALUMNO / AUTOR',d.student,24);
   field(group,bx+7,top+45,'CLASE / MATERIA',d.klass+' · '+d.subject,28);
   field(group,bx+185,top+45,'GRUPO / ID',d.group+' · '+d.studentId,24);
   field(group,bx+7,top+66,'INSTITUCIÓN',d.institution,25);
   field(group,bx+185,top+66,'LÁMINA / REV.',d.sheet+' · '+d.revision,24);
   field(group,bx+7,top+84,'ENUNCIADO',options.exercise?.statement||'',50);
   field(group,bx+7,top+103,'MODELO TERMODINÁMICO',d.model,49);
   svg.append(group);return svg;
 }
 function effectiveOrientation(source,options){
   if(options.orientation!=='auto')return options.orientation;
   const box=source.viewBox.baseVal;
   return box.width/Math.max(1,box.height)>1.3?'landscape':'portrait';
 }
 const compactNumber=value=>{
   if(typeof value==='number')return Number.isFinite(value)?Number(value.toPrecision(4)).toLocaleString('es-AR',{maximumSignificantDigits:4}):'—';
   return clean(value);
 };
 function tableHeight(table){return 15+19+15*(table.rows.length-1)+9;}
 function drawTable(root,table,x,y,width){
   const rows=table.rows,n=rows[0].length,first=Math.max(60,width*(n>4?.2:.3)),other=(width-first)/Math.max(1,n-1);
   const widths=Array.from({length:n},(_,i)=>i===0?first:other);
   text(root,x+4,y+10,table.name.toUpperCase(),9,true,50);
   y+=15;
   const headers=rows[0].map(v=>clean(v).replace(/\s*\[(.*?)\]/g,' ($1)').replace('Residuo o consumo neto','Residuo / consumo').replace('Tipo de transferencia','Transferencia').replace('Entalpía','H').replace('Entropía','S').replace('Temperatura','Temp.').replace('Densidad','Dens.'));
   const drawRow=(values,rowHeight,heading)=>{
     let cursor=x;
     for(let i=0;i<n;i++){
       const box=attr(el('rect'),{x:cursor,y,width:widths[i],height:rowHeight,fill:heading?'#edf0f2':'#fff',stroke:'#b3bbc1','stroke-width':.45});
       root.append(box);
       const font=heading?6.4:7.3,maxChars=Math.max(4,Math.floor((widths[i]-7)/(font*.51)));
       text(root,cursor+3,y+rowHeight*.68,compactNumber(values[i]),font,heading,maxChars);
       cursor+=widths[i];
     }
     y+=rowHeight;
   };
   drawRow(headers,19,true);
   for(const row of rows.slice(1))drawRow(row,15,false);
   return y+9;
 }
 function sheet(source,title,options){
   const orientation=effectiveOrientation(source,options);
   const {width,height}=size({...options,orientation}),margin=Math.max(8,Number(options.margin)||15)*72/25.4;
   const paper=attr(el('svg'),{viewBox:[0,0,width,height].join(' '),width,height});
   rectangle(paper,0,0,width,height);
   rectangle(paper,margin,margin,width-2*margin,height-2*margin,'none');
   const blockH=options.titleBlock?89:0;
   const tables=(options.tables||[]).filter(table=>Array.isArray(table?.rows)&&table.rows.length>1);
   const totalTableH=tables.reduce((sum,table)=>sum+tableHeight(table),0);
   const top=margin+10,bottom=height-margin-12-blockH;
   const regionH=bottom-top,regionW=width-2*margin-20;
   const gap=tables.length?12:0;
   // Una sola hoja: si las tablas requieren demasiado espacio, rechazar en lugar de
   // agregar páginas u ocultar resultados numéricos.
   if(totalTableH>regionH-105-gap)throw new Error('Las tablas seleccionadas no entran de forma legible en una sola hoja. Desmarcá alguna tabla o elegí A3/Oficio.');
   const diagramH=regionH-totalTableH-gap;
   const view=source.viewBox.baseVal;
   const scale=Math.min(regionW/view.width,diagramH/view.height);
   if(!(scale>0))throw new Error('El diagrama no tiene dimensiones válidas para imprimir.');
   const dx=margin+10+(regionW-view.width*scale)/2,dy=top+(diagramH-view.height*scale)/2;
   const group=attr(el('g'),{transform:'translate('+dx+' '+dy+') scale('+scale+') translate('+(-view.x)+' '+(-view.y)+')'});
   for(const child of [...source.childNodes])if(child.nodeName.toLowerCase()!=='title')group.append(child.cloneNode(true));
   paper.append(group);
   let tableY=top+diagramH+gap;
   for(const table of tables)tableY=drawTable(paper,table,margin+10,tableY,regionW);
   if(options.titleBlock){
     const d=identityFields(title,options);
     const bw=Math.min(320,width-2*margin),bx=width-margin-bw,by=height-margin-82;
     rectangle(paper,bx,by,bw,82);rectangle(paper,bx,by,bw,14,'#f3f5f7');
     text(paper,bx+8,by+10,'ΣIM · LÁMINA DE PROCESO',8,true);
     field(paper,bx+8,by+22,'PROYECTO',d.project,27);
     field(paper,bx+bw*.53,by+22,'AUTOR / ID',d.student+' · '+d.studentId,24);
     field(paper,bx+8,by+45,'CLASE / MATERIA',d.klass+' · '+d.subject,27);
     field(paper,bx+bw*.53,by+45,'LÁMINA / REVISIÓN',d.sheet+' · '+d.revision,24);
     field(paper,bx+8,by+66,'MODELO TERMODINÁMICO',d.model,49);
   }
   return paper;
 }

 return {compact,sheet,size,effectiveOrientation};
})();
