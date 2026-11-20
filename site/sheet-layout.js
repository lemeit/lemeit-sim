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
   return {project:title,student:r.student||i.student_name||'',studentId:r.studentId||'',klass:r.className||i.class_name||'',subject:r.subject||'',group:r.group||'',institution:r.institution||'',teacher:r.teacher||'',sheet:r.sheet||'',revision:r.revision||''};
 }
 function compact(svg,title,options){
   if(!options.titleBlock)return svg;
   const view=svg.viewBox.baseVal,{x,y}=view,w=view.width,h=view.height;
   const W=Math.max(w,540),right=x+W,top=y+h+12,bw=350,bh=95,bx=right-bw;
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
   svg.append(group);return svg;
 }
 function sheet(source,title,options){
   const {width,height}=size(options),margin=Math.max(8,Number(options.margin)||15)*72/25.4;
   const paper=attr(el('svg'),{viewBox:[0,0,width,height].join(' '),width,height});
   rectangle(paper,0,0,width,height); // blanco para imprimir / previsualizar
   rectangle(paper,margin,margin,width-2*margin,height-2*margin,'none');
   const contentTop=margin+10,blockH=options.titleBlock?72:0;
   const contentH=height-2*margin-25-blockH,contentW=width-2*margin-20;
   const view=source.viewBox.baseVal,scale=Math.min(contentW/view.width,contentH/view.height);
   const dx=margin+10+(contentW-view.width*scale)/2,dy=contentTop+(contentH-view.height*scale)/2;
   const group=attr(el('g'),{transform:'translate('+dx+' '+dy+') scale('+scale+') translate('+(-view.x)+' '+(-view.y)+')'});
   for(const child of [...source.childNodes])if(child.nodeName.toLowerCase()!=='title')group.append(child.cloneNode(true));
   paper.append(group);
   if(options.titleBlock){
     const d=identityFields(title,options);
     const bw=Math.min(320,width-2*margin),bx=width-margin-bw,by=height-margin-65;
     rectangle(paper,bx,by,bw,65);rectangle(paper,bx,by,bw,14,'#f3f5f7');
     text(paper,bx+8,by+10,'ΣIM · LÁMINA DE PROCESO',8,true);
     field(paper,bx+8,by+22,'PROYECTO',d.project,27);
     field(paper,bx+bw*.53,by+22,'AUTOR / ID',d.student+' · '+d.studentId,24);
     field(paper,bx+8,by+45,'CLASE / MATERIA',d.klass+' · '+d.subject,27);
     field(paper,bx+bw*.53,by+45,'LÁMINA / REVISIÓN',d.sheet+' · '+d.revision,24);
   }
   return paper;
 }
 return {compact,sheet,size};
})();
