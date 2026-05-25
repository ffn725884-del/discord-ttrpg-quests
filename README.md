# Discord TTRPG Quests

A Discord bot for managing tabletop RPG quests. Track active quests, record progress, add subquests, and complete quests—all from within Discord using slash commands.

## Features

- **Quest management**: Add, view, advance, and complete quests per channel
- **Subquests**: Nest quests under parent quests
- **Progress tracking**: Record incremental progress on any quest
- **Per-channel storage**: Quests are scoped to the Discord channel where they're created

## Prerequisites

- Node.js 18+
- A [Discord application](https://discord.com/developers/applications) with a bot

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
APP_ID=your_discord_application_id
DISCORD_TOKEN=your_bot_token
PUBLIC_KEY=your_application_public_key
PORT=3000
DEBUG=0
```

Get these values from the [Discord Developer Portal](https://discord.com/developers/applications) → your app → Bot (token) and General Information (APP_ID, PUBLIC_KEY).

Optional:
- `DATABASE_URL` – Path to SQLite database file (default: `./data/quests.db`)
- `DEBUG=1` – Enable debug logging for incoming interactions
- `JWT_SECRET` – Secret used to sign API tokens (required if using the REST API — see [REST API](#rest-api))

## Discord setup

1. In the Discord Developer Portal, enable the **Interactions Endpoint URL** under your app's General Information.
2. Set the URL to your public endpoint (e.g. `https://your-domain.com/interactions`). For local development, use a tunnel like [ngrok](https://ngrok.com) (`ngrok http 3000`).
3. Register the slash commands:

```bash
npm run register
```

## Running

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server listens on `PORT` (default 3000) and handles Discord interactions at `POST /interactions`.

## Commands

| Command | Description |
|---------|-------------|
| `/quests current` | List active quests |
| `/quests all` | List all quests (active and completed) |
| `/quests show-completed` | List completed quests |
| `/quests add` | Add a new quest |
| `/quests advance` | Record progress on a quest |
| `/quests subquest` | Add a subquest to an existing quest |
| `/quests complete` | Complete a quest with a resolution |
| `/quests delete` | Permanently delete a quest |
| `/quests clear` | Permanently clear all quests in the channel |
| `/quests system-status` | Internal app status (up, database connection) |
| `/quests api-key` | Generate a personal API key for this channel (ephemeral) |

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm run register` | Register slash commands with Discord |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run ts:check` | Type-check with TypeScript |
| `npm run generate-secret` | Print a ready-to-paste `JWT_SECRET=<hex>` line for your `.env` |

## REST API

The bot exposes a read-only HTTP API for accessing quest data from external tools (stream overlays, campaign websites, etc.). Access is tied to Discord identity: only current guild members can obtain tokens.

### Setup

1. Generate a `JWT_SECRET` and add it to your `.env`:

```bash
npm run generate-secret >> .env
```

2. Run migrations to create the `api_keys` table:

```bash
npm run migrate
```

### Getting an API key

In any Discord channel where the bot is present, run:

```
/quests api-key
```

The bot replies with a 64-character hex key visible only to you. Save it — it won't be shown again. Re-running the command rotates the key (the old one stops working immediately).

### Authenticating requests

The API uses a two-step flow so your long-lived key is never sent on every request:

**Step 1 — Exchange your API key for a short-lived token (valid 15 minutes):**

```bash
curl -X POST https://your-domain.com/api/token \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-key-here"}'
# → {"token": "<jwt>"}
```

The server verifies your API key and checks with Discord that you're still a member of the guild. If you've left the guild, the request is rejected.

**Step 2 — Fetch quests using the token:**

```bash
curl https://your-domain.com/api/quests \
  -H "Authorization: Bearer <jwt>"
# → {"quests": [...]}
```

### Response shape

```json
{
  "quests": [
    {
      "id": "1",
      "channelId": "123456789",
      "name": "Slay the Dragon",
      "progress": ["Found the lair", "Defeated the guards"],
      "completed": false,
      "parentQuestId": null
    }
  ]
}
```

Prepared (GM-only) quests are never included in API responses.

## Tech stack

- **Runtime**: Node.js + TypeScript (tsx)
- **Framework**: Express
- **Database**: SQLite with Knex
- **Discord**: discord-interactions, discord-api-types
