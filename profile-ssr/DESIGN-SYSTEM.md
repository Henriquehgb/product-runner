# Design System — Reference (LLM)

> Reference document for AI tools (Claude Code, etc.) and developers working on the painel.
> When in doubt about UI decisions, consult this file before improvising.

---

## Invariants (non-negotiable)

1. **Tokens are the source of truth.** Import from `@/lib/tokens`. Never hardcode color, spacing, radius, motion, or typography values in components.
2. **Components in `components/ui/` import tokens, never hardcode.** Tailwind utilities backed by tokens are the only sanctioned styling path.
3. **DS rules apply everywhere.** Any UI built without consulting this file is suspect. If a rule blocks something legitimate, surface the conflict instead of working around it silently.
4. **Semantic theme tokens are mandatory for structural styling.** Background, text, border, state and focus-ring of base components must use the semantic utilities (`bg-surface`, `text-text-primary`, `border-border-default`, `bg-state-*`, `ring-focus-ring`) — never raw `neutral-*` / `primary-*`. Primitives (`primary/neutral/success/warning/danger`) are reserved for decorative / non-structural cases. See [Theming (Light/Dark)](#theming-lightdark).
5. **Light/dark support is mandatory for DS components.** Components must be theme-agnostic: they render correctly in both themes via CSS variables + `darkMode: 'class'`, without changing component code. The active theme is selected by toggling the `.dark` class on the root (`<html>`).

---

## Tokens

Tokens live in `@/lib/tokens`. Tailwind config consumes them via `theme.extend`.

There are two layers:

- **Primitives** — raw scales. Decorative / non-structural use only.
- **Semantic** — theme-aware roles (background, text, border, state, focus). Mandatory for structural styling. See [Theming (Light/Dark)](#theming-lightdark).

Available namespaces:

- `tokens.color.{primary, neutral, success, warning, danger}.{50..900}` — primitives
- `tokens.semantic.{light,dark}.{bg,text,border,state,focus}` — semantic roles
- `tokens.space.{1, 2, 3, 4, 6, 8}`
- `tokens.radius.{sm, md, lg, xl}`
- `tokens.motion.{fast, base, slow}`
- `tokens.font.{family.{sans, mono}, size.{xs, sm, base, lg, xl}}`

Use Tailwind utilities for everything: `bg-surface`, `text-text-primary`, `p-4`, `rounded-lg`, `duration-base`. For inline styles needing a token value, import from `@/lib/tokens` directly.

---

## Theming (Light/Dark)

The DS supports light and dark themes through a semantic token layer. Components never branch on theme — they reference semantic utilities, and the active theme is chosen by toggling the `.dark` class on `<html>`.

### Token model: primitives × semantic

| Layer         | Where                                         | Example                      | When to use                                                                    |
| ------------- | --------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| **Primitive** | `tokens.color.*` → `bg-primary-600`           | `primary-600`, `neutral-200` | Decorative accents, charts, illustrations, one-off non-structural color.       |
| **Semantic**  | `tokens.semantic.*` → CSS vars → `bg-surface` | `surface`, `text-primary`    | **All structural styling** of base components: bg, text, border, state, focus. |

Flow: `tokens.semantic.{light,dark}` (conceptual map) → RGB-triplet CSS variables in `src/styles/globals.css` (`:root` = light, `.dark` = dark) → Tailwind utilities in `tailwind.config.ts` (`rgb(var(--token) / <alpha-value>)`). `tokens.ts` stays the single source of truth for the role→primitive mapping; keep both files in sync.

### Rule of use

- **Structural → semantic, always.** Surfaces, body/secondary text, separators, the focus ring, and primary/success/warning/danger _state fills_ on base components use semantic utilities.
- **Primitive → decorative only.** Reach for `neutral-*` / `primary-*` only when a value is genuinely not structural (and never for the structural roles a semantic token already covers).
- **State tones (success/warning/danger primitives)** remain acceptable for tonal chips/alerts (non-structural), but neutral and primary structural color must go through semantic tokens.
- **On-color foreground** (text on a saturated state fill, e.g. a primary button) stays `text-white` — it is correct in both themes.

### Official semantic utilities

| Role       | Utilities                                                                     | CSS variable(s)                                                           |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Background | `bg-canvas`, `bg-surface`, `bg-elevated`                                      | `--bg-canvas`, `--bg-surface`, `--bg-elevated`                            |
| Text       | `text-text-primary`, `text-text-secondary`, `text-text-inverse`               | `--text-primary`, `--text-secondary`, `--text-inverse`                    |
| Border     | `border-border-default`, `border-border-subtle`                               | `--border-default`, `--border-subtle`                                     |
| State      | `bg-state-primary`, `bg-state-success`, `bg-state-warning`, `bg-state-danger` | `--state-primary`, `--state-success`, `--state-warning`, `--state-danger` |
| Focus ring | `ring-focus-ring` (use with `focus-visible:ring-2`)                           | `--focus-ring`                                                            |

These accept alpha (e.g. `bg-state-primary/10`, `hover:bg-text-primary/5`) because the config maps them as `rgb(var(--token) / <alpha-value>)`. Two recurring theme-agnostic patterns: subtle hovers via `hover:bg-text-primary/5|10`, and inverse surfaces (tooltip/toast info) via `bg-text-primary text-text-inverse`.

### Do / Don't

**Do**

- Use `bg-surface` / `bg-canvas` / `bg-elevated` for component surfaces.
- Use `text-text-primary` / `text-text-secondary` for content text.
- Use `border-border-default` / `-subtle` for separators and outlines.
- Use `ring-focus-ring` for focus-visible rings, `border-state-danger` + `ring-state-danger` for error fields.
- Express subtle hovers as `hover:bg-text-primary/5` (or `/10`) so they adapt to the theme.

**Don't**

- Don't use `bg-white`, `bg-neutral-50`, `text-neutral-900`, `border-neutral-200`, `focus:ring-primary-500` for structural styling.
- Don't hardcode hex/rgb/hsl in `components/ui/*`.
- Don't branch component logic on the theme — semantic tokens already do it.
- Don't add a new CSS variable without also adding its `:root` + `.dark` value and a Tailwind utility mapping.

### Quick substitution table

| Before                   | After                   |
| ------------------------ | ----------------------- |
| `bg-white`               | `bg-surface`            |
| `bg-neutral-50`          | `bg-canvas`             |
| `text-neutral-900`       | `text-text-primary`     |
| `text-neutral-600/500`   | `text-text-secondary`   |
| `border-neutral-200`     | `border-border-default` |
| `focus:ring-primary-500` | `focus:ring-focus-ring` |

### Example

```tsx
// Theme-agnostic surface — renders correctly in light and dark.
<div className="bg-surface text-text-primary border border-border-default rounded-lg p-4">
  <h3 className="font-semibold">Resumo</h3>
  <p className="text-text-secondary">Detalhe secundário.</p>
  <button className="mt-3 h-9 px-4 rounded-md bg-state-primary text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
    Salvar
  </button>
</div>
```

Enabling dark mode: toggle the class on the root — `document.documentElement.classList.toggle('dark')`. The DS Explorer header (`/ds-explorer`) has a working toggle that exercises every component in both themes.

---

## Patterns

Transversal rules that govern how components compose. Each component declares which patterns it applies.

### Alinhamento de ações (`action-alignment`)

Em qualquer container que agrupe ações (footer de form, card, modal, drawer, toolbar), as ações ficam alinhadas à direita, com a primária na ponta direita.

**Rule:** Ações secundárias (Cancelar/Limpar/Voltar) à esquerda do grupo. Primária (Salvar/Enviar/Confirmar/Excluir destrutivo) sempre na ponta direita. Espaçamento entre botões = `space.2`.

**Applies to:** Form, Card (footer com ações), Modal/Dialog, Drawer/Sheet, Page toolbar
**Does NOT apply to:** Botões-gatilho avulsos no meio de conteúdo, ações inline em linhas de tabela, CTAs em landing/marketing, toolbar contextual em editor

---

### Timing de validação (`validation-timing`)

Quando disparar validação para que o feedback seja útil sem ser ruidoso.

**Rule:** Campos individuais validam onBlur. Form inteiro valida onSubmit. Nunca onChange a cada tecla, exceto para feedback contínuo previsível (medidor de senha, contador de caracteres). Após erro de submit, revalidar onChange para o erro sumir conforme o usuário corrige.

**Applies to:** Input, Select, Form, Form fields compostos
**Does NOT apply to:** Search-as-you-type, editores colaborativos em tempo real, medidor de força de senha / contador de caracteres

---

### Estados vazios (`empty-states`)

Toda lista, tabela ou área de conteúdo dinâmico precisa de um estado vazio que explique e ofereça caminho.

**Rule:** Estado vazio tem: (1) ícone/ilustração simples, (2) título curto que diz por que está vazio, (3) descrição opcional com próximo passo, (4) ação primária quando aplicável. Diferenciar 3 tipos: nunca-teve-dados (onboarding), filtro-vazio (limpar filtro), erro-de-carga (tentar novamente).

**Applies to:** Table, Listas, Dashboard widgets, Resultados de busca/filtro, Caixa de entrada
**Does NOT apply to:** Áreas vazias durante loading (use Skeleton), campos de formulário vazios, containers que falham por erro de rede (use Alert)

---

### Estados de carregamento (`loading-states`)

Qual indicador usar em função da latência esperada.

**Rule:** <300ms: nada. 300ms–1s: spinner inline ou loading no botão acionado. 1–10s: skeleton replicando layout final. >10s: skeleton + mensagem de progresso ou estimativa. Sempre prever fallback de erro com retry.

**Applies to:** Table (skeleton de linhas), Card com dados async, Dashboard widgets, Botão durante submit, Página em navegação
**Does NOT apply to:** Operações locais síncronas, ações instantâneas confirmadas (use Toast pós-conclusão)

---

### Hierarquia de feedback (`feedback-hierarchy`)

Qual canal usar — Toast, Alert ou Modal — em função da urgência e do bloqueio que o feedback deve impor.

**Rule:** Toast = evento transitório do sistema, não-bloqueante (salvo, copiado, enviado), auto-dismiss 4–7s. Alert = info persistente em-página, contextual à view, não bloqueia. Modal = decisão obrigatória antes de continuar, bloqueia até resposta.

**Applies to:** Toast, Alert, Modal, Banners de sistema
**Does NOT apply to:** Mensagens de erro inline em formulário (parte do Input), Tooltips (informação on-demand)

---

## Components

21 components total, alphabetical.

### Accordion

`@/components/ui/accordion` — Seções colapsáveis para revelar conteúdo sob demanda, reduzindo a primeira impressão de uma tela densa.

**Patterns:** —

| prop          | type                                                  | default |
| ------------- | ----------------------------------------------------- | ------- |
| items         | `{ id: string, title: string, content: ReactNode }[]` | —       |
| allowMultiple | `boolean`                                             | false   |
| defaultOpen   | `string[]`                                            | []      |

**Do:** Use para FAQs, configurações em grupos, detalhes opcionais • Títulos descritivos (não "Mais") • allowMultiple quando seções são independentes • Estado inicial fechado por padrão
**Don't:** Accordion para fluxo sequencial obrigatório (use Stepper) • Esconder informação crítica em accordion fechado • Aninhar accordions além de 1 nível • Animar abertura por mais de 200ms

**Example:**

```tsx
<Accordion items={faqItems} allowMultiple />
```

---

### Alert

`@/components/ui/alert` — Mensagem persistente em-página sobre estado relevante.

**Patterns:** `feedback-hierarchy`

| prop    | type                                     | default |
| ------- | ---------------------------------------- | ------- |
| tone    | `'info'\|'success'\|'warning'\|'danger'` | info    |
| title   | `string`                                 | —       |
| onClose | `() => void`                             | —       |

**Do:** Use para info contextual permanente • Inclua ação se houver ("Tentar novamente") • Tom semântico correto
**Don't:** Múltiplos alerts amontoados • Tom vermelho em info benigna

**Example:**

```tsx
<Alert tone="warning" title="Sessão expira em 5 min">
  Salve seu trabalho.
</Alert>
```

---

### Avatar

`@/components/ui/avatar` — Representar identidade de usuário ou entidade.

**Patterns:** —

| prop | type               | default |
| ---- | ------------------ | ------- |
| name | `string`           | —       |
| src  | `string`           | —       |
| size | `'sm'\|'md'\|'lg'` | md      |

**Do:** Sempre aria-label com nome • Fallback de iniciais • Tamanhos consistentes
**Don't:** Avatar sem alt/label • Imagem genérica que confunde com ícone • Múltiplos tamanhos misturados na mesma lista

**Example:**

```tsx
<Avatar name="Henrique Souza" />
```

---

### Badge

`@/components/ui/badge` — Etiqueta curta para status, contagem ou categoria.

**Patterns:** —

| prop | type                                                | default |
| ---- | --------------------------------------------------- | ------- |
| tone | `'neutral'\|'info'\|'success'\|'warning'\|'danger'` | neutral |

**Do:** 1-2 palavras • Use junto a um elemento que ele descreve • Tom semântico
**Don't:** Badge isolado sem âncora visual • Badge em vez de Button • Frase completa

**Example:**

```tsx
<Badge tone="success">Aprovado</Badge>
```

---

### Breadcrumb

`@/components/ui/breadcrumb` — Mostrar localização hierárquica e oferecer caminho de volta.

**Patterns:** —

| prop  | type                                 | default |
| ----- | ------------------------------------ | ------- |
| items | `{ label: string, href?: string }[]` | —       |

**Do:** Último item não-link, com aria-current="page" • Use em hierarquias profundas (≥2) • Separador consistente
**Don't:** Breadcrumb em telas planas • Substituir nav primária • Quebrar em múltiplas linhas em desktop

**Example:**

```tsx
<Breadcrumb
  items={[
    { label: 'Início', href: '/' },
    { label: 'Documentos', href: '/docs' },
    { label: 'Inventário 2025' },
  ]}
/>
```

---

### Button

`@/components/ui/button` — Disparar ação imediata do usuário.

**Patterns:** `action-alignment`

| prop      | type                                        | default |
| --------- | ------------------------------------------- | ------- |
| variant   | `'primary'\|'secondary'\|'danger'\|'ghost'` | primary |
| size      | `'sm'\|'md'\|'lg'`                          | md      |
| loading   | `boolean`                                   | false   |
| disabled  | `boolean`                                   | false   |
| leftIcon  | `IconComponent`                             | —       |
| rightIcon | `IconComponent`                             | —       |

**Do:** Use 1 botão primário por área de decisão • Texto-verbo no infinitivo ("Salvar", "Enviar") • Use loading em ações ≥ 200ms
**Don't:** Múltiplos primários competindo • Texto vago ("OK", "Clique aqui") • Tamanho < 40px em mobile

**Example:**

```tsx
<Button loading>Salvando…</Button>
```

---

### Card

`@/components/ui/card` — Agrupar conteúdo relacionado em uma unidade visual.

**Patterns:** `action-alignment`

| prop      | type        | default |
| --------- | ----------- | ------- |
| title     | `ReactNode` | —       |
| footer    | `ReactNode` | —       |
| className | `string`    | —       |

**Do:** Use para agrupar conteúdo coeso • Mantenha hierarquia: title → content → actions • Footer só para ações ou metadados
**Don't:** Card aninhado em card aninhado em card • Conteúdo desconexo no mesmo card • Sombra agressiva

**Example:**

```tsx
<Card
  title="Resumo"
  footer={
    <div className="flex justify-end">
      <Button size="sm">Detalhes</Button>
    </div>
  }
>
  <p>Conteúdo principal.</p>
</Card>
```

---

### Checkbox

`@/components/ui/checkbox` — Seleção independente (0..N) ou toggle binário em formulário.

**Patterns:** —

| prop     | type          | default |
| -------- | ------------- | ------- |
| label    | `string`      | —       |
| checked  | `boolean`     | —       |
| onChange | `(e) => void` | —       |

**Do:** Label clicável (associada via htmlFor) • Use para opções independentes • Erro de obrigatório claro
**Don't:** Checkbox para escolha exclusiva (use radio) • Sem label visível • Estado indeterminado sem necessidade

**Example:**

```tsx
<Checkbox
  label="Receber novidades"
  checked={v}
  onChange={(e) => setV(e.target.checked)}
/>
```

---

### DatePicker

`@/components/ui/date-picker` — Selecionar uma data por digitação ou pelo calendário, com formato local.

**Patterns:** `validation-timing`

| prop     | type                           | default |
| -------- | ------------------------------ | ------- |
| value    | `Date \| null`                 | —       |
| onChange | `(date: Date \| null) => void` | —       |
| label    | `string`                       | —       |
| hint     | `string`                       | —       |
| error    | `string`                       | —       |

**Do:** Aceite digitação E seleção visual • Use formato local (dd/mm/aaaa em pt-BR) • Hoje destacado, selecionado destacado distintamente • Botões "Hoje" e "Limpar" como atalhos
**Don't:** Forçar máscara que bloqueia colar • Calendário sem destaque visual de hoje • DatePicker para datas pré-definidas (use Select com opções) • Calendário cobrindo o input após seleção

**Example:**

```tsx
<DatePicker
  label="Data de nascimento"
  value={d}
  onChange={setD}
  hint="Use dd/mm/aaaa"
/>
```

---

### Form

`@/components/ui/form` — Composição de campos com validação, submissão e feedback. Usar com react-hook-form + zod resolver.

**Patterns:** `action-alignment`, `validation-timing`

_Sem props diretas — é composição._

**Do:** Reutilize schema do service (não duplique validação) • Foco vai para o primeiro campo com erro • Confirme sucesso explicitamente (Toast ou Alert) • Erros de API via Toast
**Don't:** Submeter sem feedback • Esconder campos obrigatórios em accordions fechados • Resetar dados após erro • Duplicar validação entre client e service

A API real é `Form` + `FormFooter` (não `FormField`/`FormItem`/`FormMessage`).
Os campos (`Input`, `Select`, `Checkbox`) trazem label/hint/error embutidos.

**Example:**

```tsx
const [data, setData] = useState({ email: '', role: 'analyst' });
const [errors, setErrors] = useState<Record<string, string>>({});

<Form onSubmit={handleSubmit}>
  <Input
    label="E-mail"
    type="email"
    required
    value={data.email}
    onChange={(e) => setData({ ...data, email: e.target.value })}
    onBlur={() => validateEmail(data.email, setErrors)}
    error={errors.email}
  />
  <FormFooter>
    <Button variant="ghost" type="button">
      Limpar
    </Button>
    <Button type="submit">Enviar</Button>
  </FormFooter>
</Form>;
```

**RHF + zod compatibility:** Input/Select/Checkbox exportam `forwardRef`. Use `{...register('campo')}` direto.

---

### Input

`@/components/ui/input` — Coletar texto curto do usuário.

**Patterns:** `validation-timing`

| prop     | type            | default |
| -------- | --------------- | ------- |
| label    | `string`        | —       |
| hint     | `string`        | —       |
| error    | `string`        | —       |
| required | `boolean`       | false   |
| type     | `HTMLInputType` | text    |

**Do:** Sempre use label visível • Indique \* em campos obrigatórios • Erros descrevem o problema E como corrigir
**Don't:** Placeholder substituindo label • Erro só por cor da borda • Validação só ao submeter, sem hint prévio

**Example:**

```tsx
<Input label="E-mail" hint="Usaremos para login" type="email" />
```

---

### Modal

`@/components/ui/dialog` — Tarefa focada que exige atenção total ou confirmação destrutiva.

**Patterns:** `action-alignment`, `feedback-hierarchy`

| prop    | type         | default |
| ------- | ------------ | ------- |
| open    | `boolean`    | —       |
| onClose | `() => void` | —       |
| title   | `ReactNode`  | —       |
| footer  | `ReactNode`  | —       |

**Do:** Foco vai para 1º elemento ao abrir • Esc fecha
**Don't:** Modal para fluxo longo • Modal sobre modal • Confirmações triviais ("Tem certeza que quer salvar?")

**Example:**

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Excluir documento"
  footer={
    <>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="danger">Excluir</Button>
    </>
  }
>
  Esta ação não pode ser desfeita.
</Modal>
```

---

### Nav

`@/components/ui/nav` — Estrutura de navegação primária. Exporta dois componentes para composição flexível: `TopBar` (header) e `SideNav` (lista lateral).

**Patterns:** —

**TopBar:**

| prop    | type        | default |
| ------- | ----------- | ------- |
| brand   | `ReactNode` | —       |
| actions | `ReactNode` | —       |

**SideNav:**

| prop       | type                            | default |
| ---------- | ------------------------------- | ------- |
| items      | `{ id, label, href?, icon? }[]` | —       |
| activeId   | `string`                        | —       |
| onNavigate | `(id: string) => void`          | —       |

**Do:** Marque rota ativa com aria-current="page" • Limite top-level a ~5-7 itens • Mantenha ordem estável
**Don't:** Reordenar itens dinamicamente • Esconder navegação principal em hover • Ícones sem texto em desktop

**Example:**

```tsx
<TopBar brand={<Logo />} actions={<Avatar name="HS" />} />
<SideNav items={navItems} activeId={route} />
```

---

### Pagination

`@/components/ui/pagination` — Navegar entre páginas de uma lista longa, mantendo posição clara e atalhos para extremos.

**Patterns:** `loading-states`

| prop         | type                     | default |
| ------------ | ------------------------ | ------- |
| page         | `number`                 | —       |
| totalPages   | `number`                 | —       |
| onChange     | `(page: number) => void` | —       |
| siblingCount | `number`                 | 1       |

**Do:** Mostre primeira e última página sempre • Use ellipsis para gaps • Indique página atual com aria-current="page"
**Don't:** Listar todas as páginas em listas longas (>10) • Pagination quando infinite scroll é melhor (feeds) • Tamanho de alvo < 44px em mobile • Esconder total de páginas

**Example:**

```tsx
<Pagination page={page} totalPages={50} onChange={setPage} />
```

---

### Popover

`@/components/ui/popover` — Painel flutuante interativo, ancorado a um gatilho, com conteúdo rico (texto, ações, formulários curtos).

**Patterns:** `action-alignment`

| prop     | type              | default |
| -------- | ----------------- | ------- |
| trigger  | `ReactNode`       | —       |
| side     | `'top'\|'bottom'` | bottom  |
| children | `ReactNode`       | —       |

**Do:** Use para conteúdo rico mas curto (até 3 ações) • Esc deve fechar • Posicione próximo ao gatilho
**Don't:** Popover para hint simples (use Tooltip) • Popover para fluxo longo (use Modal/Drawer) • Popover sem ancoragem visual ao gatilho • Múltiplos popovers abertos simultaneamente

**Example:**

```tsx
<Popover trigger={<Button>Conta</Button>}>
  <button>Perfil</button>
  <button>Configurações</button>
  <button>Sair</button>
</Popover>
```

---

### Select

`@/components/ui/select` — Escolha única entre poucas opções conhecidas.

**Patterns:** `validation-timing`

| prop    | type                                 | default |
| ------- | ------------------------------------ | ------- |
| label   | `string`                             | —       |
| options | `{ value: string, label: string }[]` | []      |
| hint    | `string`                             | —       |
| error   | `string`                             | —       |

**Do:** Default razoável já selecionado • Ordem lógica (alfabética/frequência) • Para >10 opções use combobox com busca
**Don't:** Select com 1 opção • Select para múltipla seleção (use checkboxes) • Mudança de opção disparando navegação sem aviso

**Example:**

```tsx
<Select
  label="Função"
  options={[
    { value: 'analyst', label: 'Analista' },
    { value: 'manager', label: 'Gerente' },
  ]}
/>
```

---

### Skeleton

`@/components/ui/skeleton` — Placeholder de carregamento que reproduz o layout final.

**Patterns:** `loading-states`

| prop      | type     | default |
| --------- | -------- | ------- |
| className | `string` | —       |

**Do:** Reproduza dimensões aproximadas do conteúdo final • aria-hidden + role=presentation
**Don't:** Forma muito diferente do real (causa shift) • Spinner + skeleton ao mesmo tempo

**Example:**

```tsx
<div className="space-y-2">
  <Skeleton className="h-5 w-1/2" />
  <Skeleton className="h-4 w-full" />
</div>
```

---

### Table

`@/components/ui/table` — Exibir dados tabulares para comparação e ordenação.

**Patterns:** `empty-states`, `loading-states`

| prop      | type                                                   | default |
| --------- | ------------------------------------------------------ | ------- |
| columns   | `{ key: string, label: string, sortable?: boolean }[]` | —       |
| rows      | `Record<string, ReactNode>[]`                          | —       |
| maxHeight | `number \| string`                                     | —       |

**Do:** Headers de coluna sempre visíveis • Alinhe números à direita • Para encaixar uma lista pequena/moderada num espaço limitado, use `maxHeight` (rolagem vertical com header fixo no topo) • Forneça paginação >25 linhas
**Don't:** Tabela para dados não tabulares • Ordenação só por mouse • Larguras instáveis a cada render • `maxHeight` como substituto de paginação (a regra dos 25 vale dentro e fora do scroll)

**Altura máxima + scroll vertical:** quando `maxHeight` é definida, o wrapper vira contexto de rolagem (`overflow-auto`) e o `thead` fica `sticky` no topo, mantendo os headers visíveis enquanto as linhas rolam. `number` é interpretado como px. É **ortogonal** à paginação: serve para encaixar uma lista que cresce (ex.: compras de um par) dentro de um card sem esticar a página — **não** substitui paginação. Datasets grandes seguem a regra de paginação (>25 linhas) mesmo dentro do scroll, para não renderizar/rolar centenas de linhas.

**Example:**

```tsx
<Table
  columns={[
    { key: 'doc', label: 'Documento', sortable: true },
    { key: 'status', label: 'Status' },
  ]}
  rows={data}
/>

// Lista longa em altura limitada: corpo rola, header fica fixo.
<Table columns={columns} rows={manyRows} maxHeight={280} />
```

---

### Tabs

`@/components/ui/tabs` — Alternar entre seções de mesmo nível em uma área de conteúdo.

**Patterns:** —

| prop  | type                                      | default |
| ----- | ----------------------------------------- | ------- |
| items | `{ label: string, content: ReactNode }[]` | —       |

**Do:** Use 2-6 abas • Labels curtos (1-2 palavras) • Mantenha conteúdos de mesma natureza
**Don't:** Tabs para fluxo sequencial (use Stepper) • Tabs aninhadas • Conteúdo crítico só em aba secundária

**Example:**

```tsx
<Tabs
  items={[
    { label: 'Visão geral', content: <p>Resumo</p> },
    { label: 'Detalhes', content: <p>Detalhes</p> },
  ]}
/>
```

---

### Toast

`@/components/ui/toast` — Feedback transitório de evento do sistema.

**Patterns:** `feedback-hierarchy`

| prop     | type                                     | default |
| -------- | ---------------------------------------- | ------- |
| tone     | `'info'\|'success'\|'warning'\|'danger'` | info    |
| title    | `string`                                 | —       |
| children | `ReactNode`                              | —       |

**Do:** Mensagens curtas (1 linha) • Auto-dismiss em 4-7s para info/success • Erros persistentes até dismiss manual
**Don't:** Vários toasts empilhados sem agrupamento • Texto comprido

**Example:**

```tsx
const { toast } = useToast();

toast({
  tone: 'success',
  title: 'Salvo',
  description: 'Alterações persistidas.',
});
toast({ tone: 'danger', title: 'Falha', duration: Infinity });
```

**Setup:** wrap app tree em `<ToastProvider>` no `_app.tsx`.

---

### Tooltip

`@/components/ui/tooltip` — Hint curto e on-demand sobre um elemento, exibido em hover/focus.

**Patterns:** —

| prop    | type                               | default |
| ------- | ---------------------------------- | ------- |
| content | `string \| ReactNode`              | —       |
| side    | `'top'\|'bottom'\|'left'\|'right'` | top     |
| delay   | `number (ms)`                      | 300     |

**Do:** Use para esclarecer ícones sem rótulo • Texto curto (1 linha, sem ações) • Delay de ~300ms antes de aparecer • Aparece em hover E focus
**Don't:** Tooltip com info crítica (ela some) • Tooltip com botões/links interativos (use Popover) • Tooltip em texto já legível • Tooltip que cobre o gatilho

**Example:**

```tsx
<Tooltip content="Filtrar resultados">
  <Button variant="ghost" size="icon">
    <Filter />
  </Button>
</Tooltip>
```

---

## Workflow for AI tools (Claude Code, etc.)

When implementing or editing UI:

1. Identify the components involved. If unsure, check this file's component sections.
2. Identify which patterns apply (from the **Patterns** field of each component).
3. Respect the Do/Don't rules per component and the Rule of each applied pattern.
4. Use tokens from `@/lib/tokens` for all visual decisions. If hardcoding seems necessary, the spec is incomplete — surface that.
5. If you cannot fulfill a request without violating a Do/Don't or an invariant, surface the conflict instead of silently working around it.

---

## PR checklist (UI / DS)

Before opening a PR that touches UI, confirm:

- [ ] No hardcoded colors (hex/rgb/hsl) in `components/ui/*`.
- [ ] Structural styling uses semantic utilities (`bg-surface`/`bg-canvas`, `text-text-*`, `border-border-*`, `bg-state-*`, `ring-focus-ring`) — no raw `neutral-*` / `primary-*`.
- [ ] Renders correctly in both light and dark (verify with the `/ds-explorer` theme toggle).
- [ ] Focus-visible state is clearly visible in both themes.
- [ ] Contrast is acceptable (text vs background, in both themes).
