# Data patterns

Padrões para definição de schemas, derivação de tipos,
e transformação de dados entre camadas.

## Princípio

Cada domínio tem UM arquivo `schema.ts` com:
1. Entity base (espelha o ORM model)
2. Refs de relações (formas simplificadas de entities relacionadas)
3. Inputs (derivados da entity por pick/extend)
4. Outputs (derivados da entity por omit/extend)

Nunca escrever interfaces ou types manualmente.
Sempre derivar do schema de validação e inferir tipos.

## Entity base

```typescript
// services/{domínio}/schema.ts

export const {Entity}Entity = z.object({
  id: z.string().uuid(),
  // ... espelha todos os campos do ORM model
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type {Entity}Entity = z.infer<typeof {Entity}Entity>;
```

Regras:
- Nomes de campos idênticos ao ORM model.
- DateTime → `z.string().datetime()`.
- Nullable → `.nullable()`.
- Enums como `z.enum([...])`.

## Refs de relações

Formas simplificadas pra usar como campos em outputs:

```typescript
export const {Related}Ref = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
```

## Derivação de inputs

```typescript
export const Create{Entity}Input = {Entity}Entity
  .pick({ /* campos editáveis */ })
  .partial()
  .extend({ /* campos adicionais */ });

export type Create{Entity}Input = z.infer<typeof Create{Entity}Input>;
```

Regras:
- Usar `.shape.fieldName` pra referenciar tipos da entity.
- Usar `.unwrap()` pra remover nullable quando obrigatório no input.

## Derivação de outputs

```typescript
export const {Entity}Output = {Entity}Entity
  .omit({ /* campos internos */ })
  .extend({
    // relações resolvidas
    {related}: {Related}Ref.nullable(),
  });
```

Regras:
- Omitir campos internos (paths, IDs de FK).
- Substituir FK IDs por refs resolvidas.

## Mapper toOutput

```typescript
function toOutput(doc: any): {Entity}OutputType {
  return {
    // mapear campos, resolver relações
    createdAt: doc.createdAt.toISOString(),
  };
}
```

## Validação de output em dev

```typescript
if (process.env.NODE_ENV === "development") {
  return {Entity}Output.parse(data);
}
```

---

# Service patterns

Padrões para services, repositories, erros e integrações.

## Estrutura de um domínio

```
services/{domínio}/
├── schema.ts         ← entity + inputs + outputs
├── repository.ts     ← CRUD via ORM, mapper
├── {lógica}.ts       ← lógica de negócio específica
```

Regras:
- `repository.ts` faz queries e retorna outputs tipados.
- Outros arquivos contêm lógica de negócio.
- Services podem importar outros services.
- Services NUNCA importam tipos do framework.

## Repository

```typescript
const defaultInclude = { /* relações padrão */ } as const;

export async function create{Entity}(
  input: Create{Entity}Input
): Promise<{Entity}Output> {
  const record = await orm.{entity}.create({
    data: { /* ... */ },
    include: defaultInclude,
  });
  return toOutput(record);
}
```

## Erros de domínio

```typescript
export class DomainError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 400) {
    super(message);
  }
}

export class NotFoundError extends DomainError { /* 404 */ }
export class ConflictError extends DomainError { /* 409 */ }
export class ValidationError extends DomainError { /* 400 */ }
```

## Regras de integridade

Validações que o ORM não cobre ficam no service:
- XOR constraints (campo A OU B, nunca ambos)
- Prevenção de ciclos (auto-referência hierárquica)
- Recálculo de campos derivados

## Integrações externas

```
services/integrations/
├── {provider}.ts     ← client isolado, tipos simples
```

- Retornam tipos simples, não outputs de domínio.
- O service de domínio orquestra e converte resultados.
- Credenciais via env vars, nunca hardcoded.

## Transações

```typescript
await orm.$transaction(async (tx) => {
  // operações atômicas
});
```

Usar sempre que uma operação envolve múltiplas writes.
