import {
  Activity,
  ArrowRight,
  Blocks,
  ChartNoAxesCombined,
  CheckCircle2,
  CloudCog,
  Database,
  LayoutDashboard,
  PanelsTopLeft,
  Smartphone,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjects } from '../data/projectStore';
import { CTA, ProjectCard, Reveal, SectionHead } from '../components/UI';
import { Seo } from '../components/Seo';

const services = [
  ['Sistemas web', PanelsTopLeft, 'Plataformas rápidas e responsivas para centralizar sua operação.'],
  ['Aplicativos e PWAs', Smartphone, 'Experiências instaláveis que acompanham equipes em qualquer dispositivo.'],
  ['Sistemas administrativos', Blocks, 'Controles claros para reduzir retrabalho e organizar processos.'],
  ['Dashboards', LayoutDashboard, 'Indicadores que transformam dados em decisões compreensíveis.'],
  ['Automação', Workflow, 'Etapas conectadas para poupar tempo e reduzir tarefas repetitivas.'],
  ['Soluções sob medida', CloudCog, 'Tecnologia desenhada a partir da realidade do seu negócio.'],
] as const;

export function Home() {
  const projects=useProjects();
  return <>
    <Seo title="Do problema ao sistema" description="A ACS Informática cria sistemas web, PWAs e dashboards sob medida para problemas reais."/>
    <section className="hero">
      <div className="hero-copy">
        <span className="kicker">Software sob medida</span>
        <h1>Transformamos problemas reais em <em>sistemas inteligentes.</em></h1>
        <p>A ACS Informática projeta e desenvolve sistemas web, PWAs e plataformas sob medida para operações, empresas e pessoas.</p>
        <div className="hero-actions">
          <Link className="button" to="/projetos">Explorar projetos <ArrowRight size={17}/></Link>
          <Link className="button button-ghost" to="/contato">Solicitar uma solução</Link>
        </div>
        <div className="hero-proof"><span>Estratégia</span><i/><span>Design</span><i/><span>Tecnologia</span></div>
      </div>

      <div className="hero-system" aria-label="Painel ilustrativo conectando operação, dados e pessoas">
        <div className="system-glow"/>
        <div className="system-panel">
          <div className="system-panel-head">
            <div className="system-identity"><span>Painel</span><small>Visão operacional</small></div>
            <span className="system-live"><i/> Sistema ativo</span>
          </div>
          <div className="system-metric">
            <span>Fluxos integrados</span>
            <strong>24</strong>
            <small><Activity/> Operação acompanhada em tempo real</small>
          </div>
          <div className="system-chart" aria-hidden="true">
            {[38,55,48,72,65,88,78,94].map((height,index)=><i key={index} style={{height:`${height}%`}}/>) }
          </div>
          <div className="system-status"><CheckCircle2/><span><b>Processos organizados</b><small>Dados claros para decidir melhor</small></span></div>
        </div>
        <div className="system-float float-operation"><span><ChartNoAxesCombined/></span><div><b>Operação</b><small>Fluxos centralizados</small></div></div>
        <div className="system-float float-data"><span><Database/></span><div><b>Dados</b><small>Informação confiável</small></div></div>
        <div className="system-float float-people"><span><UsersRound/></span><div><b>Pessoas</b><small>Experiência simples</small></div></div>
      </div>
    </section>

    <section className="trust-strip"><span>Não vendemos apenas código.</span><strong>Entendemos o processo, desenhamos o caminho e entregamos a ferramenta.</strong></section>
    <section className="section">
      <Reveal><SectionHead tag="O que construímos" title="Tecnologia útil, pensada para o trabalho real." text="Da primeira conversa à evolução do produto, cada solução nasce do contexto de quem vai utilizá-la."/></Reveal>
      <div className="service-grid">{services.map(([title,Icon,text],i)=><Reveal key={title}><Link className="service-card" to="/solucoes"><span>0{i+1}</span><Icon/><h3>{title}</h3><p>{text}</p><ArrowRight className="service-arrow"/></Link></Reveal>)}</div>
    </section>
    <section className="section section-muted">
      <Reveal><SectionHead tag="Projetos em destaque" title="Sistemas que saíram do papel." text="Cada case combina contexto, decisões de produto e uma solução criada para uma necessidade concreta."/></Reveal>
      <div className="project-grid">{projects.filter(p=>p.featured).map(p=><Reveal key={p.slug}><ProjectCard project={p}/></Reveal>)}</div>
      <div className="center"><Link className="button button-ghost" to="/projetos">Ver catálogo completo <ArrowRight size={17}/></Link></div>
    </section>
    <section className="section">
      <Reveal><SectionHead tag="Como trabalhamos" title="Clareza em cada etapa."/></Reveal>
      <ol className="process">{['Entender','Planejar','Prototipar','Desenvolver','Testar','Implantar','Evoluir'].map((x,i)=><li key={x}><span>{String(i+1).padStart(2,'0')}</span><b>{x}</b></li>)}</ol>
    </section>
    <section className="section founder-teaser">
      <Reveal><div><span className="kicker">Visão de negócio + execução técnica</span><h2>A ACS entende processos antes de escrever código.</h2><p>A experiência de Anderson Costa e Silva em administração e operações orienta uma abordagem prática: tecnologia só faz sentido quando melhora o trabalho de verdade.</p><Link className="text-link" to="/sobre">Conheça a história da ACS <ArrowRight size={16}/></Link></div></Reveal>
      <div className="founder-mark"><span>Anderson</span><small><b>Anderson Costa e Silva</b><br/>Fundador e responsável técnico.<br/>Tecnologia, processos e gestão.</small></div>
    </section>
    <section className="section"><CTA/></section>
  </>;
}
