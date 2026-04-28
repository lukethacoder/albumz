<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/lukethacoder/albumz">
    <img width="180" src="./docs/icon.png" alt="albumz logo">
  </a>

<h3 align="center">albumz</h3>
  <p align="center">
    Self-hosted album tracker
    <br />
    Integrates with your audio streamer of choice (Spotify, AppleMusic, YouTube, Navidrome)
    <br />
    <br />
    <a href="https://github.com/lukethacoder/albumz/issues">Report Bug</a>
    ·
    <a href="https://github.com/lukethacoder/albumz/issues">Request Feature</a>
  </p>
</div>

## Features

- Add by URL for Spotify, YouTube and Apple Music
- Multi-user Support
- Automatic linking via LastFM and MusicBrainz
- Automatic metdata fetching via LastFM & MusicBrainz
- External link support: Spotify, YouTube, LastFM, MusicBrainz, RateYourMusic, Navidrome
- Extensive sorting and filtering
- i18n Support\* (English and Dutch, PRs welcome for extending)

## Deployment

Albumz ships as a single Docker image that runs the API, client, and migrations together. You bring your own PostgreSQL database.

### Prerequisites

- Docker & Docker Compose

### Setup

**1. Download the example compose file:**

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/lukethacoder/albumz/main/docker-compose.example.yml
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

| Variable                | Required | Default                 | Description                          |
| ----------------------- | -------- | ----------------------- | ------------------------------------ |
| `POSTGRES_USER`         | Yes      | `admin`                 | PostgreSQL username                  |
| `POSTGRES_PASSWORD`     | Yes      | —                       | PostgreSQL password                  |
| `POSTGRES_DB`           | Yes      | `albumz`                | PostgreSQL database name             |
| `JWT_SECRET`            | Yes      | —                       | Secret used to sign JWT tokens       |
| `JWT_EXPIRES_IN`        | No       | `3600s`                 | Token lifetime (e.g. `3600s`, `24h`) |
| `ORIGIN`                | Yes      | `http://localhost:3000` | Public URL the app is served from    |
| `LASTFM_API_KEY`        | No       | —                       | Enables Last.fm metadata and linking |
| `SPOTIFY_CLIENT_ID`     | No       | —                       | Enables Spotify URL import           |
| `SPOTIFY_CLIENT_SECRET` | No       | —                       | Enables Spotify URL import           |

### Deploying behind a reverse proxy

Set `ORIGIN` to your public domain and proxy port `3000` through your reverse proxy:

```env
ORIGIN=https://albumz.example.com
```

## External Services

albumz relies on several external services for metadata and album artwork. External services are configurable on a per-user basis (enable/disable).

| Service         | URL Import | Image Source | Requirements                                         | Notes                                                                                                                                                                            |
| --------------- | ---------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spotify         | ✔          | ✔            | `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`      | Import of both albums and bulk add via playlists (public only)                                                                                                                   |
| LastFM          | ❌         | ✔            | `LASTFM_API_KEY`                                     |                                                                                                                                                                                  |
| YouTube         | ✔          | ❓           | N/A                                                  | YouTube Thumbnails are used as a last resort of the artwork is unable to be sourced otherwise. You can always fix the title/artist and manually select via the artwork selector. |
| MusicBrainz     | ❌         | ✔            | N/A                                                  | Image URLs are sourced from MusicBrainz, but are hosted on CoverArtArchive                                                                                                       |
| Navidrome       | ❌         | ✔            | User specific Navidrome Configuration (Profile page) | If you have this behind a reverse proxy, images may not load when you are not on your VPN/Tailscale                                                                              |
| AppleMusic      | ✔         | ❌           | N/A                                                  | URLs to AppleMusic are sourced via MusicBrainz                                                                                                                                   |
| Rate Your Music | ❌         | ❌           | N/A                                                  | URLs to Rate Your Music are sourced via MusicBrainz                                                                                                                              |

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
