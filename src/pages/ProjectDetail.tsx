import { ArrowLeft, Check, ExternalLink, Target } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useProjects } from '../data/projectStore';
import { CTA, ProjectVisual, Reveal } from '../components/UI';
import { Seo } from '../components/Seo';

export default function ProjectDetail() {
  const {slug} = useParams();
  const projects = useProjects();
  const p = projects.find(project => project.slug === slug);
  if (!p) return <section className="page-hero"><h1>Projeto não encontrado.</h1><Link className="button" to="/projetos">Voltar ao catálogo</Link></section>;
  const images=p.galleryImages?.length?p.galleryImages:(p.coverImage?[p.coverImage]:[]);

  return <><Seo title={p.name} description={p.summary}/><article>
    <section className="case-hero" style={{'--tone':p.tone} as React.CSSProperties}><div><Link className="back" to="/projetos"><ArrowLeft/> Todos os projetos</Link><span className="kicker">{p.eyebrow}</span><h1>{p.name}</h1><p>{p.summary}</p><div className="tags">{p.category.map(item=><span key={item}>{item}</span>)}<span className="status">{p.status}</span></div>{p.projectUrl&&<a className="button project-open" href={p.projectUrl} target="_blank" rel="noreferrer">Abrir projeto <ExternalLink size={17}/></a>}</div><ProjectVisual project={p}/></section>
    {p.projectUrl&&<section className="section project-home"><div className="section-head"><span className="kicker">Projeto em funcionamento</span><h2>Conheça a página inicial.</h2><p>Veja uma prévia do sistema ou abra a experiência completa em uma nova guia.</p></div><div className="project-browser"><div className="browser-bar"><i/><i/><i/><small>{p.projectUrl}</small><a href={p.projectUrl} target="_blank" rel="noreferrer">Abrir <ExternalLink/></a></div><iframe src={p.projectUrl} title={`Página inicial do projeto ${p.name}`} loading="lazy"/></div><p className="embed-note">Se a prévia não carregar, o projeto impede exibição dentro de outros sites. O botão “Abrir projeto” continuará funcionando.</p></section>}
    <section className="section case-story"><Reveal><div className="story-index">01</div><div><span className="kicker">Problema</span><h2>O ponto de partida.</h2><p>{p.problem}</p></div></Reveal><Reveal><div className="story-index">02</div><div><span className="kicker">Ideia</span><h2>O caminho pensado.</h2><p>{p.idea}</p></div></Reveal><Reveal><div className="story-index">03</div><div><span className="kicker">Solução</span><h2>Do conceito à ferramenta.</h2><p>{p.solution}</p></div></Reveal></section>
    <section className="section section-muted case-grid"><div><span className="kicker">Funcionalidades</span><h2>O que compõe a solução.</h2><ul className="feature-list">{p.features.map(item=><li key={item}><Check/>{item}</li>)}</ul></div><aside><span className="kicker">Tecnologias</span><div className="tags large">{p.technologies.map(item=><span key={item}>{item}</span>)}</div><div className="result-card"><Target/><span>Resultado</span><p>{p.result}</p></div></aside></section>
    {Boolean(images.length)&&<section className="section gallery"><span className="kicker">Galeria do sistema</span><h2>Conheça as principais telas.</h2><p>Imagens reais da interface e da experiência do projeto.</p><div className={`gallery-grid project-gallery count-${images.length}`}>{images.slice(0,4).map((image,index)=><figure key={`${image.slice(0,30)}-${index}`}><img src={image} alt={`Tela ${index+1} do projeto ${p.name}`} loading="lazy"/><figcaption>{index===0?'Visão principal':`Tela ${index+1}`}</figcaption></figure>)}</div></section>}
  </article><section className="section"><CTA/></section></>;
}
