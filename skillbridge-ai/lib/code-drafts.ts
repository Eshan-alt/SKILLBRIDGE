import {z} from 'zod';
const draftSchema = z.object({problemId: z.string().min(1).max(150), code: z.string().max(20000), updatedAt: z.string().datetime()});
export type CodeDraft = z.infer<typeof draftSchema>;
export function readCodeDrafts(raw: unknown, validIds: Set<string>): CodeDraft[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Map<string, CodeDraft>();
  for (const value of raw) {
    const parsed = draftSchema.safeParse(value);
    if (!parsed.success || !validIds.has(parsed.data.problemId)) continue;
    const previous = unique.get(parsed.data.problemId);
    if (!previous || parsed.data.updatedAt > previous.updatedAt) unique.set(parsed.data.problemId, parsed.data);
  }
  return [...unique.values()].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0,30);
}
export function updateCodeDraft(drafts: CodeDraft[], problemId: string, code: string, starter: string, now = new Date()): CodeDraft[] {
  const remaining = drafts.filter(draft => draft.problemId !== problemId);
  if (code !== starter) remaining.unshift({problemId, code: code.slice(0,20000), updatedAt: now.toISOString()});
  return remaining.slice(0,30);
}
