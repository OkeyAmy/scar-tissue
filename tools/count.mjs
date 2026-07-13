import { MemWal } from "@mysten-incubation/memwal";
const base = { key: process.env.MEMWAL_PRIVATE_KEY, accountId: process.env.MEMWAL_ACCOUNT_ID, serverUrl: "https://relayer.memory.walrus.xyz" };
for (const ns of ["debug-failures", "debug-fixes", "debug-patterns"]) {
  const m = MemWal.create({ ...base, namespace: ns });
  const { results, total } = await m.recall({ query: "error fix pattern", namespace: ns, limit: 50 });
  console.log(`${ns}: ${results.length} results (total=${total})`);
  for (const r of results) console.log(`  ${r.blob_id.slice(0,12)}  ${r.text.slice(0,70)}`);
}
