import fs from 'node:fs';import path from 'node:path';
const ignore=new Set(['.git','node_modules','.next','dist','coverage','playwright-report','test-results','.temp']);const problems=[];let scanned=0;
function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){if(ignore.has(f.name))continue;const file=path.join(dir,f.name);if(f.isDirectory()){walk(file);continue;}
if(/^\.env(?:\.|$)/.test(f.name)&&!f.name.endsWith('.example')){problems.push([file,'non-example environment file']);continue;}
if(!/\.(?:[cm]?[jt]sx?|json|sql|md|ya?ml|example|toml)$/.test(file)||f.name==='package-lock.json')continue;
const text=fs.readFileSync(file,'utf8');scanned++;
if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))problems.push([file,'private key']);
if(/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sb_secret_[A-Za-z0-9_-]{20,})\b/.test(text))problems.push([file,'secret access token']);
for(const token of text.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)??[]){try{if(JSON.parse(Buffer.from(token.split('.')[1],'base64url')).role==='service_role')problems.push([file,'service-role JWT']);}catch{}}
}}
walk('.');for(const[file,reason]of problems)console.error(`${file}: ${reason}`);if(problems.length)process.exit(1);console.log(`Secret scan passed (${scanned} first-party text files; no values printed).`);
