import crypto from "crypto";
import { env } from "./env";

// At-rest encryption for private reflections (text + voice notes).
// AES-256-GCM with a key derived from AUTH_SECRET. Format: enc1:<iv>:<tag>:<ct>
// (base64url). "Encrypted where practical": protects the DB/storage contents;
// the server can decrypt to show the member their own answers.

function key(): Buffer {
  return crypto.createHash("sha256").update(`${env.AUTH_SECRET}:reflections`).digest();
}

export function encryptText(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ct.toString("base64url")}`;
}

export function decryptText(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith("enc1:")) return stored; // legacy/plain fallback
  try {
    const [, ivB, tagB, ctB] = stored.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ctB, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null; // wrong key / corrupted — never return ciphertext
  }
}

export function encryptBytes(plain: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
  // layout: magic(4) | iv(12) | tag(16) | ciphertext
  return Buffer.concat([Buffer.from("ENC1"), iv, cipher.getAuthTag(), ct]);
}

export function decryptBytes(stored: Buffer): Buffer | null {
  try {
    if (stored.subarray(0, 4).toString() !== "ENC1") return stored;
    const iv = stored.subarray(4, 16);
    const tag = stored.subarray(16, 32);
    const ct = stored.subarray(32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  } catch {
    return null;
  }
}
