import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Code2, MonitorSmartphone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjects } from '../data/projectStore';
import { ProjectVisual } from '../components/UI';
import { Seo } from '../components/Seo';

const steps = [
  ['Conversa', 'Você conta como trabalha, o que trava a operação e o que precisa melhorar.'],
  ['Proposta', 'Definimos funcionalidades, investimento e etapas antes de começar.'],
  ['Construção', 'Você acompanha o desenvolvimento e valida os principais fluxos.'],
  ['Entrega e evolução', 'Implantamos a solução e combinamos suporte e próximos passos.'],
];
const questions = [
  ['Preciso de um sistema pronto ou sob medida?', 'Depende da sua operação. Podemos partir de uma solução da ACS ou desenvolver um projeto específico. A primeira conversa serve para identificar o caminho mais adequado.'],
  ['Funciona no celular e no computador?', 'Desenvolvemos interfaces responsivas para diferentes telas. Recursos como instalação PWA, uso offline e integração com equipamentos são definidos conforme o escopo de cada projeto.'],
  ['Quanto custa e como funciona o suporte?', 'O investimento depende das funcionalidades, integrações e implantação. Licenciamento, hospedagem, manutenção e suporte são apresentados na proposta, com as condições de cada solução.'],
  ['Posso testar os projetos do portfólio?', 'Cada case apresenta sua proposta, recursos e tecnologias. Quando houver uma demonstração pública disponível, você encontrará o acesso na página do projeto. Sistemas com dados restritos exigem uma apresentação acompanhada.'],
];

