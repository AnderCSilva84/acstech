import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, LogOut, Pencil, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { getProjects, saveProjects, useProjects } from '../data/projectStore';
import type { Project, ProjectStatus } from '../types/project';
import { Seo } from '../components/Seo';

const statuses: ProjectStatus[] = ['Em produção', 'Projeto ativo', 'Em desenvolvimento', 'Projeto concluído', 'Protótipo'];
const blank: Project = { slug:'', name:'', eyebrow:'', category:[], summary:'', problem:'', idea:'', solution:'', features:[], technologies:[], result:'', status:'Em desenvolvimento', featured:false, tone:'#60e6bd', coverImage:'', projectUrl:'' };

export default function Admin() {
  const projects = useProjects();
  const [authenticated,setAuthenticated] = useState<boolean|null>(null);
  const [error,setError] = useState('');
  const [editing,setEditing] = useState<Project|null>(null);
  const [notice,setNotice] = useState('');

  useEffect(() => { fetch('/api/portal/admin',{credentials:'same-origin'}).then(response=>setAuthenticated(response.ok)).catch(()=>setAuthenticated(false)); },[]);

  async function access(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const pin = new FormData(event.currentTarget).get('pin');
    const response = await fetch('/api/portal/admin-session',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({pin})});
    const result = await response.json().catch(()=>({error:'Servidor indisponível.'}));
    if (!response.ok) return setError(result.error||'PIN inválido.');
    setAuthenticated(true);
  }

  async function logout() { await fetch('/api/portal/admin-session',{method:'DELETE',credentials:'same-origin'}); setAuthenticated(false); }

  function remove(slug:string) {
    if (!window.confirm('Excluir este projeto?')) return;
    saveProjects(getProjects().filter(item => item.slug !== slug));
    setNotice('Projeto excluído.');
  }

  function persist(project:Project) {
    const normalized = {...project, slug:project.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''), projectUrl:project.projectUrl?.trim(), coverImage:project.coverImage?.trim()};
    const current = getProjects();
    const existing = current.findIndex(item => item.slug === normalized.slug);
    saveProjects(existing >= 0 ? current.map((item,index) => index === existing ? normalized : item) : [...current,normalized]);
    setEditing(null); setNotice('Projeto salvo e publicado neste navegador.');
  }

  if (authenticated===null) return <div className="page-loader">Verificando sessão…</div>;
  if (!authenticated) return <><Seo title="Área administrativa" description="Acesso administrativo ACS Informática."/><section className="admin-login"><form onSubmit={access} className="admin-auth-card"><span className="admin-lock"><ShieldCheck/></span><span className="kicker">Área administrativa</span><h1>Acesse o conteúdo.</h1><p>Use o mesmo PIN administrativo de 6 dígitos da gestão de clientes.</p><label>PIN administrativo<input name="pin" autoFocus type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button" type="submit">Entrar <ShieldCheck size={17}/></button></form></section></>;

  return <><Seo title="Gerenciar conteúdo" description="Painel administrativo ACS Informática."/><section className="admin-page"><header className="admin-heading"><div><span className="kicker">Conteúdo do site</span><h1>Projetos</h1><p>Cadastre e atualize o portfólio publicado.</p></div><div className="admin-actions"><button className="button" onClick={()=>setEditing({...blank})}><Plus size={17}/> Novo projeto</button><button className="button button-ghost" onClick={logout}><LogOut size={17}/> Sair</button></div></header>{notice&&<div className="admin-notice"><Check size={17}/>{notice}<button aria-label="Fechar aviso" onClick={()=>setNotice('')}><X size={16}/></button></div>}<div className="admin-projects">{projects.map(project=><article key={project.slug}><i style={{background:project.tone}}/><div><small>{project.eyebrow}</small><h2>{project.name}</h2><p>{project.summary}</p></div><div className="admin-row-actions"><button className="icon-button" aria-label={`Editar ${project.name}`} onClick={()=>setEditing({...project})}><Pencil/></button><button className="icon-button danger" aria-label={`Excluir ${project.name}`} onClick={()=>remove(project.slug)}><Trash2/></button></div></article>)}</div></section>{editing&&<ProjectEditor project={editing} onClose={()=>setEditing(null)} onSave={persist}/>}</>;
}

