import type {PracticeRecord} from './practice';
export function weekWindow(now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  return {start, end};
}
export function weeklySessions(records: PracticeRecord[], now = new Date()) {
  const {start, end} = weekWindow(now);
  return records.filter(record => {const date = new Date(record.date); return date >= start && date < end && date <= now;}).length;
}
export function practiceRecommendations(records: PracticeRecord[]) {
  const latest = new Map<string, PracticeRecord>();
  for (const record of [...records].sort((a, b) => b.date.localeCompare(a.date))) if (!latest.has(`${record.kind}:${record.title}`)) latest.set(`${record.kind}:${record.title}`, record);
  const incomplete = [...latest.values()].find(record => record.kind === 'coding' && record.score < 100);
  const interviews = records.filter(record => record.kind === 'interview').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const average = interviews.length ? interviews.reduce((sum, record) => sum + record.score, 0) / interviews.length : 0;
  return [
    {title: incomplete ? `Revisit ${incomplete.title}` : 'Build your next coding solution', reason: incomplete ? 'Your most recent attempt still has failing test cases. Search this title in Coding practice.' : 'Choose an unpracticed problem and explain its time and space complexity.', href: '/coding'},
    {title: !interviews.length ? 'Complete your first mock interview' : average < 70 ? 'Strengthen your technical explanations' : 'Try a timed interview', reason: !interviews.length ? 'Three questions will give you a starting point for improvement.' : average < 70 ? 'Your recent coaching scores suggest room for clearer examples and trade-offs. Scores are practice signals, not proof of correctness.' : 'Use a two-minute answer target to practice concise explanations.', href: '/interviews'},
    {title: 'Practice explaining a technical idea', reason: records.some(record => record.kind === 'communication') ? 'Revisit a conversation and make your main point clearer with one concrete example.' : 'Start a communication session to practice speaking clearly to a teammate.', href: '/communication'},
  ];
}
export function savedProblemIds(raw: unknown, validIds: Set<string>) {
  return Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && validIds.has(id)))] : [];
}
