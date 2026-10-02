import {randomBytes,scrypt,timingSafeEqual,createHash} from 'crypto';
import {promisify} from 'util';
import {cookies} from 'next/headers';
import {mkdir,readFile,writeFile,rename} from 'fs/promises';
import path from 'path';
import {database} from './mongodb';
const scryptAsync=promisify(scrypt);
export type User={id:string;name:string;email:string;passwordHash:string;createdAt:string;plan:'free'|'pro';subscriptionId?:string;subscriptionStatus?:string;paidUntil?:string;billingPending?:string;cancellationRequested?:boolean};
type LoginSession={tokenHash:string;userId:string;expiresAt:string};
type LocalStore={users:User[];sessions:LoginSession[]};
const file=path.join(process.cwd(),'.data','accounts.json');
let queue:Promise<unknown>=Promise.resolve();
async function local<T>(action:(store:LocalStore)=>T|Promise<T>):Promise<T>{const task=queue.then(async()=>{await mkdir(path.dirname(file),{recursive:true});let store:LocalStore={users:[],sessions:[]};try{store=JSON.parse(await readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}store.sessions=store.sessions.filter(s=>new Date(s.expiresAt)>new Date());const result=await action(store);await writeFile(`${file}.tmp`,JSON.stringify(store),{mode:0o600});await rename(`${file}.tmp`,file);return result;});queue=task.catch(()=>{});return task;}
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const key=await scryptAsync(password,salt,64) as Buffer;return `${salt}:${key.toString('hex')}`;}
export async function checkPassword(password:string,stored:string){const [salt,hex]=stored.split(':');if(!salt||!hex)return false;const key=await scryptAsync(password,salt,64) as Buffer;const expected=Buffer.from(hex,'hex');return key.length===expected.length&&timingSafeEqual(key,expected);}
export async function createUser(user:User){const db=await database();if(db){await db.collection<User>('users').createIndex({email:1},{unique:true});try{await db.collection<User>('users').insertOne(user);}catch(e){if((e as {code?:number}).code===11000)throw new Error('EMAIL_EXISTS');throw e;}}else await local(s=>{if(s.users.some(u=>u.email===user.email))throw new Error('EMAIL_EXISTS');s.users.push(user);});}
export async function userByEmail(email:string){const db=await database();return db?await db.collection<User>('users').findOne({email},{projection:{_id:0}}):await local(s=>s.users.find(u=>u.email===email)||null);}
export async function userById(id:string){const db=await database();return db?await db.collection<User>('users').findOne({id},{projection:{_id:0}}):await local(s=>s.users.find(u=>u.id===id)||null);}
export async function patchUser(id:string,patch:Partial<User>){const db=await database();if(db)await db.collection<User>('users').updateOne({id},{$set:patch});else await local(s=>{const u=s.users.find(u=>u.id===id);if(u)Object.assign(u,patch);});}
export function publicUser(user:User){return {id:user.id,name:user.name,email:user.email,plan:user.plan,subscriptionStatus:user.subscriptionStatus||null,paidUntil:user.paidUntil||null,cancellationRequested:Boolean(user.cancellationRequested)};}
export async function loginUser(id:string){const token=randomBytes(32).toString('hex');const tokenHash=createHash('sha256').update(token).digest('hex');const expiresAt=new Date(Date.now()+7*86400000).toISOString();const db=await database();if(db){await db.collection('sessions').createIndex({expires:1},{expireAfterSeconds:0});await db.collection('sessions').insertOne({tokenHash,userId:id,expiresAt,expires:new Date(expiresAt)});}else await local(s=>s.sessions.push({tokenHash,userId:id,expiresAt}));(await cookies()).set('skillbridge_auth',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*86400});}
export async function currentUser(){const token=(await cookies()).get('skillbridge_auth')?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const tokenHash=createHash('sha256').update(token).digest('hex');const db=await database();const session=db?await db.collection<LoginSession>('sessions').findOne({tokenHash,expiresAt:{$gt:new Date().toISOString()}}):await local(s=>s.sessions.find(x=>x.tokenHash===tokenHash)||null);return session?userById(session.userId):null;}
export async function logoutUser(){const token=(await cookies()).get('skillbridge_auth')?.value;if(token){const hash=createHash('sha256').update(token).digest('hex');const db=await database();if(db)await db.collection('sessions').deleteOne({tokenHash:hash});else await local(s=>{s.sessions=s.sessions.filter(x=>x.tokenHash!==hash);});}(await cookies()).delete('skillbridge_auth');}
export function proActive(user:User){return user.plan==='pro'&&Boolean(user.paidUntil)&&new Date(user.paidUntil!)>new Date();}
