import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, LockKeyhole, Menu, MessageCircle, Moon, Sun, UsersRound, X } from 'lucide-react';

const nav = [['/','Início'],['/projetos','Projetos'],['/solucoes','Soluções'],['/sobre','Sobre'],['/contato','Contato'],['/cliente','Área do Cliente']];

function Brand() {
  return <Link to="/" className="brand" aria-label="ACS Informática, início">
    <span className="brand-logo-wrap"><img className="brand-logo" src="/acs-informatica-logo.png" alt="ACS Informática"/></span>
  </Link>;
}

export function Layout({children}:{children:ReactNode}) {
  const [open,setOpen]=useState(false);
  const [theme,setTheme]=useState(()=>localStorage.getItem('acs-theme')||'light');
  const location=useLocation();
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('acs-theme',theme);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#07101d':'#f5f7f8')},[theme]);
  useEffect(()=>{setOpen(false);window.scrollTo({top:0,behavior:'smooth'})},[location.pathname]);
  const whatsapp=import.meta.env.VITE_WHATSAPP_NUMBER;
  const wa=whatsapp?`https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá! Conheci a ACS Informática pelo site e gostaria de conversar sobre um projeto.')}`:'/contato';

  return <>
    <a className="skip" href="#conteudo">Pular para o conteúdo</a>
    <header className="header">
      <Brand/>
      <nav className={open?'nav open':'nav'} aria-label="Principal">
        {nav.map(([to,label])=><NavLink key={to} to={to} end={to==='/' }>{label}</NavLink>)}
        <Link className="button button-small" to="/contato">Fale com a ACS <ArrowUpRight size={16}/></Link>
      </nav>
      <div className="header-actions">
        <button className="icon-button" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label={`Ativar tema ${theme==='dark'?'claro':'escuro'}`}>{theme==='dark'?<Sun/>:<Moon/>}</button>
        <button className="icon-button menu-button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Abrir menu">{open?<X/>:<Menu/>}</button>
      </div>
    </header>
    <main id="conteudo">{children}</main>
    <footer>
      <div><Brand/><p>Tecnologia que transforma processos.</p></div>
      <div className="footer-links">{nav.slice(1).map(([to,label])=><Link key={to} to={to}>{label}</Link>)}<Link to="/admin" className="admin-link"><LockKeyhole/> Projetos</Link><Link to="/admin/clientes" className="admin-link"><UsersRound/> Clientes</Link></div>
      <small>© {new Date().getFullYear()} ACS Informática. Todos os direitos reservados.</small>
    </footer>
    <a className="whatsapp" href={wa} target={whatsapp?'_blank':undefined} rel="noreferrer" aria-label="Conversar com a ACS"><MessageCircle/><span>Vamos conversar?</span></a>
  </>;
}
