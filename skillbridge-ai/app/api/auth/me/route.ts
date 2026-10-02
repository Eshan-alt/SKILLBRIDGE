import {NextResponse} from 'next/server';
import {currentUser,publicUser,proActive} from '@/lib/accounts';
export async function GET(){try{const u=await currentUser();return NextResponse.json({user:u?{...publicUser(u),plan:proActive(u)?'pro':'free'}:null});}catch{return NextResponse.json({error:'Account service is unavailable.'},{status:503});}}
