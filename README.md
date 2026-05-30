# 📊 Automated Billing Dashboard

Uma interface administrativa moderna, responsiva e de alta performance desenvolvida para gerenciar agendamentos de cobrança, monitorar disparos de WhatsApp via n8n e acompanhar métricas de adimplência em tempo real.

---

## 🛠️ Tecnologias e Ecossistema

* **Framework Principal:** [Sua Tecnologia - ex: React.js / Next.js / Vue.js]
* **Linguagem:** TypeScript (Garantindo tipagem estática e segurança no código)
* **Estilização:** [ex: Tailwind CSS / Shadcn UI / Chakra UI]
* **Gerenciamento de Estado & Cache:** [ex: TanStack Query (React Query) / Redux Toolkit]
* **Gráficos e Métricas:** [ex: Recharts / Chart.js]

---

## ⚙️ Funcionalidades Principais

* **Painel de Métricas (Analytics):** Visualização em tempo real de cobranças enviadas, pagas, pendentes e taxa de conversão de mensagens.
* **Gerenciador de Agendamentos:** Interface CRUD para criar, editar ou pausar réguas de cobrança automatizadas.
* **Fila de Disparos em Tempo Real:** Monitoramento do status de envio das mensagens (Aguardando Fila, Enviado ao n8n, Entregue no WhatsApp, Falhou).
* **Logs de Integração:** Tela dedicada para visualizar o histórico de payloads enviados para o n8n para facilitar o debug.

---

## 🛡️ Boas Práticas Implementadas

### 🔒 Segurança e Autenticação
* **Rotas Protegidas:** Sistema de Guards que impede o acesso de usuários não autenticados.
* **Gestão de Tokens:** Armazenamento seguro de tokens JWT (via HttpOnly Cookies ou memória com refresh token).
* **Sanitização de Inputs:** Proteção contra ataques de XSS (Cross-Site Scripting) em formulários de cadastro de clientes.

### ⚡ Performance & UX
* **Client-side Caching (TanStack Query):** Redução drástica de requisições repetidas para a API, mantendo a interface instantânea e economizando banda.
* **Optimistic Updates:** A interface atualiza o status visual da cobrança antes mesmo da resposta final do servidor, melhorando a percepção de velocidade do usuário.
* **Lazy Loading / Code Splitting:** Carregamento sob demanda das páginas e gráficos pesados, otimizando o tempo de carregamento inicial (FCP/LCP).

### 🧩 Estrutura de Código
* **Componentização Atômica:** Componentes visuais altamente reutilizáveis, isolados e fáceis de testar.
* **Zonamento de Contexto:** Separação clara entre lógica de API (Hooks customizados), UI (Componentes) e regras de validação (Zod/Yup).

---

## 🗺️ Visual da Arquitetura Interna

```text
src/
├── assets/          # Imagens, ícones e fontes
├── components/      # Componentes globais e reutilizáveis (Botões, Cards, Modais)
├── config/          # Instância do Axios/Fetch, rotas e constantes
├── hooks/           # Custom hooks para consumo da API (Queries e Mutations)
├── pages/ ou app/   # Estrutura de rotas do painel (Dashboard, Cobranças, Configurações)
├── styles/          # Configurações globais de CSS / Tailwind
└── types/           # Interfaces e Tipagens do TypeScript
