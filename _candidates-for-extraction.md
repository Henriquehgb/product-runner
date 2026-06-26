# Candidatos a extração

Anotações correntes sobre padrões, lições e regras que apareceram
em mais de um projeto. Quando algo aparece em **3 projetos**, vira
candidato forte a virar template universal.

Formato livre — anotação rápida com data, contexto e status.

---

## 2026-05-01 — kickoff do diretório

Inicialização. Aprendizados do tradeBot (em curso) que vale
revisitar quando começar painel web e demais projetos.

### Reorganização de `design-principles` em 3 categorias

- **Princípios técnicos** (universais)
- **Princípios LLM-first** (específicos pra trabalho com LLM)
- **Valores não-acionáveis** (cultural, com aviso de risco)

**Aplicado em:** `tradeBot/docs/design-principles.md`
**A acompanhar:** ver se a divisão segura no painel SSR.
**Origem:** retro do DocManager listava 8 princípios sem distinção;
a separação apareceu ao questionar "quais ajudam LLM e quais não".

### Princípios LLM-first novos

Não estavam explícitos no `retro-20260419`:

1. Critérios de aceite binários
2. Escopo travado por não-objetivos explícitos
3. Reportar decisões na própria spec (obrigatório, não opcional)
4. Guardrail dos 3 strikes
5. Documentar o porquê, não só o quê

**Aplicado em:** `tradeBot/docs/design-principles.md`,
`tradeBot/CLAUDE.md`, `tradeBot/docs/spec-guide.md`
**A acompanhar:** confirmar se faz diferença mensurável na qualidade
de implementação do Claude Code ao longo das specs do tradeBot.

### "Pragmatismo > purismo" como valor, não princípio

**Razão:** LLM já é pragmática demais por default; tratar como
princípio risca legitimar workarounds em vez de mitigar.
**Solução adotada:** virou "valor não-acionável" com aviso explícito —
qualquer escape hatch DEVE ser documentado em "Decisões de
implementação".
**Aplicado em:** `tradeBot/docs/design-principles.md`
**A acompanhar:** ver se reduz dívida invisível em projetos com LLM.

### "Decisões de implementação" como seção obrigatória da spec

**Descoberta:** spec 00 do tradeBot foi implementada e o Claude Code
esqueceu de preencher essa seção. Tive que preencher no review.
**Solução:** virou regra explícita ("OBRIGATÓRIA, não opcional") no
`spec-guide.md` e no `CLAUDE.md` do tradeBot.
**A acompanhar:** testar em mais 2-3 specs pra ver se a regra é
seguida consistentemente. Se Claude Code continuar esquecendo, vira
critério de aceite explícito da spec.

### Workflow Cowork ↔ Claude Code mais explícito

Tabela "quem faz o quê" no `spec-guide.md` do tradeBot. Estava
implícito no DocManager.
**Aplicado em:** `tradeBot/docs/spec-guide.md`
> **Superada** pelo modelo de ambiente único: a tabela "quem faz o quê" agora
> distingue por **sessão/agente** (não por app), e o handoff é o arquivo de output.
> Mantida como registro de decisão.

### Não criar templates separados por perfil ainda

Decisão: aguardar 3º projeto (painel) pra ter dados pra extração
honesta. Por enquanto:
- Snapshots em `snapshots/`
- Alimentação contínua deste arquivo
- "Snapshot mais recente do mesmo perfil" é o template

### Mudanças adjacentes vão pra outra spec (regra nova)

Surgiu ao escrever spec 01 do tradeBot (test harness). Caso
específico: testes de caracterização vs corrigir bug detectado.
Generalizado pra: qualquer mudança que NÃO é a intenção da spec
atual (bug, refactor tentador, melhoria) é anotada e adiada.

**Razão:** preserva o binário "passou/falhou" da spec, esconde
menos escopo, mantém rastreabilidade.

**Aplicado em:** `tradeBot/docs/spec-guide.md` (regra detalhada),
`tradeBot/CLAUDE.md` (linha curta com referência).
**A acompanhar:** ver se reduz "creep silencioso" de escopo nas
implementações.

### Sinal positivo do spec-guide funcionando

Ao escrever spec 01 do tradeBot, considerei quebrar em duas
(infra de teste + testes em si). Decidi manter junto pelo princípio
"fases verticais, não horizontais" do próprio spec-guide. Razão:
"infra sem teste" entrega valor zero — quebrar violaria o princípio.

