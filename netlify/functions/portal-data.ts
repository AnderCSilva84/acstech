import type { Config } from '@netlify/functions';
import { authenticate,json,listJSON,store,type Charge,type Client,type ServiceRequest } from './_shared/core';

export default async(req:Request)=>{
  const user=await authenticate(req); if(!user)return json({error:'Sessão inválida.'},401);
  if(req.method==='GET'){
    const [charges,requests,client]=await Promise.all([
      listJSON<Charge>(`charges/${user.sub}/`),
      listJSON<ServiceRequest>(`requests/${user.sub}/`),
      store.get(`clients/id-${user.sub}`,{type:'json'}) as Promise<Client|null>,
    ]);
    return json({client:{id:user.sub,name:client?.name||user.name,personType:client?.personType||'pf',establishments:client?.establishments||[]},charges:charges.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),requests:requests.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});
  }
  if(req.method==='POST'){
    const {title,details}=await req.json(); if(!title||!details)return json({error:'Preencha o assunto e a descrição.'},400);
    const item:ServiceRequest={id:crypto.randomUUID(),clientId:user.sub,title:String(title).slice(0,120),details:String(details).slice(0,3000),status:'received',createdAt:new Date().toISOString()};
    await store.setJSON(`requests/${user.sub}/${item.id}`,item); return json(item,201);
  }
  return json({error:'Método não permitido'},405);
};
export const config:Config={path:'/api/portal/data'};
