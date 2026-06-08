# Lições aprendidas — Projeto DocManager

Compilado de lições extraídas do desenvolvimento do DocManager,
organizadas por etapa. Cada lição inclui o contexto em que se aplica
e por que importa.

---

## Etapa 1 — Levantamento de requisitos

### Pesquisar soluções prontas antes de decidir por custom
**Quando se aplica:** sempre que o problema parecer comum (gestão documental, CRM, e-commerce).
**Por que importa:** evita reinventar a roda. Mas também evita forçar uma ferramenta que não cabe — no nosso caso, Paperless-ngx cobria 60% mas os 40% restantes exigiriam mais customização do que construir do zero.

### Entender orçamento de serviços externos cedo
**Quando se aplica:** projetos que dependem de APIs pagas (OCR, AI, cloud).
**Por que importa:** não é só o orçamento geral do projeto — são custos recorrentes mensais que impactam a viabilidade técnica. Google Vision a $1.50/1000 páginas cabe no budget; AWS Textract a $15/1000 não caberia.

### Perguntas fechadas aceleram o levantamento
**Quando se aplica:** sempre que estiver levantando requisitos com o usuário.
**Por que importa:** múltipla escolha força decisão imediata em vez de discussão aberta. O levantamento do DocManager levou 3 rodadas de perguntas em vez de uma conversa livre de 2 horas.

### Ordem importa: problema/contexto → viabilidade → arquitetura
**Quando se aplica:** início de qualquer projeto.
**Por que importa:** decidir stack antes de entender o problema leva a decisões enviesadas. Primeiro entender o que precisa ser resolvido, depois avaliar o que é viável, depois como construir.

---

## Etapa 2 — Escolha de stack e arquitetura

### Mapear o que o framework NÃO faz
**Quando se aplica:** ao escolher plataforma de deploy ou framework.
**Por que importa:** as limitações definem a arquitetura tanto quanto as features. Next.js não suporta storage persistente + background jobs na Vercel → descartou Vercel, definiu Docker + VPS. Essa decisão cascateia pra toda a infra.

### Arquitetura iterativa, não solução fechada
**Quando se aplica:** ao definir arquitetura com o time/usuário.
**Por que importa:** apresentar proposta inicial, ouvir contra-propostas, refinar. As melhores decisões do DocManager (services desacoplados, Zod entity como raiz) vieram de sugestões do usuário, não do planejamento inicial.

### Documentar o "porquê" de cada decisão
**Quando se aplica:** qualquer decisão de arquitetura, stack ou design.
**Por que importa:** sem o "porquê", as decisões são revisitadas toda vez que alguém novo chega ou que surge uma dúvida. "Usamos registros no banco pra campos de padrão PORQUE precisamos de consultas transversais" fecha a discussão.

---

## Etapa 3 — Modelo de dados

### Modelar junto com o usuário
**Quando se aplica:** definição de entities e relações.
**Por que importa:** gaps conceituais que o técnico não vê. No DocManager, o usuário identificou que faltava DocumentLink (relação doc↔doc) e campos repetíveis (itens de NF) — dois conceitos que o técnico não teria percebido sozinho.

### Decisões conceituais antes do schema
**Quando se aplica:** antes de escrever qualquer modelo Prisma/SQL.
**Por que importa:** "um documento pertence a uma ou muitas categorias?", "campos como registros ou JSON?", "enum ou booleanos?" — essas decisões definem TUDO. Errar aqui propaga pra todas as camadas.

### ERD visual pra alinhar entendimento
**Quando se aplica:** sempre que o modelo tiver mais de 5 entities.
**Por que importa:** texto descreve relações sequencialmente. Diagrama mostra todas as relações de uma vez. O momento "ah, falta uma seta aqui" só acontece quando você vê o diagrama.

