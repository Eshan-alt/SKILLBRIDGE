'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {Target, ArrowRight} from 'lucide-react';
import {practiceRecommendations, weeklySessions, weekWindow} from '@/lib/learning-plan';
import type {PracticeRecord} from '@/lib/practice';
export default function LearningPlan({records, userId}: {records: PracticeRecord[]; userId: string}) {
  const [goal, setGoal] = useState(5); const [loaded, setLoaded] = useState(false); const [notice, setNotice] = useState('');
  const key = `skillbridge-weekly-goal:${userId}`;
  useEffect(() => {try {const saved = Number(localStorage.getItem(key)); if (Number.isInteger(saved) && saved >= 1 && saved <= 30) setGoal(saved);} catch {setNotice('Goal preferences cannot be saved in this browser.');} setLoaded(true);}, [key]);
  const now = new Date(); const count = weeklySessions(records, now); const {start, end} = weekWindow(now); const last = new Date(end); last.setDate(last.getDate() - 1);
  return <section className="panel learning-plan"><div className="section-heading"><div><span className="eyebrow">BUILD A STEADY PRACTICE HABIT</span><h3>Your weekly plan</h3><p>{start.toLocaleDateString('en-IN', {day:'numeric', month:'short'})} – {last.toLocaleDateString('en-IN', {day:'numeric', month:'short'})} · your local timezone</p></div><Target size={22}/></div><div className="weekly-goal"><div><strong>{count} / {goal}</strong><span>completed sessions this week</span><progress max={goal} value={Math.min(count, goal)}/><small>{count >= goal ? 'Weekly goal reached. Keep practicing at your own pace.' : `${goal - count} more sessions to reach your goal.`}</small></div><label className="resume-field"><span>Weekly session goal</span><select value={goal} disabled={!loaded} onChange={e => {const value = Number(e.target.value); setGoal(value); try {localStorage.setItem(key, String(value));} catch {setNotice('Goal changed for this visit. Browser storage is unavailable.');}}}>{[1,3,5,7,10,15,20,30].map(value => <option key={value} value={value}>{value} sessions</option>)}</select></label></div><div className="recommendation-grid">{practiceRecommendations(records).map(action => <article key={action.href}><h4>{action.title}</h4><p>{action.reason}</p><Link href={action.href} className="text-button">Practice now<ArrowRight size={14}/></Link></article>)}</div><p className="mode-note">Recommendations use your saved activity. Weekly goals and saved problem lists stay on this browser, separately for each account.</p>{notice && <p role="status">{notice}</p>}</section>;
}
