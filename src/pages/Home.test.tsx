import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { projects } from '../data/projects';
import { Home } from './Home';
vi.mock('../data/projectStore', () => ({ useProjects: () => projects }));
afterEach(cleanup);
describe('portfólio da página inicial', () => {
  it('seleciona um projeto e oferece o case correto', async () => {
    render(<MemoryRouter><Home/></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /NAVIA Transporte/ }));
    expect(screen.getByRole('button', { name: /NAVIA Transporte/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /Conhecer o projeto/ })).toHaveAttribute('href', '/projetos/navia');
    expect(screen.getByRole('article', { name: 'Projeto NAVIA' })).toHaveTextContent('Passagens, fretes e encomendas');
  });
  it('explica as condições comerciais ao abrir uma dúvida', async () => {
    render(<MemoryRouter><Home/></MemoryRouter>);
    const question = screen.getByText('Quanto custa e como funciona o suporte?');
    await userEvent.click(question);
    expect(question.closest('details')).toHaveAttribute('open');
    expect(question.closest('details')).toHaveTextContent('Licenciamento, hospedagem, manutenção e suporte');
  });
});
