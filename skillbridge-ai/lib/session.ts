import {cookies} from 'next/headers';
import {randomUUID} from 'crypto';
import {currentUser} from './accounts';
export async function session(){const user=await currentUser();if(user)return user.id;const jar=await cookies();let id=jar.get('skillbridge_session')?.value;if(!id||!/^([a-f0-9-]{36})$/.test(id)){id=randomUUID();jar.set('skillbridge_session',id,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*90});}return id;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return request.headers.get('sec-fetch-site')!=='cross-site';try{const parsed=new URL(origin);return parsed.origin===new URL(request.url).origin||(parsed.host===request.headers.get('host')&&parsed.protocol===new URL(request.url).protocol);}catch{return false;}}
