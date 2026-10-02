import {MongoClient} from 'mongodb';
const globalMongo=globalThis as typeof globalThis & {skillbridgeMongo?:Promise<MongoClient>};
export async function database(){if(!process.env.MONGODB_URI)return null;if(!globalMongo.skillbridgeMongo){const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000});globalMongo.skillbridgeMongo=client.connect().catch(error=>{delete globalMongo.skillbridgeMongo;throw error;});}const client=await globalMongo.skillbridgeMongo;return client.db(process.env.MONGODB_DB||'skillbridge');}
