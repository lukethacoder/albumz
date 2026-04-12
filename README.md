# albumz
💿 self-hosted album backlog tracker 

## Features
- Add by URL for Spotify, YouTube and Apple Music
- Multi-user Support
- Automatic linking via LastFM and MusicBrainz
- Automatic metdata fetching via LastFM & MusicBrainz
- External link support: Spotify, YouTube, LastFM, MusicBrainz, RateYourMusic, Navidrome
- Extensive sorting and filtering
- i18n Support* (English and Dutch, PRs welcome for extending)

## Deployment

Albumz ships as a single Docker image that runs the API, client, and migrations together. You bring your own PostgreSQL database.

### Prerequisites

- Docker & Docker Compose

### Setup

**1. Download the example compose file:**

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/OWNER/albumz/main/docker-compose.example.yml
```

**2. Create a `.env` file** in the same directory:

```env
# PostgreSQL
POSTGRES_USER=admin
POSTGRES_PASSWORD=changeme    # use a strong password
POSTGRES_DB=albumz

# JWT
JWT_SECRET=changeme           # use a long random string

# Public URL the app is served from
ORIGIN=http://localhost:3000
```

**3. Start the stack:**

```bash
docker compose up -d
```

Migrations run automatically on startup. The app is available at `http://localhost:3000`.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_USER` | Yes | `admin` | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | — | PostgreSQL password |
| `POSTGRES_DB` | Yes | `albumz` | PostgreSQL database name |
| `JWT_SECRET` | Yes | — | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | No | `3600s` | Token lifetime (e.g. `3600s`, `24h`) |
| `ORIGIN` | Yes | `http://localhost:3000` | Public URL the app is served from |
| `LASTFM_API_KEY` | No | — | Enables Last.fm metadata and linking |
| `SPOTIFY_CLIENT_ID` | No | — | Enables Spotify URL import |
| `SPOTIFY_CLIENT_SECRET` | No | — | Enables Spotify URL import |

### Deploying behind a reverse proxy

Set `ORIGIN` to your public domain and proxy port `3000` through your reverse proxy:

```env
ORIGIN=https://albumz.example.com
```

## Development

The following documentation is for project development only.

### Tech Stack

- tRPC / Fastify
- PostgreSQL
- SvelteKit
- TailwindCSS
- inlang
- bits-ui
- lucide icons

### Getting Started

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

### Database Migrations

1. Add/Edit the respective `./api/src/db/schema/` files
2. run `npx drizzle-kit generate` from the `./api` folder
3. restart the top level `pnpm dev` command (run `pnpm dev:down` before restarting)

### Releasing and updating the Docker Image

Where `0.1.0` is the release version

```bash
# tag the git commit
git tag v0.1.0
git push origin v0.1.0

# Authenticate
echo $(gh auth token) | docker login ghcr.io -u lukethacoder --password-stdin

# Build & tag
docker build -t ghcr.io/lukethacoder/albumz:0.1.0 -t ghcr.io/lukethacoder/albumz:latest .

# Push
docker push ghcr.io/lukethacoder/albumz:0.1.0
docker push ghcr.io/lukethacoder/albumz:latest
```
