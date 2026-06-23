# Spec guide

Como ler, escrever e implementar specs neste projeto. Este guia é a
**referência de formato e critérios** da spec: o template, os critérios
meta, a granularidade, as regras de implementação e o review.

A **geração** das specs (cortar um incremento conceituado em N specs
verticais) é o [agente-gerador-spec](./agents/agente-gerador-spec.md), que consome este guia e o preenche
a partir dos artefatos a montante — ver [pipeline](./pipeline.md). Para mudanças
pequenas ou projetos sem conceituação formal, escreva a spec direto neste
template (o pipeline inteiro não é obrigatório — ver "Fixes vs specs").

---

## O que é uma spec

Definição completa de uma mudança: contexto, dependências, entrega,
arquivos afetados, regras, não-objetivos e critérios binários
de "pronto".

Spec é **contrato**, não tutorial. Diz **O QUE** muda, não **COMO**
implementar linha a linha — exceto quando o "como" é parte da
decisão (ex: "use Object.setPrototypeOf, não factory fromPlain").

---

## Onde vivem

```
specs/
├── _overview.md          ← roadmap, fases, dependências
├── setup/                ← infra, hardening, ferramentas
│   ├── 00-hardening.md
│   ├── 01-test-harness.md
│   └── ...
├── refactor/             ← reorganização do código existente
│   ├── 03-pure-logic.md
│   └── ...
└── {domínio}/            ← features novas (quando houver)
```

Numeração indica ordem dentro do domínio. Domínios são estáveis;
fases podem mudar.

---

## Template

```markdown
# {Domínio} — {Nome da mudança}

## Contexto

Por que esta spec existe. Problema que resolve. Link pra spec
anterior se depender.

## Depende de

- `{domínio}/NN-{spec anterior}` (se houver)

## Entrega

O que funciona ao final. Visão de fora — o que muda no
comportamento ou na estrutura.

## Entities envolvidas

Schemas, types, classes novos ou alterados. Sem código
completo — só assinaturas e decisões.

## Mudanças por arquivo

Arquivo a arquivo, o que muda. Aceita pseudocódigo / blocos
curtos quando a decisão precisa ser explícita.

## Regras de negócio

Validações, limites, edge cases. O que NÃO pode acontecer.

## Não-objetivos

O que esta spec NÃO faz, mesmo que apareça tentação. Cita
spec futura se for fazer depois.

## Critérios de aceite

- [ ] Cada item é binário: passa ou não passa.
- [ ] Verificável por comando, observação direta ou diff.

## Notas pra implementação

Guardrails específicos: ferramentas, alternativas descartadas,
ordem sugerida, tradeoffs.

## Decisões de implementação

(Preencher após implementação — divergências, escolhas, tentações
não feitas. Esta seção é OBRIGATÓRIA, não opcional.)
```

---

## Critérios meta padrão

Toda spec aplica estes critérios **além** dos específicos listados
na própria spec. Não precisam ser repetidos em cada spec — esta
seção é a referência canônica. Specs referenciam por nome
("aplicam-se também os critérios meta padrão M1, M2, M3").

Estes critérios existem porque regras textuais em `CLAUDE.md`
e neste guia foram observadas como insuficientes — Claude Code
lê uma vez e tende a esquecer durante a sessão. Critério binário
em checklist vence atenção.

> **Relação com os gates.** M1-M3 são a **aplicação à etapa de spec** do
> mesmo princípio do [protocolo-de-gates](./agents/protocolo-de-gates.md) (fonte canônica de gate e
> calibragem por stakes): checklist binário vence atenção textual. O
> protocolo governa os gates dos estágios a montante (conceituação,
> doc-funcional, geração); M1-M3 governam o fechamento da implementação.
> Em specs de UI, aplica-se também **M4** (responsividade — detalhe em
> `ui-patterns.md` do perfil SSR). Specs referenciam por nome:
> "aplicam-se M1, M2, M3" (e M4 quando houver UI).

### M1 — Decisões de implementação preenchidas

- [ ] A seção `## Decisões de implementação` da spec contém ao
      menos um parágrafo descrevendo: - Divergências da spec original (se houve). - Escolhas entre alternativas técnicas (qual e por quê). - Tentações de escopo NÃO executadas. - Status final (✅ / ⚠️ / ❌).
