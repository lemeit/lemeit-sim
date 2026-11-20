/* Datos editables del rótulo: metadatos del proyecto, no condiciones físicas. */
'use strict';
const SimProjectReport=(()=>{
 const FIELDS=['student','studentId','className','subject','group','institution','teacher','sheet','revision'];
 const $=id=>document.getElementById(id);
 let getGraph,changed,getIdentity;
 function valid(report){
   if(report===undefined)return;
   if(!report||typeof report!=='object'||Array.isArray(report))throw Error('Datos del rótulo inválidos.');
   for(const field of FIELDS)if(report[field]!==undefined&&(typeof report[field]!=='string'||report[field].length>100))throw Error('Campo del rótulo inválido: '+field);
 }
 function open(){
   const graph=getGraph();if(!graph?.compounds?.length)return;
   const report=graph.report||{},who=getIdentity?.()||{};
   for(const field of FIELDS){
     const el=$('report-'+field);
     el.value=report[field]??(field==='student'?(who.student_name||''):field==='className'?(who.class_name||''):'');
   }
   $('report-project-name').textContent=graph.title||'Sin título';
   $('report-statement-preview').textContent=graph.exercise?.statement||graph.learning||'Sin enunciado';
   $('report-dialog').showModal();
 }
 function bind(options){
   ({getGraph,changed,getIdentity}=options);
   $('report-open').onclick=open;
   $('report-form').onsubmit=event=>{
     event.preventDefault();
     const graph=getGraph(),report={};
     for(const field of FIELDS)report[field]=$('report-'+field).value.trim().slice(0,100);
     graph.report=report;changed();$('report-dialog').close();
   };
 }
 return {bind,open,valid};
})();
