// Embedding latency with the in-memory cache cold vs warm, through the app's own GeminiService.
// Needs GEMINI_API_KEY. Run: npx tsx scripts/bench-embedding-cache.ts
import { GeminiService } from "../lib/gemini";
import { cache } from "../lib/cache";

const texts = Array.from({ length: 10 }, (_, i) => `How do I fill section ${i} of the passport renewal form?`);
const svc = new GeminiService();

async function timeAll() {
  const ms: number[] = [];
  for (const t of texts) {
    const start = performance.now();
    await svc.generateEmbedding(t);
    ms.push(performance.now() - start);
  }
  return ms.sort((a, b) => a - b)[Math.floor(ms.length / 2)];
}

(async () => {
  cache.clear();
  const cold = await timeAll(); // every call goes to Gemini
  const warm = await timeAll(); // every call is a cache hit
  console.log(JSON.stringify({
    gfea_embed_cold_median_ms: Math.round(cold),
    gfea_embed_warm_median_ms: Math.round(warm * 100) / 100,
    gfea_cache_cut_pct: Math.round(1000 * (1 - warm / cold)) / 10,
  }, null, 2));
  cache.destroy();
})();
