# ACS Tecnologia

Site institucional, portfólio e catálogo comercial da ACS Tecnologia. A aplicação apresenta os projetos como estudos de caso, organiza as soluções oferecidas e oferece um canal de contato preparado para integração segura.

## Stack

- React, Vite e TypeScript
- React Router e carregamento sob demanda
- Framer Motion e Lucide
- PWA com service worker
- Vitest e React Testing Library

## Executar

```bash
npm install
npm run dev
```

Validação completa:

```bash
npm run lint
npm run test:run
npm run build
```

## Configuração

Copie `.env.example` para `.env.local`. Configure `VITE_WHATSAPP_NUMBER` somente com dígitos e `VITE_CONTACT_ENDPOINT` com o endpoint seguro do formulário. Sem endpoint, o formulário funciona como demonstração e não transmite dados.

Os projetos ficam centralizados em `src/data/projects.ts`. Novos cases podem ser adicionados sem alterar os componentes.

## Deploy

A pasta `dist/` gerada pelo build pode ser publicada no Netlify, Firebase Hosting ou outro host estático com fallback de rotas para `index.html`.
