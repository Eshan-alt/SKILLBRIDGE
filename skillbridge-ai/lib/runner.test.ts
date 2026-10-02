import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {challenges} from './practice';
const runner=readFileSync(new URL('../public/code-runner.js',import.meta.url),'utf8');
async function run(code:string,signature:string,tests:unknown[],unordered=false){let output:{error?:string;results?:{pass:boolean}[]}|undefined;const self={onmessage:null as unknown as (event:unknown)=>Promise<void>,postMessage:(result:typeof output)=>{output=result;}};vm.runInNewContext(runner,{self,structuredClone},{timeout:1000});await self.onmessage({data:{code,signature,tests,unordered}});return output!;}
const solutions:Record<string,string>={
 'two-sum':'function twoSum(a,t){for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]+a[j]===t)return [j,i];}',
 'valid-parentheses':'function isValid(s){const a=[];const m={")":"(","]":"[","}":"{"};for(const c of s){if("([{ ".trim().includes(c))a.push(c);else if(a.pop()!==m[c])return false;}return !a.length;}',
 'unique-values':'function uniqueValues(a){return [...new Set(a)];}',
 'binary-search':'function search(a,t){let l=0,r=a.length-1;while(l<=r){const m=Math.floor((l+r)/2);if(a[m]===t)return m;if(a[m]<t)l=m+1;else r=m-1;}return -1;}',
 'max-subarray':'function maxSubArray(a){let cur=a[0],best=a[0];for(let i=1;i<a.length;i++){cur=Math.max(a[i],cur+a[i]);best=Math.max(best,cur);}return best;}',
 'palindrome':'function isPalindrome(s){s=s.toLowerCase().replace(/[^a-z0-9]/g,"");return s===s.split("").reverse().join("");}',
 'anagram':'function isAnagram(s,t){return s.split("").sort().join("")===t.split("").sort().join("");}',
 'longest-substring':'function lengthOfLongestSubstring(s){const seen=new Map();let start=0,best=0;for(let i=0;i<s.length;i++){if(seen.has(s[i]))start=Math.max(start,seen.get(s[i])+1);seen.set(s[i],i);best=Math.max(best,i-start+1);}return best;}',
 'merge-intervals':'function merge(a){const out=[];for(const p of [...a].sort((x,y)=>x[0]-y[0])){const last=out[out.length-1];if(last&&p[0]<=last[1])last[1]=Math.max(last[1],p[1]);else out.push([...p]);}return out;}',
 'stock-profit':'function maxProfit(a){let low=Infinity,best=0;for(const x of a){low=Math.min(low,x);best=Math.max(best,x-low);}return best;}',
 'climbing-stairs':'function climbStairs(n){let a=1,b=1;for(let i=2;i<=n;i++)[a,b]=[b,a+b];return n===0?1:b;}',
 'islands':'function numIslands(g){let count=0;const seen=new Set();function visit(r,c){if(r<0||r>=g.length||c<0||c>=g[0].length||g[r][c]!=="1"||seen.has(r+","+c))return;seen.add(r+","+c);visit(r-1,c);visit(r+1,c);visit(r,c-1);visit(r,c+1);}for(let r=0;r<g.length;r++)for(let c=0;c<g[r].length;c++)if(g[r][c]==="1"&&!seen.has(r+","+c)){count++;visit(r,c);}return count;}'
};
for(const c of challenges)test(`runner correctly evaluates ${c.title}`,async()=>{const result=await run(solutions[c.id],c.signature,c.tests,c.id==='two-sum');assert(!result.error);assert(result.results?.every(r=>r.pass));});
test('runner rejects missing functions and catches syntax errors',async()=>{assert((await run('const value=1;','solve',[])).error);assert((await run('function solve( {','solve',[])).error);});
test('runner fails mutation when the contract forbids it',async()=>{const result=await run('function solve(input){input.values.push(2);return 2;}','solve',[{args:[{values:[1]}],expected:2}]);assert.equal(result.results?.[0].pass,false);});
