const requests=new Map<string,number[]>();
export function allowed(key:string,limit=10,window=60000){const now=Date.now();const recent=(requests.get(key)||[]).filter(t=>now-t<window);if(recent.length>=limit)return false;if(requests.size>5000)requests.clear();requests.set(key,[...recent,now]);return true;}
