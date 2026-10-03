import {z} from 'zod';

export const applicationStages = ['Saved', 'Applied', 'Interview', 'Offer', 'Closed'] as const;
const date = z.string().refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value, 'Choose a valid date.');
export const applicationSchema = z.object({
  id: z.string().uuid(),
  company: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(150),
  stage: z.enum(applicationStages),
  url: z.string().trim().max(1000).refine(value => !value || /^https?:\/\//i.test(value) && URL.canParse(value), 'Use a full http or https job URL.'),
  appliedDate: date,
  followUpDate: date,
  notes: z.string().max(4000),
  updatedAt: z.string().datetime(),
  archived: z.boolean().default(false),
});
export type JobApplication = z.infer<typeof applicationSchema>;
export function dueForFollowUp(application: JobApplication, today: string) {
  return !application.archived && !['Closed', 'Offer'].includes(application.stage) && Boolean(application.followUpDate) && application.followUpDate <= today;
}
export function mergeApplications(local: JobApplication[], remote: JobApplication[]) {
  const merged = new Map<string, JobApplication>();
  for (const item of [...local, ...remote]) {
    const previous = merged.get(item.id);
    if (!previous || item.updatedAt >= previous.updatedAt) merged.set(item.id, item);
  }
  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
