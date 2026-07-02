# Arquitetura — Painel AUTOCORE

## Camadas (o padrão do projeto)

```
página / componente   → renderiza e interage (UI)
      │ usa
hook (React Query)     → estado de servidor: cache, loading, erro, paginação
      │ chama
service                → funções que falam com a API (axios)
      │ via
api.ts                 → cliente HTTP único (baseURL /api, JWT, 401→logout)
```

**Regra:** componente não chama `axios` direto. Sempre `componente → hook → service → api`. Estado de servidor mora no React Query (não em `useState`/`useEffect`).

## Estrutura de pastas

```
src/
├── auth/            · AuthContext (sessão), ProtectedRoute (guarda)
├── components/      · UI reutilizável e layouts (AppShell, SideBar)
├── hooks/           · hooks de dados (React Query): useInvoiceOverdue, ...
├── lib/             · utilitários (token storage)
├── pages/           · telas por rota (Login, Dashboard, Settings, ...)
├── services/        · api.ts + *.service.ts (clientes, invoices, auth, notification)
├── App.tsx          · definição das rotas
├── main.tsx         · providers (QueryClient, Router, Auth) + StrictMode
└── index.css        · design system (tokens @theme) — ver design-system.md
```

## Autenticação (fluxo)

1. `LoginPage` chama `useAuth().login({username, password})`.
2. `authService.login` faz `POST /api/auth/login`, recebe `{ token }` e salva via `tokenStorage` (localStorage).
3. `api.ts` (interceptor de request) injeta `Authorization: Bearer <token>` em toda chamada.
4. `ProtectedRoute` bloqueia rotas privadas quando não autenticado, redirecionando para `/login` (preservando o destino).
5. Se qualquer resposta vier **401**, o interceptor limpa o token e dispara o evento `auth:unauthorized`; o `AuthContext` derruba a sessão sem reload.

## Rotas

- `/login` — pública.
- `/dashboard`, `/clients`, `/settings` — protegidas, dentro do `AppShell` (sidebar).
- `/` e `*` — redirecionam para `/dashboard`.

## Comunicação com a API (sem CORS, sem host fixo)

`api.ts` usa `baseURL = /api` (relativo). Em **dev**, o proxy do Vite (`vite.config.ts`) encaminha `/api` para `VITE_API_PROXY_TARGET`. Em **produção**, o nginx serve `/api` no mesmo host. O browser sempre vê mesma origem.

## Dados (React Query)

- Um hook por recurso (`use*`). `queryKey` inclui parâmetros (ex.: page/limit) para refetch automático.
- `placeholderData: previousData` para paginação sem "piscar".
- Defaults globais em `main.tsx` (`retry: 1`, sem refetch no foco, `staleTime` 1 min).

## Performance & resiliência

- **Code splitting**: as páginas são `lazy()` + `<Suspense>` (ver `App.tsx`) — cada rota é um chunk. A landing pública não baixa o JS do painel, e vice-versa. Fallback de carregamento em `components/RouteFallback`.
- **ErrorBoundary** global (`components/ErrorBoundary`, montado no `main.tsx`) evita tela branca em erro de render e oferece "Recarregar". Ponto natural para plugar observabilidade (Sentry).
- **React Query**: cache + `invalidateQueries` nas mutations (a UI atualiza sozinha); `placeholderData` para paginação sem flicker.
- **Skeletons** de loading nas listas/cards (sem "pulos" de layout).

## Convenções

- `verbatimModuleSyntax` ligado → **importar tipos com `import type`**.
- `noUnusedLocals/Parameters` ligados → nada de variável/parâmetro sem uso.
- Sem `any` novo em código de produção (o legado será migrado).