### Validar modelo completo antes de implementar
**Quando se aplica:** antes de criar a primeira migration.
**Por que importa:** é a fundação. Erro no modelo propaga pra services, API, UI. Adicionar uma entity depois é fácil; mudar uma relação fundamental depois é caro.

---

## Etapa 4 — Dev workflow e spec-first

### Spec-first economiza mais tempo do que parece
**Quando se aplica:** qualquer projeto com implementação assistida por AI.
**Por que importa:** o Claude Code com spec clara implementa em minutos o que levaria horas sem contexto. A spec é o "prompt" perfeito porque tem tudo: contexto, entities, funções, API, UI, critérios de aceite.

### Granularidade certa é crucial
**Quando se aplica:** ao escrever specs.
**Por que importa:** spec grande demais → Claude Code perde foco e gera código inconsistente. Spec pequena demais → overhead de gestão, muitas sessões. Regra: uma spec = uma sessão de Claude Code.

### Fases com corte vertical, não horizontal
**Quando se aplica:** ao planejar fases de entrega.
**Por que importa:** "modelo → services → API → UI" (horizontal) entrega valor só no final. "Upload + OCR + visualização de ponta a ponta" (vertical) entrega valor visível na Fase 1. O usuário vê resultado e valida cedo.

### Overview com grafo de dependências
**Quando se aplica:** projetos com mais de 5 specs.
**Por que importa:** evita implementar specs fora de ordem. "Org/03 depende de org/01" — sem o grafo, alguém pode tentar implementar referências antes de categorias existirem.

### Critérios de aceite binários
**Quando se aplica:** toda spec.
**Por que importa:** eliminam ambiguidade do "pronto". "Consigo arrastar 10 fotos e todas são salvas" — ou passa ou não passa. Sem "parcialmente implementado".

### Documentar o princípio de entrega vertical
**Quando se aplica:** ao criar o overview de fases.
**Por que importa:** a lista de fases mostra a ordem, mas não o porquê. Sem documentar o princípio, alguém replicando pode organizar horizontalmente sem perceber que foi uma escolha deliberada.

---

## Etapa 5 — Skills e documentação

### Menos skills melhores > muitas skills rasos
**Quando se aplica:** ao montar estratégia de skills/docs.
**Por que importa:** 1 CLAUDE.md completo + docs de referência supera 9 CLAUDE.md espalhados. Manutenção de 9 arquivos sincronizados é overhead que não compensa.

### Conhecer o formato de cada ferramenta antes de gerar artefatos
**Quando se aplica:** ao criar skills, configs, templates pra ferramentas.
**Por que importa:** o Cowork exige YAML frontmatter nas skills. Gerar sem e descobrir pelo erro custou retrabalho. Verificar o formato esperado antes de gerar evita isso.

### Divisão de responsabilidade entre ferramentas deve ser explícita
**Quando se aplica:** projetos que usam múltiplas ferramentas AI.
**Por que importa:** sem definição clara, você mistura — pede pro chat o que o Cowork faz melhor, ou pro Claude Code o que é um fix do Cowork. Definir no kickoff: chat = pensar, Cowork = agir nos arquivos, Code = implementar.

### Padrão de comunicação entre ferramentas
**Quando se aplica:** workflow multi-ferramenta.
**Por que importa:** "discutir aqui → instrução copiável → cola lá" surgiu organicamente mas deveria ser definido no kickoff. Sem esse padrão, cada handoff é improvisado.

### Regras operacionais no CLAUDE.md fazem diferença real
**Quando se aplica:** qualquer projeto com Claude Code.
**Por que importa:** "3 strikes", "spec vs realidade técnica", "fixes não precisam de spec" — todas surgiram de problemas reais. Sem elas, loops e decisões subótimas repetem.

---

## Etapa 6 — Ciclo de implementação

### Claude Code precisa de guardrails comportamentais
**Quando se aplica:** qualquer projeto com Claude Code.
**Por que importa:** ele é excelente executor mas sem guardrails entra em loops (searchVector), segue spec literalmente quando há alternativa melhor (rowIndex null), e não para pra perguntar quando deveria.