- [ ] Seção vazia ou só template original = critério **não** atendido.

### M2 — Decisões técnicas explicitadas durante a sessão

- [ ] Cada escolha não-óbvia entre alternativas (cast vs guard,
      qual lib, mock vs fixture, signature, etc.) aparece num
      thinking block ou comentário durante a sessão.
- [ ] Reportada no resumo final junto com a justificativa.
- [ ] Decisões silenciosas (escolha tomada sem rastro) violam
      este critério.

### M3 — Release checklist explícito antes de declarar pronto

- [ ] Antes de reportar conclusão, percorrer cada critério de
      aceite da spec e marcar ✅ / ❌ / ⚠️ explicitamente
      (incluindo os meta).
- [ ] Reportar a varredura no resumo final.
- [ ] Smoke checks marcados como "pendente humano" exigem nota
      curta explicando por que não foi feito automaticamente
      (ex: precisa de credenciais reais, exige observação visual).

---

## Princípios

### Spec é contrato, não tutorial

Regra: dizer **O QUE**, não **COMO** — exceto quando o COMO é
a essência da decisão.

Exemplos:

- ✅ "Validar `BINANCE_API_KEY` no boot. Se ausente, fail-fast com mensagem clara."
- ❌ "Linha 17, adicionar `if (!process.env.BINANCE_API_KEY) throw new Error(...)`."
- ✅ "Use `Object.setPrototypeOf`, não factory `fromPlain` — escolha justificada na nota X." (o COMO é parte da decisão)

### Granularidade: uma spec = uma sessão

Spec entre **80-150 linhas**. Mais curta vira fix; mais longa
quebra em duas.

Se ao escrever a spec ela passa de 150 linhas, sinal de que tem
duas mudanças disfarçadas de uma. Separar.

### Critérios binários

Cada critério de aceite é verificável por comando ou observação
direta. Sem "o sistema funciona corretamente".

Exemplos:

- ✅ `git grep -E '(eNls3mjIoTZ|vIE3NutkqUq6)'` retorna vazio.
- ✅ Rodar `npm test` retorna `Tests passed: 12`.
- ❌ "O bot está estável."
- ❌ "Erros são tratados de forma robusta."

### Escopo travado por não-objetivos

Sempre listar "Não-objetivos" antes do checklist. LLM tende a
fazer mais que pedido — lista de "não fazer" ancora.

Itens típicos: "Não migrar X agora", "Não tocar em Y", "Não fazer
fix do bug Z (vai em refactor/03)".

### Fases verticais, não horizontais

Cada spec deve entregar **valor visível de ponta a ponta** dentro
do seu escopo, não construir uma camada inteira pra próxima
spec usar.

- ❌ Horizontal: spec só de schemas, depois só de services, depois só de testes.
- ✅ Vertical: spec de "test harness com 1ª cobertura de WavesHistory" — entrega
  schemas + setup + 1 teste rodando.

---

## Workflow

Este é o **trecho de implementação** do método (spec→implementa→review).
Quando o projeto passa pelo pipeline completo, a "escrita da spec" é o
[agente-gerador-spec](./agents/agente-gerador-spec.md) cortando o incremento conceituado — ver [pipeline](./pipeline.md).
Em mudança pequena, a spec é escrita direto neste template.

### Quem faz o quê

| Etapa                     | Onde                       | Quem                                |
| ------------------------- | -------------------------- | ----------------------------------- |
| Análise, gap, decisão     | Cowork (esta sessão)       | LLM + você                          |
| Escrita da spec           | Cowork                     | LLM ([agente-gerador-spec](./agents/agente-gerador-spec.md) no pipeline) + validação sua |
| Implementação             | Claude Code (outra sessão) | LLM em sessão dedicada              |
| Review                    | Cowork (volta aqui)        | LLM + você                          |
| Decisões de implementação | Cowork (review preenche)   | LLM + você                          |

### Ciclo

1. Cowork escreve spec → grava em `specs/.../NN-nome.md`.
2. Você abre Claude Code apontando pro repo.
3. Pede ao Code: "implementa `specs/.../NN-nome.md`".
4. Code implementa, reporta no chat.
5. Você traz o report de volta pra Cowork.
6. Cowork revisa contra critérios, preenche "Decisões de implementação".
7. Cowork escreve próxima spec.

