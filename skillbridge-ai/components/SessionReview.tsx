'use client';
import {useEffect,useRef,useState} from 'react';
import {Download} from 'lucide-react';
import type {PracticeRecord} from '@/lib/practice';
import {sessionNotes} from '@/lib/session-notes';
export default function SessionReview({record}: {record: PracticeRecord}) {
  const [downloadUrl,setDownloadUrl]=useState('');const linkRef=useRef('');
  useEffect(()=>()=>{if(linkRef.current)URL.revokeObjectURL(linkRef.current);},[]);
  function prepareNotes(){if(linkRef.current)URL.revokeObjectURL(linkRef.current);const url=URL.createObjectURL(new Blob([sessionNotes(record)],{type:'text/plain;charset=utf-8'}));linkRef.current=url;setDownloadUrl(url);}
  return <section className="session-review" id={`review-${record.id}`} aria-label={`${record.title} session review`}><div className="section-heading"><div><span className="eyebrow">LEARN FROM YOUR LAST ATTEMPT</span><h3>Question-by-question review</h3></div><button className="secondary" onClick={prepareNotes}><Download size={14}/>Prepare review notes</button></div>{downloadUrl&&<p className="hint-box" role="status"><a href={downloadUrl} download="skillbridge-interview-review.txt">Download your review notes →</a></p>}<p className="mode-note">Your submitted answers are preserved below. Local scores measure keywords and detail; AI feedback can be imperfect.</p>{record.transcript?.map((item,index)=><details key={index} className="review-question" open={index===0}><summary><span>Question {index+1} · {item.feedback.score}/100 · {item.mode==='ai'?'AI feedback':'Local rubric'}</span>{item.question}</summary><h4>Your submitted answer</h4><p className="review-answer">{item.answer}</p><div className="review-feedback"><div><h4>What worked</h4><ul>{item.feedback.strengths.map((value,i)=><li key={i}>{value}</li>)}</ul></div><div><h4>What to improve</h4><ul>{item.feedback.improvements.map((value,i)=><li key={i}>{value}</li>)}</ul></div></div><div className="follow-up"><span className="eyebrow">REFLECTION QUESTION</span><p>{item.feedback.followUp}</p></div></details>)}</section>;
}
