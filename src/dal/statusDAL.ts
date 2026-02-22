import { db } from "../db/index";

/** Checks whether the database is reachable. Returns true if healthy, false otherwise. */
export async function isDatabaseUp(): Promise<boolean> {
  try {
    await db.raw("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