**Significa:** o spec-guide está sendo USADO pra tomar decisões,
não só consultado. Boa-feedback loop. Vale repetir o exercício de
"considerei X mas o doc Y diz Z" em outras specs pra validar que
os docs continuam pagando o aluguel.

### Verificar side-effects no top-level antes de prescrever import em teste

Surgiu na implementação da spec 01 do tradeBot. A spec prescreveu
adicionar `export` em uma função de `index.ts` pra testá-la, mas
o arquivo tinha side-effects pesados no top-level (validação fail-fast
de envs, instanciação de client Binance, dispatch de loop infinito).
Importar em teste virou rabbit-hole de mocks que violou a regra
dos 3 strikes.

**Lição:** spec que prescreve import de função existente DEVE
verificar antes se o módulo tem side-effects no top-level. Se tiver:
(a) extrai função pra arquivo próprio (vira refactor com escopo
maior), ou (b) adia teste pra spec posterior. Não há mock leve.

**Aplicado em:** `tradeBot/docs/spec-guide.md` (regra explícita),
`tradeBot/specs/setup/01-test-harness.md` (decisões de implementação),
`tradeBot/specs/_open-issues.md#3` (achado registrado).
**A acompanhar:** ver se outras specs que prescrevem `export`
caem no mesmo problema.

### `_open-issues.md` como ponte entre regra e esquecimento

A regra "mudanças adjacentes vão pra outra spec" diz pra anotar e
adiar. Mas anotar onde? Anotação solta em "Decisões de implementação"
da spec atual fica enterrada — só descobre relendo a spec inteira.

**Solução:** criar `specs/_open-issues.md` como registro central de
achados detectados durante implementação que ainda não viraram spec.
Cada item exige "Candidato a endereçamento" explícito (sem isso,
vira lixo).

**Aplicado em:** `tradeBot/specs/_open-issues.md` (criado com 3 itens).
**A acompanhar:** ver se reduz "perda de bug detectado mas não fixado".

### Mock pesado pra contornar acoplamento estrutural é anti-padrão

Ao tentar testar função de `index.ts` com side-effects, a tentação
foi mockar `dotenv/config`, `@binance/connector`, `setupFiles` com
env vars, e ter `account()` retornando promise hangante. Cada
camada de mock adiciona acoplamento entre teste e implementação
interna.

**Lição:** quando o teste precisa de >2 mocks pra carregar o módulo,
o problema não é o teste — é a estrutura do código. Solução é
refactor estrutural, não mais mocks.

**A acompanhar:** se aparecer de novo, virar princípio de primeira
classe ("acoplamento estrutural não se resolve com mock").

### Limite de "N lugares" funcionou como guardrail

Spec 02 do tradeBot incluiu nota: *"Se o ajuste exigir mexer em
mais de 5 lugares, parar e relatar."* O Claude Code resolveu com
2 lugares (`as any` em `recalculateLimits` + `String(values.id)`
em `BotEnviromentData`), dentro do limite — não precisou parar.

**Significa:** dar limite numérico explícito (vs "menor superfície"
abstrato) é guardrail efetivo. LLM consegue contar e decidir.

**A acompanhar:** repetir essa formulação em outras specs de
refactor — *"se ajuste exigir mexer em mais de N lugares, parar"*
— pra validar se o padrão segura escopo de forma consistente.

### Pragmatismo controlado: cada escape hatch tem destino

Spec 02 introduziu 4 escape hatches: `as any`, `String(values.id)`,
remoção de `.js` stale, `ignoreDeprecations: "6.0"`. Todos foram
documentados em "Decisões de implementação" com candidato a
endereçamento futuro (refactor/03 e similares). Cada um virou
issue em `_open-issues.md` (com 4 entries novas).

**Significa:** a regra "pragmatismo > purismo é valor não-acionável,
COM aviso de documentar escape hatches" funcionou como esperado.
LLM aceitou pragmatismo MAS deixou rastro auditável.

**A acompanhar:** ver se em refactor/03+ esses 4 issues realmente
são endereçados — se ficarem esquecidos, o "destino futuro" virou
arquivo morto.

### Critérios meta padrão > regras textuais (intervenção)

Aplicado após análise da sessão da spec 03 do tradeBot. O Code
esqueceu de preencher "Decisões de implementação" mesmo com a regra
explícita em `CLAUDE.md` e `spec-guide.md`. Hipótese validada:
**critério de aceite binário vence regra textual** na atenção do
Code durante sessão.

