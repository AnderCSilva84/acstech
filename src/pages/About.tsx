import { ArrowRight, Code2, Compass, Layers3, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CTA, Reveal, SectionHead } from '../components/UI';
import { Seo } from '../components/Seo';

export default function About() {
  const values = [
    [Compass,'Contexto antes da solução','Perguntar, observar e mapear antes de decidir.'],
    [Layers3,'Simplicidade com estrutura','Interfaces claras sustentadas por uma base preparada para crescer.'],
    [Code2,'Qualidade pragmática','Decisões técnicas proporcionais ao risco e ao uso real.'],
  ] as const;
  return <>
    <Seo title="Sobre" description="Conheça a ACS Informática e seu fundador e responsável técnico, Anderson Costa e Silva."/>
    <section className="page-hero about-hero"><span className="kicker">Sobre a ACS</span><h1>A tecnologia começa<br/><em>entendendo o processo.</em></h1><p>A ACS Informática transforma desafios operacionais em produtos digitais claros, úteis e preparados para evoluir.</p></section>
    <section className="section manifesto"><Reveal><div className="manifesto-copy"><span className="kicker">Nossa abordagem</span><p className="lead">Uma empresa de tecnologia com olhar para o que acontece antes, durante e depois de cada clique.</p><p>Construímos sistemas web, PWAs e dashboards a partir de problemas concretos. Isso significa investigar o fluxo, ouvir quem executa, reduzir atritos e entregar uma ferramenta que se encaixe no trabalho — não o contrário.</p></div></Reveal></section>
    <section className="section section-muted founder"><div className="portrait" aria-hidden="true"><UserRound/></div><Reveal><div><span className="kicker">Fundador e responsável técnico</span><h2>Anderson Costa e Silva</h2><p className="lead">ACS são as iniciais de Anderson Costa e Silva — uma trajetória construída entre tecnologia, gestão e desenvolvimento de sistemas.</p><p>No início dos anos 2000, Anderson já atuava com manutenção de computadores, suporte técnico e redes, desenvolvendo uma base prática em hardware, infraestrutura e resolução de problemas. Foram anos trabalhando diretamente com tecnologia até que sua trajetória profissional o levou à área administrativa.</p><p>Nessa nova etapa, gerenciou a equipe do departamento financeiro da Minds English School e atuou como supervisor no CNA Idiomas. A experiência com pessoas, processos, controles e operação ampliou sua visão de negócio e trouxe um diferencial que hoje está presente em cada projeto da ACS.</p><p>Após a pandemia, retornou à sua grande paixão: a tecnologia. Agora, como analista e desenvolvedor de sistemas, com pós-graduação em Segurança da Informação, une engenharia de software, visão operacional e princípios de segurança para criar sistemas web, PWAs, dashboards e automações alinhados às necessidades reais de cada organização.</p><p>Essa combinação permite à ACS compreender o processo antes do código, estruturar soluções com responsabilidade técnica e desenvolver produtos digitais claros, seguros e preparados para evoluir.</p><Link className="text-link" to="/contato">Falar com Anderson <ArrowRight/></Link></div></Reveal></section>
    <section className="section"><SectionHead tag="Princípios" title="O que orienta cada entrega."/><div className="value-grid">{values.map(([Icon,title,text])=><Reveal key={title}><article><Icon/><h3>{title}</h3><p>{text}</p></article></Reveal>)}</div></section>
    <section className="section"><CTA/></section>
  </>;
}