### O report final do Claude Code é o artefato mais valioso
**Quando se aplica:** após cada sessão de implementação.
**Por que importa:** critérios ✅/❌ + decisões de implementação + notas do que não testou = tudo que precisa pra review e documentação retroativa. Sem ele, você não sabe o que mudou.

### Divergências spec↔código devem ser documentadas
**Quando se aplica:** após cada implementação.
**Por que importa:** se a spec diz X e o código faz Y (por bom motivo), documentar na seção "Decisões de implementação" da spec. Senão a spec vira mentira e perde valor como referência.

### Validação visual no browser é insubstituível
**Quando se aplica:** qualquer feature com UI.
**Por que importa:** tsc --noEmit pega erros de tipo mas não de comportamento. Um filtro que não aplica, um botão que não navega, um layout quebrado — só vê testando no browser.

### Fixes pequenos vão direto, sem spec
**Quando se aplica:** bugs, ajustes visuais, links faltando.
**Por que importa:** criar spec pra corrigir um link é overhead. Regra: se altera entity, cria service, adiciona endpoint ou cria tela → spec. Se é correção do que já deveria funcionar → fix direto.

### Port fixo + report do port real
**Quando se aplica:** projetos com dev server local.
**Por que importa:** port mudando entre sessões (3000 vs 3001) causa confusão. Fixar no package.json e documentar que o Claude Code deve reportar o port real no output.

---

## Etapa 7 — Evolução durante o projeto

### O processo deve suportar evolução aditiva
**Quando se aplica:** qualquer projeto que vai durar mais de uma semana.
**Por que importa:** specs novas, alterações em existentes, regras novas no CLAUDE.md — tudo deve ser aditivo, nunca destrutivo. A arquitetura "nullable pra evolução" se provou: nenhuma mudança exigiu migração destrutiva.

### Usar o sistema real expõe gaps
**Quando se aplica:** sempre.
**Por que importa:** as melhores melhorias do DocManager vieram de testar com dados reais: campos repetíveis surgiram ao configurar padrões, DATETIME ao pensar em tipos de data. Nenhum planejamento abstrato teria pego isso.

### Formatter desde o dia zero, linting customizado depois
**Quando se aplica:** setup de qualquer projeto.
**Por que importa:** Prettier + lint-staged + husky no setup/01 — custo mínimo, evita reformatação retroativa. Regras de linting customizadas (services não importam de Next, etc) entram quando as convenções se consolidam.

### CLAUDE.md é documento vivo
**Quando se aplica:** durante todo o projeto.
**Por que importa:** regras operacionais surgem de problemas reais durante o desenvolvimento. Adicionar conforme aparecem, não tentar prever tudo no início.

### Modelar pra evolução > modelar "completo"
**Quando se aplica:** design de modelo de dados.
**Por que importa:** campos nullable, enums extensíveis, constraints aditivos. Mais importante que acertar tudo de primeira é garantir que mudanças futuras não quebrem o existente.

---

## Etapa 8 — Retrospectiva

### Retrospectiva é etapa formal, não opcional
**Quando se aplica:** ao final de cada fase ou do projeto.
**Por que importa:** se não parar pra fazer, as lições ficam na conversa e se perdem. A retrospectiva deve gerar artefatos concretos (este documento, templates, regras novas).

### Fazer retro com a mesma ferramenta preserva contexto
**Quando se aplica:** ao planejar a retrospectiva.
**Por que importa:** reconstruir de memória perde nuances. Fazer na mesma conversa que conduziu o projeto permite referenciar decisões com contexto real.

---

## Notas exploratórias

### Arquivo compartilhado como barramento entre agentes
Explorar uso de `inbox/instructions.md` como meio de comunicação
entre Claude.ai e Cowork — tanto pra instruções quanto pra outputs.
Evita copy-paste manual. Não validado ainda.

