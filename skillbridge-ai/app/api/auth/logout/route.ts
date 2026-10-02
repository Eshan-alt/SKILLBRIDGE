import {NextResponse} from 'next/server';
import {logoutUser} from '@/lib/accounts';
import {sameOrigin} from '@/lib/session';
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});try{await logoutUser();return NextResponse.json({ok:true});}catch{return NextResponse.json({error:'Could not sign out. Please try again.'},{status:503});}}
