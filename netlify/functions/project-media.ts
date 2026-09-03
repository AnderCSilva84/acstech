import type { Config, Context } from '@netlify/functions';
import { adminAllowed, json, store } from './_shared/core';

const allowed=new Set(['image/jpeg','image/png','image/webp','image/gif']);

export default async function projectMedia(req:Request,context:Context) {
  const id=context.params.id;
  if(req.method==='GET'&&id) {
    const key=`project-media/${id}`;
    const [data,record]=await Promise.all([store.get(key,{type:'arrayBuffer'}),store.getMetadata(key)]);
    if(!data)return new Response('Imagem não encontrada.',{status:404});
    const metadata=record?.metadata as {contentType?:string}|undefined;
    return new Response(data,{headers:{'content-type':metadata?.contentType||'application/octet-stream','cache-control':'public, max-age=31536000, immutable'}});
  }
  if(req.method==='POST'&&!id) {
    if(!await adminAllowed(req))return json({error:'Acesso administrativo necessário.'},401);
    const {data}=await req.json() as {data?:string};
    const match=data?.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
    if(!match||!allowed.has(match[1]))return json({error:'Formato de imagem inválido.'},400);
    const bytes=Buffer.from(match[2],'base64');
    if(bytes.length>1024*1024)return json({error:'A imagem deve ter no máximo 1 MB.'},413);
    const mediaId=crypto.randomUUID();
    await store.set(`project-media/${mediaId}`,bytes,{metadata:{contentType:match[1],uploadedAt:new Date().toISOString()}});
    return json({url:`/api/project-media/${mediaId}`},201);
  }
  return json({error:'Método não permitido.'},405);
}

export const config:Config={path:['/api/project-media','/api/project-media/:id']};