### Estrutura multi-agente de referência
Setup mais poderoso possível com ferramentas atuais:
- Cowork = orquestrador (arquivos + Chrome connector)
- Claude Code = implementador (Agent Teams + Chrome)
- Claude.ai = arquiteto (sem conexão direta — humano é ponte)

### Chrome como ponte automática
Testar Claude in Chrome lendo a aba do Claude.ai como ponte.
Promissor mas frágil — não recomendar como prática padrão
até validar em projetos reais.

### Regras de lint customizadas pro DocManager
Avaliar adicionar: services não importam de `next`,
API routes não importam do Prisma direto,
schemas derivam da entity base.

---

*Documento gerado ao final do projeto DocManager como parte
da retrospectiva. Cada lição tem contexto real — não são
"boas práticas genéricas" mas aprendizados de problemas
que aconteceram.*

---

# Lições adicionais — projeto tradeBot (2026-05)

Aprendizados extraídos do refactor incremental do tradeBot.
Complementam ou refinam as lições do DocManager.

## Etapa 9 — LLM como executor

### Princípios técnicos vs princípios LLM-first vs valores
**Quando se aplica:** ao escrever [[design-principles]].
**Por que importa:** tratar tudo como "princípios" mistura regras
acionáveis com filosofia. Separação em 3 categorias:
- **Técnicos** (4): regras universais de arquitetura.
- **LLM-first** (5): regras específicas pra trabalho com LLM como executor.
- **Valores não-acionáveis** (2): cultura, sem critério binário.
LLM lê critério binário > regra textual.

### Critérios meta padrão (M1, M2, M3)
**Quando se aplica:** toda spec.
**Por que importa:** regras textuais em CLAUDE.md são esquecidas
durante a sessão. Critério em checklist é checkpoint binário.
- **M1**: Decisões de implementação preenchidas com substância.
- **M2**: Decisões técnicas explicitadas em thinking.
- **M3**: Release checklist com símbolos ✅/❌/⚠️ por item.

### Template literal > exemplo aspiracional
**Quando se aplica:** instruir formato de output do Code (ex: M3).
**Por que importa:** "o output deve seguir esse formato:" + bloco
de código fixo é copiado e preenchido. Exemplo aspiracional sem
"Code DEVE reportar usando este formato" é ignorado.

### Mudanças adjacentes vão pra outra spec
**Quando se aplica:** durante implementação de qualquer spec.
**Por que importa:** preserva o binário "passou/falhou", esconde
menos escopo, mantém rastreabilidade. Bug ou refactor tentador
visto durante implementação NÃO entra na spec atual — anota em
"Decisões de implementação" e abre spec separada se relevante.

### `_open-issues.md` como ponte entre regra e esquecimento
**Quando se aplica:** projeto com mais de 3-4 specs.
**Por que importa:** "anotar e adiar" precisa de lugar central,
não enterrado em decisões de spec. Cada item exige "Candidato a
endereçamento" explícito — sem isso, vira lixo.

### Smoke check em código > pendente humano
**Quando se aplica:** quando bug é detectável programaticamente.
**Por que importa:** "pendente humano" significa "ninguém vai
rodar". Bug pode passar silencioso. Quando possível (round-trip,
fixture conhecida), critério vira teste programático.

### Pragmatismo controlado: escape hatch tem destino
**Quando se aplica:** ao aceitar `as any`, `// @ts-ignore`, etc.
**Por que importa:** LLM aceita escape hatches com facilidade.
Aviso explícito: qualquer escape hatch DEVE ser documentado em
"Decisões de implementação" + ter candidato a endereçamento futuro.
Sem destino, vira dívida invisível.

### Limite numérico funciona como guardrail
**Quando se aplica:** ao prescrever ajustes em código existente.
**Por que importa:** "se ajuste exigir mexer em mais de 5 lugares,
parar" é mais efetivo que "menor superfície" abstrato. LLM consegue
contar. Dá um número.