---

## Como o Claude Code lê

Ordem sugerida (ele conhece esse padrão):

1. Ler a spec INTEIRA antes de começar.
2. Verificar "Depende de" — se a dependência não está implementada, parar.
3. Ler `docs/` relevantes (referenciados na spec ou no CLAUDE.md).
4. Implementar mudanças por arquivo.
5. Rodar critérios de aceite localmente — confirmar cada um.
6. Reportar:
    - Cada critério ✅ ou ❌.
    - Decisões de implementação (escolhas + tradeoffs).
    - Notas: o que não testou, tentações que apareceram, divergências.

### Regras operacionais durante implementação

- **3 strikes:** se uma abordagem falhou 3 vezes, parar e relatar.
  Não entrar em loop tentando variações.
- **Spec vs realidade:** se a spec tem tradeoff técnico significativo
  na implementação, parar e apresentar — spec é guia, não lei.
- **Menor superfície:** preferir solução que altera menos arquivos.
- **Não adivinhar:** se a spec não cobre, perguntar.
- **Verificar side-effects no top-level antes de prescrever import
  em teste.** Ao escrever spec que importa código existente pra
  testar, checar primeiro se o módulo de origem tem side-effects no
  top-level (`process.exit`, `new Client(...)`, `run().catch(...)`,
  etc.). Se tiver, **não prescrever apenas `export`** — não funciona.
  Opções: (a) extrair função pra arquivo próprio (vira refactor,
  amplia escopo da spec); (b) adiar teste pra spec posterior. Não há
  solução barata via mock que valha o investimento dos 3 strikes.
  _Lição extraída de `setup/01-test-harness` no tradeBot, onde a
  spec assumiu que `export` em função de `index.ts` bastava._

- **Mudanças adjacentes vão pra outra spec.** Quando a implementação
  expõe um problema que NÃO faz parte da intenção da spec atual
  (bug em código adjacente, refactor tentador, melhoria não-pedida),
  **não corrigir na mesma spec**. Anotar em "Decisões de
  implementação" como achado, abrir spec separada se for relevante.

    Exemplos:
    - Spec de testes expõe que `WavesHistory.ticPrice` tem
      comportamento esquisito num edge case → o teste reflete
      o comportamento ATUAL (caracterização), fix vai em outra spec.
    - Spec de refactor de service expõe um bug aritmético → anota,
      não corrige junto.
    - Spec de Zod expõe que um campo nullable nunca é nulo na
      prática → anota como candidato a `.nonNullable()`, não
      muda agora.

    Razão: misturar correção com a intenção principal reduz o
    binário "passou/falhou" da spec, esconde escopo, e confunde
    rastreabilidade. O bug visto AGORA continua visível DEPOIS — anotar
    é suficiente pra não se perder.

---

## Como o review funciona

Trazer o report do Code de volta pra Cowork. A revisão:

1. Cruza critérios da spec com o estado real do código (não apenas
   o report).
2. Identifica divergências silenciosas (coisas mudadas que não foram
   reportadas).
3. Documenta na seção "Decisões de implementação" da spec — não
   em mensagem solta.
4. Se houver fix necessário pequeno, faz inline. Se for grande,
   abre nova spec.

A seção "Decisões de implementação" é OBRIGATÓRIA. Spec sem ela
preenchida = spec incompleta.

---

## Fixes vs specs

Nem tudo precisa de spec.

| Situação                                               | Spec?                      |
| ------------------------------------------------------ | -------------------------- |
| Adicionar entity, schema, service novo                 | Sim                        |
| Refactor estrutural (mover código entre pastas)        | Sim                        |
| Mudar comportamento de cálculo / regra de trade        | Sim                        |
| Bug menor (typo, parêntese errado, condição invertida) | Não                        |
| Ajuste de log / mensagem                               | Não                        |
| Atualização de dependência                             | Não (a menos que mude API) |

Regra: se altera contrato (schema, função pública, comportamento
observável de fora), spec. Se é correção do que já deveria funcionar,
fix direto.

---

_Este guia é vivo. Padrões entram aqui quando aparecem na prática,
não por importação de "boas práticas" genéricas._
