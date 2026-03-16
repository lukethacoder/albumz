# albumz
💿 self-hosted album backlog tracker 

## Development

```bash
pnpm i
```

```bash
pnpm dev
```

Services run at:
- Client: http://localhost:5173
- API: http://localhost:3000
- PostgreSQL: http://localhost:5432

### Other commands

```bash
# Stop containers
pnpm dev:down # or pnpm prod:down

# View logs
pnpm dev:logs # or pnpm prod:logs

# Rebuild specific service
docker compose -f docker-compose.dev.yml up --build api
```

## Database Migrations

1. Add/Edit the respective `./api/src/db/schema/` files
2. run `npx drizzle-kit generate` from the `./api` folder
3. restart the top level `pnpm dev` command (run `pnpm dev:down` before restarting)
