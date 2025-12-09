type CacheEntry<T> = { at: number; ttl: number; value: T };
const store = new Map<string, CacheEntry<any>>();
const ORDER: string[] = [];
const MAX = 600;

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() - e.at > e.ttl) {
    store.delete(key);
    return null;
  }
  const i = ORDER.indexOf(key);
  if (i >= 0) ORDER.splice(i, 1);
  ORDER.push(key);
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = 1000 * 60 * 5) {
  store.set(key, { at: Date.now(), ttl: ttlMs, value });
  ORDER.push(key);
  if (ORDER.length > MAX) {
    const k = ORDER.shift();
    if (k) store.delete(k);
  }
}
