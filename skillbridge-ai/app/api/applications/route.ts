import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/accounts';
import {database} from '@/lib/mongodb';
import {sameOrigin} from '@/lib/session';
import {applicationSchema, type JobApplication} from '@/lib/applications';
import {allowed} from '@/lib/rate-limit';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({applications: [], storage: 'local'});
    const db = await database();
    if (!db) return NextResponse.json({applications: [], storage: 'local'});
    const applications = await db.collection('applications').find({userId: user.id}, {projection: {_id: 0, userId: 0}}).sort({updatedAt: -1}).limit(500).toArray();
    return NextResponse.json({applications, storage: 'mongodb'}, {headers: {'Cache-Control': 'no-store'}});
  } catch { return NextResponse.json({error: 'Your application tracker could not load from the database.'}, {status: 503}); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error: 'Invalid origin.'}, {status: 403});
  try {
    const parsed = applicationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({error: 'Check company, role, dates, and job URL.'}, {status: 400});
    const user = await currentUser();
    if (!user) return NextResponse.json({storage: 'local'});
    if (!await allowed(`applications:${user.id}`, 60)) return NextResponse.json({error: 'Please wait before saving more changes.'}, {status: 429});
    const db = await database();
    if (!db) return NextResponse.json({storage: 'local'});
    const collection = db.collection<JobApplication & {userId: string}>('applications');
    await collection.createIndex({userId: 1, id: 1}, {unique: true});
    await collection.createIndex({userId: 1, updatedAt: -1});
    const item = parsed.data;
    // A stale device cannot overwrite a newer edit, including an archive tombstone.
    await collection.updateOne({userId: user.id, id: item.id}, {$setOnInsert: {...item, userId: user.id}}, {upsert: true});
    await collection.updateOne({userId: user.id, id: item.id, updatedAt: {$lte: item.updatedAt}}, {$set: item});
    return NextResponse.json({storage: 'mongodb'});
  } catch { return NextResponse.json({error: 'Saved on this browser. Database sync is unavailable.'}, {status: 503}); }
}
