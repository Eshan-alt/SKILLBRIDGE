import {NextResponse} from 'next/server';
import {currentUser, proActive} from '@/lib/accounts';
import {aiUsage, aiMonthlyLimit, usagePeriod} from '@/lib/ai-usage';
export async function GET() {
  try {
    const user = await currentUser();
    const usage = user ? await aiUsage(user.id) : {used: 0, limit: aiMonthlyLimit(), ...usagePeriod(), configured: false};
    return NextResponse.json({...usage, pro: Boolean(user && proActive(user))}, {headers: {'Cache-Control': 'no-store'}});
  } catch { return NextResponse.json({error: 'Usage could not load.'}, {status: 503}); }
}
