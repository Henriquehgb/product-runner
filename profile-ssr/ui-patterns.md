# UI patterns

Padrões para componentes, páginas, formulários e estilização.

## Estrutura

```
src/components/
├── ui/              ← componentes da lib (shadcn, etc) — gerados
├── {componente}.tsx  ← componentes do projeto
```

## Estilização

Tailwind utility classes para tudo. Sem CSS modules,
sem styled-components, sem arquivos CSS customizados.

## Formulários

Usar React Hook Form + Zod resolver, reutilizando
os schemas do service:

```typescript
const form = useForm<InputType>({
  resolver: zodResolver(InputSchema),
  defaultValues: { /* ... */ },
});
```

Regras:
- NUNCA duplicar validação — reutilizar o schema do service.
- Erros inline via FormMessage do componente lib.
- Erros de API via toast.

## Páginas

- Tipar dados com os types de output do service.
- Loading states com skeleton.
- Empty states com mensagem + ação sugerida.
- Layout consistente.

## Componentes da lib (ex: shadcn/ui)

- Sempre usar CLI pra instalar: `npx shadcn@latest add <comp>`.
- Nunca criar componentes da lib manualmente.
- Editar depois de gerado é permitido.

## Responsividade mobile

Toda página/componente novo é validado em **dois viewports** antes
de declarar pronto:

| Viewport | Resolução | Comportamento esperado |
|---|---|---|
| Mobile | 375 × 667 (iPhone SE) | Sem scroll horizontal; touch targets ≥ 44px; menus colapsam |
| Desktop | 1280 × 720 | Layout completo; hover states funcionam |

### Regras de Tailwind

- Mobile-first: classes sem prefix são pra mobile; `md:`, `lg:`
  são extensões pra telas maiores.
- Evitar `w-screen` puro (causa scroll horizontal); usar `w-full`.
- Espaçamentos generosos em mobile (`p-4`, `gap-4`) que diminuem
  em desktop (`md:p-6`, `lg:p-8`).
- Tipografia: `text-base` mobile, `md:text-lg` desktop quando
  precisar de hierarquia visual.

### Anti-patterns

- ❌ `min-w-[800px]` — causa scroll horizontal em mobile.
- ❌ `fixed` sem prever que mobile pode cobrir conteúdo.
- ❌ Testar só em desktop e descobrir o mobile depois.

## Skill de UI/UX (suporte externo)

Considerar invocar a skill `ui-design-system` ao revisar
componentes novos pra obter:
- Análise de hierarquia visual.
- Identificação de inconsistências com design system existente.
- Indicação de pontos de responsividade frágeis.
- Sugestões de spec-anchored (componentes para o Code aplicar
  consistentemente).

## Critério meta M4 — UI responsiva

Toda spec que cria/altera componente UI inclui no checklist:

- [ ] Componente funciona em viewport `375x667` (mobile) sem scroll
      horizontal.
- [ ] Touch targets ≥ 44px em mobile (botões, links clicáveis).
- [ ] Componente funciona em viewport `1280x720` (desktop) com
      hover states ativos.
- [ ] Code rodou screenshot ou descreveu o layout nos dois viewports
      no report final.

M4 é critério meta da própria spec — referenciar como "aplicam-se
M1, M2, M3, M4" em specs de UI.
