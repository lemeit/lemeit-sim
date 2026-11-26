/* Modelos analíticos explícitos; no son corridas DWSIM. */
'use strict';
globalThis.SimChartModels=(()=>{
 const col=(key,name,unit)=>({key,name,unit});
 const definitions={
  isentropic:{name:'Gas ideal · compresión isentrópica',params:[['P0','Presión inicial [kPa]',100],['T0','Temperatura inicial [K]',300],['v0','Volumen específico inicial [m³/kg]',.861],['gamma','γ',1.4],['ratio','Relación de presión final',5]],columns:[col('specificVolume','Volumen específico','m³/kg'),col('pressure','Presión absoluta','kPa'),col('temperature','Temperatura','°C'),col('ratio','Relación de presión','1')],note:'Gas ideal, γ constante, proceso reversible adiabático. P·v^γ = constante.'},
  isothermal:{name:'Gas ideal · compresión isotérmica',params:[['P0','Presión inicial [kPa]',100],['T0','Temperatura inicial [K]',300],['v0','Volumen específico inicial [m³/kg]',.861],['ratio','Relación de presión final',5]],columns:[col('specificVolume','Volumen específico','m³/kg'),col('pressure','Presión absoluta','kPa'),col('temperature','Temperatura','°C'),col('ratio','Relación de presión','1')],note:'Gas ideal a temperatura constante. P·v = constante.'},
  polytropic:{name:'Gas ideal · proceso politrópico',params:[['P0','Presión inicial [kPa]',100],['T0','Temperatura inicial [K]',300],['v0','Volumen específico inicial [m³/kg]',.861],['gamma','Exponente n',1.3],['ratio','Relación de presión final',5]],columns:[col('specificVolume','Volumen específico','m³/kg'),col('pressure','Presión absoluta','kPa'),col('temperature','Temperatura','°C'),col('ratio','Relación de presión','1')],note:'Gas ideal, exponente constante. P·v^n = constante.'},
  kinetics:{name:'Cinética · reacción de orden 1',params:[['C0','Concentración inicial [mol/L]',1],['k','Constante [1/s]',.02],['duration','Duración [s]',200]],columns:[col('time_s','Tiempo','s'),col('concentration','Concentración','mol/L'),col('conversion','Conversión','%')],note:'Reactor discontinuo, volumen constante y cinética irreversible de primer orden.'},
  cooling:{name:'Enfriamiento de Newton',params:[['T0','Temperatura inicial [°C]',80],['Ta','Temperatura ambiente [°C]',20],['k','Constante [1/s]',.02],['duration','Duración [s]',200]],columns:[col('time_s','Tiempo','s'),col('temperature','Temperatura','°C')],note:'Capacidad térmica y coeficiente efectivos constantes; ambiente constante.'}
 };
 function generate(id,p){
  const d=definitions[id];if(!d)throw Error('Modelo desconocido.');
  for(const [key] of d.params)if(!Number.isFinite(p[key]))throw Error('Completá todos los parámetros.');
  const gas=['isentropic','isothermal','polytropic'].includes(id);
  if(gas&&(!(p.P0>0&&p.T0>0&&p.v0>0&&p.ratio>0)||id==='isentropic'&&!(p.gamma>1)||id==='polytropic'&&!(p.gamma>0)))throw Error('Presión, temperatura absoluta, volumen, relación y exponente deben ser físicamente válidos.');
  if(!gas&&(!(p.duration>0&&p.k>=0)||id==='kinetics'&&!(p.C0>0)||id==='cooling'&&(p.T0< -273.15||p.Ta< -273.15)))throw Error('Parámetros fuera del dominio físico.');
  const points=Array.from({length:101},(_,i)=>{
   if(gas){const n=id==='isothermal'?1:p.gamma,ratio=1+(p.ratio-1)*i/100;return {ratio,pressure:p.P0*ratio,specificVolume:p.v0*ratio**(-1/n),temperature:p.T0*ratio**((n-1)/n)-273.15};}
   const time_s=p.duration*i/100,e=Math.exp(-p.k*time_s);
   return id==='kinetics'?{time_s,concentration:p.C0*e,conversion:100*(1-e)}:{time_s,temperature:p.Ta+(p.T0-p.Ta)*e};
  });
  if(points.some(row=>Object.values(row).some(v=>!Number.isFinite(v))))throw Error('El modelo excede el rango numérico.');
  return {points,columns:d.columns,title:d.name,source:'ΣIM · modelo analítico',assumptions:d.note+' No son resultados de DWSIM.'};
 }
 return Object.freeze({definitions,generate});
})();
