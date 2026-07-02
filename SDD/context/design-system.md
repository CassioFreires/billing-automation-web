# Design System — AUTOCORE (dark premium)

Fonte única dos tokens: `src/index.css`, dentro de `@theme` (Tailwind v4).

## Como funciona (Tailwind v4)

No Tailwind v4 os tokens declarados em `@theme` **viram utilitários automaticamente**:

- `--color-brand-primary` → `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`
- `--animate-fade-in` → `animate-fade-in`

> ⚠️ Erro comum (que existia aqui): declarar as cores só em `:root` **não** gera utilitário. Tem que ser em `@theme`.

## Tokens

| Token | Uso |
|---|---|
| `bg-main` (`#070b14`) | fundo da página |
| `bg-card` (`#0f1626`) | cards / superfícies |
| `bg-elevated` (`#16203a`) | hover / elevado |
| `border-subtle` (`#1e293b`) | bordas |
| `brand-primary` (`#0ea5e9`) | marca / ações primárias |
| `brand-hover` (`#38bdf8`) | hover da marca |
| `brand-success` / `brand-warning` / `brand-danger` | estados semânticos |
| `text-main` / `text-muted` / `text-faint` | hierarquia de texto |

Fonte: **Inter** (`font-sans`), carregada no `index.html`.
Animações: `animate-fade-in`, `animate-fade-in-up`.
Foco acessível: classe utilitária `focus-ring` (outline da marca no `:focus-visible`).

## Regras de UI/UX

1. **Consistência de raio**: cards `rounded-2xl`, controles `rounded-xl`.
2. **Hierarquia por cor de texto**: título `text-main`, apoio `text-muted`, legendas `text-faint`.
3. **Estados sempre visíveis**: loading (skeleton/spinner), vazio (mensagem clara), erro (cor `danger` + o que fazer).
4. **Microinterações discretas**: `transition-all`, `active:scale-[0.98]` em botões; nada exagerado.
5. **Acessibilidade**: use `focus-ring`, `aria-label` em botões só-ícone, contraste adequado.
6. **Mobile-first**: layout responsivo (a sidebar já colapsa em `lg`).
7. **Performance**: evitar re-render desnecessário; estado de servidor no React Query; imagens otimizadas.

## Ao criar um componente novo

- Use os tokens (não hardcode hex).
- Prefira composição pequena e reutilizável em `components/`.
- Se precisar de um token novo, **adicione em `@theme`** e documente aqui.
