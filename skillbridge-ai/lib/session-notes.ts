import type {PracticeRecord} from './practice';
export function sessionNotes(record: PracticeRecord) {
  const lines = ['SKILLBRIDGE INTERVIEW REVIEW', record.title, `Completed: ${record.date}`, `Average coaching score: ${record.score}/100`, '', 'Scores are coaching signals, not verified hiring or examination results.', ''];
  for (const [index, answer] of (record.transcript || []).entries()) {
    lines.push(`QUESTION ${index+1}`, answer.question, '', 'YOUR ANSWER', answer.answer, '', `${answer.mode==='ai'?'AI feedback':'Local keyword rubric'}: ${answer.feedback.score}/100`, 'STRENGTHS', ...answer.feedback.strengths.map(value=>`- ${value}`), 'IMPROVEMENTS', ...answer.feedback.improvements.map(value=>`- ${value}`), 'REFLECTION', answer.feedback.followUp, '', '----------------------------------------', '');
  }
  return lines.join('\n');
}
