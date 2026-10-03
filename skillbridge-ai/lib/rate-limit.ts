import {createHash} from 'crypto';
import {database} from './mongodb';
const counters = new Map<string, {count: number; expires: number}>();
export function counterIdentity(key: string, windowMs: number, now = Date.now()) {
  const bucket = Math.floor(now / windowMs);
  return {key: createHash('sha256').update(key).digest('hex') + ':' + bucket, expires: new Date((bucket + 1) * windowMs)};
}
export function localCounter(key: string, limit: number, windowMs: number, now = Date.now()) {
  for (const [id, value] of counters) if (value.expires <= now) counters.delete(id);
  const identity = counterIdentity(key, windowMs, now);
  const current = counters.get(identity.key) || {count: 0, expires: identity.expires.getTime()};
  if (current.count >= limit) return false;
  if (!counters.has(identity.key) && counters.size >= 10000) return false;
  current.count++;
  counters.set(identity.key, current);
  return true;
}
export async function allowed(key: string, limit = 10, windowMs = 60000, period?: {key: string; expires: Date}) {
  const db = await database();
  const identity = period || counterIdentity(key, windowMs);
  if (!db) {
    if (!period) return localCounter(key, limit, windowMs);
    const current = counters.get(identity.key) || {count: 0, expires: identity.expires.getTime()};
    if (current.count >= limit) return false;
    current.count++; counters.set(identity.key, current); return true;
  }
  const collection = db.collection<{_id: string; count: number; expires: Date}>('request_limits');
  await collection.createIndex({expires: 1}, {expireAfterSeconds: 0});
  // _id uniqueness ensures concurrent instances share exactly one bounded counter.
  try {
    const result = await collection.findOneAndUpdate({_id: identity.key, count: {$lt: limit}}, {$inc: {count: 1}, $setOnInsert: {expires: identity.expires}}, {upsert: true, returnDocument: 'after'});
    return Boolean(result);
  } catch (error) {
    if ((error as {code?: number}).code === 11000) {
      const retry = await collection.findOneAndUpdate({_id: identity.key, count: {$lt: limit}}, {$inc: {count: 1}}, {returnDocument: 'after'});
      return Boolean(retry);
    }
    throw error;
  }
}
