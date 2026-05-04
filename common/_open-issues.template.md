# Open issues

Achados detectados durante implementação que NÃO foram endereçados
na spec onde apareceram, conforme regra "mudanças adjacentes vão
pra outra spec" do [[spec-guide]].

Cada item lista: contexto, descrição, impacto, e candidato a spec
onde será endereçado. Sem candidato explícito = lixo acumulando.

---

## Template de issue novo

```markdown
## #N — {Título curto e descritivo}

**Detectado em:** `{spec ou contexto onde apareceu}`
**Arquivo(s):** `path/to/file.ts`

{Descrição do problema. Linha de código se aplicável,
diagnóstico do que está errado, comportamento observado.}

**Impacto em produção:** {zero / médio / alto — descrição concreta}

**Candidato a endereçamento:** `{spec planejada}` — {motivo
de não fazer agora}.
```

---

## Template de issue fechado

```markdown
## #N — {título original} ✅ FECHADA

**Fechada em:** `{spec que resolveu}`, {data} — {resumo do fix}.
```

---

*Adicionar aqui qualquer achado durante implementação que não
caiba na spec atual. Cada item DEVE ter "Candidato a endereçamento"
explícito — sem isso, vira lixo acumulado.*

*Ao fechar issue, mantém o conteúdo anterior + adiciona linha
"✅ FECHADA" + spec + resumo. Histórico preservado.*
