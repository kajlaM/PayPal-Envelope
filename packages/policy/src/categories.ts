// Small category tree so "Audio" counts as "Electronics", but not the other way round.
// A request category is allowed when it, or any parent of it, is in the policy's allowed list.

const PARENT: Record<string, string> = {
  audio: 'electronics',
  headphones: 'audio',
  earbuds: 'audio',
  speakers: 'audio',
  computers: 'electronics',
  laptops: 'computers',
  accessories: 'electronics',
  phones: 'electronics',
  electricity: 'utilities',
  water: 'utilities',
  gas: 'utilities',
  internet: 'utilities',
};

const norm = (c: string) => c.trim().toLowerCase();

/** "Headphones" -> ["headphones", "audio", "electronics"] */
export function categoryLineage(category: string): string[] {
  const chain: string[] = [];
  let current: string | undefined = norm(category);
  while (current && !chain.includes(current)) {
    chain.push(current);
    current = PARENT[current];
  }
  return chain;
}

export function isCategoryAllowed(category: string, allowed: string[]): boolean {
  const allowedSet = new Set(allowed.map(norm));
  return categoryLineage(category).some((c) => allowedSet.has(c));
}
