import {NextResponse} from 'next/server';
import {loginSchema} from '@/lib/auth-validation';
import {checkPassword,userByEmail,loginUser,publicUser} from '@/lib/accounts';
import {sameOrigin} from '@/lib/session';
import {allowed} from '@/lib/rate-limit';
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});try{const p=loginSchema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Enter your email and password.'},{status:400});if(!allowed(`login:${p.data.email}`,6,60000)||!allowed('login-total',100,60000))return NextResponse.json({error:'Too many login attempts. Please wait a minute.'},{status:429});const user=await userByEmail(p.data.email);if(!user||!await checkPassword(p.data.password,user.passwordHash))return NextResponse.json({error:'Email or password is incorrect.'},{status:401});await loginUser(user.id);return NextResponse.json({user:publicUser(user)});}catch{return NextResponse.json({error:'Sign-in is unavailable. Check your database connection.'},{status:503});}}
