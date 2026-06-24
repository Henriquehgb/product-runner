# Migrations

Notas de migração entre versões dos templates. **Opcionais por versão** — a
maioria dos bumps (um arquivo novo, formatação, pequena adição) é resolvida pelo
diff de estado do `update` e **não** precisa de migration. Uma migration só
existe quando há mudança que o diff não expressa ou não deve aplicar sozinho:
rename/split de arquivos, mudança de convenção, ou transformação acoplada a
código.

## Como o `update` usa

1. Lê o `version` do manifesto do projeto (o "cursor").
2. Junta as migrations no intervalo `(cursor, versão-do-pacote]`, em ordem.
3. Roda-as **antes** do diff de estado: as `autoApply` aplicam seus `ops`
   mecânicos; as demais viram handoff (`docs/.pdb-update/MIGRATION-<v>.md`) pra
   conduzir com o humano.
4. Depois o diff de estado reconcilia o que sobrou.

## Formato

Um arquivo por versão: `migrations/<x.y.z>.md`. Frontmatter **JSON** entre `---`
(o pacote é zero-dependência; JSON.parse é robusto), seguido do corpo em
markdown com as instruções conduzidas.

```md
---
{
  "version": "0.3.0",
  "previous": "0.2.3",
  "title": "Resumo curto da migração",
  "risk": "high",
  "autoApply": false,
  "affects": ["docs/DESIGN-SYSTEM.md"],
  "ops": []
}
---

## O que mudou

Prosa explicando a mudança e, se `autoApply: false`, como conduzir a decisão
com o humano (o que trazer, o que preservar, qual o tradeoff).
```

### Campos

| Campo | Significado |
|---|---|
| `version` | versão que esta migration leva o projeto a alcançar (= nome do arquivo) |
| `previous` | versão anterior (informativo) |
| `title` | resumo de uma linha |
| `risk` | `low` ou `high` |
| `autoApply` | `true` = o CLI aplica os `ops` sozinho; `false` = só apresenta, a LLM conduz |
| `affects` | lista informativa de arquivos/áreas afetados |
| `ops` | passos mecânicos (só executados se `autoApply: true`) |

### Ops mecânicos

```json
{ "type": "rename", "from": "docs/a.md", "to": "docs/b.md" }
{ "type": "replace", "glob": "docs/**/*.md", "find": "regex", "replace": "texto" }
```

- `rename`: move o arquivo (no-op se a origem não existir — ex.: já renomeado).
- `replace`: regex global nos arquivos que casam o `glob` (`*` num segmento,
  `**` atravessa).

> Mudança acoplada a código (ex.: migração de tokens primitivos → semânticos)
> **não** deve ser `autoApply` — descreva em prosa e deixe virar spec/issue.
