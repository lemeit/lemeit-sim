/* ΣIM — renderer científico independiente de la fuente de datos. */
'use strict';
globalThis.SimScientificCharts=(()=>{
 const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const fmt=v=>Number(v.toPrecision(5)).toLocaleString('es-AR',{maximumSignificantDigits:5});
 const palette=['#175b92','#a33b35','#287a61','#b86b19','#76559b','#278399','#87385b','#39434d'];
 const safeColor=(c,i=0)=>/^#[0-9a-f]{6}$/i.test(c||'')?c:palette[i%palette.length];
 function bounds(values,zero,log){
   const a=values.filter(v=>Number.isFinite(v)&&(!log||v>0)).map(v=>log?Math.log10(v):v);
   if(!a.length)throw Error('No hay datos válidos para esta escala.');
   let lo=a.reduce((m,v)=>Math.min(m,v),Infinity),hi=a.reduce((m,v)=>Math.max(m,v),-Infinity);
   if(zero&&!log){lo=Math.min(lo,0);hi=Math.max(hi,0);}
   if(lo===hi){const d=Math.abs(lo)*.1||1;lo-=d;hi+=d;}
   return [lo,hi];
 }
 function render(svg,{points,xKey='time_s',xLabel='Tiempo [s]',yLabel='',y2Label='',logY2=false,zeroY2=true,series,index=0,grid=true,markers=false,logY=false,zeroY=true,title='',source='',subtitle='',reference='',generated='',logX=false,connect=true,strokeWidth=1.8,legend=true,categories=null,extra=[],tall=false}){
   if(!Array.isArray(points)||!series?.length)throw Error('Series no disponibles.');
   const [xmin,xmax]=bounds([...points.map(p=>p[xKey]),...extra.flatMap(s=>s.points.map(p=>p.x))],false,logX);
   const dual=series.some(s=>s.axis==='right');
   const [ymin,ymax]=bounds([...series.filter(s=>s.axis!=='right').flatMap(s=>points.map(p=>p[s.key])),...extra.flatMap(s=>s.points.map(p=>p.y))],zeroY,logY);
   const [rmin,rmax]=dual?bounds(series.filter(s=>s.axis==='right').flatMap(s=>points.map(p=>p[s.key])),zeroY2,logY2):[0,1];
   const W=785,H=tall?590:340,L=91,R=dual?694:753,T=subtitle?60:48,B=H-(reference||generated?102:90);
   const rightColor=safeColor(series.find(s=>s.axis==='right')?.color,1);
   const x=v=>L+((logX?Math.log10(v):v)-xmin)/(xmax-xmin)*(R-L);
   const y=v=>B-((logY?Math.log10(v):v)-ymin)/(ymax-ymin)*(B-T);
   const ry=v=>B-((logY2?Math.log10(v):v)-rmin)/(rmax-rmin)*(B-T);
   const sy=(v,s)=>s.axis==='right'?ry(v):y(v);
   const valid=(p,s)=>Number.isFinite(p[xKey])&&(!logX||p[xKey]>0)&&Number.isFinite(p[s.key])&&(!(s.axis==='right'?logY2:logY)||p[s.key]>0);
   const line=(a,b,c,d,extra='')=>'<line x1="'+a+'" y1="'+b+'" x2="'+c+'" y2="'+d+'" '+extra+'/>';
   const label=(a,b,t,extra='')=>'<text x="'+a+'" y="'+b+'" '+extra+'>'+esc(t)+'</text>';
   let out='<rect width="785" height="'+H+'" fill="#fff"/><g fill="#20252a" stroke="none" font-family="Arial, sans-serif" font-size="12">';
   out+=label((L+R)/2,22,title,'text-anchor="middle" font-size="15" font-weight="600"');
   if(subtitle)out+=label((L+R)/2,40,String(subtitle).slice(0,115),'text-anchor="middle" font-size="10" fill="#59636d"');
   for(let i=0;i<=5;i++){
     const xx=L+(R-L)*i/5,yy=B-(B-T)*i/5;
     if(grid)out+=line(xx,T,xx,B,'stroke="#dce1e5" stroke-width=".7"')+line(L,yy,R,yy,'stroke="#dce1e5" stroke-width=".7"');
     out+=line(xx,B,xx,B+5,'stroke="#222"')+line(L-5,yy,L,yy,'stroke="#222"');
     if(!categories||logX)out+=label(xx,B+19,fmt(logX?10**(xmin+(xmax-xmin)*i/5):xmin+(xmax-xmin)*i/5),'text-anchor="middle"');
     const v=ymin+(ymax-ymin)*i/5;out+=label(L-9,yy+4,fmt(logY?10**v:v),'text-anchor="end"');
     if(dual){const rv=rmin+(rmax-rmin)*i/5;out+=line(R,yy,R+5,yy,'stroke="'+rightColor+'"')+label(R+9,yy+4,fmt(logY2?10**rv:rv),'fill="'+rightColor+'"');}
   }
   if(categories&&!logX){const step=Math.max(1,Math.ceil(categories.length/7));categories.forEach((name,i)=>{if(i%step===0)out+=label(x(i+1),B+15,String(name).slice(0,20),'text-anchor="middle" font-size="9"');});}
   out+='<rect x="'+L+'" y="'+T+'" width="'+(R-L)+'" height="'+(B-T)+'" fill="none" stroke="#222" stroke-width="1.1"/>';
   out+=label((L+R)/2,B+40,xLabel+(logX?' · log':''),'text-anchor="middle" font-size="13"');
   out+='<text transform="translate(19 '+((T+B)/2)+') rotate(-90)" text-anchor="middle" font-size="13">'+esc(yLabel+(logY?' · log':''))+'</text>';
   if(dual)out+='<text data-axis="right" transform="translate(774 '+((T+B)/2)+') rotate(90)" text-anchor="middle" font-size="13" fill="'+rightColor+'">'+esc(y2Label+(logY2?' · log':''))+'</text>';
   const selected=points[Math.max(0,Math.min(points.length-1,index))];
   if(Number.isFinite(selected?.[xKey])&&(!logX||selected[xKey]>0))out+=line(x(selected[xKey]),T,x(selected[xKey]),B,'stroke="#7b858e" stroke-dasharray="3 4"');
   series.forEach((s,i)=>{
     const color=safeColor(s.color,i),drawLine=s.connect??connect,drawMarkers=s.markers??markers,width=s.strokeWidth??strokeWidth;let d='',started=false;
     for(const p of points){if(!valid(p,s)){started=false;continue;}d+=(started?'L':'M')+x(p[xKey]).toFixed(2)+' '+sy(p[s.key],s).toFixed(2)+' ';started=true;}
     if(drawLine)out+='<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+Math.max(.5,Math.min(5,Number(width)||1.8))+'" stroke-linejoin="round"/>';
     if(drawMarkers||!drawLine||points.filter(p=>valid(p,s)).length===1)for(const p of points)if(valid(p,s))out+='<circle cx="'+x(p[xKey])+'" cy="'+sy(p[s.key],s)+'" r="2" fill="white" stroke="'+color+'"/>';
     if(selected&&valid(selected,s))out+='<circle cx="'+x(selected[xKey])+'" cy="'+sy(selected[s.key],s)+'" r="4" fill="'+color+'" stroke="white"/>';
     const lx=L+(i%3)*220,ly=B+54+Math.floor(i/3)*15;
     if(legend){out+='<g data-legend-style="'+(!drawLine?'points':drawMarkers?'both':'line')+'">';if(drawLine)out+=line(lx,ly-4,lx+24,ly-4,'stroke="'+color+'" stroke-width="2"');if(drawMarkers||!drawLine)out+='<circle cx="'+(lx+12)+'" cy="'+(ly-4)+'" r="3" fill="white" stroke="'+color+'"/>';out+=label(lx+30,ly,s.name+(s.axis==='right'?' · Y2':''))+'</g>'; }
   });
   for(const s of extra){for(const p of s.points)if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!logX||p.x>0)&&(!logY||p.y>0))out+='<circle cx="'+x(p.x)+'" cy="'+y(p.y)+'" r="4" fill="white" stroke="#a33b35" stroke-width="2"/>';if(legend)out+=label(L,B+70,s.name,'fill="#a33b35" font-size="10"');}
   if(reference)out+=label(12,H-21,String(reference).slice(0,130),'font-size="9" fill="#59636d"');
   if(generated)out+=label(12,H-6,generated,'font-size="9" fill="#59636d"');
   out+=label(773,H-6,source,'text-anchor="end" font-size="10" fill="#59636d"')+'</g>';
   svg.setAttribute('data-chart-height',String(H));svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.innerHTML=out;
 }
 async function download(svg,name='sim-grafica.svg',format='svg'){
   const height=svg.getAttribute('data-chart-height')==='590'?590:340;
   const clone=svg.cloneNode(true);clone.setAttribute('viewBox','0 0 785 '+height);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','785');clone.setAttribute('height',String(height));
   const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'});
   const save=(data,filename)=>{const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);};
   if(format==='svg'){save(blob,name);return;}
   if(!['png','jpg'].includes(format))throw Error('Formato de imagen no admitido.');
   const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await blob.text());
   {const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('No se pudo convertir la gráfica en imagen.'));image.src=url;});const canvas=document.createElement('canvas');canvas.width=1570;canvas.height=height*2;const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo crear la imagen.');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const raster=await new Promise(resolve=>canvas.toBlob(resolve,format==='jpg'?'image/jpeg':'image/png',.94));if(!raster)throw Error('No se pudo exportar la imagen.');save(raster,name.replace(/\.[^.]+$/,'')+'.'+format);}
 }
 return Object.freeze({render,download});
})();