Solução adotada: criada seção "Critérios meta padrão" no
`tradeBot/docs/spec-guide.md` listando 3 critérios universais:
- **M1**: Decisões de implementação preenchidas (com substância).
- **M2**: Decisões técnicas explicitadas em thinking durante sessão.
- **M3**: Release checklist explícito antes de declarar pronto.

Specs novas referenciam por nome ("aplicam-se M1, M2, M3"), sem
repetir.

**A acompanhar:** ver se a próxima sessão de Code respeita esses
critérios sem intervenção. Se sim, padrão validado para
SSR/painel também.

### Critérios meta padrão funcionaram parcialmente na primeira aplicação

Spec 03b foi a primeira a referenciar M1, M2, M3 como critério.

Resultado:
- **M1** ✅ — Code preencheu "Decisões de implementação" com
  substância (3 parágrafos cobrindo fix, workaround, edge case).
  Sucesso claro vs sessões anteriores.
- **M2** ⚠️ parcial — escolha de `slice(-N)` vs `Math.max(0, ...)`
  não foi explicitada em thinking (foi prescrita pela spec, então
  não havia decisão real). Decisões menores foram documentadas.
- **M3** ⚠️ parcial — Code LISTOU critérios atendidos, mas sem
  símbolos ✅/❌/⚠️ explícitos por item.

**Significa:** critérios meta funcionam mas precisam de reforço
visual. Próxima spec pode incluir EXEMPLO de output esperado:
```
Critérios:
- ✅ slice(-N) idiomático em pushMaxValue/pushMinValue
- ✅ ...
- ⚠️ Smoke check pendente (motivo: precisa estado do bot)
```

**A acompanhar:** ver se exemplo de formato resolve, ou se precisa
de mais reforço.

### Critérios meta funcionando consistentemente após adoção

Aplicação dos meta-critérios M1, M2, M3 nas specs 03b, 01b, 04:

| Spec | M1 (Decisões) | M2 (Decisões técnicas) | M3 (checklist) |
|------|---------------|------------------------|-----------------|
| 03b  | ✅            | ⚠️ parcial             | ⚠️ parcial      |
| 01b  | ✅            | ✅                     | ⚠️ parcial      |
| 04   | ✅ (substância) | ✅ (5 decisões)       | ⚠️ parcial      |

**M1 está sólido** após 3 specs consecutivas — Code preenche
a seção. Antes, faltava em 2 de 3 (sem critério). Confirma que
critério > regra textual.

**M3 continua parcial** em todas — Code lista critérios mas
sem símbolos ✅/❌/⚠️ explícitos por item. Mesmo com exemplo
na spec 08 e 04, ainda não pegou consistentemente.

**Hipótese pra M3:** o exemplo no critério é "exemplo aspiracional"
sem força contratual. Talvez precise virar template literal
obrigatório — Code copiar e preencher, não inferir formato.
Próxima spec experimentar.

**A acompanhar:** se M3 continuar parcial em mais 2 specs,
considerar mudança de formato.

### Padrão port/adapter funcionou bem em projeto pequeno

Spec 04 introduziu `BrokerClient` (port) + `BinanceBroker`
(adapter). Total de complexidade adicionada:
- 1 interface (5 linhas)
- 1 adapter (40 linhas)
- 3 schemas Zod com `.passthrough()` (12 linhas)
- 1 mock (25 linhas)
- 11 testes
- 6 substituições em `index.ts`

Custo razoável vs benefícios:
- Lógica de trade testável com mock (preparado pra refactor/06)
- Validação de respostas da Binance
- Trocar exchange = trocar 1 arquivo

**Lição:** padrão port/adapter cabe bem mesmo em projetos
pequenos quando há lib externa cuja interface deve ser isolada
(broker, DB, AI APIs, etc). Custo inicial baixo se a lib tem
interface clara e poucos métodos (3 aqui).

**Aplicado em:** `tradeBot/specs/refactor/04-broker-abstraction.md`.
**A acompanhar:** ver se padrão se replica bem em projetos com
mais integrações (ex: painel SSR com DB + Auth + APIs externas).

### M3 com formato literal funcionou — primeira spec totalmente atendida

Spec 05 adotou abordagem nova pra critério M3: forneceu **template
literal exato** que o Code deve copiar e preencher, em vez de
"exemplo aspiracional".

