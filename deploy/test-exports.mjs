import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({TextEncoder});vm.runInContext(readFileSync(new URL('../site/exports.js',import.meta.url),'utf8'),ctx);const api=vm.runInContext('SimproxFiles',ctx);
test('CSV local e internacional escapan textos y conservan números negativos',()=>{
 const rows=[['Nombre','Caudal'],['=SUM(1;2)',-1.25],['A"B\nC',2],['A,B',Infinity]];
 assert.equal(api.csv(rows),'\ufeffNombre;Caudal\r\n"\'=SUM(1;2)";-1,25\r\n"A""B\nC";2\r\nA,B;\r\n');
 assert.equal(api.csv(rows,'international'),'Nombre,Caudal\r\n\'=SUM(1;2),-1.25\r\n"A""B\nC",2\r\n"A,B",\r\n');
});
test('tablas exportan valores del motor sin redondear y distinguen reacciones',()=>{const sheets=api.tables({title:'Prueba',nodes:[{id:'s',name:'Agua'},{id:'r',name:'Reactor'}]},{model:'IAPWS',engine:'DWSIM',elapsed_s:2,streams:{s:{temperature_K:300,pressure_Pa:101325,mass_flow_kg_s:1.23456789,phases:[{enthalpy_kJ_kg:100}]}},balances:[{id:'r',reactive:true,components:{Water:{in_kg_s:1,out_kg_s:2,residual_kg_s:-1}}}]});assert.equal(sheets[0].rows[1][1],1.23456789);assert.equal(sheets[0].rows[1][3],101.325);assert.equal(sheets[2].rows[1][4],-1);assert.match(sheets[2].rows[1][5],/generación/);});


test('exportación distingue trabajo de eje de calor sin cambiar la potencia numérica',()=>{
 const sheets=api.tables({title:'Compresión',nodes:[{id:'k',name:'K1'}]},{streams:{},balances:[{id:'k',energy_kind:'shaft',heat_to_fluid_kW:152.233190001056}]});
 assert.equal(sheets[1].rows[1][4],152.233190001056);assert.equal(sheets[1].rows[1][6],'Trabajo de eje');
});

test('expansor exporta trabajo negativo hacia el fluido sin convertirlo en calor',()=>{
 const sheets=api.tables({title:'Expansión',nodes:[{id:'x',name:'X1'}]},{streams:{},balances:[{id:'x',energy_kind:'shaft',heat_to_fluid_kW:-66.6179460348}]});
 assert.equal(sheets[1].rows[1][4],-66.6179460348);assert.equal(sheets[1].rows[1][6],'Trabajo de eje');
});

function zipEntries(bytes){
 const entries={};
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const decoder=new TextDecoder();
 for(let offset=0;view.getUint32(offset,true)===0x04034b50;){
  assert.equal(view.getUint16(offset+8,true),0,'Método ZIP almacenado');
  const size=view.getUint32(offset+18,true),nameSize=view.getUint16(offset+26,true);
  const start=offset+30+nameSize+view.getUint16(offset+28,true);
  const name=decoder.decode(bytes.slice(offset+30,offset+30+nameSize));
  entries[name]=decoder.decode(bytes.slice(start,start+size));
  offset=start+size;
 }
 return entries;
}
const loadJson=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const example=loadJson('../site/examples/MulticomponentBalance.json');
const result6=loadJson('./fixtures/example6-results.json');

test('Ejemplo 6 resuelto: ida y vuelta CSV es-AR e internacional y valores de referencia',()=>{
 const streams=api.tables(example,result6)[0];
 assert.equal(streams.rows.length,9);
 assert.equal(streams.rows[1][6],941.2494715054087);
 assert.equal(streams.rows[1][7],44.919060011504634);
 assert.equal(streams.rows[1][4],0.10764946283363493);
 assert.equal(streams.rows[1][5],0.0003610580675285425);
 assert.ok(Math.abs(streams.rows.at(-1)[2]-25.00003571985945)<1e-12);
 for(const [locale,delimiter] of [['es-AR',';'],['international',',']]){
  const lines=api.csv(streams.rows,locale).trim().split('\r\n');
  assert.equal(lines.length,9);
  for(const [i,line] of lines.slice(1).entries()){
   const [name,...numbers]=line.split(delimiter);
   assert.equal(name,streams.rows[i+1][0]);
   assert.equal(numbers.length,7);
   for(const [j,number] of numbers.entries()){
    assert.match(number,locale==='es-AR'?/^-?\d+(,\d+)?(e[+-]\d+)?$/i:/^-?\d+(\.\d+)?(e[+-]\d+)?$/i);
    assert.equal(Number(number.replace(',','.')),streams.rows[i+1][j+1]);
   }
  }
 }
});

test('Ejemplo 6 resuelto: ida y vuelta XLSX con números, unidades, formatos y anchos',()=>{
 const sheets=api.tables(example,result6);
 sheets.at(-1).rows.push(['Texto de prueba','=1+1']);
 const entries=zipEntries(api.xlsx(sheets));
 assert.match(entries['xl/workbook.xml'],/Corrientes.*Balances.*Componentes.*Datos/);
 assert.match(entries['xl/_rels/workbook.xml.rels'],/Target="styles.xml"/);
 assert.match(entries['[Content_Types].xml'],/PartName="\/xl\/styles.xml"/);
 assert.match(entries['xl/styles.xml'],/formatCode="0\.############"/);
 const streams=entries['xl/worksheets/sheet1.xml'];
 assert.match(streams,/Temperatura \[°C\].*Presión \[kPa\].*Densidad \[kg\/m³\]/);
 assert.match(streams,/<col min="3" max="3" width="24" customWidth="1"\/>/);
 const rows=Array.from(streams.matchAll(/<row r="\d+">(.+?)<\/row>/g),match=>match[1]).slice(1);
 assert.equal(rows.length,8);
 for(const [i,row] of rows.entries()){
  const numeric=Array.from(row.matchAll(/<c t="n" s="\d+"><v>([^<]+)<\/v><\/c>/g),match=>Number(match[1]));
  assert.deepEqual(numeric,Array.from(sheets[0].rows[i+1].slice(1)));
 }
 const info=entries['xl/worksheets/sheet4.xml'];
 assert.match(info,/<c t="inlineStr"><is><t xml:space="preserve">=1\+1<\/t>/);
});
