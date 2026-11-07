/* Exportaciones locales. Valores numéricos originales del motor; sin red ni dependencias. */
'use strict';
const SimproxFiles=(()=>{
 const xml=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
 const text=s=>{const v=String(s??'');return /^[=+@\-\t\r]/.test(v)?"'"+v:v;};
 function csv(rows){return '\ufeff'+rows.map(row=>row.map(value=>'"'+(typeof value==='number'?String(value):text(value)).replaceAll('"','""')+'"').join(';')).join('\r\n');}
 function tables(graph,result){
  const name=id=>graph.nodes.find(n=>n.id===id)?.name||id;
  const streams=[['Corriente','Caudal [kg/s]','Temperatura [°C]','Presión [kPa]','Entalpía [kJ/kg]','Entropía [kJ/(kg K)]','Densidad [kg/m³]','Caudal molar [mol/s]']];
  for(const [id,r] of Object.entries(result.streams||{})){const p=r.phases?.[0]||{};streams.push([name(id),r.mass_flow_kg_s,r.temperature_K-273.15,r.pressure_Pa/1000,p.enthalpy_kJ_kg,p.entropy_kJ_kgK,p.density_kg_m3,r.molar_flow_mol_s]);}
  const balances=[['Equipo','Entrada [kg/s]','Salida [kg/s]','Residuo masa [kg/s]','Calor hacia fluido [kW]','Reactivo']];
  const components=[['Equipo','Componente','Entrada [kg/s]','Salida [kg/s]','Residuo o consumo neto [kg/s]','Interpretación']];
  for(const b of result.balances||[]){balances.push([name(b.id),b.mass_in,b.mass_out,b.mass_residual,b.heat_to_fluid_kW,b.reactive?'Sí':'No']);for(const [compound,c] of Object.entries(b.components||{}))components.push([name(b.id),compound,c.in_kg_s,c.out_kg_s,c.residual_kg_s,b.reactive?'Consumo (+), generación (−)':'Residuo']);}
  return [{name:'Corrientes',rows:streams},{name:'Balances',rows:balances},{name:'Componentes',rows:components},{name:'Datos',rows:[['Proyecto',graph.title],['Modelo',result.model],['Motor',result.engine],['Duración [s]',result.elapsed_s],['Exportado [UTC]',new Date().toISOString()],['Origen','Simulación calculada por DWSIM; no mediciones experimentales']]}];
 }
 const encoder=new TextEncoder();
 const crcTable=Array.from({length:256},(_,i)=>{for(let k=0;k<8;k++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
 function crc(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
 function zip(files){const chunks=[],central=[];let offset=0;for(const [path,source] of Object.entries(files)){const name=encoder.encode(path),data=encoder.encode(source),sum=crc(data),header=new Uint8Array(30+name.length),h=new DataView(header.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,sum,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);header.set(name,30);chunks.push(header,data);const directory=new Uint8Array(46+name.length),d=new DataView(directory.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,sum,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);directory.set(name,46);central.push(directory);offset+=header.length+data.length;}const size=central.reduce((s,v)=>s+v.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,central.length,true);e.setUint16(10,central.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);chunks.push(...central,end);const all=new Uint8Array(offset+size+22);let cursor=0;for(const part of chunks){all.set(part,cursor);cursor+=part.length;}return all;}
 function xlsx(sheets){
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main',rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships',head='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const files={'[Content_Types].xml':head+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>',
   '_rels/.rels':head+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
   'xl/workbook.xml':head+`<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets>`+sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>',
   'xl/_rels/workbook.xml.rels':head+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${rel}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+'</Relationships>'};
  sheets.forEach((sheet,i)=>files[`xl/worksheets/sheet${i+1}.xml`]=head+`<worksheet xmlns="${ns}"><sheetData>`+sheet.rows.map((row,r)=>`<row r="${r+1}">`+row.map(value=>typeof value==='number'&&Number.isFinite(value)?`<c><v>${value}</v></c>`:`<c t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join('')+'</row>').join('')+'</sheetData></worksheet>');return zip(files);
 }
 return {csv,tables,xlsx};
})();
