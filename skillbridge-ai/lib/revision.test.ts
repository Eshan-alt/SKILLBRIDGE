import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCodeDrafts, updateCodeDraft} from './code-drafts';
import {recordSchema, practiceFeedback} from './practice';
import {sessionNotes} from './session-notes';
const now=new Date('2026-10-03T10:00:00Z');
test('coding drafts restore newest valid entries and reject corrupt or unknown problems',()=>{
 const valid={problemId:'two-sum',code:'function twoSum() { return []; }',updatedAt:now.toISOString()};
 assert.deepEqual(readCodeDrafts([valid,{...valid,code:'older',updatedAt:'2026-10-02T10:00:00Z'},{...valid,problemId:'unknown'},{...valid,code:'x'.repeat(20001)},null],new Set(['two-sum'])),[valid]);
});
test('draft resets remove only that problem and retention is bounded',()=>{
 const values=Array.from({length:30},(_,i)=>({problemId:`p-${i}`,code:'draft',updatedAt:now.toISOString()}));
 const next=updateCodeDraft(values,'new','edited','starter',now);assert.equal(next.length,30);assert.equal(next[0].problemId,'new');
 const reset=updateCodeDraft(next,'new','starter','starter',now);assert.equal(reset.length,29);assert(!reset.some(d=>d.problemId==='new'));assert(reset.some(d=>d.problemId==='p-0'));
 assert.equal(updateCodeDraft([], 'blank', '', 'starter', now)[0].code,'');
});
test('transcripts preserve answer and feedback and reject overlong or incompatible records',()=>{
 const item={question:'How would you optimize a slow list?',answer:'I would profile rendering before choosing an optimization.',feedback:practiceFeedback('Frontend developer',0,'I would profile rendering before choosing an optimization.'),mode:'practice' as const};
 const base={id:'9583303b-e628-44af-b50c-99c7dd8b74dd',kind:'interview' as const,title:'Frontend developer',score:50,date:now.toISOString(),duration:20,mode:'practice' as const,details:'Three questions',transcript:[item]};
 const parsed=recordSchema.parse(base);assert.equal(parsed.transcript?.[0].answer,item.answer);assert.deepEqual(parsed.transcript?.[0].feedback,item.feedback);
 assert(!recordSchema.safeParse({...base,transcript:Array(4).fill(item)}).success);assert(!recordSchema.safeParse({...base,kind:'coding'}).success);assert(!recordSchema.safeParse({...base,transcript:[{...item,answer:'x'.repeat(6001)}]}).success);
 const notes=sessionNotes(parsed);assert(notes.includes(item.question));assert(notes.includes(item.answer));assert(notes.includes('Local keyword rubric'));assert(notes.includes(item.feedback.followUp));
 const {transcript,...legacy}=base;assert(recordSchema.safeParse(legacy).success);
});
