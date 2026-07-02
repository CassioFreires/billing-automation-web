# SDD — billing-automation-web

Base de conhecimento do **frontend** (painel AUTOCORE). Mesmo espírito do SDD do backend: **contexto antes de código**.

Este é o painel web que consome a `billing-automation-api`. Stack: **React 19 + Vite + Tailwind v4 + TanStack Query + React Router + axios**.

## Como usar

1. **Entrar pela primeira vez?** Leia `context/` na ordem: `overview` → `architecture` → `design-system`.
2. **Vai criar uma tela/feature?** Siga os padrões de `architecture.md` (camadas service → hook → página) e use os tokens de `design-system.md`.
3. **Mudou comportamento?** Atualize o contexto aqui no mesmo commit.

## Estrutura

```
SDD/
├── README.md
└── context/
    ├── overview.md       · o que o painel é, capacidades e estado
    ├── architecture.md   · pastas, camadas, auth, rotas, dados (React Query)
    └── design-system.md  · tokens (Tailwind v4 @theme), regras de UI/UX
```

## Rodar

```bash
cp .env.example .env      # ajuste VITE_API_PROXY_TARGET para sua API
npm install
npm run dev               # http://localhost:5173
```

O painel fala com a API por caminho relativo `/api` (proxy do Vite em dev, nginx em produção) — sem CORS, sem host fixo.
