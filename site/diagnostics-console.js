/* Consola de diagnóstico local y acotada: solo metadatos, nunca credenciales ni cargas de procesos. */
'use strict';
globalThis.SimDiagnostics=(()=>{
  const KEYS=['http','ms','engine','stage','operation','message','version','feature','available','count','state','model','objects','connections','streams','equipment'];
  const MAX=100;
  function redact(value){
    return String(value??'').replace(/(authorization|bearer|token|secret|password|api[_-]?key|origin[_-]?key)\s*[:=]\s*[^\s,;]+/gi,'$1=[REDACTADO]')
      .replace(/https?:\/\/[^\s]+/gi,'[URL omitida]').slice(0,360);
  }
  function normalize(entry){
    const e={time:typeof entry.time==='string'?entry.time:new Date().toISOString(),
      level:['INFO','OK','WARN','ERROR'].includes(entry.level)?entry.level:'INFO',
      event:redact(entry.event||'evento').slice(0,72)};
    for(const key of KEYS){
      const v=entry[key];
      if(v===undefined||v===null)continue;
      if(typeof v==='boolean')e[key]=v;
      else if(typeof v==='number'&&Number.isFinite(v))e[key]=v;
      else if(typeof v==='string')e[key]=redact(v);
    }
    return e;
  }
  function add(events,event){events.push(normalize(event));if(events.length>MAX)events.splice(0,events.length-MAX);return events;}
  function show(events,filter='all'){return filter==='errors'?events.filter(e=>['ERROR','WARN'].includes(e.level)):events;}
  function line(entry){
    const time=entry.time?.slice(11,23)||'--:--:--';
    const extra=KEYS.filter(k=>entry[k]!==undefined).map(k=>k+'='+JSON.stringify(entry[k])).join(' ');
    return '['+time+'] ['+entry.level+'] '+entry.event+(extra?' · '+extra:'');
  }
  function exportReport({project,model,engine,portalVersion,review,lastCalculation,connectionCheck,gatewayCheck,events}){
    return JSON.stringify({source:'ΣIM · consola local (no son logs internos de DWSIM)',
      exported_at:new Date().toISOString(),portal_version:portalVersion,project:redact(project),
      model:redact(model),engine,review:(review||[]).map(redact),last_calculation:lastCalculation?
        {time:lastCalculation.time,engine:lastCalculation.engine,state:lastCalculation.state,
         http:lastCalculation.http??null,ms:lastCalculation.duration_ms??null,
         message:redact(lastCalculation.message)}:null,
      connection:connectionCheck?{state:connectionCheck.state,http:connectionCheck.http,ms:connectionCheck.ms}:null,
      gateway:gatewayCheck?{version:gatewayCheck.version,ok:gatewayCheck.ok,state:gatewayCheck.state}:null,
      events:events.map(normalize)},null,2);
  }
  return {normalize,add,show,line,exportReport,redact};
})();
