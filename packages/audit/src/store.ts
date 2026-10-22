import { AUDIT_INDEX, es } from './client.ts';
import { describeDecision, describeLedger, type DecisionInput, type LedgerInput } from './describe.ts';

// The audit index: one document per decision and per ledger entry. Document ids are fixed
// (decision-<id>, ledger-<id>), so writing again after a change just updates the document.

export async function ensureAuditIndex() {
  if (await es().indices.exists({ index: AUDIT_INDEX })) return false;
  await es().indices.create({
    index: AUDIT_INDEX,
    mappings: {
      properties: {
        doc_type: { type: 'keyword' }, // decision | ledger
        vault_id: { type: 'keyword' },
        vault_name: { type: 'keyword' },
        vault_type: { type: 'keyword' },
        decision_id: { type: 'keyword' },
        ledger_entry_id: { type: 'keyword' },
        merchant: { type: 'keyword' },
        amount: { type: 'float' }, // dollars
        category: { type: 'keyword' },
        result: { type: 'keyword' }, // APPROVE / BLOCK / NEEDS_HUMAN, or the ledger type
        reasons: { type: 'keyword' },
        resolved_by: { type: 'keyword' },
        ledger_status: { type: 'keyword' },
        invoice_id: { type: 'keyword' },
        summary: { type: 'text' }, // keyword (BM25) search
        summary_semantic: { type: 'semantic_text' }, // meaning search; Elastic makes the embeddings
        timestamp: { type: 'date' },
      },
    },
  });
  return true;
}

export async function indexDecision(d: DecisionInput) {
  const summary = describeDecision(d);
  await es().index({
    index: AUDIT_INDEX,
    id: `decision-${d.id}`,
    document: {
      doc_type: 'decision',
      vault_id: d.vaultId,
      vault_name: d.vaultName,
      vault_type: d.vaultType,
      decision_id: d.id,
      merchant: d.request.merchant,
      amount: d.request.amount,
      category: d.request.category,
      result: d.result,
      reasons: d.reasons,
      resolved_by: d.resolvedBy,
      invoice_id: d.request.invoice_id,
      summary,
      summary_semantic: summary,
      timestamp: d.createdAt,
    },
  });
}

export async function indexLedger(e: LedgerInput) {
  const summary = describeLedger(e);
  await es().index({
    index: AUDIT_INDEX,
    id: `ledger-${e.id}`,
    document: {
      doc_type: 'ledger',
      vault_id: e.vaultId,
      vault_name: e.vaultName,
      vault_type: e.vaultType,
      decision_id: e.decisionId,
      ledger_entry_id: e.id,
      merchant: e.merchant,
      amount: e.amountCents / 100,
      result: e.type,
      ledger_status: e.status,
      summary,
      summary_semantic: summary,
      timestamp: e.updatedAt,
    },
  });
}

export type AuditHit = { id: string; summary: string; timestamp: string; vaultId: string; result: string; decisionId?: string };

/** Hybrid search: keyword (BM25) and semantic results merged with reciprocal rank fusion. */
export async function searchAudit(query: string, opts: { vaultId?: string; size?: number } = {}): Promise<AuditHit[]> {
  const filter = opts.vaultId ? [{ term: { vault_id: opts.vaultId } }] : [];
  const size = opts.size ?? 8;
  const toHits = (hits: any[]): AuditHit[] =>
    hits.map((h) => ({
      id: h._id,
      summary: h._source.summary,
      timestamp: h._source.timestamp,
      vaultId: h._source.vault_id,
      result: h._source.result,
      decisionId: h._source.decision_id ?? undefined,
    }));

  try {
    const res = await es().search({
      index: AUDIT_INDEX,
      size,
      _source: ['summary', 'timestamp', 'vault_id', 'result', 'decision_id'],
      retriever: {
        rrf: {
          retrievers: [
            { standard: { query: { bool: { must: [{ match: { summary: query } }], filter } } } },
            { standard: { query: { bool: { must: [{ semantic: { field: 'summary_semantic', query } }], filter } } } },
          ],
          rank_window_size: 50,
        },
      },
    });
    return toHits(res.hits.hits);
  } catch (err) {
    // RRF not available on this cluster: semantic search alone still answers well.
    console.warn('Hybrid search failed, using semantic only:', (err as Error).message.slice(0, 160));
    const res = await es().search({
      index: AUDIT_INDEX,
      size,
      query: { bool: { must: [{ semantic: { field: 'summary_semantic', query } }], filter } },
    });
    return toHits(res.hits.hits);
  }
}