function ProjectEditor({project,onClose,onSave}:{project:Project;onClose:()=>void;onSave:(project:Project)=>void}) {
  const [form,setForm] = useState({...project,coverImage:project.coverImage||'',projectUrl:project.projectUrl||''});
  const [imageError,setImageError] = useState('');
  const update = <K extends keyof Project>(key:K,value:Project[K]) => setForm(current => ({...current,[key]:value}));

  function selectImage(event:ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; setImageError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setImageError('Escolha um arquivo de imagem.');
    if (file.size > 2*1024*1024) return setImageError('A imagem deve ter no máximo 2 MB.');
    const reader = new FileReader(); reader.onload = () => update('coverImage',String(reader.result||'')); reader.readAsDataURL(file);
  }

  return <div className="editor-backdrop"><form className="project-editor" onSubmit={e=>{e.preventDefault();onSave(form)}}><header><div><span className="kicker">Editor de projeto</span><h2>{project.name||'Novo projeto'}</h2></div><button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}><X/></button></header><div className="editor-grid">
    <label>Nome<input value={form.name} onChange={e=>{update('name',e.target.value);if(!project.slug)update('slug',e.target.value)}} required/></label>
    <label>Endereço (slug)<input value={form.slug} onChange={e=>update('slug',e.target.value)} required/></label>
    <label className="wide">Link público do projeto<input type="url" value={form.projectUrl} onChange={e=>update('projectUrl',e.target.value)} placeholder="https://meuprojeto.com.br"/></label>
    <label className="wide">Imagem de capa por endereço<input type="url" value={form.coverImage} onChange={e=>update('coverImage',e.target.value)} placeholder="https://.../imagem.jpg"/></label>
    <label className="wide project-image-upload">Ou escolha uma imagem do computador<input type="file" accept="image/*" onChange={selectImage}/><small>JPG, PNG ou WebP, até 2 MB.</small>{imageError&&<span className="form-error">{imageError}</span>}{form.coverImage&&<span className="project-image-preview"><img src={form.coverImage} alt="Prévia da capa"/><button type="button" className="button button-ghost button-small" onClick={()=>update('coverImage','')}>Remover imagem</button></span>}</label>
    <label className="wide">Chamada curta<input value={form.eyebrow} onChange={e=>update('eyebrow',e.target.value)} required/></label>
    <label className="wide">Resumo<textarea rows={3} value={form.summary} onChange={e=>update('summary',e.target.value)} required/></label>
    {(['problem','idea','solution','result'] as const).map(key=><label className="wide" key={key}>{({problem:'Problema',idea:'Ideia',solution:'Solução',result:'Resultado'})[key]}<textarea rows={3} value={form[key]} onChange={e=>update(key,e.target.value)} required/></label>)}
    {(['category','features','technologies'] as const).map(key=><label className="wide" key={key}>{({category:'Categorias',features:'Funcionalidades',technologies:'Tecnologias'})[key]} <small>— uma por linha</small><textarea rows={3} value={form[key].join('\n')} onChange={e=>update(key,e.target.value.split('\n').map(v=>v.trim()).filter(Boolean))}/></label>)}
    <label>Status<select value={form.status} onChange={e=>update('status',e.target.value as ProjectStatus)}>{statuses.map(status=><option key={status}>{status}</option>)}</select></label>
    <label>Cor do projeto<input type="color" value={form.tone} onChange={e=>update('tone',e.target.value)}/></label>
    <label className="check-field"><input type="checkbox" checked={form.featured} onChange={e=>update('featured',e.target.checked)}/> Exibir na página inicial</label>
  </div><footer><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button" type="submit"><Save size={17}/> Salvar e publicar</button></footer></form></div>;
}