export function Home() {
  const projects = useProjects();
  const [slug, setSlug] = useState('');
  const [slide, setSlide] = useState(0);
  const selected = projects.find(p => p.slug === slug) || projects.find(p => p.featured) || projects[0];
  const images = selected ? (selected.galleryImages?.length ? selected.galleryImages : selected.coverImage ? [selected.coverImage] : []) : [];
  useEffect(() => { setSlide(0); }, [selected?.slug]);
  const currentSlide = images.length ? slide % images.length : 0;
  const number = import.meta.env.VITE_WHATSAPP_NUMBER;
  const whatsapp = number ? `https://wa.me/${number}?text=${encodeURIComponent('Olá! Conheci o portfólio da ACS Tecnologia e quero conversar sobre uma solução para meu negócio.')}` : '';
  const contact = (label: string, secondary = false) => whatsapp
    ? <a className={`button${secondary ? ' button-ghost' : ''}`} href={whatsapp} target="_blank" rel="noreferrer">{label}<MessageCircle size={18}/></a>
    : <Link className={`button${secondary ? ' button-ghost' : ''}`} to="/contato">{label}<ArrowUpRight size={18}/></Link>;

  return <div className="acs-landing">
    <Seo title="Sistemas para negócios reais" description="Conheça os projetos da ACS Tecnologia: sistemas web, PWAs, gestão, vendas e automações. Soluções inteligentes. Tecnologia que conecta."/>
    <section className="landing-hero">
      <div className="landing-hero-copy">
        <span className="landing-label"><i/> ACS TECNOLOGIA · SISTEMAS E APLICATIVOS</span>
        <h1>Seu negócio tem<br/>um jeito próprio.<br/><em>Seu sistema também.</em></h1>
        <p>Do atendimento à gestão, construímos soluções que acompanham sua rotina. Menos trabalho repetido. Mais clareza para seguir em frente.</p>
        <div className="hero-actions">{contact('Vamos falar do seu projeto')}<a className="text-link" href="#portfolio">Explorar portfólio <ArrowRight size={17}/></a></div>
        <div className="landing-benefits"><span><Check/> Soluções sob medida</span><span><Check/> Celular e computador</span><span><Check/> Conversa direta</span></div>
      </div>
      <a className="hero-case" href="#portfolio" aria-label="Explorar os sistemas do portfólio">
        <div className="hero-case-top"><span>DA IDEIA À OPERAÇÃO</span><ArrowUpRight size={24}/></div>
        {selected && <ProjectVisual project={selected}/>}
        <div className="hero-case-bottom"><div><small>CONHEÇA UM PROJETO ACS</small><h2>{selected?.name || 'Sistemas que conectam'}</h2></div><span>Explorar<br/>o projeto ↗</span></div>
      </a>
    </section>
    <div className="landing-strip"><span>TECNOLOGIA QUE CONECTA</span><b>Sistemas web</b><i/><b>Aplicativos PWA</b><i/><b>Dashboards</b><i/><b>Automações</b></div>
    <section id="portfolio" className="landing-section portfolio-section">
      <div className="landing-section-heading"><div><span className="landing-label">PORTFÓLIO / PROJETOS ACS</span><h2>Conheça o que<br/><em>já saiu do papel.</em></h2></div><p>Explore cada projeto, veja o problema que ele resolve e descubra o que podemos construir para a sua operação.</p></div>
      {selected ? <>
        <div className="project-selector" role="group" aria-label="Escolha um projeto">{projects.map(p => <button key={p.slug} type="button" aria-pressed={selected.slug === p.slug} onClick={() => setSlug(p.slug)}><span>{p.name}</span><small>{p.eyebrow}</small></button>)}</div>
        <article className="portfolio-stage" aria-label={`Projeto ${selected.name}`}>
          <div className="portfolio-screen">
            <div className="screen-chrome"><span><i/><i/><i/></span><small>{selected.name} / {images.length ? 'Telas do projeto' : 'Identidade do projeto'}</small><MonitorSmartphone size={18}/></div>
            {images.length ? <img className="portfolio-image" src={images[currentSlide]} alt={`Tela ${currentSlide + 1} do projeto ${selected.name}`}/> : <><ProjectVisual project={selected}/><span className="illustration-note">Representação visual · veja os recursos ao lado</span></>}
            {images.length > 1 && <div className="gallery-controls"><button onClick={() => setSlide((currentSlide + images.length - 1) % images.length)} aria-label="Tela anterior"><ChevronLeft/></button><span aria-live="polite">{currentSlide + 1} / {images.length}</span><button onClick={() => setSlide((currentSlide + 1) % images.length)} aria-label="Próxima tela"><ChevronRight/></button></div>}
          </div>
          <div className="portfolio-description" aria-live="polite"><span className="landing-label">{selected.eyebrow}</span><span className="portfolio-status">{selected.status}</span><h3>{selected.name}</h3><p>{selected.summary}</p><ul>{selected.features.slice(0,4).map(feature => <li key={feature}><Check size={16}/>{feature}</li>)}</ul><div className="tags">{selected.technologies.slice(0,5).map(t => <span key={t}>{t}</span>)}</div><Link className="button" to={`/projetos/${selected.slug}`}>Conhecer o projeto <ArrowUpRight size={18}/></Link></div>
        </article>
      </> : <p>Os projetos estão sendo atualizados. Converse com a ACS para conhecer nossas soluções.</p>}
      <Link className="text-link portfolio-all" to="/projetos">Ver todos os cases e detalhes <ArrowRight size={17}/></Link>
    </section>
    <section className="landing-section landing-value"><span className="landing-label">O QUE MUDA NA SUA ROTINA</span><h2>Tecnologia boa aparece<br/><em>no trabalho que fica mais fácil.</em></h2><div className="value-grid">{[
      ['01', 'Sua operação, conectada.', 'Vendas, cadastros, estoque e relatórios podem compartilhar um fluxo claro, sem espalhar informação por vários lugares.'],
      ['02', 'Informação para decidir.', 'Painéis e relatórios ajudam a acompanhar o que acontece e encontrar o que precisa de atenção.'],
      ['03', 'Uma solução que acompanha você.', 'Interfaces práticas para usar no balcão, no escritório ou em campo, conforme as necessidades do projeto.'],
    ].map(([n,title,text]) => <div key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
    <section className="landing-section landing-process"><div className="landing-section-heading"><div><span className="landing-label">COMO TRABALHAMOS</span><h2>Da primeira conversa<br/>ao próximo passo.</h2></div><p>Você conversa com quem desenvolve. Escopo claro, acompanhamento e decisões ligadas ao seu negócio.</p></div><ol>{steps.map(([title,text],i) => <li key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
    <section className="landing-section landing-founder"><div className="founder-code"><Code2 size={48}/><span>PROCESSOS + TECNOLOGIA</span><strong>O sistema começa<br/>antes do código.</strong><small>Anderson Costa e Silva / ACS Tecnologia</small></div><div><span className="landing-label">QUEM ESTÁ POR TRÁS</span><h2>Prazer, Anderson.</h2><p>Minha experiência em administração e operações orienta o jeito como desenvolvo sistemas: primeiro entender o trabalho, depois construir a ferramenta.</p><p>A ACS Tecnologia nasce dessa conexão entre gestão e desenvolvimento, com projetos para comércio, transporte, fiscalização e organização do dia a dia.</p><Link className="text-link" to="/sobre">Conheça a ACS <ArrowRight size={17}/></Link></div></section>
    <section className="landing-section landing-faq"><div><span className="landing-label">SEM COMPLICAÇÃO</span><h2>Antes de<br/>começar.</h2></div><div>{questions.map(([question,answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    <section className="landing-section"><div className="landing-cta"><span className="landing-label">VAMOS CONSTRUIR O PRÓXIMO?</span><h2>Qual parte do seu negócio<br/><em>pode funcionar melhor?</em></h2><p>Conte seu desafio. Vamos encontrar uma solução que faça sentido para a sua rotina.</p>{contact('Conversar com a ACS')}<small>Soluções inteligentes. Tecnologia que conecta.</small></div></section>
  </div>;
}
