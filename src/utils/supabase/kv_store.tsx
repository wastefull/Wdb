type KVRecord = { key: string; value: unknown };

const memoryStore = new Map<string, unknown>();

// Lightweight in-memory KV shim for frontend TypeScript modules.
export async function get(key: string): Promise<unknown | null> {
  return memoryStore.has(key) ? (memoryStore.get(key) ?? null) : null;
}

export async function set(key: string, value: unknown): Promise<void> {
  memoryStore.set(key, value);
}

export async function del(key: string): Promise<void> {
  memoryStore.delete(key);
}

export async function getByPrefix(prefix: string): Promise<KVRecord[]> {
  const rows: KVRecord[] = [];

  for (const [key, value] of memoryStore.entries()) {
    if (key.startsWith(prefix)) {
      rows.push({ key, value });
    }
  }

  return rows;
}
