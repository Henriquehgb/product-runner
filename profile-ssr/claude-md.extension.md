# Extension CLAUDE.md — Perfil SSR

> **Este arquivo é uma extensão.** Mescla com `common/claude-md.template.md`
> ao criar `CLAUDE.md` raiz do projeto.

## Seções a adicionar/sobrescrever no template-base

### Stack (extensão)

Adicionar:
- **Framework:** Next.js (Pages Router)
- **ORM:** Prisma + PostgreSQL (ou outro adapter quando configurado)
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod resolver
- **Charts (se aplicável):** Recharts (default) ou TradingView
  lightweight charts (séries financeiras)
- **Background jobs (se aplicável):** BullMQ + Redis
- **Deploy:** Docker + VPS (Vercel não cobre storage persistente +
  background jobs)

### Arquitetura — Princípio central (SSR)

Lógica de domínio desacoplada do framework. Services são TypeScript
puro. API routes são cascas finas que validam e delegam pros services.
Componentes UI consomem outputs tipados dos services.

### Estrutura alvo (SSR)

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

### Comandos úteis (SSR)

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

### Convenções específicas (SSR)

#### API Routes
- Validar com `Schema.safeParse()`.
- Chamar o service e retornar o resultado.
- Sem lógica de negócio.
- Detalhe em [[api-patterns]].

#### UI
- Componentes shadcn/ui como base (gerados via CLI).
- Tailwind utility classes — sem CSS modules.
- Formulários com React Hook Form + Zod resolver.
- **Responsividade mobile validada em todo componente novo** (M4 — ver
  [[ui-patterns]]).
- Considerar skill `ui-design-system` em revisões de componente.

#### Validação visual no browser
Insubstituível — `tsc --noEmit` pega erros de tipo mas não de
comportamento. Smoke check humano em mobile (375x667) e desktop
(1280x720) faz parte do M4.

### Configuração (SSR)

| Arquivo | Conteúdo | Comitado? |
|---|---|---|
| `.env` | DATABASE_URL, secrets | ❌ NUNCA |
| `.env.example` | Mesmas chaves sem valor | ✅ |
| `prisma/schema.prisma` | Schema do DB | ✅ |
| `next.config.js` | Config Next | ✅ |
| `tailwind.config.ts` | Config Tailwind | ✅ |
| `components.json` | Config shadcn/ui | ✅ |

### Port fixo + report do port real

Configurar port fixo no `package.json` (`"dev": "next dev -p 3000"`)
pra evitar mudança entre sessões. Code deve reportar port real no
output ao iniciar dev server.
