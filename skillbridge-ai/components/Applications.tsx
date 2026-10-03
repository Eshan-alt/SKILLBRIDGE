'use client';
import {useEffect, useState, type FormEvent} from 'react';
import {BriefcaseBusiness, Plus, ArrowUpRight, Archive, RotateCcw, CalendarClock} from 'lucide-react';
import {applicationSchema, applicationStages, dueForFollowUp, mergeApplications, type JobApplication} from '@/lib/applications';

function blank(): JobApplication {
  return {id: crypto.randomUUID(), company: '', role: '', stage: 'Saved', url: '', appliedDate: '', followUpDate: '', notes: '', updatedAt: new Date().toISOString(), archived: false};
}
export default function Applications({userId}: {userId: string}) {
  const key = `skillbridge-applications:${userId}`;
  const [items, setItems] = useState<JobApplication[]>([]);
  const [draft, setDraft] = useState<JobApplication | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cloud, setCloud] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let local: JobApplication[] = [];
      try {
        const raw = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(raw)) local = raw.flatMap(value => {const p = applicationSchema.safeParse(value); return p.success ? [p.data] : [];});
      } catch {setMessage('Browser storage is unavailable. Drafts may not persist.');}
      setItems(local);
      try {
        const response = await fetch('/api/applications'); const data = await response.json();
        if (!response.ok) throw Error(data.error);
        if (cancelled) return;
        setCloud(data.storage === 'mongodb');
        if (data.storage === 'mongodb') {
          const remote = data.applications.flatMap((value: unknown) => {const p = applicationSchema.safeParse(value); return p.success ? [p.data] : [];});
          const merged = mergeApplications(local, remote); setItems(merged); localStorage.setItem(key, JSON.stringify(merged));
          for (const item of local.filter(item => !remote.some((r: JobApplication) => r.id === item.id && r.updatedAt >= item.updatedAt))) {
            const sync = await fetch('/api/applications', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(item)});
            if (!sync.ok) setMessage('Some changes need syncing. Reopen this page to retry.');
          }
        }
      } catch (e) {if (!cancelled) setMessage(e instanceof Error ? e.message : 'Could not sync applications.');}
      finally {if (!cancelled) setLoaded(true);}
    }
    load(); return () => {cancelled = true;};
  }, [key]);
  async function persist(item: JobApplication) {
    setSyncing(true); setMessage('');
    const next = mergeApplications(items, [item]); setItems(next);
    try {localStorage.setItem(key, JSON.stringify(next));} catch {setMessage('Browser storage is unavailable. Keep this page open.');}
    try {
      const response = await fetch('/api/applications', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(item)});
      const data = await response.json(); if (!response.ok) throw Error(data.error);
      setCloud(data.storage === 'mongodb'); setMessage(data.storage === 'mongodb' ? 'Application saved to your account.' : 'Application saved on this browser.');
    } catch (e) {setMessage(e instanceof Error ? e.message : 'Saved locally. Sync failed.');}
    finally {setSyncing(false);}
  }
  function submit(event: FormEvent) {
    event.preventDefault(); if (!draft) return;
    const parsed = applicationSchema.safeParse({...draft, updatedAt: new Date().toISOString()});
    if (!parsed.success) {setMessage(parsed.error.issues[0].message); return;}
    setDraft(null); void persist(parsed.data);
  }
  const active = items.filter(item => !item.archived);
  const visible = items.filter(item => filter === 'Archived' ? item.archived : !item.archived && (filter === 'All' || filter === 'Follow-ups' ? filter !== 'Follow-ups' || dueForFollowUp(item, today) : item.stage === filter)).filter(item => `${item.company} ${item.role}`.toLowerCase().includes(search.toLowerCase()));
  const change = (field: keyof JobApplication, value: string) => setDraft(current => current ? {...current, [field]: value} : current);
  return <>
    <section className="application-intro panel"><div><span className="eyebrow">TURN PRACTICE INTO OPPORTUNITY</span><h2>Your next role starts with a plan.</h2><p>Track applications, prepare for interviews, and keep follow-ups in sight.</p><small>{cloud ? 'Account sync enabled' : 'Saved on this browser · sign in with MongoDB configured for account sync'}</small></div><button className="primary" disabled={!loaded || syncing} onClick={() => setDraft(blank())}><Plus size={16}/>Add application</button></section>
    <section className="stats-grid application-stats">{[['Tracked roles', active.length], ['Interview stage', active.filter(item => item.stage === 'Interview').length], ['Offers', active.filter(item => item.stage === 'Offer').length], ['Follow-ups due', active.filter(item => dueForFollowUp(item, today)).length]].map(([label, value]) => <article className="stat" key={label}><div className="stat-top"><span>{label}</span><BriefcaseBusiness size={17}/></div><strong>{value}</strong></article>)}</section>
    {draft && <section className="panel application-editor"><div className="section-heading"><h3>{items.some(item => item.id === draft.id) ? 'Edit application' : 'Add a new opportunity'}</h3><button className="text-button" onClick={() => setDraft(null)}>Cancel</button></div><form onSubmit={submit}><div className="form-grid">{[['company', 'Company'], ['role', 'Role'], ['url', 'Job link']].map(([field, label]) => <label className="resume-field" key={field}><span>{label}</span><input value={draft[field as 'company' | 'role' | 'url']} required={field !== 'url'} maxLength={field === 'url' ? 1000 : field === 'role' ? 150 : 100} type={field === 'url' ? 'url' : 'text'} onChange={e => change(field as keyof JobApplication, e.target.value)}/></label>)}<label className="resume-field"><span>Stage</span><select value={draft.stage} onChange={e => change('stage', e.target.value)}>{applicationStages.map(stage => <option key={stage}>{stage}</option>)}</select></label>{[['appliedDate', 'Applied date'], ['followUpDate', 'Follow-up date']].map(([field, label]) => <label className="resume-field" key={field}><span>{label}</span><input type="date" value={draft[field as 'appliedDate' | 'followUpDate']} onChange={e => change(field as keyof JobApplication, e.target.value)}/></label>)}</div><label className="resume-field"><span>Notes and next steps</span><textarea rows={4} maxLength={4000} value={draft.notes} onChange={e => change('notes', e.target.value)} placeholder="Interview format, preparation topics, or your next action…"/></label><button className="primary" disabled={syncing}>Save application</button></form></section>}
    <section className="panel applications-panel"><div className="section-heading"><h3>Your opportunities</h3><label className="application-search"><span className="sr-only">Search applications</span><input placeholder="Search company or role" value={search} onChange={e => setSearch(e.target.value)}/></label></div><div className="filter-tabs application-filters">{['All', ...applicationStages, 'Follow-ups', 'Archived'].map(stage => <button key={stage} className={filter === stage ? 'selected' : ''} onClick={() => setFilter(stage)}>{stage}</button>)}</div>{visible.length ? <div className="application-grid">{visible.map(item => <article className="application-card" key={item.id}><div><span className="pill">{item.stage}</span>{dueForFollowUp(item, today) && <span className="followup-due"><CalendarClock size={13}/>Follow-up due</span>}</div><h3>{item.role}</h3><p className="application-company">{item.company}</p>{item.appliedDate && <small>Applied {item.appliedDate}</small>}{item.followUpDate && <small>Follow up {item.followUpDate}</small>}{item.notes && <p className="application-notes">{item.notes}</p>}<div className="button-row">{item.url && <a className="text-button" href={item.url} target="_blank" rel="noopener noreferrer">View role<ArrowUpRight size={13}/></a>}<button className="text-button" disabled={syncing} onClick={() => setDraft(item)}>Edit</button><button className="text-button" disabled={syncing} onClick={() => void persist({...item, archived: !item.archived, updatedAt: new Date().toISOString()})}>{item.archived ? <RotateCcw size={13}/> : <Archive size={13}/>} {item.archived ? 'Restore' : 'Archive'}</button></div></article>)}</div> : <div className="chart-empty"><BriefcaseBusiness size={30}/><p>{active.length ? 'No applications match this view.' : 'Add your first opportunity and take the next step.'}</p></div>}</section>
    {message && <div className="hint-box" role="status">{message}</div>}<p className="mode-note">Follow-up dates appear here when due. This tracker does not send emails or notifications outside the app.</p>
  </>;
}
