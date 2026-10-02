import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const jar=new Map();let checks=0;let userId;
async function request(path,method='GET',body,origin=base){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')},body:body===undefined?undefined:JSON.stringify(body)});for(const cookie of response.headers.getSetCookie()){const first=cookie.split(';')[0];const index=first.indexOf('=');jar.set(first.slice(0,index),first.slice(index+1));}return {status:response.status,body:await response.json()};}
function check(condition,label){assert(condition,label);checks++;console.log(`PASS ${label}`);}
try{
 const health=await request('/api/health');check(health.status===200&&health.body.storage==='local','local test environment');
 check((await request('/api/auth/register','POST',{name:'x',email:'bad',password:'bad'})).status===400,'registration validation');
 const email=`skillbridge-api-test-${Date.now()}@example.test`;const credentials={name:'API Test User',email,password:'TestOnlyPassword123'};
 const register=await request('/api/auth/register','POST',credentials);check(register.status===201,'registration');userId=register.body.user.id;
 check(!('passwordHash' in register.body.user),'password hashes remain private');
 check((await request('/api/auth/me')).body.user.id===userId,'session authentication');
 check((await request('/api/auth/register','POST',credentials)).status===409,'duplicate email protection');
 check((await request('/api/auth/logout','POST')).status===200,'logout');check((await request('/api/auth/me')).body.user===null,'session revocation');
 check((await request('/api/auth/login','POST',{email,password:'WrongPassword123'})).status===401,'incorrect password');
 check((await request('/api/auth/login','POST',credentials)).status===200,'login');
 check((await request('/api/questions','POST',{role:'bad',index:0,history:[],recent:[]})).status===400,'question request validation');
 const recent=[];const history=[];for(let index=0;index<3;index++){const q=await request('/api/questions','POST',{role:'Frontend developer',index,history,recent});check(q.status===200&&!recent.includes(q.body.item.question),`fresh question ${index+1}`);recent.push(q.body.item.question);const answer='I would profile the render, test keyboard accessibility and validation, and compare server and client caching approaches. I would explain trade-offs and verify the result using repeatable tests.';const feedback=await request('/api/interview','POST',{role:'Frontend developer',index,answer,...q.body.item});check(feedback.status===200&&feedback.body.mode==='practice'&&feedback.body.feedback.score>=0,`answer feedback ${index+1}`);history.push({question:q.body.item.question,answer});}
 check((await request('/api/interview','POST',{role:'Frontend developer',index:0,answer:'short'})).status===400,'short answer rejected');
 check((await request('/api/questions','POST',{},'https://foreign.example')).status===403,'cross-origin request rejected');
 const chat=await request('/api/communication','POST',{scenario:'Tell your story',history:[{role:'user',content:'I built a useful project and learned to test it carefully.'}]});check(chat.status===200&&chat.body.reply&&chat.body.feedback,'communication reply');
 check((await request('/api/progress','POST',{bad:true})).status===400,'invalid progress record rejected');
 check((await request('/api/billing/subscribe','POST')).status===503,'unconfigured payment provider gives honest error');
 check((await request('/api/billing/webhook','POST',{})).status===503,'unconfigured webhook does not grant access');
 await request('/api/auth/logout','POST');check((await request('/api/billing/subscribe','POST')).status===401,'subscription requires sign-in');
 console.log(`${checks} API checks passed.`);
} finally {if(userId){const file=new URL('../.data/accounts.json',import.meta.url);const data=JSON.parse(await readFile(file,'utf8'));data.users=data.users.filter(u=>u.id!==userId);data.sessions=data.sessions.filter(s=>s.userId!==userId);await writeFile(file,JSON.stringify(data),{mode:0o600});}}
