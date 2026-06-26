# Product Runner — Visão, Etapas e Horizontes

> Documento de visão consolidado. Resume o que é o produto, o caminho
> percorrido (em etapas/releases) e os horizontes que enxergamos. Vivo —
> atualizar conforme o método e a marca evoluem.
>
> Estado atual: **v0.5.0** (rename em revisão no PR #9). Repo ainda em
> `Henriquehgb/project-docs-blueprints`; npm `product-runner` livre, não publicado.

---

## 1. O que é (objetivo)

**Product Runner** é um conjunto de **harness, agentes e runners** que conduz a
**construção e a evolução de um produto** com low-coding / vibe-coding assistido —
do **briefing/discovery** até a **supervisão e aprovação de arquitetura** —
mantendo **consistência** e **evolução contínua do próprio processo**.

Não é "mais um spec-driven": o spec é só um estágio. O diferencial é cobrir o
ciclo inteiro (descoberta → arquitetura → review) **e** evoluir o método junto
com os projetos que o usam.

Dois diferenciais centrais:

1. **Método versionado com migrations** — o `update` + `migrations/x.y.z.md`
   propagam melhorias do processo para projetos **já existentes** (a maioria das
   ferramentas é "instale uma vez").
2. **Processo auto-evolutivo** — `lessons-learned` + o agente **Review.LLM**
   (meta) corrigem o **próprio pipeline** quando uma falha reincide.

---

## 2. Posicionamento (benchmark)

| Projeto | Cobertura | Diferença pro Product Runner |
|---|---|---|
| **GitHub Spec Kit** | Spec → Plan → Tasks → Implement | Starter kit, começa na spec; sem discovery, sem auto-evolução |
| **BMAD-METHOD** | SDLC inteiro, 12+ personas | Comparável mais direto (papéis), mas sem migrations no projeto vivo |
| **Agent OS** | Standards + specs | Foco em consistência de código; não conduz discovery→arquitetura |
| **OpenSpec** | Mudança incremental (brownfield) | Spec viva + deltas; leve, sem ciclo de produto |
| **Kiro (AWS)** | Spec-driven em IDE | IDE proprietária |

**Nicho do Product Runner:** o harness que mantém o método **consistente** e o
faz **evoluir continuamente**, do briefing à aprovação de arquitetura.

---

## 3. Arquitetura do método

### Pipeline (estágios 0–5)

```
0 discovery → 1 conceituação → 2 doc-funcional → 3 gerador-spec → 4 implementação → 5 review
  (kickoff)     (reqs/ldoc+hdoc)  (como-funciona)    (specs/)        (código+report)     │
                      └──────── protocolo-de-gates governa os gates ───────────────┘     │
                                                                                          ↓
5 · review (sub-cadeia):  Review.Code → User Review → Review.Product → Review.LLM
                          (veredito)    (uso humano)   (roteia)        (corrige pipeline)
```

### Agentes

| Agente | Papel |
|---|---|
| **agente-prod-runner** | Porta de entrada / roteador / ciclo de vida (scaffold, update, migrations) |
| **agente-kickoff** | Estágio 0 — discovery / briefing |
| **agente-conceituacao** | Estágio 1 — dor→conceito, roadmap, DER amplo |
| **agente-documentacao-funcional** | Estágio 2 — como a app funciona |
| **agente-gerador-spec** | Estágio 3 — corta o incremento em specs verticais |
| **agente-review-code** | Estágio 5 — review técnico (critério × código real) |
| **agente-user-review** | Estágio 5 — teste de usabilidade (julgamento humano) |
| **agente-review-product** | Estágio 5 — roteia feedback por causa-raiz |
| **agente-review-llm** | Estágio 5 (meta) — corrige o próprio pipeline |
| **protocolo-de-gates** | Transversal — gate e calibragem por stakes |

### Princípios de fundação

- **LDoc é fonte; HDoc é derivado** (nunca editado à mão).
- **Status se lê do conteúdo (a spec), não do índice** (`_overview`/tabelas são
  índice derivado que drift-a).
- **Gate por stakes**: alto risco → lista numerada, "ok" genérico não fecha.
- **Checklist binário vence atenção textual** (critérios meta M1–M4).

### Engine (CLI)

- `init` — entrega os agentes de bootstrap; o humano abre o `agente-prod-runner`.
- `scaffold` — gera `CLAUDE.md` (merge por diretivas `prod-runner-merge` +
  perfil cli/ssr) + `docs/` + seeds em `specs/` + manifesto.
- `update` — diff 3-way via manifesto (adiciona / auto-merge / revisar);
  normalização por Prettier; detecção de arquivos movidos.
- `migrations` — `migrations/x.y.z.md` com ops mecânicos (autoApply) ou handoff
  conduzido; rodam antes do diff de estado.

---

## 4. Etapas concluídas (linha do tempo)

### Fundação (pré-CLI)
Lições extraídas de **DocManager**, **tradeBot** e **trade-bot-painel** viram
templates vivos. O **pipeline de agentes** roda ponta a ponta pela 1ª vez no
trade-bot-painel (Incremento 1) — método vivo, tratado como hipótese.

### v0.2.x — Empacotamento como CLI
- Pacote npm com `init`, `scaffold`, `update`.
- Merge do `CLAUDE.md` por diretivas + manifesto.
- `update` ciente de projeto sem manifesto (modo legado) + normalização.

### v0.3.0 — Porta de entrada + estrutura
- `agente-prod-runner` (ex-`agente-pdb`) como entrada única (roteador + ciclo de vida).
- `_overview`/`_open-issues` saem de `docs/*.template` e viram seeds em `specs/`.
- **Primeira migration real** (0.3.0).

### v0.4.0 — Status content-derived + review como estágio _(esta sessão)_
- **Diagnóstico:** numa sessão de orientação, o agente respondeu "em que etapa
  estamos" a partir do **índice** (tabelas de status, lidas truncadas), não da
  **fonte** (as specs) — quase repassando divergência stale e confundindo
  "Decisões de implementação" (rastro do estágio 4) com "review feito" (estágio 5).
- **Correção no template:**
  - `pipeline.md`: estágio 5 expandido na sub-cadeia de review; seção
    **"Em que estágio estou?"** (orientar pelo rastro no conteúdo).
  - `claude-md.template.md`: cadeia completada com review; tabela de estado
    rebaixada a **índice derivado**; subseção de orientação.
  - `agents/README.md`: os 4 `agente-review-*` entram na tabela/diagrama.
  - `lessons-learned.md`: lição "Status se lê do conteúdo, não do índice".
- **Migration 0.4.0** (conduzida) + bump.
- **PR #8 — mergeado** na `main`.

### v0.5.0 — Rename para Product Runner _(esta sessão)_
- Benchmark de mercado (spec-kit, BMAD, Agent OS, OpenSpec, Kiro) + rodada de
  nomes; escolha de **`product-runner`** (npm + GitHub livres).
- `project-docs-blueprints` → `product-runner` em toda a identidade
  (name/bin, npx, npm view, manifesto `.product-runner.json`).
- Abreviação `pdb` → `prod-runner` (`agente-prod-runner`, `.prod-runner-update/`,
  diretivas `prod-runner-merge`).
- `update.ts`: **fallback** que lê o manifesto no nome antigo (projetos pré-rename).
- **Migration 0.5.0** (autoApply): rename do manifesto e do agente nos projetos.
- 28/28 testes. **PR #9 — aberto, aguardando merge.**

---

## 5. Horizontes

### H1 — Curto: fechar a marca e publicar _(próximo)_
- [ ] **Mergear o PR #9** (0.5.0) na `main`.
- [ ] **Renomear o repo** no GitHub para `product-runner` (mantém stars/issues, redireciona URLs).
- [ ] **Publicar no npm** a 0.5.0 (`npm publish`) — aloca o nome globalmente.
- [ ] (Opcional) **Registrar domínio** `product-runner.dev` para landing/docs.
- [ ] Acompanhar CI/review do PR.

### H2 — Médio: consolidar o método
- [ ] **`_overview` regenerável/derivado** — hoje é índice mantido à mão que
      drift-a; torná-lo derivável do conteúdo das specs (issue separada já sinalizada).
- [ ] **Validar a sub-cadeia de review em runs reais** — Review.Code → User
      Review → Review.Product → Review.LLM foi recém-especificada; só uma run a
      validou parcialmente. Fechar a **volta de reconciliação** (Review.Product →
      Conceituação) com evidência.
- [ ] **Acumular runs** do pipeline ponta a ponta em mais de um projeto (hoje:
      só trade-bot-painel, Incremento 1).
- [ ] Consolidar `lessons-learned` em diretivas mecânicas (procedimento > prosa)
      conforme reincidências aparecem (papel do Review.LLM).

### H3 — Longo: escala e ecossistema
- [ ] **Novos perfis** além de `cli`/`ssr` (ex.: mobile, data, serviço).
- [ ] **Marketplace de agentes/skills** plugáveis no método.
- [ ] Ponte automática entre ferramentas (Cowork ↔ Claude Code) sem copy-paste manual.
- [ ] Métricas de saúde do método (quanto o `update`/migrations economiza, taxa
      de drift de índice, reincidência de falhas).

---

## 6. Decisões em aberto / pendências

- **Abreviação `prod-runner`** — definida (substituiu `pdb`). `product`≠`prod` é
  uma pequena inconsistência aceita conscientemente.
- **Domínio** — RDAP não confirmou `.dev`/`.com` no ambiente; checar num registrar.
- **Repo vs npm vs org** — npm é o que trava a marca globalmente; nome de repo é
  único só por conta; org `product-runner` no GitHub ainda livre se quiser reservar.
- **`.pdb-update/` legado** — não migra por op (efêmero/gitignored); regenera como
  `.prod-runner-update/`. Projetos antigos podem ter a pasta velha órfã (inócua).

---

_Documento vivo. O método é tratado como hipótese até acumular runs — esta visão
acompanha essa postura: registrar o caminho sem cravar o que ainda não foi validado._
