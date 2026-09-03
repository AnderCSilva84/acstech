import type { Config } from '@netlify/functions';
import { adminAllowed,hashPin,json,listJSON,normalizePhone,store,type Charge,type Client } from './_shared/core';

export default async(req:Request)=>{
  if(!await adminAllowed(req)) return json({error:'Acesso negado.'},401);
  if(req.method==='GET') {
    const records=await listJSON<Client>('clients/id-');
    return json({clients:records.map(client=>({id:client.id,name:client.name,phone:client.phone,personType:client.personType,document:client.document,establishments:client.establishments||[],active:client.active}))});
  }
  if(req.method!=='POST') return json({error:'Método não permitido'},405);
  const body=await req.json();
  if(body.action==='client') {
    const phone=normalizePhone(body.phone||'');
    const document=normalizePhone(body.document||''); const personType=body.personType==='pj'?'pj':'pf';
    if(!body.name?.trim()) return json({error:'Informe o nome do cliente ou responsável.'},400);
    if(!/^\d{10,11}$/.test(phone)) return json({error:'Informe um telefone válido com DDD.'},400);
    if(!/^\d{4}$/.test(body.pin||'')) return json({error:'O PIN do cliente deve ter exatamente 4 dígitos.'},400);
    if((personType==='pf'&&document.length!==11)||(personType==='pj'&&document.length!==14)) return json({error:`Informe um ${personType==='pf'?'CPF':'CNPJ'} válido.`},400);
    const establishments=personType==='pj'&&Array.isArray(body.establishments)?body.establishments.filter((item:{name?:string})=>item.name?.trim()).map((item:{name:string;system?:string})=>({id:crypto.randomUUID(),name:item.name.trim(),system:String(item.system||'').trim()})):[];
    if(personType==='pj'&&!establishments.length) return json({error:'Cadastre pelo menos um estabelecimento da empresa.'},400);
    const id=body.id||crypto.randomUUID(); const salt=crypto.randomUUID();
    const client:Client={id,name:String(body.name).trim(),phone,personType,document,establishments,pinHash:await hashPin(body.pin,salt),salt,active:true};
    await Promise.all([store.setJSON(`clients/phone-${phone}`,client),store.setJSON(`clients/id-${id}`,client)]);
    return json({id,name:client.name,phone,personType,document,establishments},201);
  }
  if(body.action==='charge') {
    if(!body.clientId||!body.description||Number(body.amount)<=0||!body.dueDate) return json({error:'Preencha todos os dados da cobrança.'},400);
    const charge:Charge={id:crypto.randomUUID(),clientId:body.clientId,description:String(body.description),amount:Math.round(Number(body.amount)*100),dueDate:body.dueDate,status:'pending',createdAt:new Date().toISOString()};
    await Promise.all([store.setJSON(`charges/${charge.clientId}/${charge.id}`,charge),store.setJSON(`charge-index/${charge.id}`,{clientId:charge.clientId})]);
    return json(charge,201);
  }
  return json({error:'Ação inválida.'},400);
};
export const config:Config={path:'/api/portal/admin'};
