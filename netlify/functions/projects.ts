import type { Config } from '@netlify/functions';
import { adminAllowed, json, store } from './_shared/core';

export default async function projectsApi(req:Request) {
  if(req.method==='GET') {
    const projects=await store.get('projects/catalog',{type:'json'});
    return json({projects:projects||null});
  }
  if(req.method==='PUT') {
    if(!await adminAllowed(req))return json({error:'Acesso administrativo necessário.'},401);
    const body=await req.json() as {projects?:unknown[]};
    if(!Array.isArray(body.projects))return json({error:'Catálogo inválido.'},400);
    await store.setJSON('projects/catalog',body.projects);
    return json({ok:true});
  }
  return json({error:'Método não permitido.'},405);
}

export const config:Config={path:'/api/projects'};
