/* Datos del informe en el editor integrado; no alteran el cálculo físico. */
'use strict';
const SimProjectReport=(()=>{
 const FIELDS=['student','studentId','className','subject','group','institution','teacher','sheet','revision'];
 const $=id=>document.getElementById(id);
 let getGraph,getIdentity;
 function valid(report){
   if(report===undefined)return;
   if(!report||typeof report!=='object'||Array.isArray(report))throw Error('Datos del rótulo inválidos.');
   for(const field of FIELDS)if(report[field]!==undefined&&(typeof report[field]!=='string'||report[field].length>100))throw Error('Campo del rótulo inválido: '+field);
 }
 function sync(){
   const graph=getGraph(),report=graph.report||{},who=getIdentity?.()||{};
   for(const field of FIELDS){
     const value=report[field]??(field==='student'?who.student_name||'':field==='className'?who.class_name||'':'');
     $('report-'+field).value=value;
   }
   $('report-project-name').textContent=graph.title||'Sin título';
   $('report-statement-preview').textContent=graph.exercise?.statement||graph.learning||'Sin enunciado';
 }
 function save(){
   const report={};
   for(const field of FIELDS)report[field]=$('report-'+field).value.trim().slice(0,100);
   getGraph().report=report;
 }
 function bind(options){
   ({getGraph,getIdentity}=options);
   // Atajo de compatibilidad: abre la misma ficha, en la pestaña Rótulo.
   $('report-open').onclick=()=>SimExerciseEditor.open('report');
 }
 return {bind,sync,save,valid};
})();
