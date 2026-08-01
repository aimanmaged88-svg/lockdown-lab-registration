import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Storage abstraction: local disk today, swappable for S3/GCS later. The rest
// of the app only ever sees storage-relative paths, never absolute FS paths.
export interface StorageProvider {
  save(buffer: Buffer, filename: string, subdir?: string): Promise<string>; // returns relative key
  read(key: string): Promise<Buffer>;
  url(key: string): string; // servable URL
  delete(key: string): Promise<void>;
}

const ROOT = path.join(process.cwd(), "storage");

class LocalStorage implements StorageProvider {
  async save(buffer: Buffer, filename: string, subdir = "uploads"): Promise<string> {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const id = crypto.randomBytes(6).toString("hex");
    const rel = path.join(subdir, `${id}-${safe}`);
    const abs = path.join(ROOT, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, buffer);
    return rel.split(path.sep).join("/");
  }
  async read(key: string): Promise<Buffer> {
    return fs.readFile(path.join(ROOT, key));
  }
  url(key: string): string {
    // Served via /api/media/[...key]
    return `/api/media/${key}`;
  }
  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(path.join(ROOT, key));
    } catch {
      /* already gone */
    }
  }
}

export const storage: StorageProvider = new LocalStorage();
export const STORAGE_ROOT = ROOT;
