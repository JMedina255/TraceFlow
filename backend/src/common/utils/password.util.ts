import { hash, verify } from '@node-rs/argon2';

export const ARGON2ID_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  outputLen: 32,
  parallelism: 4,
} as const;

export async function hashPasswordArgon2id(plainPassword: string): Promise<string> {
  return hash(plainPassword, ARGON2ID_OPTIONS);
}

export async function verifyPasswordArgon2id(
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  if (!storedHash.startsWith('$argon2')) {
    return false;
  }
  return verify(storedHash, plainPassword);
}
