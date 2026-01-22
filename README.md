# Transactions API (NestJS)

API publica de transacoes com idempotencia forte, persistencia em Postgres e processamento assincrono com BullMQ.

## Como rodar local

1) Instale dependencias:
```bash
npm install
```

2) Configure variaveis de ambiente (exemplo em `.env.example`):
```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379
API_KEY=
```

3) Inicie a aplicacao:
```bash
npm run start:dev
```

Observacao: existe `docker-compose.yml` para quem quiser rodar Postgres/Redis localmente, mas nao e obrigatorio.

## Endpoints

### Criar transacao
```bash
curl -X POST http://localhost:3000/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey":"abc-123","amount":"120.50","currency":"BRL","description":"teste"}'
```

### Listar transacoes (paginado)
```bash
curl "http://localhost:3000/v1/transactions?page=1&pageSize=10&status=PROCESSED"
```

### Buscar por id
```bash
curl http://localhost:3000/v1/transactions/<transaction-id>
```

## Idempotencia (POST /v1/transactions)

- `idempotencyKey` e obrigatoria.
- Existe indice UNIQUE no banco em `idempotency_key`.
- Se duas requisicoes simultaneas chegarem com a mesma chave:
  - apenas um INSERT acontece
  - a outra requisicao retorna 200 com o registro existente
  - o job nao e reenfileirado
- Se inserir com sucesso:
  - retorna 201
  - enfileira job com `jobId = idempotencyKey`

## Por que BullMQ

- Fila simples e confiavel para processar fora do request
- Retry e backoff nativos
- Idempotencia via `jobId` evita duplicidade de processamento

## Gargalos e primeiro problema em producao

- Gargalo: concorrencia alta no banco por `idempotency_key` e atualizacoes de status
- Primeiro problema: Redis como single point of failure para a fila (necessario monitorar e ter persistencia)

## Deploy no Render

1) Build Command:
```bash
npm install && npm run build
```

2) Start Command:
```bash
npm run start:prod
```

3) Variaveis de ambiente no Render:
- `DATABASE_URL` (Render fornece automaticamente)
- `REDIS_URL` (seu Redis no Render)
- `NODE_ENV=production`
- `API_KEY` (opcional)

Em producao, o TypeORM habilita SSL automaticamente (`rejectUnauthorized: false`).
