/* Conversiones de presentación. El archivo guarda valores canónicos, sin redondearlos. */
'use strict';
globalThis.SimproxStreams=(()=>{
  const units={
    temperature_C:{'°C':[1,0],K:[1,-273.15],'°F':[5/9,-32*5/9]},
    pressure_kPa:{kPa:[1,0],bar:[100,0],Pa:[.001,0],atm:[101.325,0]},
    mass_flow:{'kg/s':[1,0],'kg/h':[1/3600,0],'t/h':[1000/3600,0]},
    molar_flow:{'mol/s':[1,0],'kmol/h':[1000/3600,0],'kmol/s':[1000,0]},
    enthalpy_kJ_kg:{'kJ/kg':[1,0],'J/kg':[.001,0]},
    entropy_kJ_kgK:{'kJ/(kg·K)':[1,0],'J/(kg·K)':[.001,0]},
    vapor_fraction:{'mol/mol':[1,0],'%':[.01,0]}
  };
  const specs={TP:['temperature_C','pressure_kPa'],PH:['pressure_kPa','enthalpy_kJ_kg'],PS:['pressure_kPa','entropy_kJ_kgK'],PV:['pressure_kPa','vapor_fraction'],TV:['temperature_C','vapor_fraction']};
  function unit(n,key){const selected=n.units?.[key];return Object.hasOwn(units[key],selected)?selected:Object.keys(units[key])[0];}
  function toCanonical(key,value,selected){const [factor,offset]=units[key][selected];return value*factor+offset;}
  function fromCanonical(key,value,selected){if(!Number.isFinite(value))return null;const [factor,offset]=units[key][selected];return (value-offset)/factor;}
  function issues(n,compounds){const out=[],spec=n.flash_spec||'TP';if(!Object.hasOwn(specs,spec))return ['Especificación flash inválida.'];for(const k of specs[spec]){const v=n[k];if(!Number.isFinite(v))out.push('Completá '+k+'.');else if(k==='temperature_C'&&v<=-273.15)out.push('La temperatura debe superar el cero absoluto.');else if(k==='pressure_kPa'&&v<=0)out.push('La presión absoluta debe ser positiva.');else if(k==='vapor_fraction'&&(v<0||v>1))out.push('La fracción de vapor debe estar entre 0 y 1.');}if(!['mass','molar'].includes(n.flow_basis||'mass'))out.push('Base de caudal inválida.');if(!['mass','molar'].includes(n.composition_basis||'mass'))out.push('Base de composición inválida.');if(!(n[(n.flow_basis||'mass')==='mass'?'mass_flow':'molar_flow']>0))out.push('Completá un caudal positivo.');const fractions=compounds.map(c=>n.composition?.[c]);if(fractions.some(v=>!Number.isFinite(v)||v<0||v>1)||Math.abs(fractions.reduce((a,b)=>a+b,0)-1)>1e-6)out.push('Las fracciones deben estar entre 0 y 1 y sumar 1.');return out;}
  return {units,specs,unit,toCanonical,fromCanonical,issues};
})();
