// The business's own bookkeeping on its transactions: "Reconciled", a tag and a note, edited in the grid.
// Merchant-only data: saved per business in data/ (gitignored), never sent to PayPal, customers or agents.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { BusinessAccount } from './accounts.ts';

const DATA_DIR = fileURLToPath(new URL('./data/', import.meta.url));
export const TAGS = ['', 'Follow up', 'Wholesale', 'Gift', 'VIP', 'Disputed', 'Tax review'] as const;
export type Notes = { reconciled?: boolean; tag?: string; note?: string };

const stores = new Map<string, Record<string, Notes>>();
const fileOf = (biz: BusinessAccount) => `${DATA_DIR}business-notes-${biz.username}.json`;

export async function notesOf(biz: BusinessAccount) {
  let store = stores.get(biz.username);
  if (!store) {
    store = await readFile(fileOf(biz), 'utf8').then((t) => JSON.parse(t) as Record<string, Notes>).catch(() => ({}));
    stores.set(biz.username, store);
  }
  return store;
}

/** Save one field of one transaction. Only the three known fields, with sane values. */
export async function saveNote(biz: BusinessAccount, id: string, field: string, value: unknown) {
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(id)) throw new Error('Bad transaction id');
  const store = await notesOf(biz);
  const entry = store[id] ?? {};
  if (field === 'reconciled') entry.reconciled = value === true;
  else if (field === 'tag') entry.tag = TAGS.includes(String(value ?? '') as (typeof TAGS)[number]) ? String(value ?? '') : '';
  else if (field === 'note') entry.note = String(value ?? '').slice(0, 500);
  else throw new Error('Unknown field');
  store[id] = entry;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(fileOf(biz), JSON.stringify(store));
  return entry;
}
