import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';

const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Solutions = lazy(() => import('./pages/Solutions'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
const AdminClients = lazy(() => import('./pages/AdminClients'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return <Layout><Suspense fallback={<div className="page-loader" role="status"><span/>Carregando experiência…</div>}><Routes>
    <Route path="/" element={<Home/>}/><Route path="/projetos" element={<Projects/>}/><Route path="/projetos/:slug" element={<ProjectDetail/>}/><Route path="/solucoes" element={<Solutions/>}/><Route path="/sobre" element={<About/>}/><Route path="/contato" element={<Contact/>}/><Route path="/cliente" element={<ClientPortal/>}/><Route path="/admin" element={<Admin/>}/><Route path="/admin/clientes" element={<AdminClients/>}/><Route path="*" element={<NotFound/>}/>
  </Routes></Suspense></Layout>;
}
