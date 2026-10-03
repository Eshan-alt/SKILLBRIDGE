import {createHash} from 'crypto';
import {database} from './mongodb';
import {allowed} from './rate-limit';
export function aiMonthlyLimit() {
  const configured = Number(process.env.AI_MONTHLY_REQUEST_LIMIT || 300);
  return Number.isInteger(configured) && configured > 0 && configured <= 10000 ? configured : 300;
}
export function usagePeriod(now = new Date()) {
  return {month: now.toISOString().slice(0, 7), resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()};
}
function monthlyIdentity(userId: string) {
  const {month, resetsAt} = usagePeriod();
  return {key: createHash('sha256').update(`ai-month:${userId}:${month}`).digest('hex'), expires: new Date(resetsAt)};
}
export async function reserveAIRequest(userId: string) {
  return allowed('monthly-ai', aiMonthlyLimit(), 60000, monthlyIdentity(userId));
}
export async function aiUsage(userId: string) {
  const {resetsAt} = usagePeriod();
  const db = await database();
  if (!db) return {used: 0, limit: aiMonthlyLimit(), resetsAt, configured: false};
  const identity = monthlyIdentity(userId);
  const record = await db.collection<{_id: string; count: number}>('request_limits').findOne({_id: identity.key});
  return {used: record?.count || 0, limit: aiMonthlyLimit(), resetsAt, configured: true};
}
