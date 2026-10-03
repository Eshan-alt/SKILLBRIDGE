import type {Resume, ResumeEntry} from '@/lib/resume';
import {resumeLink} from '@/lib/resume-link';
export default function ResumePreview({resume}: {resume: Resume}) {
  const links = [[resume.website, /github\.com/i.test(resume.website) ? 'GitHub' : 'Portfolio'], [resume.linkedin, 'LinkedIn'], [resume.github, 'GitHub']].filter(([value]) => value);
  return <article className="resume-paper sample-resume"><header><h2>{resume.name || 'Your Name'}</h2>{resume.title && <p className="resume-role">{resume.title}</p>}<div className="sample-contacts">{resume.phone && <span>{resume.phone}</span>}{resume.email && <span>{resume.email}</span>}{links.map(([value, label], i) => <span key={i}>{resumeLink(value) ? <a href={resumeLink(value)!} target="_blank" rel="noopener noreferrer" title={value}>{label}</a> : value}</span>)}{resume.location && <span>{resume.location}</span>}{!resume.phone && !resume.email && <span>Email · Phone · Location</span>}</div></header>
    {resume.summary && <Section title="Summary"><p>{resume.summary}</p></Section>}
    {resume.education.some(e => e.title || e.organization) && <Section title="Education">{resume.education.map(e => <Entry key={e.id} entry={e} education/>)}</Section>}
    {resume.skills && <Section title="Technical Skills"><ul className="sample-skills">{resume.skills.split('\n').filter(line => line.trim()).map((line, i) => {const colon = line.indexOf(':'); return <li key={i}>{colon > 0 ? <><strong>{line.slice(0, colon)}:</strong>{line.slice(colon + 1)}</> : line}</li>;})}</ul></Section>}
    {resume.experience.some(e => e.title || e.organization) && <Section title="Experience">{resume.experience.map(e => <Entry key={e.id} entry={e}/>)}</Section>}
    {resume.projects.some(p => p.name) && <Section title="Projects">{resume.projects.filter(p => p.name).map(p => <div className="sample-entry" key={p.id}><div className="sample-entry-heading"><strong>• {p.name}</strong>{p.link && (resumeLink(p.link) ? <a href={resumeLink(p.link)!} target="_blank" rel="noopener noreferrer">Source Code</a> : <span>{p.link}</span>)}</div>{p.technologies && <p className="sample-entry-subtitle"><em>Tools: {p.technologies}</em></p>}<Bullets value={p.details}/></div>)}</Section>}
    {resume.responsibilities.some(e => e.title || e.organization) && <Section title="Positions of Responsibility">{resume.responsibilities.map(e => <Entry key={e.id} entry={e}/>)}</Section>}
    {resume.achievements && <Section title="Achievements"><ul className="sample-skills">{resume.achievements.split('\n').filter(line => line.trim()).map((line, i) => <li key={i}>{line}</li>)}</ul></Section>}
    {!resume.summary && !resume.skills && !resume.education.length && !resume.experience.length && !resume.projects.length && !resume.responsibilities.length && !resume.achievements && <div className="resume-placeholder"><p>Your resume takes shape as you type.</p></div>}
  </article>;
}
function Section({title, children}: {title: string; children: React.ReactNode}) {return <section className="resume-document-section"><h3>{title}</h3>{children}</section>;}
function Bullets({value}: {value: string}) {return value.trim() ? <ul className="sample-bullets">{value.split('\n').filter(line => line.trim()).map((line, i) => <li key={i}>{line}</li>)}</ul> : null;}
function Entry({entry, education = false}: {entry: ResumeEntry; education?: boolean}) {
  if (!entry.title && !entry.organization) return null;
  return <div className="sample-entry"><div className="sample-entry-heading"><strong>• {entry.organization || entry.title}</strong><em>{entry.dates}</em></div><div className="sample-entry-subtitle"><em>{entry.organization ? entry.title : ''}</em><span>{entry.location}</span></div>{education ? entry.details && <p className="sample-education-details">{entry.details}</p> : <Bullets value={entry.details}/>}</div>;
}
