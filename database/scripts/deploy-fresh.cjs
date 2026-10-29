const {Client}=require('pg'),{spawnSync}=require('node:child_process'),path=require('node:path');const root=path.resolve(__dirname,'..');
async function main(){
 if(!process.env.DIRECT_URL)throw new Error('DIRECT_URL must be supplied securely');const db=new Client({connectionString:process.env.DIRECT_URL});await db.connect();try{
 const {rows:[state]}=await db.query("SELECT to_regclass('public.property') AS existing,to_regclass('public._prisma_migrations') AS history,to_regclass('auth.users') AS auth,to_regclass('auth.sessions') AS sessions");
 if(state.existing||state.history)throw new Error('Fresh deployment requires an empty application schema. Use reviewed deployment for existing databases.');if(!state.auth||!state.sessions)throw new Error('Supabase Auth must be provisioned first.');
 const {rows}=await db.query("SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN('r','p')");if(rows.length)throw new Error('Public schema contains tables; refusing fresh deployment.');
 }finally{await db.end()}
 if(!process.argv.includes('--apply')){console.log('Fresh deployment preflight passed. Nothing changed.');return}
 if(!process.env.LUMAVOK_DATABASE_APPROVAL||!process.env.LUMAVOK_TARGET_PROJECT)throw new Error('Explicit database approval and target project references are required.');
 const result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy','--schema',path.join(root,'schema.prisma')],{cwd:root,stdio:'inherit',env:{...process.env,DATABASE_URL:process.env.DIRECT_URL}});if(result.status!==0)throw new Error('Migration deployment failed.');
}main().catch(error=>{console.error(error.message);process.exitCode=1});
