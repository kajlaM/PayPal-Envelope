import { AUDIT_INDEX, EMBED_ENDPOINT, EMBED_MODEL, embedKey, es, LEGACY_AUDIT_INDEX } from './client.ts';
import { describeDecision, describeLedger, type DecisionInput, type LedgerInput } from './describe.ts';

// The audit index: one document per decision and per ledger entry. Document ids are fixed
// (decision-<id>, ledger-<id>), so writing again after a change just updates the document.

/**
 * Creates the Gemini embedding endpoint in Elastic (once). Returns its id, or undefined when
 * ELASTIC_GEMINI_API_KEY is not set (then Elastic's default hosted model is used).
 */
async function ensureEmbedEndpoint(): Promise<string | undefined> {
  const apiKey = embedKey();
  if (!apiKey) return undefined;
  const path = `/_inference/text_embedding/${EMBED_ENDPOINT}`;
  const exists = await es().transport.request({ method: 'GET', path }).then(() => true, () => false);
  if (!exists) {
    await es().transport.request({
      method: 'PUT',
      path,
      body: { service: 'googleaistudio', service_settings: { api_key: apiKey, model_id: EMBED_MODEL } },
    });
    console.log(`Created the Elastic embedding endpoint ${EMBED_ENDPOINT} (Gemini ${EMBED_MODEL}).`);
  }
  return EMBED_ENDPOINT;
}

/** Copies the records of the old index into the new one (Elastic re-embeds them with Gemini). */
async function copyLegacyRecords() {
  if (!(await es().indices.exists({ index: LEGACY_AUDIT_INDEX }))) return;
  const res = await es().reindex({
    source: { index: LEGACY_AUDIT_INDEX },
    dest: { index: AUDIT_INDEX },
    script: { source: 'ctx._source.summary_semantic = ctx._source.summary' }, // re-embed from the plain text
    conflicts: 'proceed',
    refresh: true,
  }, { requestTimeout: 300_000 }); // every record is re-embedded with Gemini, which takes a while
  if (res.failures?.length) console.warn(`Audit copy: ${res.failures.length} records failed, first: ${JSON.stringify(res.failures[0]).slice(0, 200)}`);
  console.log(`Copied ${res.created ?? 0} audit records from ${LEGACY_AUDIT_INDEX} to ${AUDIT_INDEX}.`);
}

export async function ensureAuditIndex() {
  const inferenceId = await ensureEmbedEndpoint();
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
        // Meaning search; Elastic makes the embeddings through the Gemini endpoint.
        summary_semantic: inferenceId ? { type: 'semantic_text', inference_id: inferenceId } : { type: 'semantic_text' },
        timestamp: { type: 'date' },
      },
    },
  });
  await copyLegacyRecords().catch((err) => console.error('Copying old audit records failed:', (err as Error).message.slice(0, 200)));
  return true;
}

/**
 * Writes one audit document. If making its embedding fails (model down, quota, key), the record is
 * still saved without the meaning-search field, so keyword search and the history keep working.
 */
async function writeAudit(id: string, document: Record<string, unknown>) {
  try {
    await es().index({ index: AUDIT_INDEX, id, document });
  } catch (err) {
    const message = (err as Error).message;
    if (!/inference|status_exception|embedding/i.test(message)) throw err;
    console.warn(`Audit ${id}: embedding failed, saved without semantic search (${message.slice(0, 120)})`);
    const { summary_semantic: _skip, ...rest } = document;
    await es().index({ index: AUDIT_INDEX, id, document: rest });
  }
}

export async function indexDecision(d: DecisionInput) {
  const summary = describeDecision(d);
  await writeAudit(`decision-${d.id}`, {
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
  });
}

export async function indexLedger(e: LedgerInput) {
  const summary = describeLedger(e);
  await writeAudit(`ledger-${e.id}`, {
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
  }
  try {
    const res = await es().search({
      index: AUDIT_INDEX,
      size,
      query: { bool: { must: [{ semantic: { field: 'summary_semantic', query } }], filter } },
    });
    return toHits(res.hits.hits);
  } catch (err) {
    // The embedding model is unreachable: keyword search still finds the records.
    console.warn('Semantic search failed, using keyword search:', (err as Error).message.slice(0, 160));
    const res = await es().search({ index: AUDIT_INDEX, size, query: { bool: { must: [{ match: { summary: query } }], filter } } });
    return toHits(res.hits.hits);
  }
}
