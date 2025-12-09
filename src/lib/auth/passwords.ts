// src/lib/auth/passwords.ts
import { promisify } from "node:util";
import { scrypt as _scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const scrypt = promisify(_scrypt);

// פורמט scrypt שלנו:  "<salt-hex>:<hash-hex>"
export async function hashPasswordScrypt(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (!stored) return false;

  // bcrypt?
  if (
    stored.startsWith("$2a$") ||
    stored.startsWith("$2b$") ||
    stored.startsWith("$2y$")
  ) {
    try {
      return await bcrypt.compare(plain, stored);
    } catch {
      return false;
    }
  }

  // scrypt? (salt:hash)
  const [saltHex, hashHex] = stored.split(":");
  if (
    saltHex &&
    hashHex &&
    /^[0-9a-f]+$/i.test(saltHex) &&
    /^[0-9a-f]+$/i.test(hashHex)
  ) {
    try {
      const expected = Buffer.from(hashHex, "hex");
      const derived = (await scrypt(plain, saltHex, expected.length)) as Buffer;
      return (
        expected.length === derived.length && timingSafeEqual(expected, derived)
      );
    } catch {
      return false;
    }
  }

  // לא מזוהה
  return false;
}
