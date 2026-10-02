import {NextResponse} from 'next/server';
import {billingConfigured} from '@/lib/billing';
import {currentUser,proActive} from '@/lib/accounts';
export async function GET(){try{const user=await currentUser();return NextResponse.json({ai:Boolean(process.env.AI_API_KEY)&&Boolean(user&&proActive(user)),aiConfigured:Boolean(process.env.AI_API_KEY),storage:process.env.MONGODB_URI?'mongodb':'local',billing:billingConfigured(),authentication:'account-and-guest'});}catch{return NextResponse.json({error:'Could not load connection status.'},{status:503});}}
