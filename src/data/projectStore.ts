import { useEffect, useState } from 'react';
import { projects as initialProjects } from './projects';
import type { Project } from '../types/project';

const STORAGE_KEY='acs-projects';
const CHANGE_EVENT='acs-projects-change';

export function getProjects():Project[] {
  try { const saved=localStorage.getItem(STORAGE_KEY); return saved?JSON.parse(saved) as Project[]:initialProjects; }
  catch { return initialProjects; }
}

function updateLocal(projects:Project[]) {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(projects)); } catch { /* O servidor continua como fonte principal. */ }
  initialProjects.splice(0,initialProjects.length,...projects);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export async function syncProjects() {
  try {
    const response=await fetch('/api/projects');
    if(!response.ok)return;
    const result=await response.json() as {projects:Project[]|null};
    if(Array.isArray(result.projects))updateLocal(result.projects);
  } catch { /* Mantém a cópia disponível no dispositivo quando estiver offline. */ }
}

export async function saveProjects(projects:Project[]) {
  const response=await fetch('/api/projects',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({projects})});
  const result=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}));
  if(!response.ok)throw new Error(result.error||'Não foi possível publicar os projetos.');
  updateLocal(projects);
}

export function useProjects() {
  const [projects,setProjects]=useState<Project[]>(getProjects);
  useEffect(()=>{
    const refresh=()=>setProjects([...getProjects()]);
    void syncProjects();
    window.addEventListener('storage',refresh); window.addEventListener(CHANGE_EVENT,refresh);
    return()=>{window.removeEventListener('storage',refresh);window.removeEventListener(CHANGE_EVENT,refresh)};
  },[]);
  return projects;
}
