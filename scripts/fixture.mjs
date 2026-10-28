import {spawn} from 'node:child_process';
if(process.env.NODE_ENV==='production')throw new Error('The fixture must never run in production');
const child=spawn(process.execPath,['--import','tsx','tests/e2e-server.ts'],{cwd:'backend',stdio:'inherit',env:{...process.env,NODE_ENV:'test',LUMAVOK_E2E_FIXTURE:'1'}});child.on('exit',code=>process.exit(code??1));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
