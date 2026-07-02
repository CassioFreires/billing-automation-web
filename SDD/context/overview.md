# Overview — Painel AUTOCORE

## Propósito

Interface web para o operador (dono do negócio / equipe de cobrança) gerenciar a automação de cobrança: autenticar, ver a saúde financeira, gerenciar inadimplentes e disparar/acompanhar cobranças por WhatsApp. Consome a `billing-automation-api`.

## Público

Multi-tenant: cada usuário loga na conta (tenant) dele e vê apenas seus dados. O token JWT carrega o `tenantId`; o backend isola tudo.

## Capacidades

| Recurso | Estado |
|---|---|
| Login (JWT) + rotas protegidas | ✅ Fundação |
| Layout autenticado (sidebar + navegação por rotas) | ✅ Fundação |
| Dashboard (métricas) | 🟡 Mockado — a ligar aos dados reais |
| Inadimplência (faturas em atraso, paginada) | ✅ Dados reais (React Query) |
| Disparo manual de cobrança | ✅ Via `/notifications/trigger-overdue/:id` |
| CRUD de clientes | ⏳ A construir |
| CRUD/consulta de faturas (todas) | ⏳ A construir (`GET /invoices`) |
| Tema dual claro/escuro | ⏳ Futuro |

## Princípios de produto (o que buscamos)

Simplicidade, elegância e performance. Uma experiência que o cliente **ama navegar**: rápida, previsível, acessível, com microinterações discretas e zero fricção. Dark premium como identidade.

## Relação com o backend

- Contrato das rotas: ver `../../billing-automation-api/postman/GUIA-DE-TESTES.md`.
- Fluxo de ponta a ponta (n8n → fila → worker → pagamento): `../../billing-automation-api/SDD/context/fluxo-completo.md`.
