/* Conversiones físicas: SI, unidades de ingeniería y anglosajonas. */
'use strict';
globalThis.SimUnits=(()=>{
 const lb=.45359237,ft=.3048,Btu=1055.05585262;
 const group=(label,units)=>({label,units:Object.fromEntries(Object.entries(units).map(([u,v])=>[u,Array.isArray(v)?v:[v,0]]))});
 const groups={
  temperature:group('Temperatura',{'K':[1,0],'°C':[1,273.15],'°F':[5/9,273.15-32*5/9],'°R':[5/9,0]}),
  delta_temperature:group('Diferencia de temperatura',{'K':1,'Δ°C':1,'Δ°F':5/9,'Δ°R':5/9}),
  pressure:group('Presión',{'Pa':1,'kPa':1000,'MPa':1e6,'bar':1e5,'atm':101325,'psi':6894.757293168361,'torr':101325/760}),
  mass:group('Masa',{'kg':1,'g':.001,'t':1000,'lb':lb,'oz':lb/16}),
  amount:group('Cantidad de sustancia',{'mol':1,'kmol':1000,'lbmol':lb*1000}),
  time:group('Tiempo',{'s':1,'min':60,'h':3600,'d':86400}),
  length:group('Longitud',{'m':1,'cm':.01,'mm':.001,'km':1000,'ft':ft,'in':.0254,'yd':.9144}),
  area:group('Área',{'m²':1,'cm²':1e-4,'mm²':1e-6,'ft²':ft*ft,'in²':.0254**2}),
  volume:group('Volumen',{'m³':1,'L':.001,'mL':1e-6,'ft³':ft**3,'in³':.0254**3,'gal US':.003785411784,'gal imp':.00454609}),
  mass_flow:group('Caudal másico',{'kg/s':1,'kg/h':1/3600,'g/s':.001,'t/h':1000/3600,'lb/s':lb,'lb/h':lb/3600,'lb/min':lb/60}),
  molar_flow:group('Caudal molar',{'mol/s':1,'mol/h':1/3600,'kmol/s':1000,'kmol/h':1000/3600,'lbmol/h':lb*1000/3600,'lbmol/s':lb*1000}),
  volume_flow:group('Caudal volumétrico',{'m³/s':1,'m³/h':1/3600,'L/s':.001,'L/min':.001/60,'ft³/s':ft**3,'ft³/min':ft**3/60,'gal US/min':.003785411784/60}),
  density:group('Densidad',{'kg/m³':1,'g/cm³':1000,'kg/L':1000,'lb/ft³':lb/ft**3,'lb/gal US':lb/.003785411784}),
  force:group('Fuerza',{'N':1,'kN':1000,'lbf':4.4482216152605,'dyn':1e-5,'kgf':9.80665}),
  frequency:group('Frecuencia',{'Hz':1,'kHz':1000,'1/min':1/60,'rpm':1/60}),
  molar_energy:group('Energía molar / activación',{'J/mol':1,'kJ/mol':1000,'kJ/kmol':1,'Btu/lbmol':1055.05585262/453.59237}),
  reaction_rate:group('Velocidad de reacción volumétrica',{'mol/(m³·s)':1,'mol/(L·s)':1000,'kmol/(m³·h)':1000/3600,'lbmol/(ft³·h)':453.59237/(.3048**3*3600)}),
  energy:group('Energía',{'J':1,'kJ':1000,'MJ':1e6,'Wh':3600,'kWh':3.6e6,'cal th':4.184,'kcal th':4184,'Btu IT':Btu}),
  power:group('Potencia',{'W':1,'kW':1000,'MW':1e6,'Btu/h':Btu/3600,'hp mec':745.6998715822702}),
  enthalpy:group('Entalpía específica',{'J/kg':1,'kJ/kg':1000,'Btu/lb':Btu/lb}),
  entropy:group('Entropía / calor específico',{'J/(kg·K)':1,'kJ/(kg·K)':1000,'Btu/(lb·°R)':Btu/(lb*5/9)}),
  concentration:group('Concentración molar',{'mol/m³':1,'mol/L':1000,'kmol/m³':1000,'mol/ft³':1/ft**3,'lbmol/ft³':lb*1000/ft**3}),
  mass_concentration:group('Concentración másica',{'kg/m³':1,'g/L':1,'mg/L':.001,'lb/ft³':lb/ft**3}),
  velocity:group('Velocidad',{'m/s':1,'km/h':1/3.6,'ft/s':ft,'mph':.44704}),
  dynamic_viscosity:group('Viscosidad dinámica',{'Pa·s':1,'mPa·s':.001,'cP':.001,'P':.1,'lb/(ft·s)':lb/ft}),
  kinematic_viscosity:group('Viscosidad cinemática',{'m²/s':1,'mm²/s':1e-6,'cSt':1e-6,'ft²/s':ft**2}),
  thermal_conductivity:group('Conductividad térmica',{'W/(m·K)':1,'Btu/(h·ft·°F)':Btu/(3600*ft*5/9)}),
  heat_transfer:group('Coeficiente de transferencia de calor',{'W/(m²·K)':1,'Btu/(h·ft²·°F)':Btu/(3600*ft**2*5/9)}),
  current:group('Corriente eléctrica',{'A':1,'mA':.001,'kA':1000}),
  luminous:group('Intensidad luminosa',{'cd':1,'mcd':.001}),
  fraction:group('Fracción molar o porcentaje',{'mol/mol':1,'%':.01})
 };
 function convert(category,value,from,to){const g=groups[category];if(!Number.isFinite(value)||!g||!Object.hasOwn(g.units,from)||!Object.hasOwn(g.units,to))throw Error('Elegí una magnitud y unidades compatibles con un valor finito.');const [a,b]=g.units[from],[c,d]=g.units[to];return (value*a+b-d)/c;}
 function pressure(value,from,to,fromGauge=false,toGauge=false,ambient=101325){if(!(ambient>0))throw Error('La presión atmosférica debe ser positiva.');const absolute=convert('pressure',value,from,'Pa')+(fromGauge?ambient:0);if(absolute<0)throw Error('La presión absoluta no puede ser negativa.');return convert('pressure',absolute-(toGauge?ambient:0),'Pa',to);}
 function mixture(values,masses,basis='molar'){
  if(!['molar','mass'].includes(basis)||!values.length||values.length!==masses.length||values.some(v=>!Number.isFinite(v)||v<0||v>1)||masses.some(m=>!Number.isFinite(m)||m<=0))throw Error('Completá fracciones válidas y masas molares positivas.');
  const sum=values.reduce((a,b)=>a+b,0);if(Math.abs(sum-1)>1e-6)throw Error('Las fracciones deben sumar 1 (o 100 %). No se normalizan automáticamente.');
  const normalized=values.map(v=>v/sum);let y,w,M;
  if(basis==='molar'){y=normalized;M=y.reduce((s,v,i)=>s+v*masses[i],0);w=y.map((v,i)=>v*masses[i]/M);}
  else{w=normalized;const total=w.reduce((s,v,i)=>s+v/masses[i],0);M=1/total;y=w.map((v,i)=>v/masses[i]/total);}
  return {y,w,M};
 }
 function partials(y,P,T){if(!Number.isFinite(P)||P<0||!Number.isFinite(T)||T<=0)throw Error('Usá presión absoluta no negativa y temperatura Kelvin positiva.');if(y.some(v=>!Number.isFinite(v)||v<0)||Math.abs(y.reduce((a,b)=>a+b,0)-1)>1e-6)throw Error('Las fracciones molares deben sumar 1.');return y.map(v=>({pressure_Pa:v*P,ideal_concentration_mol_m3:v*P/(8.31446261815324*T)}));}
 return {groups,convert,pressure,mixture,partials};
})();
