/* ΣIM · Modelo DIDÁCTICO de tanque abierto a densidad constante.
 * NO llama a DWSIM: balances integrales de materia con Euler explícito y eventos.
 * Mantener independiente de cálculos estacionarios y del gateway DWSIM. */
'use strict';
globalThis.SimTankDynamics=(()=>{
 const GRAVITY=9.80665,MAX_STEPS=2400;
 const number=(value,label,{min=-Infinity,max=Infinity,strict=false}={})=>{
   const n=Number(value);
   if(value===''||value===null||value===undefined||!Number.isFinite(n)||(strict?n<=min:n<min)||n>max)
     throw new RangeError(label+': valor inválido o fuera de rango.');
   return n;
 };
 function validate(options){
   if(!options||typeof options!=='object')throw new TypeError('Configuración del tanque no válida.');
   const capacity=number(options.capacityM3,'Volumen útil',{min:0,strict:true,max:1e7});
   const area=number(options.areaM2,'Área de sección',{min:0,strict:true,max:1e7});
   const density=number(options.densityKgM3,'Densidad',{min:0,strict:true,max:1e6});
   const initialVolume=number(options.initialVolumeM3,'Volumen inicial',{min:0,max:capacity});
   const inflowMass=number(options.inflowKgS,'Entrada másica',{min:0,max:1e8});
   const outflowMass=number(options.outflowKgS??0,'Salida másica',{min:0,max:1e8});
   const duration=number(options.durationS,'Duración',{min:0,strict:true,max:8640000});
   const step=number(options.stepS,'Paso temporal',{min:0,strict:true,max:duration});
   const mode=options.outletMode??'constant';
   if(!['constant','gravity'].includes(mode))throw new RangeError('Modo de salida no disponible.');
   const coefficient=number(options.dischargeCoefficient??0.62,'Coeficiente de descarga',{min:0,max:1});
   const outletArea=number(options.outletAreaM2??0.0005,'Área de orificio',{min:0,max:100});
   const steps=Math.ceil(duration/step);
   if(steps>MAX_STEPS)throw new RangeError('Reducí la duración o aumentá el paso: máximo '+MAX_STEPS+' intervalos.');
   return {capacity,area,density,initialVolume,inflowMass,outflowMass,duration,step,mode,coefficient,outletArea};
 }
 function simulate(options){
   const p=validate(options),points=[];
   const qin=p.inflowMass/p.density;
   let time=0,volume=p.initialVolume,integratedNetMass=0,event=null;
   const sample=()=>({
     time_s:time,
     volume_m3:volume,
     level_m:volume/p.area,
     mass_kg:volume*p.density,
     fill_pct:100*volume/p.capacity,
     inlet_m3_s:qin,
     outlet_m3_s:p.mode==='gravity'?p.coefficient*p.outletArea*Math.sqrt(2*GRAVITY*volume/p.area):p.outflowMass/p.density
   });
   points.push(sample());
   for(let i=0;i<Math.ceil(p.duration/p.step);i++){
     const now=points[points.length-1];
     const dt=Math.min(p.step,p.duration-time);
     if(dt<=0)break;
     const netFlow=now.inlet_m3_s-now.outlet_m3_s;
     let elapsed=dt,proposed=volume+netFlow*dt;
     if(proposed>=p.capacity&&netFlow>0){
       elapsed=Math.max(0,(p.capacity-volume)/netFlow);
       proposed=p.capacity;
       event='lleno';
     }else if(proposed<=0&&netFlow<0){
       elapsed=Math.max(0,-volume/netFlow);
       proposed=0;
       event='vacío';
     }
     volume=Math.min(p.capacity,Math.max(0,proposed));
     time+=elapsed;integratedNetMass+=netFlow*p.density*elapsed;
     points.push(sample());
     if(event)break;
   }
   const massResidualKg=(volume-p.initialVolume)*p.density-integratedNetMass;
   return {source:'sim-simplified-tank',model:'Modelo didáctico ΣIM · densidad constante · Euler explícito',assumptions:'Tanque abierto, líquido incompresible, sección constante, sin balance energético ni control de presión.',
     config:p,points,event,simulatedDurationS:time,massResidualKg,completed:!event&&Math.abs(time-p.duration)<=1e-7};
 }
 function csv(result){
   if(result?.source!=='sim-simplified-tank'||!Array.isArray(result.points))throw new TypeError('Serie no válida.');
   const n=v=>Number.isFinite(v)?Number(v.toPrecision(11)).toString().replace('.',','):'';
   const rows=['Modelo;Didáctico ΣIM (no DWSIM)','Método;Euler explícito de balance de masa','Tiempo [s];Volumen [m3];Nivel [m];Masa [kg];Llenado [%];Entrada [m3/s];Salida [m3/s]'];
   for(const p of result.points)rows.push([p.time_s,p.volume_m3,p.level_m,p.mass_kg,p.fill_pct,p.inlet_m3_s,p.outlet_m3_s].map(n).join(';'));
   return '\uFEFF'+rows.join('\r\n')+'\r\n';
 }
 return Object.freeze({validate,simulate,csv});
})();
