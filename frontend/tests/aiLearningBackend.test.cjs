const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function transpile(path) { return ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText; }
const dataContext={exports:{}}; vm.runInNewContext(transpile('frontend/src/data/aiLearning.ts'),dataContext);
function setup({validToken=true,configured=true}={}) {
 let handler; let providerCalls=0;
 const env={CLERK_ISSUER_URL:'https://test.clerk.accounts.dev',AI_ALLOWED_ORIGINS:'https://app.example',GEMINI_MODEL:'test-model',GEMINI_API_KEY:configured?'test-key':''};
 const context={exports:{},Request,Response,File,FormData,URL,Uint8Array,TextDecoder,AbortSignal,btoa,console,
 require: name=>name.startsWith('npm:jose')?{createRemoteJWKSet:()=>({}),jwtVerify:async()=>{if(!validToken)throw Error('Bad signature');return {payload:{sub:'student',exp:2000000000,azp:'https://app.example'}};}}:dataContext.exports,
 Deno:{env:{get:name=>env[name]},serve:fn=>{handler=fn;}},
 fetch:async()=>{providerCalls++;return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({text:'A clear explanation.',quiz:[],flashcards:[]})}]}}]});},
 };
 vm.runInNewContext(transpile('backend/supabase/functions/ai-learning/index.ts'),context);
 return {handle:(request)=>handler(request),calls:()=>providerCalls};
}
function request({origin='https://app.example',mode='explain',file}={}) {
 const body=new FormData();body.set('mode',mode);body.set('messages',JSON.stringify([{role:'user',content:'Explain sorting'}]));if(file)body.set('file',file);
 return new Request('https://project.supabase.co/functions/v1/ai-learning',{method:'POST',headers:{origin,authorization:'Bearer test'},body});
}
test('AI function rejects untrusted origins before provider access',async()=>{const api=setup();assert.equal((await api.handle(request({origin:'https://evil.example'}))).status,403);assert.equal(api.calls(),0);});
test('AI function rejects invalid Clerk sessions',async()=>{const api=setup({validToken:false});assert.equal((await api.handle(request())).status,401);assert.equal(api.calls(),0);});
test('missing configuration is explicit, never a fake AI answer',async()=>{const api=setup({configured:false});assert.equal((await api.handle(request())).status,503);assert.equal(api.calls(),0);});
test('valid learning request returns validated structured output',async()=>{const api=setup();const response=await api.handle(request());assert.equal(response.status,200);assert.equal((await response.json()).text,'A clear explanation.');assert.equal(api.calls(),1);});
test('invalid mode and disguised PDF do not reach the provider',async()=>{const api=setup();assert.equal((await api.handle(request({mode:'unknown'}))).status,400);assert.equal((await api.handle(request({file:new File(['not a pdf'],'notes.pdf')}))).status,400);assert.equal(api.calls(),0);});
test('per-instance burst limit blocks the eleventh request',async()=>{const api=setup();for(let i=0;i<10;i++)assert.equal((await api.handle(request())).status,200);assert.equal((await api.handle(request())).status,429);assert.equal(api.calls(),10);});
