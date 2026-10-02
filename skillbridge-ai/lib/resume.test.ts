import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {emptyResume,exampleResume,resumeSchema,resumeChecks} from './resume';
import {makeResumePDF} from './resume-pdf';
test('resume draft validation and completeness checks',()=>{assert(resumeSchema.safeParse(emptyResume()).success);assert.equal(resumeChecks(emptyResume()).filter(c=>c.done).length,0);assert.equal(resumeChecks(exampleResume).filter(c=>c.done).length,6);assert.equal(resumeSchema.safeParse({...emptyResume(),projects:Array(9).fill(exampleResume.projects[0])}).success,false);});
test('resume PDF is a valid document with searchable text and metadata',async()=>{const bytes=await makeResumePDF(exampleResume);assert.equal(Buffer.from(bytes).subarray(0,4).toString(),'%PDF');const doc=await PDFDocument.load(bytes);assert(doc.getPageCount()>=1);assert.equal(doc.getAuthor(),'Alex Morgan');assert(doc.getTitle()?.includes('Resume'));});
test('long resumes wrap text and create additional pages',async()=>{const r={...exampleResume,experience:Array.from({length:6},(_,i)=>({id:String(i),title:'Software Developer',organization:'Example Organization',location:'Remote',dates:'2024–2026',details:Array(12).fill('Built a useful feature with clear requirements, validation, careful testing, and a documented implementation approach.').join('\n')}))};const doc=await PDFDocument.load(await makeResumePDF(r));assert(doc.getPageCount()>1);});
