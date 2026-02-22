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

## Tech stack

- **Runtime**: Node.js + TypeScript (tsx)
- **Framework**: Express
- **Database**: SQLite with Knex
- **Discord**: discord-interactions, discord-api-types
