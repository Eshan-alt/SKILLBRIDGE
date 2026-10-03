import {NextResponse} from 'next/server';
import {randomUUID} from 'crypto';
import {registerSchema} from '@/lib/auth-validation';
import {hashPassword,createUser,loginUser,publicUser,type User} from '@/lib/accounts';
import {sameOrigin} from '@/lib/session';
import {allowed} from '@/lib/rate-limit';
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});try{if(!await allowed('register',20))return NextResponse.json({error:'Too many attempts. Please try again in a minute.'},{status:429});const parsed=registerSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:'Enter a name, valid email, and a password with at least 10 characters, a letter, and a number.'},{status:400});const {name,email,password}=parsed.data;const user:User={id:randomUUID(),name,email,passwordHash:await hashPassword(password),createdAt:new Date().toISOString(),plan:'free'};await createUser(user);await loginUser(user.id);return NextResponse.json({user:publicUser(user)},{status:201});}catch(e){if(e instanceof Error&&e.message==='EMAIL_EXISTS')return NextResponse.json({error:'An account with this email already exists. Please sign in.'},{status:409});return NextResponse.json({error:'Account creation is unavailable. Please check your database settings.'},{status:503});}}
