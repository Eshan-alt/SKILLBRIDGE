import {NextResponse} from 'next/server';
import {resumeSchema} from '@/lib/resume';
import {makeResumePDF} from '@/lib/resume-pdf';
import {sameOrigin,session} from '@/lib/session';
import {allowed} from '@/lib/rate-limit';
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});try{const id=await session();if(!await allowed(`resume:${id}`,10))return NextResponse.json({error:'Please wait a minute before exporting again.'},{status:429});const p=resumeSchema.safeParse(await req.json());if(!p.success||!p.data.name.trim())return NextResponse.json({error:'Add your name and check your resume fields before exporting.'},{status:400});const bytes=await makeResumePDF(p.data);return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="skillbridge-resume.pdf"','Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Could not export PDF. Use Latin-script text for this export; your draft remains saved.'},{status:400});}}
