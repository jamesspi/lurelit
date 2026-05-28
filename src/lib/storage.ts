import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

export interface StorageProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

class FileStorage implements StorageProvider {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || join(process.cwd(), 'data');
  }

  private filePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9_:-]/g, '_');
    return join(this.basePath, safeKey);
  }

  async get(key: string): Promise<string | null> {
    const primary = this.filePath(key);
    const fallback = join('/tmp', `lurelit_${key.replace(/[^a-zA-Z0-9_:-]/g, '_')}`);

    for (const p of [primary, fallback]) {
      if (!existsSync(p)) continue;
      try {
        const content = readFileSync(p, 'utf8');
        if (!content) continue;
        return content;
      } catch {
        continue;
      }
    }
    return null;
  }

  async set(key: string, value: string): Promise<void> {
    const primary = this.filePath(key);
    const fallback = join('/tmp', `lurelit_${key.replace(/[^a-zA-Z0-9_:-]/g, '_')}`);

    try {
      const dir = dirname(primary);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(primary, value, 'utf8');
    } catch {
      try {
        writeFileSync(fallback, value, 'utf8');
        console.warn(`[Lurelit] Could not write to ${primary}, saved to ${fallback}`);
      } catch (e) {
        throw new Error(`Cannot write storage key "${key}": ${e}`);
      }
    }
  }

  async del(key: string): Promise<void> {
    const primary = this.filePath(key);
    const fallback = join('/tmp', `lurelit_${key.replace(/[^a-zA-Z0-9_:-]/g, '_')}`);

    for (const p of [primary, fallback]) {
      try {
        if (existsSync(p)) unlinkSync(p);
      } catch {
        // ignore
      }
    }
  }
}

class RedisStorage implements StorageProvider {
  private redis: import('@upstash/redis').Redis | null = null;
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private async getClient() {
    if (!this.redis) {
      const { Redis } = await import('@upstash/redis');
      this.redis = new Redis({ url: this.url, token: this.token });
    }
    return this.redis;
  }

  async get(key: string): Promise<string | null> {
    const client = await this.getClient();
    const value = await client.get<string>(`lurelit:${key}`);
    if (value === null || value === undefined) return null;
    // @upstash/redis auto-deserializes JSON values into objects, but
    // StorageProvider.get must always return a raw string.
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  async set(key: string, value: string): Promise<void> {
    const client = await this.getClient();
    await client.set(`lurelit:${key}`, value);
  }

  async del(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(`lurelit:${key}`);
  }
}

// Find Upstash/KV credentials regardless of which env var prefix the user's integration uses.
// Vercel marketplace integrations may use plain UPSTASH_*, KV_* (legacy), or prefixed variants
// like <DBNAME>_UPSTASH_REDIS_REST_URL.
function findRedisCredentials(): { url: string; token: string; source: string } | null {
  const env = process.env;

  // Direct, unprefixed pairs (most common)
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN, source: 'UPSTASH_REDIS_REST_*' };
  }
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    return { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN, source: 'KV_REST_API_*' };
  }

  // Prefixed variants (e.g. MYDB_UPSTASH_REDIS_REST_URL + MYDB_UPSTASH_REDIS_REST_TOKEN)
  for (const key of Object.keys(env)) {
    if (key.endsWith('_UPSTASH_REDIS_REST_URL')) {
      const prefix = key.replace(/_UPSTASH_REDIS_REST_URL$/, '');
      const tokenKey = `${prefix}_UPSTASH_REDIS_REST_TOKEN`;
      if (env[tokenKey]) {
        return { url: env[key]!, token: env[tokenKey]!, source: `${prefix}_UPSTASH_REDIS_REST_*` };
      }
    }
    if (key.endsWith('_KV_REST_API_URL')) {
      const prefix = key.replace(/_KV_REST_API_URL$/, '');
      const tokenKey = `${prefix}_KV_REST_API_TOKEN`;
      if (env[tokenKey]) {
        return { url: env[key]!, token: env[tokenKey]!, source: `${prefix}_KV_REST_API_*` };
      }
    }
  }

  return null;
}

export function describeStorage(): { kind: 'redis' | 'file'; source?: string } {
  const creds = findRedisCredentials();
  if (creds) return { kind: 'redis', source: creds.source };
  return { kind: 'file' };
}

let _storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (_storage) return _storage;

  const creds = findRedisCredentials();
  if (creds) {
    console.log(`[Lurelit] Using Redis storage from env: ${creds.source}`);
    _storage = new RedisStorage(creds.url, creds.token);
  } else {
    console.log('[Lurelit] Using filesystem storage (no Upstash/KV env vars detected)');
    _storage = new FileStorage();
  }

  return _storage;
}
