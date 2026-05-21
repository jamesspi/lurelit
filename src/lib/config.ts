import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';
import { getStorage } from './storage';

export interface GlobalConfig {
  kibanaUrl: string;
  workflowId: string;
  huntEnabled: boolean;
}

const STORAGE_KEY = 'config.enc';
const SALT = 'smish-analyzer-v1';

function getEncryptionKey(): Buffer {
  const secret = process.env.CONFIG_SECRET || 'smish-analyzer-default-key-change-me';
  return scryptSync(secret, SALT, 32);
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(data: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, encHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  const storage = getStorage();
  const data = encrypt(JSON.stringify(config));
  await storage.set(STORAGE_KEY, data);
}

export async function loadGlobalConfig(): Promise<GlobalConfig | null> {
  if (process.env.KIBANA_URL && process.env.WORKFLOW_ID) {
    return { kibanaUrl: process.env.KIBANA_URL, workflowId: process.env.WORKFLOW_ID, huntEnabled: true };
  }

  const storage = getStorage();
  try {
    const data = await storage.get(STORAGE_KEY);
    if (!data) return null;
    const json = decrypt(data);
    const parsed = JSON.parse(json);
    return { huntEnabled: true, ...parsed } as GlobalConfig;
  } catch (err) {
    console.error('[Lurelit] Failed to load config — encrypted data exists but could not be decrypted. If CONFIG_SECRET changed since setup, re-run /setup.', err);
    return null;
  }
}

export async function clearGlobalConfig(): Promise<void> {
  const storage = getStorage();
  await storage.del(STORAGE_KEY);
}

export async function hasGlobalConfig(): Promise<boolean> {
  return (await loadGlobalConfig()) !== null;
}
