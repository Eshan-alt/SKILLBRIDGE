const issues=[];const warnings=[];
if(!process.env.MONGODB_URI)issues.push('MONGODB_URI is required for production accounts and shared limits.');
try{const u=new URL(process.env.APP_URL||'');if(u.protocol!=='https:'||['localhost','127.0.0.1'].includes(u.hostname))issues.push('APP_URL must be the public HTTPS address.');}catch{issues.push('APP_URL must be a valid public HTTPS address.');}
const payment=['RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_PLAN_ID','RAZORPAY_WEBHOOK_SECRET'];const count=payment.filter(k=>process.env[k]).length;
if(count>0&&count<payment.length)issues.push('Razorpay configuration is incomplete.');
if(!process.env.AI_API_KEY)warnings.push('AI provider missing: local practice only.');
if(count===0)warnings.push('Payments disabled: free pilot only.');
if(count===payment.length&&!process.env.AI_API_KEY)issues.push('Do not enable paid AI subscriptions without an AI provider.');
console.log('Production configuration check (secret values are never printed).');
for(const x of issues)console.log('FAIL '+x);for(const x of warnings)console.log('NOTICE '+x);
console.log('This checks configuration presence, not live integrations, legal policies or launch approval.');
if(issues.length)process.exitCode=1;else console.log('PASS required configuration present. Complete DEPLOYMENT.md integration checks.');
