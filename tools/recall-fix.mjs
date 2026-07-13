import { MemWal } from "@mysten-incubation/memwal";
const base = { key: process.env.MEMWAL_PRIVATE_KEY, accountId: process.env.MEMWAL_ACCOUNT_ID, serverUrl: "https://relayer.memory.walrus.xyz" };
const q = process.argv[2]; const ns = process.argv[3] || "debug-fixes";
const m = MemWal.create({ ...base, namespace: ns });
const { results } = await m.recall({ query: q, namespace: ns, limit: 5 });
for (const r of results) console.log(`[${r.distance?.toFixed(3)}] ${r.text}\n`);
