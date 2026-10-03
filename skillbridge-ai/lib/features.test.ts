import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applicationSchema, dueForFollowUp, mergeApplications, type JobApplication} from './applications';
import {localCounter, counterIdentity} from './rate-limit';
import {usagePeriod, aiMonthlyLimit} from './ai-usage';
const item: JobApplication = {id:'ea86cfcc-08ba-4ae1-b4a5-c2c0542c1734',company:'Example',role:'Developer',stage:'Applied',url:'https://example.com/jobs/1',appliedDate:'2026-10-01',followUpDate:'2026-10-02',notes:'Prepare API design',updatedAt:'2026-10-02T10:00:00.000Z',archived:false};
test('job links reject executable protocols and incomplete application data',()=>{
 assert(applicationSchema.safeParse(item).success);
 assert(!applicationSchema.safeParse({...item,url:'javascript:alert(1)'}).success);
 assert(!applicationSchema.safeParse({...item,company:' '}).success);
 assert(!applicationSchema.safeParse({...item,stage:'Unknown'}).success);
});
test('follow-ups include today and overdue, excluding closed, offers, and archives',()=>{
 assert(dueForFollowUp(item,'2026-10-02')); assert(dueForFollowUp(item,'2026-10-03'));
 assert(!dueForFollowUp(item,'2026-10-01'));
 for(const patch of [{archived:true},{stage:'Closed' as const},{stage:'Offer' as const}]) assert(!dueForFollowUp({...item,...patch},'2026-10-02'));
});
test('newer archived edits win over stale devices and duplicate application IDs',()=>{
 const archived={...item,archived:true,updatedAt:'2026-10-03T10:00:00.000Z'};
 assert.deepEqual(mergeApplications([archived],[item]),[archived]);
 assert.deepEqual(mergeApplications([item],[archived]),[archived]);
});
test('request buckets enforce limits, isolate users, and renew after expiry',()=>{
 for(let i=0;i<3;i++) assert(localCounter('test-limit',3,1000,10000));
 assert(!localCounter('test-limit',3,1000,10000));
 assert(localCounter('other-user',3,1000,10000));
 assert(localCounter('test-limit',3,1000,11000));
 assert(!counterIdentity('private-email@example.com',1000,10000).key.includes('@'));
});
test('monthly usage resets at UTC calendar boundaries including year rollover',()=>{
 assert.deepEqual(usagePeriod(new Date('2026-12-31T23:59:00Z')),{month:'2026-12',resetsAt:'2027-01-01T00:00:00.000Z'});
 assert.equal(usagePeriod(new Date('2028-02-10T00:00:00Z')).resetsAt,'2028-03-01T00:00:00.000Z');
 const original=process.env.AI_MONTHLY_REQUEST_LIMIT;
 try{process.env.AI_MONTHLY_REQUEST_LIMIT='-1';assert.equal(aiMonthlyLimit(),300);process.env.AI_MONTHLY_REQUEST_LIMIT='250';assert.equal(aiMonthlyLimit(),250);}finally{if(original===undefined)delete process.env.AI_MONTHLY_REQUEST_LIMIT;else process.env.AI_MONTHLY_REQUEST_LIMIT=original;}
});

test('checkout lease cannot be released by another owner',async()=>{const {acquireLease,releaseLease}=await import('./leases');const owner=await acquireLease('test-checkout');assert(owner);assert.equal(await acquireLease('test-checkout'),null);await releaseLease('test-checkout','wrong-owner');assert.equal(await acquireLease('test-checkout'),null);await releaseLease('test-checkout',owner);const second=await acquireLease('test-checkout');assert(second);await releaseLease('test-checkout',second);});

test('impossible calendar dates are rejected',()=>{assert(!applicationSchema.safeParse({...item,followUpDate:'2026-02-31'}).success);});
test('weekly goals include Monday through Sunday and exclude future or previous-week sessions',async()=>{
 const {weeklySessions,weekWindow}=await import('./learning-plan');
 const now=new Date(2026,9,7,12); const {start,end}=weekWindow(now);
 assert.equal(start.getDay(),1);assert.equal(end.getDay(),1);
 const record={id:item.id,kind:'coding' as const,title:'Example',score:100,date:start.toISOString(),duration:1,mode:'tests' as const,details:'Passed'};
 assert.equal(weeklySessions([record,{...record,date:new Date(start.getTime()-1).toISOString()},{...record,date:end.toISOString()}],now),1);
});
test('recommendations stop suggesting a failed problem after a successful retry',async()=>{
 const {practiceRecommendations,savedProblemIds}=await import('./learning-plan');
 const record={id:item.id,kind:'coding' as const,title:'Two Sum',score:50,date:'2026-10-02T10:00:00.000Z',duration:1,mode:'tests' as const,details:'Failed'};
 assert(practiceRecommendations([record])[0].title.includes('Two Sum'));
 assert(!practiceRecommendations([record,{...record,score:100,date:'2026-10-03T10:00:00.000Z'}])[0].title.includes('Two Sum'));
 assert.deepEqual(savedProblemIds(['two-sum','two-sum','unknown',5],new Set(['two-sum'])),['two-sum']);
});
