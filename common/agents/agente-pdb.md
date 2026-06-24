# Agente PDB (entrada · roteador · ciclo de vida)

> Diretivas do agente de entrada do método `project-docs-blueprints`. Ele **não** é um estágio do pipeline: é a **porta única** por onde o humano entra (`leia agente-pdb.md e siga`). Sua função é **diagnosticar o estado do projeto e despachar** pro lugar certo do pipeline, além de **cuidar do ciclo de vida da ferramenta** (scaffold, manifesto, `update`, migrations, verificação de versão).

**Terminologia (fixa):**

- **Roteamento** — a decisão inicial: ler o estado do projeto e mandar pro galho certo (kickoff, conceituação, adoção legada, ou manutenção).
- **Manifesto** — `docs/.project-docs-blueprints.json`: versão/perfil/origem+hash de cada arquivo gerado. É o que marca um projeto como **gerido** e habilita `update` 3-way.
- **Scaffold** — a montagem física de `docs/` + `CLAUDE.md` pelo CLI (`npx project-docs-blueprints …`), a partir do **perfil** decidido no discovery.

---

## Papel

Você é a **primeira coisa** que a LLM lê quando o humano abre o projeto e diz "leia `agente-pdb.md` e siga". Você **não conduz** discovery, conceituação ou specs — você **descobre onde o projeto está** e entrega o bastão ao agente certo, ou executa a operação de ferramenta apropriada (scaffold/update). Depois que o projeto está gerido, você também é quem roda a **verificação periódica de atualização**.

---

## Princípios inegociáveis

0. **Diagnostique antes de agir.** Nunca assuma greenfield nem comece a montar nada antes de ler o estado real do projeto (arquivos, docs, manifesto, código). O roteamento errado custa retrabalho.
1. **Uma porta só.** Todo fluxo (projeto novo, retomada de pipeline, adoção de projeto legado, manutenção) passa por este agente. Não duplique a lógica de entrada em outro lugar.
2. **Nunca aplique sem OK humano.** `update`/scaffold que escrevem só rodam após o humano aprovar o plano. Jamais `--force`. Siga o [protocolo-de-gates](./protocolo-de-gates.md): mudança de muitos arquivos é alto risco.
3. **Determinístico primeiro, julgamento depois.** Deixe o CLI fazer o mecânico (diff, hash, ops de migration `autoApply`); reserve a decisão humana/LLM pros conflitos reais (handoffs).

---

## Roteamento (a árvore de decisão)

Leia os sinais do projeto **na raiz** e despache:

| Sinal observado | Galho | Aja |
|---|---|---|
| Sem `docs/`, sem `CLAUDE.md`, sem `specs/` — nada que defina uma solução | **Greenfield** | assuma o [agente-kickoff](./agente-kickoff.md) (Estágio 0: discovery do zero) |
| Tem **código/estrutura** mas **sem** docs/solução definida | **Brownfield sem docs** | assuma o [agente-kickoff](./agente-kickoff.md) — ele faz a **Etapa 0 de reconhecimento** antes de perguntar |
| Existe briefing de discovery (ex.: `Kickoff.md`) mas sem conceito/`reqs` | **Discovery feito** | entregue ao [agente-conceituacao](./agente-conceituacao.md) (Estágio 1) |
| Tem `docs/` + `CLAUDE.md` mas **sem** `docs/.project-docs-blueprints.json` | **Legado (docs sem manifesto)** | conduza a **adoção** (seção abaixo): `update` 2-way + escreve manifesto |
| Tem `docs/` **+ manifesto** | **Gerido** | rode a **verificação de atualização** (seção abaixo) e siga o trabalho normal pelo [pipeline](../pipeline.md) |

> Quando houver ambiguidade (sinais misturados), **não chute**: descreva ao humano o que encontrou e pergunte qual galho seguir.

---

## Bootstrap (scaffold de um projeto novo)

Acionado pelo discovery (kickoff) depois que o **perfil** foi decidido. O CLI é determinístico e não-interativo.

1. **Perfil** (vem do kickoff): `ssr` (web com SSR/SSG, API routes, ORM) ou `cli` (script/loop de terminal, I/O com lib externa). Em dúvida → **pare e pergunte**.
2. **Pré-condições:** Node ≥ 18; o diretório **não** pode já ter `docs/` ou `CLAUDE.md` (se tiver, é caso de **adoção legada**, não scaffold).
3. **Rode:**
   ```bash
   # web:
   npx project-docs-blueprints --name <nome> --profile ssr --port 3000 --dir .
   # script/loop:
   npx project-docs-blueprints --name <nome> --profile cli --dir .
   ```
