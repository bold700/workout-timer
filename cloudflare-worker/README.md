# Sonos OAuth2 Proxy Worker

Deze Cloudflare Worker handelt de OAuth2 token exchange af voor de Sonos integratie. Dit is nodig omdat de `client_secret` niet in de frontend code mag staan.

## Setup Instructies

### 1. Cloudflare Account
1. Ga naar [Cloudflare Workers](https://dash.cloudflare.com/) en maak een gratis account
2. Kies een subdomain voor je workers (bijv. `bold700`)

### 2. Worker Aanmaken

**Optie A: Via Dashboard (makkelijkst)**
1. Ga naar Workers & Pages > Create Application > Create Worker
2. Noem de worker `workout-timer-sonos-proxy`
3. Klik "Deploy"
4. Klik "Edit code" en plak de inhoud van `worker.js`
5. Klik "Deploy"

**Optie B: Via Wrangler CLI**
```bash
cd cloudflare-worker
npm install -g wrangler
wrangler login
wrangler deploy
```

### 3. Environment Variables Instellen
1. Ga naar je Worker in het dashboard
2. Klik op "Settings" > "Variables"
3. Voeg toe:
   - `SONOS_CLIENT_ID`: `24980fc6-b0b3-43d0-982a-0e4314c9e2c4`
   - `SONOS_CLIENT_SECRET`: `6c6e1f18-c81e-4063-acd5-92b6cbe2525a`
4. Klik "Encrypt" voor de secret (optioneel maar aanbevolen)
5. Klik "Deploy"

### 4. URL Updaten
Je worker URL wordt: `https://workout-timer-sonos-proxy.{jouw-subdomain}.workers.dev`

Update `src/services/sonosAuth.ts` met jouw worker URL als deze anders is dan `bold700`.

## Endpoints

- `POST /token` - Exchange authorization code for tokens
- `POST /refresh` - Refresh access token
- `GET /health` - Health check

## Security

- CORS is beperkt tot toegestane origins
- Secrets worden veilig opgeslagen in Cloudflare environment variables
- Geen logging van gevoelige data
