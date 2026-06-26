---
name: project-kickoff
description: >
  Processo para levar um projeto novo do problema ao código com ferramentas
  AI (Claude Code). Cobre o discovery — levantamento de requisitos,
  decisões de arquitetura e modelo de dados — e entrega o projeto ao
  pipeline de specs. Ativar quando o usuário quiser começar um projeto novo,
  planejar um sistema do zero, ou montar a estrutura de desenvolvimento com
  AI ("preciso de um sistema para...", "quero começar um projeto", "como
  estruturo um projeto novo", "me ajuda a planejar"). Referencia a skill
  it-analyst para análise técnica e troubleshooting.
---

# Project kickoff

> **Stub.** Esta skill é a **entrada humana** do discovery de um projeto novo.
> O processo em si está **versionado nos agentes** — o conteúdo que antes vivia
> aqui foi consolidado em `agente-kickoff.md` (discovery) e distribuído pelo
> resto do método (`pipeline.md`, `spec-guide.md`, agentes de review,
> `lessons-learned.md`). Esta skill só **bootstrapa**, pra não duplicar fonte.

## Como iniciar

1. No diretório do projeto novo:
   ```bash
   npx product-runner init
   ```
   Isso coloca `agente-prod-runner.md` + `agente-kickoff.md` na raiz.
2. Abra sua LLM no repositório (ex.: Claude Code) e peça:
   **"leia `agente-prod-runner.md` e siga"**.
   Ele diagnostica o estado do projeto e roteia para o **discovery**
   (`agente-kickoff.md`), que conduz problema → arquitetura → esboço de dados
   e entrega o briefing (`Kickoff.md` na raiz) à conceituação.

## Fonte da verdade

- **Discovery (este estágio):** `agente-kickoff.md`.
- **Entrada / roteamento:** `agente-prod-runner.md`.
- **Visão geral do método:** `pipeline.md`.

Não reproduza o processo aqui — esta skill aponta para os agentes versionados.