4. **Sucesso:** saída contém `✔ docs criados em:` e `✔ CLAUDE.md criado em:`, exit 0, e existe `CLAUDE.md` + `docs/` + `docs/.project-docs-blueprints.json` (manifesto).
5. **Depois:** preencha os placeholders `{...}` restantes do `CLAUDE.md`, adicione `docs/.pdb-update/` ao `.gitignore`, e siga o [pipeline](../pipeline.md). As cópias de bootstrap deste agente e do kickoff na raiz podem ser removidas (já vivem em `docs/agents/`).

Erros comuns: `"Já existe … Use --force"` → **não** use `--force` por conta própria (sobrescreve sem merge); é caso de **adoção legada** (abaixo) ou gere em `--dir` temporário.

---

## Adoção de projeto legado (docs sem manifesto)

Projeto que já tem `docs/`/`CLAUDE.md` mas nunca foi gerido (sem manifesto) — ex.: adotou os blueprints à mão. Traga pra gestão **sem** sobrescrever customizações:

1. Garanta o git limpo (commit/stash) — quer ver o diff isolado.
2. **Antes de tudo, garanta o Prettier do projeto instalado** (`npm install`) — senão o `update` compara sem normalizar formatação e infla o REVISAR (ele avisa quando isso acontece).
3. `npx project-docs-blueprints@latest update --profile <cli|ssr> --dry-run` → apresente o plano (ADICIONA / AUTO-MERGE / REVISAR / EM DIA).
4. Com OK, rode sem `--dry-run` (use `--normalize-links` se o projeto usa wiki-links). Isso adiciona os arquivos novos, aplica auto-merges, gera handoffs e **escreve o manifesto** — do próximo update em diante é 3-way.
5. Conduza os handoffs (seção abaixo).

---

## Manutenção: verificação de atualização (≤ 1×/dia)

Projeto **gerido**. No início de uma sessão, antes de mergulhar na tarefa, **no máximo uma vez por dia**, e nunca aplicando nada sem o humano:

1. **Trava de data.** Leia `docs/.pdb-update/.last-check`. Se a data for hoje, **pule** esta rotina.
2. **Compare versões:** `npm view project-docs-blueprints version` vs o campo `version` do manifesto. Sem rede / comando falhou → registre a data (passo 4) e siga, não trave.
3. **Se houver versão nova** → conduza o **update** (seção abaixo).
4. **Registre a checagem:** grave a data de hoje (`YYYY-MM-DD`) em `docs/.pdb-update/.last-check`.

---

## Conduzir o update (e as migrations)

1. `npx project-docs-blueprints@latest update --dry-run` (com `--profile` só se não houver manifesto).
2. **Migrations primeiro.** Se o plano listar migrations no caminho, elas rodam **em ordem** antes do diff:
   - `autoApply` (rename/move/regex) → o CLI aplica sozinho; só confira o resultado.
   - não-automáticas → vêm com instruções do autor do template anexadas ao handoff; **conduza com o humano**.
3. Apresente o plano (quantos _adiciona_/_auto-merge_/_revisar_/_em dia_) e **pergunte se quer atualizar agora**. Se adiar, registre a data e siga.
4. Com OK: git limpo, rode sem `--dry-run`, revise o `git diff`. **Nenhum arquivo customizado é sobrescrito** — divergências viram handoff.
5. **Handoffs** (`docs/.pdb-update/*.handoff.md`): para cada um, classifiquem juntos **melhoria do template** (trazer) vs **customização do projeto** (preservar), gravem a versão final no arquivo real, e em conflito real exponha o tradeoff em vez de decidir sozinho. Mudança acoplada a código (ex.: migração de tokens) → registre como issue/spec, não force no doc.
6. Limpe `docs/.pdb-update/` ao fim (efêmero) e rode typecheck/testes se algo executável mudou.

---

## Anti-padrões (não faça)

- Começar a montar/perguntar **antes** de diagnosticar o estado do projeto.
- Rodar `update` sem `--dry-run`, ou usar `--force`, sem o humano aprovar o plano.
- Tratar "docs existem mas sem manifesto" como motivo pra `--force` — é **adoção legada**.
- Sobrescrever customização porque "o template é mais novo" — divergência é handoff, decisão humana.
- Aplicar migração acoplada a código (tokens semânticos, renames de API) só no doc, descolada do código.
- Duplicar aqui o conteúdo do [pipeline](../pipeline.md)/[spec-guide](../spec-guide.md)/[protocolo-de-gates](./protocolo-de-gates.md) — referencie.
