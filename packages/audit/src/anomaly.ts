import { AUDIT_INDEX, es } from './client.ts';

// Anomaly score (Policy Engine soft check UNUSUAL_SPEND, threshold 0.8).
// Compares a new spend with the vault's past approved spends, read from Elastic:
//   - amount far above the usual (median) amount: 2x the median scores 0, 5x scores 1
//   - a merchant and a category the vault never used before: +0.2 each
// With fewer than 3 past spends there is not enough history, so the score is 0.

export type SpendHistory = { count: number; median: number | null; merchants: string[]; categories: string[] };
export type AnomalyResult = { score: number; why: string[] };

const MIN_HISTORY = 3;
const lower = (list: string[]) => new Set(list.map((s) => s.toLowerCase()));

export function scoreAnomaly(history: SpendHistory, spend: { amount: number; merchant: string; category: string }): AnomalyResult {
  if (history.count < MIN_HISTORY || !history.median) return { score: 0, why: ['not enough history'] };
  const why: string[] = [];
  const ratio = spend.amount / history.median;
  let score = Math.min(1, Math.max(0, (ratio - 2) / 3));
  if (ratio >= 2) why.push(`${ratio.toFixed(1)}x the usual amount ($${history.median.toFixed(2)})`);
  if (!lower(history.merchants).has(spend.merchant.toLowerCase())) {
    score += 0.2;
    why.push(`first purchase from ${spend.merchant}`);
  }
  if (!lower(history.categories).has(spend.category.toLowerCase())) {
    score += 0.2;
    why.push(`first purchase in ${spend.category}`);
  }
  return { score: Math.round(Math.min(1, score) * 100) / 100, why };
}

/** The vault's past approved spends (approved by the engine or by a human), aggregated by Elastic. */
export async function spendHistory(vaultId: string): Promise<SpendHistory> {
  const res = await es().search({
    index: AUDIT_INDEX,
    size: 0,
    query: {
      bool: {
        filter: [{ term: { vault_id: vaultId } }, { term: { doc_type: 'decision' } }],
        should: [{ term: { result: 'APPROVE' } }, { term: { resolved_by: 'APPROVED_BY_HUMAN' } }],
        minimum_should_match: 1,
      },
    },
    aggs: {
      amount: { percentiles: { field: 'amount', percents: [50] } },
      merchants: { terms: { field: 'merchant', size: 50 } },
      categories: { terms: { field: 'category', size: 50 } },
    },
  });
  const aggs: any = res.aggregations ?? {};
  const total = res.hits.total;
  return {
    count: typeof total === 'number' ? total : (total?.value ?? 0),
    median: aggs.amount?.values?.['50.0'] ?? null,
    merchants: (aggs.merchants?.buckets ?? []).map((b: any) => String(b.key)),
    categories: (aggs.categories?.buckets ?? []).map((b: any) => String(b.key)),
  };
}

export async function anomalyScore(vaultId: string, spend: { amount: number; merchant: string; category: string }) {
  return scoreAnomaly(await spendHistory(vaultId), spend);
}
