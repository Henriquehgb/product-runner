<!--
Extensão do CLAUDE.md — Perfil SSR.
Este arquivo NÃO é concatenado: cada bloco abaixo declara, via diretiva
`pdb-merge`, como dobra numa seção do template-base (common/claude-md.template.md).
Modos: replace (troca a seção), append (acrescenta ao fim da seção),
after (insere logo após a seção). Edite o conteúdo, não as diretivas.
-->

<!-- pdb-merge: append section="Stack" -->

- **Framework:** Next.js (Pages Router)
- **ORM:** Prisma + PostgreSQL (ou outro adapter quando configurado)
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod resolver
- **Charts (se aplicável):** Recharts (default) ou TradingView lightweight
  charts (séries financeiras)
- **Background jobs (se aplicável):** BullMQ + Redis
- **Deploy:** Docker + VPS (Vercel não cobre storage persistente +
  background jobs)

<!-- pdb-merge: replace section="Princípio central" -->

### Princípio central

Lógica de domínio desacoplada do framework. Services são TypeScript
puro. API routes são cascas finas que validam e delegam pros services.
Componentes UI consomem outputs tipados dos services.

<!-- pdb-merge: replace section="Estrutura de pastas" -->

### Estrutura de pastas

```
{project}/
├── CLAUDE.md
├── prisma/                           ← schema.prisma + migrations
├── src/
│   ├── pages/
│   │   ├── api/                     ← API routes (cascas finas)
│   │   └── {páginas SSR}
│   ├── services/
│   │   ├── {dominio}/
│   │   │   ├── schema.ts             ← Zod entity + derivações
│   │   │   └── repository.ts         ← Prisma queries + toOutput
│   │   └── integrations/             ← clients de APIs externas
│   ├── components/
│   │   └── ui/                       ← shadcn/ui (gerados)
│   └── lib/
│       ├── prisma.ts
│       ├── errors.ts
│       └── {outros utilitários}
├── scripts/
├── specs/
├── docs/
└── docker-compose.yml                ← infra (Postgres, Redis se aplicável)
```

<!-- pdb-merge: append section="Convenções de código" -->

### API Routes (SSR)

- Validar com `Schema.safeParse()`.
- Chamar o service e retornar o resultado.
- Sem lógica de negócio.
- Detalhe em [api-patterns](./docs/api-patterns.md).

### UI (SSR)

- Componentes shadcn/ui como base (gerados via CLI).
- Tailwind utility classes — sem CSS modules.
- Formulários com React Hook Form + Zod resolver.
- **Responsividade mobile validada em todo componente novo** (M4 — ver
  [ui-patterns](./docs/ui-patterns.md)).
- Considerar skill `ui-design-system` em revisões de componente.

### Validação visual no browser (SSR)

Insubstituível — `tsc --noEmit` pega erros de tipo mas não de
comportamento. Smoke check humano em mobile (375x667) e desktop
(1280x720) faz parte do M4.

<!-- pdb-merge: replace section="Comandos úteis" -->

## Comandos úteis

```bash
docker compose up -d              # infra (Postgres, Redis)
npm install                       # deps
npx prisma migrate dev            # migrations
npx prisma generate               # client
npm run dev                       # dev server (port {PORT})
npm test                          # testes
npx tsc --noEmit                  # typecheck
npx shadcn@latest add <comp>      # adicionar componente
npm run format                    # formatar tudo
```

Configurar port fixo no `package.json` (`"dev": "next dev -p {PORT}"`) pra
evitar mudança entre sessões. Code deve reportar o port real no output ao
iniciar o dev server.

<!-- pdb-merge: replace section="Configuração" -->

## Configuração

| Arquivo                | Conteúdo              | Comitado? |
| ---------------------- | --------------------- | --------- |
| `.env`                 | DATABASE_URL, secrets | ❌ NUNCA  |
| `.env.example`         | Mesmas chaves sem valor | ✅      |
| `prisma/schema.prisma` | Schema do DB          | ✅        |
| `next.config.js`       | Config Next           | ✅        |
| `tailwind.config.ts`   | Config Tailwind       | ✅        |
| `components.json`      | Config shadcn/ui      | ✅        |
