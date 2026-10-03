import {notFound} from 'next/navigation';
import Workspace from '@/components/Workspace';
const sections:Record<string,string>={stories:'Story bank','job-fit':'Job match',interviews:'Mock interviews',coding:'Coding practice',communication:'Communication',progress:'My progress',resources:'Resources',applications:'Applications',resume:'Resume builder',subscription:'Subscription',settings:'Settings'};
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;const name=sections[section];if(!name)notFound();return <Workspace initialTab={name}/>;}
