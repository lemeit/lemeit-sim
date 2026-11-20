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
 // Tablas más compactas: medición real del texto para evitar invadir columnas.
 const tableMetric={heading:12,row:10.5,caption:12,gap:4};
 const compactNumber=value=>{
   if(typeof value!=='number')return clean(value);
   if(!Number.isFinite(value))return '—';
   if(value!==0&&Math.abs(value)<1e-9)return '≈ 0';
   return Number(value.toPrecision(4)).toLocaleString('es-AR',{maximumSignificantDigits:4});
 };
 const headerName=value=>clean(value)
   .replace(/\s*\[(.*?)\]/g,' ($1)')
   .replace('Residuo o consumo neto','Residuo / consumo')
   .replace('Tipo de transferencia','Transferencia')
   .replace('Caudal molar','Molar')
   .replace('Caudal','Flujo')
   .replace('Entalpía','H')
   .replace('Entropía','S')
   .replace('Temperatura','Temp.')
   .replace('Densidad','Dens.')
   .replace('Interpretación','Balance')
   .replace('Energía hacia fluido','Energía')
   .replace('Presión','Pres.');
 const shortValue=(value,heading)=>{
   const text=compactNumber(value);
   if(heading)return headerName(text);
   if(text.startsWith('Consumo (+), generación'))return 'Consumo (+) / gen. (−)';
   return text;
 };
 const measuring=document.createElement('canvas').getContext('2d');
 function cellText(root,x,y,value,width,font,heading){
   const t=attr(el('text'),{x,y,fill:'#20252a','font-family':'Arial, sans-serif','font-size':font,'font-weight':heading?'bold':'normal'});
   const full=shortValue(value,heading);
   let fitted=full;
   const available=Math.max(4,width-6);
   if(measuring){
     measuring.font=(heading?'bold ':'')+font+'px Arial';
     if(measuring.measureText(fitted).width>available){
       let low=0,high=[...full].length;
       const chars=[...full];
       while(low<high){
         const mid=Math.ceil((low+high)/2),candidate=chars.slice(0,mid).join('')+'…';
         if(measuring.measureText(candidate).width<=available)low=mid;
         else high=mid-1;
       }
       fitted=low?chars.slice(0,low).join('')+'…':'…';
     }
   }
   t.textContent=fitted;root.append(t);
 }
 function tableHeight(table){return tableMetric.caption+tableMetric.heading+tableMetric.row*(table.rows.length-1)+tableMetric.gap;}
 function drawTable(root,table,x,y,width){
   const rows=table.rows,n=rows[0].length;
   const first=Math.min(width*.28,Math.max(50,width*(n>=7?.17:n>=5?.21:.28)));
   const other=(width-first)/Math.max(1,n-1);
   const widths=Array.from({length:n},(_,i)=>i===0?first:other);
   text(root,x+2,y+8,table.name.toUpperCase(),7.8,true,50);
   y+=tableMetric.caption;
   const drawRow=(values,height,heading)=>{
     let cursor=x;
     for(let i=0;i<n;i++){
       root.append(attr(el('rect'),{x:cursor,y,width:widths[i],height,fill:heading?'#edf0f2':'#fff',stroke:'#b3bbc1','stroke-width':.4}));
       const font=heading?5.6:6.1;
       cellText(root,cursor+3,y+height*.71,values[i],widths[i],font,heading);
       cursor+=widths[i];
     }
     y+=height;
   };
   drawRow(rows[0],tableMetric.heading,true);
   for(const row of rows.slice(1))drawRow(row,tableMetric.row,false);
   return y+tableMetric.gap;
 }

 const activitySections=options=>{
   if(!options.includeActivity)return [];
   const exercise=options.exercise||{};
   return [['ENUNCIADO',exercise.statement],['CONSIGNAS',exercise.instructions],['OBSERVACIONES',exercise.observations]]
     .filter(([,value])=>typeof value==='string'&&value.trim());
 };
 function wrapActivity(value,maxWidth,fontSize=8){
   const ctx=measuring;if(ctx)ctx.font=fontSize+'px Arial';
   const lines=[];
   for(const paragraph of String(value).replace(/\r\n?/g,'\n').split('\n')){
     if(!paragraph.trim()){lines.push('');continue;}
     let line='';
     for(const word of paragraph.split(/(\s+)/).filter(Boolean)){
       if(!ctx||ctx.measureText(line+word).width<=maxWidth){line+=word;continue;}
       if(line.trim()){lines.push(line.trimEnd());line='';}
       for(const char of [...word]){
         if(ctx&&ctx.measureText(line+char).width>maxWidth&&line){lines.push(line);line='';}
         line+=char;
       }
     }
     lines.push(line.trimEnd());
   }
   return lines;
 }
 function activityLayout(options,width){
   return activitySections(options).map(([label,value])=>{
     const lines=wrapActivity(value,width-12);
     return {label,lines,height:15+Math.max(1,lines.length)*11+5};
   });
 }
 function drawActivity(root,sections,x,y){
   for(const section of sections){
     text(root,x+3,y+8,section.label,8,true,40);y+=15;
     for(const line of section.lines){
       const item=attr(el('text'),{x:x+5,y:y+8,fill:'#20252a','font-family':'Arial, sans-serif','font-size':8});
       item.textContent=line;root.append(item);y+=11;
     }
     y+=5;
   }
   return y;
 }
 function activityAnnexes(title,options){
   if(!options.includeActivity)return [];
   const orientation=options.resolvedOrientation||options.orientation||'portrait';
   const {width,height}=size({...options,orientation}),margin=Math.max(8,Number(options.margin)||15)*72/25.4;
   const left=margin+10,regionW=width-2*margin-20,top=margin+18,end=height-margin-22;
   const sections=activityLayout(options,regionW);
   if(!sections.length)return [];
   const pages=[];
   let paper,y;
   const fresh=()=>{
     paper=attr(el('svg'),{viewBox:'0 0 '+width+' '+height,width,height});
     rectangle(paper,0,0,width,height);rectangle(paper,margin,margin,width-2*margin,height-2*margin,'none');
     text(paper,left,margin+14,'ΣIM · ACTIVIDAD DEL PROYECTO',11,true,64);
     text(paper,left,margin+28,title,8,false,90);
     y=top+29;pages.push(paper);
   };
   fresh();
   for(const section of sections){
     if(y+30>end)fresh();
     text(paper,left+3,y+8,section.label,8,true,40);y+=15;
     for(const line of section.lines){
       if(y+12>end){fresh();text(paper,left+3,y+8,section.label+' (continuación)',8,true,46);y+=15;}
       const item=attr(el('text'),{x:left+5,y:y+8,fill:'#20252a','font-family':'Arial, sans-serif','font-size':8});
       item.textContent=line;paper.append(item);y+=11;
     }
     y+=5;
   }
   return pages;
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
   const activities=activityLayout(options,regionW);
   const activityH=activities.reduce((total,section)=>total+section.height,0);
   const activityInline=activityH>0&&(totalTableH+gap+activityH+10<=regionH*.54);
   const reservedActivityH=activityInline?activityH+10:0;
   paper.dataset.activityAnnex=String(activityH>0&&!activityInline);
   // Una sola hoja: si las tablas requieren demasiado espacio, rechazar en lugar de
   // agregar páginas u ocultar resultados numéricos.
   const minDiagramH=regionH*.46;
   if(totalTableH>regionH-minDiagramH-gap)throw new Error('Las tablas seleccionadas dejan demasiado poco espacio al diagrama. Desmarcá alguna tabla o elegí A3/Oficio.');
   const diagramH=regionH-totalTableH-gap-reservedActivityH;
   const view=source.viewBox.baseVal;
   const scale=Math.min(regionW/view.width,diagramH/view.height);
   if(!(scale>0))throw new Error('El diagrama no tiene dimensiones válidas para imprimir.');
   const dx=margin+10+(regionW-view.width*scale)/2,dy=top+(diagramH-view.height*scale)/2;
   const group=attr(el('g'),{transform:'translate('+dx+' '+dy+') scale('+scale+') translate('+(-view.x)+' '+(-view.y)+')'});
   for(const child of [...source.childNodes])if(child.nodeName.toLowerCase()!=='title')group.append(child.cloneNode(true));
   paper.append(group);
   let tableY=top+diagramH+gap;
   if(activityInline)tableY=drawActivity(paper,activities,margin+10,tableY)+10;
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

 return {compact,sheet,size,effectiveOrientation,activityAnnexes,activityLayout,wrapActivity};
})();
