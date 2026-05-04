# API route patterns

API routes são cascas finas — sem lógica de negócio.

## Estrutura padrão

```typescript
export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "GET": return handleGet(req, res);
      case "POST": return handlePost(req, res);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: "Método não permitido" });
    }
  } catch (err) {
    return handleError(err, res);
  }
}

async function handlePost(req, res) {
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      details: parsed.error.flatten().fieldErrors,
    });
  }
  const result = await serviceFunction(parsed.data);
  return res.status(201).json(result);
}
```

## Tratamento de erros centralizado

```typescript
export function handleError(err: unknown, res) {
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({
      error: err.message, code: err.code,
    });
  }
  console.error("Erro inesperado:", err);
  return res.status(500).json({ error: "Erro interno" });
}
```

## Validação

Sempre `safeParse`, nunca `parse` em API routes.
Query params com `z.coerce` pra converter strings.

## Respostas padronizadas

| Situação             | Status | Body                    |
|----------------------|--------|-------------------------|
| Sucesso (read)       | 200    | `{ ...data }`           |
| Sucesso (create)     | 201    | `{ ...data }`           |
| Sucesso (no content) | 204    | vazio                   |
| Aceito (async)       | 202    | `{ ...queue info }`     |
| Validação falhou     | 400    | `{ error, details }`    |
| Não encontrado       | 404    | `{ error, code }`       |
| Conflito             | 409    | `{ error, code }`       |
| Método não permitido | 405    | `{ error }` + Allow     |
| Erro interno         | 500    | `{ error }` genérico    |

## Upload de arquivos

Desabilitar bodyParser, usar lib de parsing multipart.
