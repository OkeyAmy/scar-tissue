import { MemWal } from "@mysten-incubation/memwal";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const credsPath = join(homedir(), ".memwal", "credentials.json");
const creds = JSON.parse(readFileSync(credsPath, "utf8"));

const base = {
  key: process.env.MEMWAL_PRIVATE_KEY ?? creds.delegatePrivateKey,
  accountId: process.env.MEMWAL_ACCOUNT_ID ?? creds.accountId,
  serverUrl: creds.relayerUrl ?? "https://relayer.memory.walrus.xyz",
};

for (const ns of ["debug-failures", "debug-fixes", "debug-patterns"]) {
  const m = MemWal.create({ ...base, namespace: ns });
  const { results, total } = await m.recall({ query: "error fix pattern", namespace: ns, limit: 50 });
  console.log(`${ns}: ${results.length} results (total=${total})`);
  for (const r of results) console.log(`  ${r.blob_id.slice(0,12)}  ${r.text.slice(0,70)}`);
}
