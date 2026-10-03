import {randomUUID} from 'crypto';
import {database} from './mongodb';
const local = new Map<string, {owner: string; expires: number}>();
export async function acquireLease(key: string, ttlMs = 60000) {
  const db = await database(); const owner = randomUUID(); const now = new Date(); const expires = new Date(now.getTime() + ttlMs);
  if (!db) {const existing = local.get(key); if (existing && existing.expires > now.getTime()) return null; local.set(key, {owner, expires: expires.getTime()}); return owner;}
  const locks = db.collection<{_id: string; owner: string; expires: Date}>('operation_leases');
  await locks.createIndex({expires: 1}, {expireAfterSeconds: 0});
  try {const result = await locks.findOneAndUpdate({_id: key, expires: {$lte: now}}, {$set: {owner, expires}}, {upsert: true, returnDocument: 'after'}); return result ? owner : null;}
  catch (error) {if ((error as {code?: number}).code === 11000) return null; throw error;}
}
export async function releaseLease(key: string, owner: string) {
  const db = await database();
  if (db) await db.collection<{_id: string; owner: string}>('operation_leases').deleteOne({_id: key, owner});
  else if (local.get(key)?.owner === owner) local.delete(key);
}
