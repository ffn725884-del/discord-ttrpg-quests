import crypto from "crypto";
import { db } from "../db/index";

interface ApiKeyRow {
  id: number;
  user_id: string;
  guild_id: string;
  channel_id: string;
  key_hash: string;
  created_at: number;
  revoked: number;
}

export interface ApiKeyRecord {
  userId: string;
  guildId: string;
  channelId: string;
}

function hashKey(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

/** Generates a cryptographically secure 32-byte hex API key. */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Stores a new API key for a user+channel, replacing any existing one.
 * Only the SHA-256 hash is persisted; the plaintext is never stored.
 */
export async function upsertApiKey(
  userId: string,
  guildId: string,
  channelId: string,
  plaintext: string
): Promise<void> {
  const keyHash = hashKey(plaintext);
  const now = Math.floor(Date.now() / 1000);

  await db("api_keys")
    .insert({
      user_id: userId,
      guild_id: guildId,
      channel_id: channelId,
      key_hash: keyHash,
      created_at: now,
      revoked: 0,
    })
    .onConflict(["user_id", "channel_id"])
    .merge(["guild_id", "key_hash", "created_at", "revoked"]);
}

/**
 * Looks up an API key by its plaintext value.
 * Returns the associated record, or null if not found or revoked.
 */
export async function findApiKey(
  plaintext: string
): Promise<ApiKeyRecord | null> {
  const keyHash = hashKey(plaintext);
  const row = await db<ApiKeyRow>("api_keys")
    .where({ key_hash: keyHash, revoked: 0 })
    .first();
  if (!row) return null;
  return {
    userId: row.user_id,
    guildId: row.guild_id,
    channelId: row.channel_id,
  };
}
