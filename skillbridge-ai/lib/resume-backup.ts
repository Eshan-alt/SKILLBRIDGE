import {z} from 'zod';import {resumeSchema,type Resume} from './resume';
export const resumeVersionSchema=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(80),createdAt:z.string().datetime(),resume:resumeSchema});
export type ResumeVersion=z.infer<typeof resumeVersionSchema>;
export function readResumeVersions(raw:string|null):ResumeVersion[]{try{const data=JSON.parse(raw||'[]');if(!Array.isArray(data))return [];return data.slice(0,10).flatMap(v=>{const p=resumeVersionSchema.safeParse(v);return p.success?[p.data]:[];});}catch{return [];}}
export function parseResumeBackup(raw:string):Resume{if(raw.length>100000)throw new Error('Backup must be smaller than 100 KB.');const data=JSON.parse(raw);return resumeSchema.parse(data?.format==='skillbridge-resume-v1'?data.resume:data);}
export function resumeBackup(resume:Resume){return JSON.stringify({format:'skillbridge-resume-v1',resume:resumeSchema.parse(resume)},null,2);}