### Mock pesado pra contornar acoplamento estrutural é anti-padrão
**Quando se aplica:** ao testar função que importa módulo com
side-effects.
**Por que importa:** quando o teste precisa de >2 mocks pra carregar
o módulo, o problema é a estrutura, não o teste. Solução é refactor
estrutural, não mais mocks. Caso clássico: side-effects no top-level
do entrypoint.

### Verificar side-effects no top-level antes de prescrever import em teste
**Quando se aplica:** ao escrever spec que prescreve `export` de
função existente pra testar.
**Por que importa:** se o módulo de origem tem `process.exit`,
`new Client(...)`, `run().catch(...)` no top-level, importar em teste
vira rabbit hole. Opções: extrair função pra arquivo próprio, ou
adiar teste pra spec posterior.

## Etapa 10 — Trabalho com snapshots e templates vivos

### Templates vivos > snapshots zero
**Quando se aplica:** ao acumular padrões de múltiplos projetos.
**Por que importa:** snapshot por projeto preserva histórico.
Templates separados, versionados em git, mantêm o estado da arte
atualizável. Os dois são complementares — não substitutos.

### "Fix definitivo" prematuro pode ser falso
**Quando se aplica:** ao fechar issue assumindo que causa raiz
foi resolvida.
**Por que importa:** se o sintoma reaparece em outro contexto,
o fix não era definitivo. Marcar issue como FECHADA exige observar
em pelo menos 2 sessões sem retorno do sintoma.

### Padrão port/adapter cabe em projeto pequeno
**Quando se aplica:** projeto com lib externa cuja interface deve
ser isolada (broker, DB, AI APIs).
**Por que importa:** custo inicial baixo (~80 linhas) destrava
testabilidade, validação de respostas, e flexibilidade pra trocar
implementação. Não é overkill mesmo em projetos pequenos.

### `.passthrough()` em Zod resolve "campos extras pra log"
**Quando se aplica:** validação de respostas de APIs externas
onde a lógica usa só alguns campos mas log/observability quer todos.
**Por que importa:** schema valida campos críticos, runtime mantém
o resto. Tipo inferido fica estrito; cast pra index signature
quando necessário.

### `outDir` separado desde o início
**Quando se aplica:** projeto com `tsc` + Vitest (ou similar).
**Por que importa:** `tsc` gerando `.js` ao lado de `.ts` causa
conflito recorrente — Node prefere `.js` na resolução. Custo de fix
tardio: sessões bloqueadas por arquivos stale. Configurar
`outDir: ./dist/` desde a primeira sessão.

### Múltiplas leituras fragmentadas do mesmo arquivo
**Quando se aplica:** Code lendo arquivo grande com offsets
diferentes.
**Por que importa:** custo de round-trips agregado supera custo
de uma leitura única. Antes de múltiplos `Read` com offsets,
considerar `limit: 2000` em uma única chamada.

### Limite de "tudo numa spec" pode estourar mas vale aceitar
**Quando se aplica:** specs de refactor estrutural maior (mover
muitos arquivos).
**Por que importa:** spec-guide diz ~80-150 linhas. Refactor que
move 10+ funções com testes inevitavelmente passa de 200. Aceitar
quando o escopo é coeso é melhor que dividir em sub-specs que
violam "fases verticais entregam valor".

---

*Lições adicionais extraídas do tradeBot. Padrão: cada lição tem
contexto, "quando se aplica", "por que importa" — não é máxima
abstrata.*

---

# Lições adicionais — projeto painel (2026-06)

Aprendizados do **trade-bot-painel**, o 3º projeto. Aqui o **pipeline de
agentes** ([[pipeline]]) rodou de ponta a ponta pela 1ª vez (conceituação →
documentação funcional → geração de spec → implementação) no Incremento 1.

## Etapa 11 — Pipeline de agentes (conceituação → spec)