Resultado: **primeira spec a atender M3 100%**. Code reportou
checklist com ✅/⚠️ explícitos por item, formato igual ao pedido.

**Antes (specs 03b, 01b, 04):** exemplos eram aspiracionais. Code
listava critérios mas sem símbolos consistentes. M3 ⚠️ parcial em 3
specs consecutivas.

**Hipótese validada:** template literal > exemplo aspiracional. Code
copia + preenche é mais barato cognitivamente do que inferir formato.

**Aplicar em todas as specs futuras.** Spec 06 (loop fino) já usa
esse formato. Verificar se mantém o resultado.

### Issue #6 (stale .js) ressurgiu após "fix" em 01b

Mesmo após `setup/01b` mudar `outDir` pra `./dist/`, `.js` em `model/`
voltaram a aparecer durante `refactor/05`. Significa que tem outra
fonte gerando esses arquivos além do `npm run start`.

**Lição:** "fix definitivo" prematuro. Marcar issue como FECHADA
exige validação que o problema não retorne em outro contexto, não
só que a causa óbvia foi resolvida.

**Aplicado:** `tradeBot/specs/_open-issues.md#10` registra a
recidiva. Issue #6 fica fechada formalmente (causa principal
resolvida) mas o sintoma reaparece — anotado em #10 separado.

**A acompanhar:** se reaparecer 2+ vezes em sessões futuras,
investigar fonte real (IDE? Vitest? algum script?).

### Smoke check obrigatório em código > pendente humano

Spec 05b adotou **smoke check executado em código** dentro da
sessão (round-trip `JSON.stringify` → `safeParse`), em vez do
clássico "pendente humano".

**Origem:** bug da `setup/05` passou despercebido porque o smoke
check de reload ficou como "pendente humano" e ninguém rodou
até a `refactor/06` exposá-lo.

**Lição:** quando bug é detectável via teste programático
(round-trip, fixture conhecida, etc.), **nunca delegar pra humano**.
Critério de aceite vira "teste X passa" em vez de "humano valida X".

**Aplicado em:** `tradeBot/specs/refactor/05b-fix-state-schemas.md`.
**A acompanhar:** verificar se reduz "bugs latentes que dependem de
smoke check humano".

### Critérios meta consolidados após 11 specs implementadas

Trajetória do M3 (release checklist com símbolos) ao longo do refactor:

| Sequência | M3 |
|---|---|
| 03b, 01b, 04 | ⚠️ parcial |
| 05 (template literal) | ✅ |
| 06, 05b, 07 | ✅ ✅ ✅ |

**Validação:** template literal pra release checklist + sinalização
clara de "Code DEVE reportar usando este formato" funciona. **3 specs
consecutivas atendendo M3 sem reforço adicional.**

### Bug latente em decisão de "campo opcional não aparece no JSON"

Code escreveu nas decisões da `setup/05`:
> "Campo é optional, não aparece no JSON serializado pelo bot
> hoje (não é setado no constructor)"

**Erro silencioso.** Campo ERA setado em runtime (`buyAndSell`
faz `ed.trade.lastTurnDateTime = new Date()` em todo tick).
Decisão errada passou no review porque eu não validei a afirmação
empiricamente — confiei no raciocínio do Code.

**Lição pra mim:** quando Code afirma "campo X não aparece em Y",
validar grepando se algum lugar SETA o campo. Não confiar em
"não aparece no constructor" como prova.

