/* Fuentes tabulares independientes del renderizador. */
'use strict';
globalThis.SimChartData=(()=>{
 const finite=Number.isFinite;
 const column=(key,name,unit='')=>({key,name,unit});
 function table(points,columns,title,source,assumptions='',categorical=false){
  return {points,columns:columns.filter(c=>points.some(p=>finite(p[c.key]))),title,source,assumptions,categorical};
 }
 function stationary(graph,result,engine){
  if(!result)return [];
  const name=id=>graph.nodes.find(n=>n.id===id)?.name||id;
  const source='DWSIM · Estado estacionario';
  const common=[column('index','Objeto')];
  const sc=[...common,column('temperature','Temperatura','°C'),column('pressure','Presión absoluta','kPa'),column('mass','Caudal másico','kg/s'),column('molar','Caudal molar','mol/s'),column('enthalpy','Entalpía','kJ/kg'),column('entropy','Entropía','kJ/(kg·K)'),column('density','Densidad','kg/m³'),column('specificVolume','Volumen específico','m³/kg'),column('volume','Caudal volumétrico','m³/s')];
  for(const [i,c] of (graph.compounds||[]).entries()){sc.push(column('w'+i,'Fracción másica · '+c,'kg/kg'),column('z'+i,'Fracción molar · '+c,'mol/mol'));}
  const streams=Object.entries(result.streams||{}).map(([id,s],i)=>{
   const p=s.phases?.find(p=>p.name==='Mixture');
   const row={index:i+1,objectId:id,label:name(id),temperature:finite(s.temperature_K)?s.temperature_K-273.15:null,pressure:finite(s.pressure_Pa)?s.pressure_Pa/1000:null,mass:s.mass_flow_kg_s,molar:s.molar_flow_mol_s,enthalpy:p?.enthalpy_kJ_kg,entropy:p?.entropy_kJ_kgK,density:p?.density_kg_m3,specificVolume:p?.density_kg_m3>0?1/p.density_kg_m3:null,volume:finite(s.mass_flow_kg_s)&&p?.density_kg_m3>0?s.mass_flow_kg_s/p.density_kg_m3:null};
   for(const [j,c] of (graph.compounds||[]).entries()){row['w'+j]=p?.compounds?.[c]?.mass_fraction;row['z'+j]=p?.compounds?.[c]?.mole_fraction;}return row;
  });
  const balances=(result.balances||[]).map((b,i)=>({index:i+1,label:name(b.id),massIn:b.mass_in,massOut:b.mass_out,residual:b.mass_residual,energy:b.heat_to_fluid_kW}));
  const components=(result.balances||[]).flatMap(b=>Object.entries(b.components||{}).map(([c,v])=>({label:name(b.id)+' · '+c,massIn:v.in_kg_s,massOut:v.out_kg_s,residual:v.residual_kg_s}))).map((p,i)=>({...p,index:i+1}));
  const bc=[...common,column('massIn','Entrada','kg/s'),column('massOut','Salida','kg/s'),column('residual','Residuo o consumo neto','kg/s')];
  const datasets=[table(streams,sc,'Corrientes',source,'Cada punto es una corriente, no un instante. Caudal volumétrico derivado de masa/densidad.',true),table(balances,[...bc,column('energy','Energía neta al fluido','kW')],'Balances',source,'Cada punto es un equipo; la energía neta no equivale a potencia intercambiada en un intercambiador.',true),table(components,bc,'Componentes',source,'Cada punto es un par equipo/componente. En reacción, el residuo puede representar consumo o generación.',true)];
  if(streams.length===2&&graph.nodes.some(n=>n.type==='Compressor'||n.type==='Expander')){
   const states=datasets[0];
   states.defaultX=states.columns.some(c=>c.key==='specificVolume')?'specificVolume':'index';
   states.defaultY=states.columns.some(c=>c.key==='pressure')?'pressure':'temperature';
   states.assumptions='Cada punto muestra un estado calculado de entrada o salida. Para una curva continua, generá un modelo analítico por separado.';
  }
  return datasets.filter(d=>d.points.length&&d.columns.length>1);
 }
 function parse(text){
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)throw Error('Ingresá encabezados y al menos una fila.');
  const sep=lines[0].includes('\t')?'\t':lines[0].includes(';')?';':',';
  const split=line=>{let fields=[],v='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===sep&&!quoted){fields.push(v.trim());v='';}else v+=c;}if(quoted)throw Error('Comillas sin cerrar.');fields.push(v.trim());return fields;};
  const headers=split(lines[0]);if(headers.length<2||headers.length>30||lines.length>10001)throw Error('Usá entre 2 y 30 columnas y hasta 10000 filas.');
  const columns=headers.map((h,i)=>{const m=h.match(/^(.*?)\s*\[([^\]]+)\]$/);return column('c'+i,m?m[1]:h||'Columna '+(i+1),m?m[2]:'');});
  const points=lines.slice(1).map((line,i)=>{const cells=split(line);if(cells.length!==headers.length)throw Error('Fila '+(i+2)+': cantidad de columnas incorrecta.');const p={label:'Fila '+(i+1)};cells.forEach((v,j)=>{if(!v)return;const n=Number(sep===','?v:v.replace(',','.'));if(!finite(n))throw Error('Fila '+(i+2)+': dato no numérico.');p['c'+j]=n;});return p;});
  const d=table(points,columns,'Datos propios','Datos ingresados por el usuario','No calculados por DWSIM.');if(d.columns.length<2)throw Error('Se necesitan dos columnas numéricas.');return d;
 }
 return Object.freeze({stationary,parse});
})();