### Separar conceituação de geração de spec paga
**Quando se aplica:** projeto novo de produto, não mudança pequena.
**Por que importa:** a conceituação (`agente-conceituacao`) produz um LDoc
estável (dor, casos de uso, roadmap de incrementos, DER amplo) que vira
fonte de verdade; o gerador (`agente-gerador-spec`) só **recorta e
redistribui** isso em specs verticais. Não inventar na geração — se está
escrevendo do zero algo que já está no LDoc, o corte está errado.

### LDoc é fonte da verdade; HDoc deriva estrito
**Quando se aplica:** qualquer artefato de documentação do pipeline.
**Por que importa:** o `.md` para LLM (LDoc) é editado; o doc humano (HDoc)
é sempre regerado dele, nunca editado à mão. Tutorial e exemplos moram no
LDoc (não só no HDoc) — servem ao gerador de spec como referência de
comportamento. Evita duas fontes divergindo.

### Protocolo de gates > regra de gate em prosa
**Quando se aplica:** qualquer ponto de confirmação humana num agente.
**Por que importa:** os agentes "declaravam rigor e cediam a um ok genérico"
em ponto de alto risco. Externalizar para [[protocolo-de-gates]] (alto
risco = lista numerada, "ok" genérico não fecha, valores verificáveis =
alto risco automático) é o mesmo aprendizado dos critérios meta — checklist
binário vence atenção. Limite honesto: mais forte que prosa, não à prova
de falha.

### Roadmap por incremento, estável mas não congelado
**Quando se aplica:** projeto que entrega em fatias de produto.
**Por que importa:** detalhar só o Incremento 1 em alta resolução e manter
os demais em baixa (nome + valor + UCs) evita compromisso prematuro. O
re-entry (detalhar o próximo incremento) inclui um checkpoint "o macro
ainda vale?" — captura aprendizado sem repetir o diálogo macro.

### Schema frouxo ≠ dado ausente
**Quando se aplica:** ao cortar/justificar spec a partir de schemas.
**Por que importa:** `z.array(z.unknown())` significa "forma ainda não
tipada", não "o dado é vazio". No painel, `buyStack`/`sellStack` estavam
`z.unknown()` (vazios na amostra) — quando o dado real apareceu, o shape
foi determinado e as specs `monitor/01` e `03` tiparam. Tratar forma do
schema como forma, nunca como evidência sobre presença/conteúdo do dado.

### Confronto com dado real reconcilia o DER amplo
**Quando se aplica:** geração de spec quando há exemplo real do dado.
**Por que importa:** o DER amplo (raso, por decisão) supôs `orderId` como
`string`; o JSON real tinha `number`. As specs corrigiram (fonte de verdade
= dado real) e registraram a divergência pra reconciliação a jusante. Não
infira a forma do dado da conceituação quando há o dado na mão.

### Docs de orientação descasam do roadmap real — reconciliar cedo
**Quando se aplica:** quando o pipeline reorganiza o trabalho (ex.: de
domínio `tradebot/` para incremento `monitor/`).
**Por que importa:** `_overview`, `CLAUDE.md` (tabela de estado) e o doc de
entrada passam a mentir sobre "qual a próxima spec". A spec em si é
autocontida (não bloqueia), mas o roadmap desatualizado confunde. Issue de
roadmap precisa de candidato e fechamento, igual bug.

### Briefing congelado precisa de nota, não de reescrita
**Quando se aplica:** quando um snapshot canônico (ex.: `Kickoff.md`) fica
obsoleto.
**Por que importa:** reescrever um doc deliberadamente congelado apaga
história e contradiz a decisão de congelá-lo. Uma nota no topo apontando o
roadmap vigente resolve a confusão sem perder o snapshot.

---

*Lições do painel. O pipeline de agentes teve aqui sua 1ª validação real —
tratar como método vivo, não consolidado, até acumular mais runs.*