**Aplicado:** anotação em `_open-issues.md#11` + spec dedicada `05b`.
**A acompanhar:** se aparecer afirmação similar ("campo nunca é
nulo", "função nunca é chamada", etc.), exigir grep + reportar
no review.

### `.passthrough()` em Zod resolve "campos extras pra log"

Caso típico: respostas de APIs externas têm muitos campos. Lógica
usa só alguns. Mas log/observability quer todos.

`.passthrough()` no schema valida campos críticos e mantém o resto
em runtime. Tipo inferido fica estrito, mas em runtime o objeto
tem tudo.

Trade-off: `.passthrough()` exige cast pra index signature
(`as PlacedOrder` com `[key: string]: unknown`). Aceitável.

**Aplicado em:** `tradeBot/services/integrations/schemas.ts`.
**A acompanhar:** verificar se o padrão escala em respostas com
50+ campos (Binance.account() pode ter muitos).

### Stale `.js` files: friction recorrente, vale fix definitivo

Bug `_open-issues.md#6` (Vitest carregando `.js` compilado em vez
de `.ts` fonte) bloqueou implementação em 2 specs consecutivas
(setup/02 e refactor/03b). Code resolveu manualmente as duas
vezes.

**Padrão claro:** workaround manual repete-se a cada sessão que
toca testes após `npm run start`. Custo agregado supera fix
definitivo.

**Fix definitivo possível:** mudar `tsconfig.json` `outDir` pra
`./dist/` e atualizar scripts. Custo ~30min de Code, resolve
permanentemente.

**Lição:** ao identificar issue que aparece 2x+ como friction
recorrente, criar spec dedicada antes de aparecer 3x. "Friction
recorrente é dívida."

### Múltiplas leituras fragmentadas do mesmo arquivo

Observação da sessão da spec 03: 8 reads do `index.ts` (~810
linhas) com offsets diferentes. Custo de round-trips foi alto
(~30s perdidos), enquanto 1 read com `limit: 2000` resolveria.

**Tradeoff entendido:** Code estava economizando tokens por leitura,
não percebendo o custo agregado de round-trips. Tradeoff inverso
do que a otimização sugeria.

**Aplicado em:** regra explícita no `tradeBot/CLAUDE.md`:
*"Antes de múltiplos Reads com offsets diferentes, considerar
1 leitura com `limit` alto. Custo de tokens é menor que custo
de round-trips."*

**A acompanhar:** ver se reduz fragmentação em sessões futuras.
Se Code continuar fragmentando, virar critério meta M4.

### Code esquece de preencher "Decisões de implementação" na spec (recorrente)

Padrão observado em 2 das 3 sessões de Claude Code (specs 00 e 03).
Reporta as decisões corretamente no chat, mas não as escreve na
seção "Decisões de implementação" da spec correspondente. Tive que
preencher no review.

**Hipótese:** o Code lê o template como "preencher após", interpreta
como instrução pra deixar como está. A regra "Decisões de
implementação são obrigatórias" no CLAUDE.md/spec-guide é texto,
não checklist visível durante a sessão.

**Solução proposta:** adicionar como CRITÉRIO DE ACEITE explícito
em cada spec — ex: *"`## Decisões de implementação` da spec contém
ao menos um parágrafo descrevendo: (a) divergências, (b) escolhas
entre alternativas, (c) tentações não executadas. Vazio = critério
não atendido."* Critérios são checklist binária, regras são texto.
Critério vence regra na atenção do Code.

**A acompanhar:** se virar critério, ver se o Code passa a preencher
proativamente.

### `!` (non-null assertion) é soft cast — vale acompanhar

Na implementação da spec 03 do tradeBot, o Code usou `!` em retornos
da função pura (`minLimitPriceToSell!`, `brokeUpFlowWaitingLimitPrice!`)
porque os branches setam mas TS não consegue inferir.

Não é `as any`. Mas é soft cast — afirma à máquina o que ela não
consegue verificar. Se a lógica mudar, o `!` continua silencioso e
NaN/null pode escapar.

**Alternativas:**
- Inicializar variáveis com defaults (mas mascara bugs).
- Usar `if (x === undefined) throw` antes do return (verboso).
- Tipar o resultado intermediário com `T | undefined` e fazer guards
  explícitos (cleaner, mais código).

**Lição:** considerar adicionar regra ao CLAUDE.md:
*"`!` non-null assertion é soft cast. Aceitável quando a lógica
provavelmente garante non-null E é mais legível que guard explícito.
Documentar quando usado em `Decisões de implementação`."*

**A acompanhar:** ver se vira problema real ou continua benigno.

### `.js` stale gerados por build conflitam com testes

Padrão recorrente em projetos Node sem build separado: `tsc` gera
`.js` ao lado de `.ts`. Vitest/Node prefere `.js` na resolução,
carregando versão velha. Tipo problema: "ué, mudei o `.ts` e o
teste continua falhando".

**Lição genérica:** ao introduzir test runner em projeto que
compila in-place, prever no setup do test runner: (a) ou
configurar `outDir` separado, (b) ou ignorar `.js` em `model/`
no Vitest, (c) ou pelo menos colocar `.js` no `.gitignore` pra
evitar commits.

**Aplicado em:** `tradeBot/specs/_open-issues.md#6` (registrado).
**A acompanhar:** quando montar painel SSR, considerar `outDir`
separado desde o início.

### Diferenciação CLI vs SSR

Identificado que ~70-80% do conteúdo é compartilhado:
- Universal: princípios técnicos, princípios LLM-first, spec-guide,
  workflow, regras operacionais, naming, padrões de erro
- Específico CLI: BrokerClient, persistência arquivo, loop infinito
- Específico SSR: API patterns, UI patterns, ORM/repository

Quando criar templates definitivos, estrutura sugerida:
```
templates/
├── common/        ← universal
├── cli/           ← extensões CLI
└── ssr/           ← extensões SSR
```

---

## 2026-06 — painel: pipeline de agentes validado (3º projeto)

O **trade-bot-painel** é o 3º projeto — o gatilho que estava marcado em
"Não criar templates separados por perfil ainda" (aguardava o 3º pra
extração honesta). Vários "A acompanhar" agora têm dado.

### Hipóteses confirmadas pelo painel

- **3 categorias de princípios seguram no SSR.** A divisão técnicos/
  LLM-first/valores (criada no tradeBot) foi aplicada no painel sem atrito.
  → Confirmada; é princípio estável.
- **Critérios meta M1-M4 funcionam em SSR.** M1-M3 mais M4 (responsivo)
  referenciados nas specs de UI. → Padrão portável.
- **Padrão port/adapter replica em projeto com I/O diferente.** No painel
  virou `BotDataReader`/`BotDataWriter` (lê/escreve os JSONs do bot) — o
  mesmo padrão do `BrokerClient`, sem Binance. → Confirma a previsão da
  nota "adaptação CLI → SSR".
- **`outDir` separado desde o início evitou o bug recorrente.** A previsão
  ("quando montar painel SSR, considerar `outDir` separado") foi aplicada
  no `setup/01` e fechou a issue de stale `.js` de saída. → Validada.

### Padrão novo extraído: pipeline de agentes (→ promovido a `common/`)

Surgiu no painel e foi promovido a template (`common/agents/` +
`common/pipeline.md`): conceituação → documentação funcional → geração de
spec, com protocolo de gates compartilhado. Detalhe e limites em
[pipeline](common/pipeline.md) e [lessons-learned](common/lessons-learned.md) (Etapa 11). **A acompanhar:** rodar em
um 4º projeto (não-trading, idealmente) pra confirmar que as diretivas dos
agentes não carregam viés do domínio do painel.

### Candidatos ainda em aberto (decisões do plano de merge não tomadas)

- **`project-kickoff` (skill, gen 0) ↔ pipeline.** O discovery do kickoff
  (build-vs-buy, orçamento, "o que o framework não faz") não está nos
  agentes. Decidir se o kickoff vira a porta de entrada que delega ao
  pipeline, ou se o discovery entra como Fase 0 da conceituação. (§3.8 do
  plano — adiado.)
- **Conteúdo perdido da gen 0:** princípios "o que a máquina escreveu é
  sagrado" e "booleanos independentes > enum composto", e as seções
  `## Service functions`/`## API routes`/`## UI` do template de spec antigo.
  Recuperar ou confirmar descarte. (§3.9 — adiado.)

---

## A acompanhar (espaços abertos pra próximas seções)

Itens que vão preencher conforme tradeBot evolui:

### Padrões de teste (CLI)
Virá das specs 01-04 do tradeBot:
- Vitest config
- Fixtures de inputs (waves, configs)
- Mocks de broker
- Padrão de cobertura de função pura
- Padrão de teste de integração com mock de broker

### Padrões de observability
Virá da spec 08 do tradeBot:
- Logs estruturados (formato, níveis)
- Métricas expostas
- Decisão sobre NewRelic vs alternativa

### Broker abstrato (port/adapter)
Virá da spec 04 do tradeBot:
- Interface `BrokerClient`
- Adapter `BinanceBroker`
- Mock pra testes

### Adaptação CLI → SSR no painel
Quando começar o painel:
- Lições de teste do tradeBot adaptadas pra rotas + repository
- Lições de observability adaptadas pra ambiente web
- Lições de broker abstrato → não se aplica direto, mas o padrão
  port/adapter aplica pra outros connectors (DB, Redis, APIs externas)

---

*Este arquivo é vivo. Adicionar entrada com data toda vez que
identificar padrão repetido ou aprendizado relevante.*
