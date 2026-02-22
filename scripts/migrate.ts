import "dotenv/config";
import { db } from "../src/db/index";

async function migrate(): Promise<void> {
  const [batch, migrations] = await db.migrate.latest();
  console.log(`Ran batch ${batch}: ${migrations.length} migration(s)`);
  await db.destroy();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
