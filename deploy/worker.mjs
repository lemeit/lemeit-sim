// Los archivos estáticos se incorporan al publicar. Ninguna credencial va en ASSETS.
const ASSETS = /* ASSETS */ {};
const CSP = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'";

function headers(type) {
  return {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':CSP,'Referrer-Policy':'strict-origin-when-cross-origin'};
}
function error(status, message) {
  return new Response(JSON.stringify({error:message}),{status,headers:headers('application/json; charset=utf-8')});
}
export async function handle(request, env, assets=ASSETS) {
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')) {
    const catalog=url.pathname==='/api/catalog'&&request.method==='GET';
    const calculate=url.pathname==='/api/simulate'&&request.method==='POST';
    if(!catalog&&!calculate)return error(404,'Operación no disponible.');
    const origin=request.headers.get('Origin');
    if(origin&&origin!==url.origin)return error(403,'Origen no autorizado.');
    if(request.headers.get('Sec-Fetch-Site')==='cross-site')return error(403,'Origen no autorizado.');
    let body;
    if(calculate) {
      if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return error(415,'Se requiere JSON.');
      if(Number(request.headers.get('Content-Length')||0)>100000)return error(413,'El proceso supera los 100 kB.');
      // Limitar también los cuerpos sin Content-Length, sin almacenarlos sin límite.
      const reader=request.body?.getReader();if(!reader)return error(400,'Proceso vacío.');
      const chunks=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>100000){await reader.cancel();return error(413,'El proceso supera los 100 kB.');}chunks.push(value);}
      body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
    }
    if(!env.ORIGIN_KEY||!env.ENGINE_URL)return error(503,'El motor todavía no está configurado.');
    try {
      const upstream=await fetch(env.ENGINE_URL+url.pathname,{method:request.method,
        headers:{'Content-Type':'application/json','X-Origin-Key':env.ORIGIN_KEY,'Origin':url.origin,
          'User-Agent':request.headers.get('User-Agent')||'LemeitSim/0.2'},
        body,redirect:'error',signal:AbortSignal.timeout(55000)});
      if(!upstream.headers.get('Content-Type')?.includes('application/json'))return error(503,'El motor no está disponible. La PC de cálculo puede estar apagada o sin conexión.');
      return new Response(upstream.body,{status:upstream.status,headers:headers('application/json; charset=utf-8')});
    }catch{return error(503,'El motor no está disponible. La PC de cálculo puede estar apagada o sin conexión.');}
  }
  if(!['GET','HEAD'].includes(request.method))return error(405,'Método no disponible.');
  const path=url.pathname==='/'?'/index.html':url.pathname;
  const asset=assets[path];
  if(!asset)return new Response('Página no encontrada',{status:404,headers:headers('text/plain; charset=utf-8')});
  const bytes=request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
  return new Response(bytes,{headers:headers(asset.type)});
}
export default {fetch(request,env){return handle(request,env);}};
