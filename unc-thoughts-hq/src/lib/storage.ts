import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Storage abstraction: local disk in dev, Supabase Storage when configured (for
// serverless hosts like Netlify where the filesystem is ephemeral). The rest of
// the app only ever sees storage-relative keys and calls storage.url(key).
export interface StorageProvider {
  save(buffer: Buffer, filename: string, subdir?: string): Promise<string>; // returns key
  read(key: string): Promise<Buffer>;
  url(key: string): string; // servable URL
  delete(key: string): Promise<void>;
}

const ROOT = path.join(process.cwd(), "storage");

function safeName(filename: string): string {
  const base = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${crypto.randomBytes(6).toString("hex")}-${base}`;
}

class LocalStorage implements StorageProvider {
  async save(buffer: Buffer, filename: string, subdir = "uploads"): Promise<string> {
    const rel = path.join(subdir, safeName(filename));
    const abs = path.join(ROOT, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, buffer);
    return rel.split(path.sep).join("/");
  }
  async read(key: string): Promise<Buffer> {
    return fs.readFile(path.join(ROOT, key));
  }
  url(key: string): string {
    return `/api/media/${key}`; // served by /api/media/[...key]
  }
  async delete(key: string): Promise<void> {
    try { await fs.unlink(path.join(ROOT, key)); } catch { /* already gone */ }
  }
}

// Uploads to a public Supabase Storage bucket via the REST API using the anon
// key (no SDK dependency). Public bucket => url() is a direct CDN link.
class SupabaseStorage implements StorageProvider {
  constructor(
    private base: string, // e.g. https://xxx.supabase.co
    private key: string,  // anon key
    private bucket: string,
  ) {}

  private mime(filename: string): string {
    const e = path.extname(filename).toLowerCase();
    return ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf" } as Record<string, string>)[e] ?? "application/octet-stream";
  }

  async save(buffer: Buffer, filename: string, subdir = "uploads"): Promise<string> {
    const key = `${subdir}/${safeName(filename)}`;
    const res = await fetch(`${this.base}/storage/v1/object/${this.bucket}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        apikey: this.key,
        "Content-Type": this.mime(filename),
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) throw new Error(`Supabase upload failed (${res.status}): ${await res.text()}`);
    return key;
  }
  async read(key: string): Promise<Buffer> {
    const res = await fetch(this.url(key));
    if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  url(key: string): string {
    return `${this.base}/storage/v1/object/public/${this.bucket}/${key}`;
  }
  async delete(key: string): Promise<void> {
    await fetch(`${this.base}/storage/v1/object/${this.bucket}/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.key}`, apikey: this.key },
    }).catch(() => {});
  }
}

function makeStorage(): StorageProvider {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  if (url && key) return new SupabaseStorage(url, key, bucket);
  return new LocalStorage();
}

export const storage: StorageProvider = makeStorage();
export const STORAGE_ROOT = ROOT;
