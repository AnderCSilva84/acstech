import { useEffect, useState } from 'react';
import { projects as initialProjects } from './projects';
import type { Project } from '../types/project';

const STORAGE_KEY = 'acs-projects';
const CHANGE_EVENT = 'acs-projects-change';

export function getProjects(): Project[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as Project[] : initialProjects;
  } catch { return initialProjects; }
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  initialProjects.splice(0, initialProjects.length, ...projects);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(getProjects);
  useEffect(() => {
    const refresh = () => setProjects(getProjects());
    window.addEventListener('storage', refresh); window.addEventListener(CHANGE_EVENT, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(CHANGE_EVENT, refresh); };
  }, []);
  return projects;
}
