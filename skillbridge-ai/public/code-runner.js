/* Local practice runner. This is not a hostile-code security sandbox. */
self.onmessage = async ({data}) => {
 const {code,signature,tests,unordered}=data;
 try {
  const fn=new Function(`${code}\n;return typeof ${signature} === 'function' ? ${signature} : null;`)();
  if(!fn)throw new Error(`Define a function named ${signature}.`);
  const results=[];
  for(const test of tests){try{const args=structuredClone(test.args);const before=JSON.stringify(args);const actual=await fn(...args);const normalize=v=>unordered&&Array.isArray(v)?[...v].sort((a,b)=>a-b):v;const pass=JSON.stringify(normalize(actual))===JSON.stringify(normalize(test.expected))&&(!['uniqueValues','solve'].includes(signature)||JSON.stringify(args)===before);results.push({pass,actual:actual===undefined?'undefined':JSON.stringify(actual),expected:JSON.stringify(test.expected)});}catch(e){results.push({pass:false,actual:e.message,expected:JSON.stringify(test.expected)});}}
  self.postMessage({results});
 }catch(e){self.postMessage({error:e.message});}
};
